require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

// Use helmet to secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Temporarily disable CSP for simplicity
  hidePoweredBy: { setTo: 'PHP 7.4.3' }, // Pretend to be powered by PHP
  noCache: true, // Disable client-side caching
  xssFilter: true, // Prevent XSS attacks
}));

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

// Socket.io setup for real-time multiplayer game
const io = socket(server);

let players = [];
let collectibles = [];

io.on('connection', socket => {
  console.log('New player connected: ', socket.id);

  // Create a new player and add to players array
  const newPlayer = { id: socket.id, x: 0, y: 0, score: 0 };
  players.push(newPlayer);

  // Send current players and collectibles to the new player
  socket.emit('currentPlayers', players);
  socket.emit('collectible', collectibles);

  // Broadcast the new player to other players
  socket.broadcast.emit('newPlayer', newPlayer);

  // Handle player movement
  socket.on('movePlayer', movementData => {
    const player = players.find(p => p.id === socket.id);
    if (player) {
      player.x += movementData.x;
      player.y += movementData.y;

      // Check collision with collectibles
      collectibles.forEach((collectible, index) => {
        if (player.x === collectible.x && player.y === collectible.y) {
          player.score += collectible.value;
          collectibles.splice(index, 1); // Remove collected item
          io.emit('collectibles', collectibles); // Update all clients
        }
      });

      // Broadcast updated player position
      io.emit('playerMoved', player);
    }
  });

  // Handle player disconnection
  socket.on('disconnect', () => {
    console.log('Player disconnected: ', socket.id);
    players = players.filter(p => p.id !== socket.io);
    io.emit('playerDisconnected', socket.id);
  });
});

module.exports = app; // For testing
