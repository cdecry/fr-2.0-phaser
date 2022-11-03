var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var Client = require('./network/client').Client;

const mongoose = require('mongoose');
const { loginRequest } = require('./database/queries');

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


// move to network manager
const clients = new Object();


// socket connections
io.on('connection', function (socket) {

    console.log('client connected');

    // move to network manager
    const client = new Client(socket.id);
    clients[Object.keys(clients).length] = client;

    socket.on('disconnect', function () {
        console.log('client disconnected');
    });

    socket.on('login request', async (user, pass) => {
        if (await loginRequest(user, pass)) {
            console.log('Sucessfully logged in! Clients connected: ' + JSON.stringify(clients));
            io.emit('login success', 'bonk');
        }
        else {
            console.log('Invalid username/password. Please try again.');
            io.emit('login fail');
        }
      });
});

server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});
