var app = require('express')();
var path = require('path');
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendFile(path.resolve(__dirname+'/../index.html'));
});

const game = io.of('/game');
const playerMoveSpeed = 10

let roomName = 'gamesession'
let connectedPlayers = {}

game.on('connection', function(socket) {

    //console.log('a user connected');

    socket.join(roomName, function () {
        connectedPlayers[socket.id] = {
            id: socket.id,
            color: [getRandomRange(0, 240), getRandomRange(0, 240), getRandomRange(0, 240)],
            size: 40,
            coords: {x: 50, y: 50}
        }

        game.to(roomName).emit('new-player-joined-room', connectedPlayers[socket.id]);
    });
    
    socket.on('get-all-players-in-room', function(data, callback) {
        callback(connectedPlayers)
    });

    socket.on('change-position', function(data){
        if (socket.rooms.hasOwnProperty(roomName)) {

            connectedPlayers[socket.id].coords.x += data.direction[0] * playerMoveSpeed
            connectedPlayers[socket.id].coords.y += data.direction[1] * playerMoveSpeed
            
            game.to(roomName).emit('position-changed', connectedPlayers[socket.id]);
        }
    });

    socket.on('disconnect', function(){
        delete connectedPlayers[socket.id]
        
        socket.leave(roomName)
        game.to(roomName).emit('player-disconnected', socket.id);
    });
});
  
function getRandomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}


http.listen(3000, function(){
  console.log('listening on *:3000');
});