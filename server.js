// import { Game } from './game.js';

const express = require("express");
const server = express();
const PORT = 7000;
const execSync = require('child_process').execSync;

server.use(express.static('public'));

let curr_game = null;

server.get('', (req, res) => {
    res.sendFile(__dirname + '/public/connect4bot7x7.html');
});

server.get('/move', (req, res) => {
    const player_move = parseInt(req.query.col);
    if (isNaN(player_move) || curr_game == null || !curr_game.make_player_move(player_move)) {
        res.status(200).json({player_move: null, com_move: null});
    }
    else {
        res.status(200).json({player_move: player_move, com_move: curr_game.make_computer_move()});
    }
});

server.get('/hover', (req, res) => {
    const col = parseInt(req.query.col);
    if (isNaN(col) || curr_game == null) res.status(200).json({col: null});
    else {
        const empty_slot = curr_game.lowest_empty_slot(col);
        res.status(200).json({col: col, empty_slot: empty_slot});
    }
});

server.get('/go-first', (req, res) => {
    curr_game = new Game(false);
    res.status(200).json({started: true});
});

server.get('/go-second', (req, res) => {
    curr_game = new Game(true);
    res.status(200).json({com_move: curr_game.make_computer_move()});
});

server.get('/resign', (req, res) => {
    curr_game = null;
    res.status(200).json();
});

server.listen(PORT, err => {
    if (err) {
        console.error(err);
    }
    else {
        console.log(`Server running on port ${PORT}`)
    }
});

const DRAW = 0;
const WIN = 1;
const NOT_OVER = 2;

const MAX_MOVES = 49;
const COL_MASK = BigInt("0b11111111");
const IS_LEGAL = BigInt("0b01111111011111110111111101111111011111110111111101111111");
const MAX_HEIGHT = 7;

const ZERO = BigInt(0);
const ONE = BigInt(1);

function Game(comTurn) {
    this.computerPieces = ZERO;
    this.playerPieces = ZERO;
    this.heightMap = BigInt("0b00000001000000010000000100000001000000010000000100000001");
    this.isComputerTurn = comTurn;
    this.movesMade = 0;
}

Game.prototype.computer_won = function () {
    for (let i = 1; i < 10; i += Math.floor(1 / i) * 5 + 1) {
        let connections = BigInt(this.computerPieces);
        for (let j = 0; j < 3; j++) connections = connections & (connections >> BigInt(i));
        if (connections !== ZERO) return true;
    }
    return false;
}

Game.prototype.game_state = function () {
    if (this.computer_won()) return WIN;
    return this.movesMade === MAX_MOVES ? DRAW : NOT_OVER;
}

Game.prototype.make_computer_move = function () {
    let col = 0; //get column from c++ program
    const move = this.heightMap & (COL_MASK << (col << 3));
    this.computerPieces |= move;
    this.heightMap += move;
    this.movesMade++;
    this.isComputerTurn = false;
    return col;
}

Game.prototype.make_player_move = function (col) {
    col = BigInt(col);
    const move = this.heightMap & (COL_MASK << (col << 3));
    if (this.isComputerTurn || (move & IS_LEGAL) === ZERO) return false;
    this.playerPieces |= move;
    this.heightMap += move;
    this.movesMade++;
    this.isComputerTurn = true;
    return true;
}

Game.prototype.lowest_empty_slot = function (col) {
    if (this.isComputerTurn) return null;
    let colBits = this.heightMap >> (BigInt(col) << BigInt(3));
    let height = 0;
    while ((colBits & ONE) === ZERO) {
        colBits >>= ONE;
        height++;
    }
    return height < MAX_HEIGHT ? height : null;
}
