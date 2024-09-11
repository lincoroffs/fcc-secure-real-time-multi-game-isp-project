import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

let players = {};
let collectibles = {};

// Listen for current players from the server
socket.on('currentPlayers', serverPlayers => {
    players = {};
    serverPlayers.forEach(player => {
        players[player.id] = new Player(player);
    });
    draw();
});

// Listen for new players joining
socket.on('newPlayer', playerData => {
    players[playerData.id] = new Player(playerData);
    draw();
});

// Listen for player movements
socket.on('playerMoved', playerData => {
    players[playerData.id].x = playerData.x;
    players[playerData.id].y = playerData.y;
    players[playerData.id].score = playerData.score;
    draw();
});

// Listen for player disconnections
socket.on('playerDisconnected', playerId => {
    delete players[playerId];
    draw();
});

// Listen for collectible updates
socket.on('collectibles', serverCollectibles => {
    collectibles = {};
    serverCollectibles.forEach(collectible => {
        collectibles[collectible.id] = new Collectible(collectible);
    });
    draw();
});

// Draw players and collectibles on the canvas
const draw = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    Object.values(collectibles).forEach(drawCollectible);
    Object.values(players).forEach(drawPlayer);
}

// Draw a player
const drawPlayer = (player) => {
    context.fillStyle = 'blue';
    context.fillRect(player.x, player.y, 20, 20);
    context.fillStyle = 'white';
    context.fillText(`Score: ${player.score}`, player.x, player.y - 10);
}

// Draw a collectible
const drawCollectible = (collectible) => {
    context.fillStyle = 'red';
    context.fillRect(collectible.x, collectible.y, 10, 10);
}

// Handle player movement using WASD or arrow keys
document.addEventListener('keydown', event => {
    const player = players[socket.id];
    if (!player) return;

    let moved = false;
    if (event.key === 'w' || event.key === 'ArrowUp') {
        player.movePlayer('up', 5);
        moved = true;
    } else if (event.key === 's' || event.key === 'ArrowDown') {
        player.movePlayer('down', 5);
        moved = true;
    } else if (event.key === 'a' || event.key === 'ArrowLeft') {
        player.movePlayer('left', 5);
        moved = true;
    } else if (event.key === 'd' || event.key === 'ArrowRight') {
        player.movePlayer('right', 5);
        moved = true;
    }

    if (moved) {
        socket.emit('movePlayer', { x: player.x, y: player.y });
    }
});