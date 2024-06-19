import express from "express";
import child_process from "child_process";
import {Game, MAX_HEIGHT} from "./game.js";
import path from 'path';

const __dirname = path.resolve();
const server = express();
const PORT = 7000;
const execSync = child_process.execSync;

server.use(express.static('public'));

const curr_games = {};

server.get('', (req, res) => {
    res.sendFile(`${__dirname}/public/connect4bot7x7.html`);
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
    res.status(200).json({resigned: true});
});

server.listen(PORT, err => {
    if (err) {
        console.error(err);
    }
    else {
        console.log(`Server running on port ${PORT}`)
    }
});
