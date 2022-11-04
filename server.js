var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var Client = require('./network/player').Client;
const mongoose = require('mongoose');
const { loginRequest, getUserAvatar } = require('./database/queries');
const { Player } = require('./network/player');

// store clients (id: socketid)
// const clients = new Object();

const players = {};
const rooms = {};

// connect to database
main().catch(err => console.log(err));
async function main() {
    await mongoose.connect('mongodb+srv://root:jcohnKil2BDsyVMr@fr-cluster.qaeqyz4.mongodb.net/?retryWrites=true&w=majority');
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
        // if this user was logged in, delee from plyer list
        if (players!= null && players[socket.id] != null) {
            console.log('player disconnected: ' + players[socket.id].username);
            delete players[socket.id];
        }
        else
            console.log('client disconnected');
    });

    socket.on('login request', async (username, password) => {
        var userId = await loginRequest(username, password);
        if (userId != null) {

            // get avatar
            const avatar = await getUserAvatar(userId);

            var player = new Player(socket.id, username, 'downtown', avatar, false, 400, 200);
            players[socket.id] = player;

            if (rooms['downtown'] == null)
                rooms['downtown'] = [player];
            else
                rooms['downtown'].push(player);

            console.log('Sucessfully logged in! Players online: ' + JSON.stringify(players));
            // load game
            socket.join('downtown');
            // load local player
            io.emit('login success');
        }
        else {
            console.log('Invalid username/password. Please try again.');
            io.emit('login fail');
        }
    });

    socket.on('game loaded', function() {
        io.emit('spawnCurrentPlayers', players);
        socket.to("downtown").emit("spawnNewPlayer", players[socket.id]);
    });
});

server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});
