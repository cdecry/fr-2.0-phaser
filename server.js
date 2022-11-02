const server = require('express')();
const http = require('http').createServer(server);

const io = require('socket.io');