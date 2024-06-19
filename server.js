const express = require("express");
const server = express();
const PORT = 7000;
const execSync = require('child_process').execSync;

server.use(express.static('public'));

const curr_games = {};

server.get('', (req, res) => {
    console.log("request");
    res.sendFile(__dirname + '/public/connect4bot7x7.html');
});

server.get('/move', (req, res) => {
    let col = parseInt(req.query.col);
    const curr_game = curr_games[req.ip];

    if (isNaN(col) || curr_game == null) res.status(200).json({row: undefined, col: undefined});
    else {
        const row = curr_game.col_height(col);
        if (row === MAX_HEIGHT) res.status(200).json({row: undefined, col: undefined});
        else if (curr_game.make_player_move(col)) res.status(200).json({row: row, col: col});
        else res.status(200).json({row: undefined, col: undefined});
    }
});

server.get('/computer-move', (req, res) => {
    let row, col;
    const curr_game = curr_games[req.ip];

    if (curr_game != null && curr_game.isComputerTurn) {
        col = curr_game.make_computer_move();
        row = curr_game.col_height(col) - 1;
    }
    res.status(200).json({row: row, col: col});
});

server.get('/hover', (req, res) => {
    const col = parseInt(req.query.col);
    const curr_game = curr_games[req.ip];

    if (isNaN(col) || curr_game == null || curr_game.isComputerTurn) res.status(200).json({row: undefined, col: undefined});
    else {
        const row = curr_game.col_height(col);
        if (row === MAX_HEIGHT) res.status(200).json({row: undefined, col: undefined});
        else res.status(200).json({row: row, col: col});
    }
});

server.get('/go-first', (req, res) => {
    curr_games[req.ip] = new Game(false);
    res.status(200).json({started: true});
});

server.get('/go-second', (req, res) => {
    curr_games[req.ip] = new Game(true);
    res.status(200).json({started: true});
});

server.get('/resign', (req, res) => {
    if (req.ip in curr_games) delete curr_games[req.ip];
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
    const move = this.heightMap & (COL_MASK << (BigInt(col) << BigInt(3)));
    this.computerPieces |= move;
    this.heightMap += move;
    this.movesMade++;
    this.isComputerTurn = false;
    return col;
}

Game.prototype.make_player_move = function (col) {
    col = BigInt(col);
    const move = this.heightMap & (COL_MASK << (col << BigInt(3)));
    if (this.isComputerTurn || (move & IS_LEGAL) === ZERO) return false;
    this.playerPieces |= move;
    this.heightMap += move;
    this.movesMade++;
    this.isComputerTurn = true;
    return true;
}

Game.prototype.col_height = function (col) {
    let colBits = this.heightMap >> (BigInt(col) << BigInt(3));
    let height = 0;
    while ((colBits & ONE) === ZERO) {
        colBits >>= ONE;
        height++;
    }
    return height;
}
