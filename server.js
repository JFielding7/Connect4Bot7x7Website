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
    if (isNaN(player_move) || curr_game == null || !curr_game.make_player_move(player_move)) res.status(200).json({});
    else res.status(200).json({player_move: player_move, com_move: curr_game.make_computer_move()});
});

server.get('/hover', (req, res) => {
    const col = parseInt(req.query.col);
    if (isNaN(col) || curr_game == null) {
        console.log('hello');
        res.status(200).json({col: 88});
    }
    else {
        const empty_slot = curr_game.lowest_empty_slot(col);
        res.status(200).json(empty_slot != null ? {col: empty_slot}: {});
    }
});

server.get('/go-first', (req, res) => {
    curr_game = new Game(false);
    res.status(200).json();
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
