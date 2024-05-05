require('dotenv').config();
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var Client = require('./network/player').Client;
const mongoose = require('mongoose');
const { loginRequest, getUserAvatar, changeEquipped, addBuddy, getIdfoneData } = require('./database/queries');
const { Player } = require('./network/player');
const { FashionShow } = require('./entity/fashionShow');

// store clients (id: socketid)
// const clients = new Object();

const players = {};
const usernameToId = {};
const usernameToPID = {};
// const rooms = {};
const fashionShows = {};

// fashion show rooms structure
/*
{
    'blueberry7': FashionShow obj
}
*/

// connect to database
main().catch(err => console.log(err));
async function main() {
    await mongoose.connect(process.env.DB_URI);
}

// get files for client
app.use(express.static(__dirname + '/client'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

// socket connections
io.on('connection', function (socket) {

    console.log('client connected'); 
    
    socket.on('disconnect', function () {
        console.log(socket.id);
        // if this user was logged in, delee from plyer list
        if (players!= null && players[socket.id] != null) {
            console.log('player disconnected: ' + players[socket.id].username);
            socket.to(players[socket.id].room).emit('removePlayer', socket.id);
            io.emit("playerOffline", players[socket.id].username);

            // update if they were in a game room

            delete usernameToId[players[socket.id].username];
            delete usernameToPID[players[socket.id].username];
            delete players[socket.id];
        }
        else
            console.log('client disconnected');
    });

    socket.on('login request', async (username, password) => {
        var result = await loginRequest(username, password);
        if (result != null) {

            // get avatar
            const avatar = await getUserAvatar(result.id);
            
            // add player to our list of online players
            var player = new Player(socket.id, result.id, username, 'downtown', avatar, false, 400, 200, result.inventory, result.level, result.isMember, result.idfone, result.stars, result.ecoins, result.buddies);
            players[socket.id] = player;
            usernameToId[username] = socket.id;
            usernameToPID[username] = result.id;

            // add player to room list
            // if (rooms['downtown'] == null)
            //     rooms['downtown'] = [player];
            // else
            //     rooms['downtown'].push(player);

            console.log('Sucessfully logged in! Players online: ' + JSON.stringify(players));
            // load game
            socket.join('downtown');
            // load local player
            io.to(socket.id).emit('login success', result.inventory, usernameToPID);
        }
        else {
            console.log('Invalid username/password. Please try again.');
            io.to(socket.id).emit('login fail');
        }
    });

    socket.on('game loaded', function() {
        // assume everyone spawns in downtown
        let playersInThisRoom =  Object.values(players).filter(player => player.room === "downtown");
        // load players online

        io.to(socket.id).emit('spawnCurrentPlayers', playersInThisRoom);
        socket.to("downtown").emit("spawnNewPlayer", players[socket.id]);
        io.emit("playerOnline", players[socket.id]);
    });

    socket.on('playerMovement', function (movementData) {
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        players[socket.id].flipX = movementData.flipX;

        socket.to(players[socket.id].room).emit('playerMoved', players[socket.id]);
    });

    socket.on('playerWave', function() {
        socket.broadcast.to(players[socket.id].room).emit('playerWaveResponse', players[socket.id]);
    })

    socket.on('playerCry', function() {
        socket.broadcast.to(players[socket.id].room).emit('playerCryResponse', players[socket.id]);
    })

    socket.on('playerJump', function() {
        socket.broadcast.to(players[socket.id].room).emit('playerJumpResponse', players[socket.id]);
    })

    socket.on('playerWink', function() {
        socket.broadcast.to(players[socket.id].room).emit('playerWinkResponse', players[socket.id]);
    })

    socket.on('chatMessage', function(msg) {
        socket.broadcast.to(players[socket.id].room).emit('chatMessageResponse', players[socket.id], msg);
    })

    socket.on('privateMessage', function(msg, toUser) {
        io.to(usernameToId[toUser]).emit('privateMessageResponse', players[socket.id], msg);
    })

    socket.on('buddyRequest', function(toUser) {
        io.to(usernameToId[toUser]).emit('buddyRequestResponse', players[socket.id]);
    })

    socket.on('acceptBuddyRequest', async (userId, username) => {

        // add buddy to this player's buddy list
        players[socket.id].buddies =  await addBuddy(players[socket.id].pid, userId, username);
        io.to(socket.id).emit('acceptBuddyRequestResponse', players[socket.id].buddies, username);

        var updatedBuddies = await addBuddy(userId, players[socket.id].pid, players[socket.id].username);
        if (usernameToId.hasOwnProperty(username)) {
            players[usernameToId[username]].buddies = updatedBuddies;
            io.to(usernameToId[username]).emit('acceptBuddyRequestResponse', players[usernameToId[username]].buddies, players[socket.id].username);
        }
    })

    socket.on('getOfflineIdfone', async (userId) => {
        let result = await getIdfoneData(userId);
        let avatar = await getUserAvatar(userId);
        let player = new Player(-1, userId, result.username, '', avatar, false, -1, -1, null, result.level, result.isMember, result.idfone, null, null, null);
        io.to(socket.id).emit('getOfflineIdfoneResponse', player);
    })

    function handleRoomChange(room) {
        let currentRoom = players[socket.id].room;

        // for all the players in this player's room, remove this player
        // for this player, remove all the players in the current room.
        socket.to(currentRoom).emit('removePlayer', socket.id);
        io.to(socket.id).emit('removePlayers');

        // for all the players in the new room, spawn this player
        // for this player, spawn all other players in the room
        socket.to(room).emit('spawnNewPlayer', players[socket.id]);//    THIS SI GIVING ME PROBLEMS
        
        let playersInThisRoom =  Object.values(players).filter(player => player.room === room);
        io.to(socket.id).emit('spawnCurrentPlayers', playersInThisRoom);
        
        players[socket.id].room = room;
        socket.leave(currentRoom);
        socket.join(room);
        console.log(`${players[socket.id].username} is in ${room}`);
    }

    socket.on('changeRoom', function(room) {
        handleRoomChange(room);
    })

    socket.on('changeClothes', async (equipped, fashionShowHost) => {
        // similar to invent, but of changed clothes
        var changed = {"0":[], "1":[], "2":[], "3":[], "4":[], "5": [], "6":[], "7":[], "8":[], "9":[]};
        var numChanged = 0;
        // check that the player has these clothes

        if (equipped != null) {
            for (let i = 0; i < equipped.length; i++) {

                var itemId = equipped[i];

                if (players[socket.id].avatar.equipped[i] == itemId) continue; // this item is already equipped

                if (itemId == -1) { // nothing of this type is equipped
                    players[socket.id].avatar.equipped[i] = itemId;
                    changed[i].push(-1)
                    numChanged++;
                }

                var itemExistsInInventory = false;

                // Check if the item exists in the inventory
                var itemArray = players[socket.id].inventory[i];
                
                for (let j = 0; j < itemArray.length; j++) {
                    const item = itemArray[j];
                    if (item.id === itemId) {
                        itemExistsInInventory = true;
                        changed[i].push(item);
                        players[socket.id].avatar.equipped[i] = itemId;
                        numChanged++;
                        break;
                    }
                }

                if (!itemExistsInInventory) {
                    console.log(`Item ${itemId} is not in the inventory.`);
                }
            }

            if (numChanged == 0) return;

            socket.to(players[socket.id].room).emit("changeClothesResponse", changed);
            io.in(players[socket.id].room).emit('changeClothesResponse', socket.id, changed);

            // update player avatar database
            await changeEquipped(players[socket.id].pid, players[socket.id].avatar.equipped);
        }

        if (fashionShowHost != "") {
            // call funciton to calculate fasion show score based on theme and items equipped
            // for now, set score to 5.
            console.log('player changed in fashion show, sending score');
            var scoring = {
                theme: 1,
                originality: 3,
                rare: 0,
                pet: 0
            }
            fashionShows[fashionShowHost].currentScores[players[socket.id].username] = 5;
            io.to('fashionShow-' + fashionShowHost).emit('fashionShowUpdateScores', fashionShows[fashionShowHost].currentScores, players[socket.id].username, scoring);
        }

    })

    socket.on('hostFashionShow', function() {

        var player = players[socket.id];
        var fashionShow = new FashionShow(player.username, player.avatar.gender);
        fashionShows[player.username] = fashionShow;
        socket.to('topModels').emit('updateFashionShowList', fashionShow);
        handleRoomChange('fashionShow-' + player.username);
    })

    socket.on('joinFashionShow', function(fashionShowRoom) {

        var playerUser = players[socket.id].username;
        var hostUser = fashionShowRoom.split('-')[1];

        fashionShows[hostUser].players.push(playerUser);
        fashionShows[hostUser].playerCount++;

        socket.to('topModels').emit('updateFashionShowList',  fashionShows[hostUser]);

        for (const [roomName, sockets] of io.sockets.adapter.rooms) {
            console.log(roomName);
            if (roomName.startsWith("fashionShow-")) {
                io.to(roomName).emit("addFashionShowPlayer", fashionShows[hostUser], playerUser);
            }
        }

        handleRoomChange(fashionShowRoom);
    })

    socket.on('getFashionShows', function() {
        io.to(socket.id).emit('getFashionShowsResponse', fashionShows);
    })

    socket.on('startFashionShowRequest', function(hostUser) {
        var thisFS = fashionShows[hostUser];

        thisFS.started = true;
        thisFS.currentRound = 1;
        
        thisFS.players.forEach(player => {
            thisFS.currentScores[player] = 0;
        });

        fashionShows[hostUser] = thisFS;

        io.to('topModels').emit('updateFashionShowList',  fashionShows[hostUser]);
        io.to(`fashionShow-${hostUser}`).emit('startFashionShow',  fashionShows[hostUser]);
    })

    socket.on('selectFashionShowTheme', function(hostUser, theme) {
        io.to(`fashionShow-${hostUser}`).emit('selectedFashionShowTheme', theme);
        var timer = 20;


        
        var x = setInterval(function() {
            timer-=1;
            if (timer < 0) {
                clearInterval(x);
                // force close inventories for those not done, then they wil send a message for server to calc score
                io.to(`fashionShow-${hostUser}`).emit('fashionShowForceClose');

                var prePosingTimer = 10;

                var y = setInterval(function() {
                    prePosingTimer-=1;
                    if (prePosingTimer < 0) {
                        clearInterval(y);
                        // force close inventories for those not done, then they wil send a message for server to calc score
                        io.to(`fashionShow-${hostUser}`).emit('fashionShowStartPosing');
                    }
                }, 1000);
            }
        }, 1000);
    })
});

server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});
