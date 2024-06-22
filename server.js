import express from "express";
import {Game, MAX_COL_HEIGHT} from "./game.js";

const server = express();
const PORT = 7000;

server.use(express.static("public"));

const curr_games = {};

server.get("/game-state", (req, res) => {
    const curr_game = curr_games[req.ip];
    if (curr_game == null) res.status(200).json({player_starts: undefined});
    else res.status(200).json({player_starts: (curr_game.movesMade & 1) === 0, moves: curr_game.moves});
});

function make_move(game, move_func, game_id, col) {
    const move = move_func.call(game, col);
    if (move.result != null) delete curr_games[game_id];
    return move;
}

server.get("/move", (req, res) => {
    let col = parseInt(req.query.col);
    const curr_game = curr_games[req.ip];

    if (isNaN(col) || curr_game == null)
        res.status(200).json({row: undefined, col: undefined, result: undefined});
    else 
        res.status(200).json(make_move(curr_game, curr_game.make_player_move, req.ip, col));
});

server.get("/computer-move", (req, res) => {
    const curr_game = curr_games[req.ip];

    if (curr_game != null && curr_game.isComputerTurn)
        res.status(200).json(make_move(curr_game, curr_game.make_computer_move, req.ip));
    else
        res.status(200).json({row: undefined, col: undefined, result: undefined});
});

server.get("/hover", (req, res) => {
    const col = parseInt(req.query.col);
    const curr_game = curr_games[req.ip];

    if (isNaN(col) || curr_game == null || curr_game.isComputerTurn)
        res.status(200).json({row: undefined, col: undefined});
    else {
        const row = curr_game.col_height(col);
        if (row === MAX_COL_HEIGHT) res.status(200).json({row: undefined, col: undefined});
        else res.status(200).json({row: row, col: col});
    }
});

// think about maybe changing the game code, can only have 1 tab, also have to figure out how to end games when user leaves tab
server.get("/go-first", (req, res) => {
    curr_games[req.ip] = new Game(false);
    res.status(200).json({started: true});
});

server.get("/go-second", (req, res) => {
    const curr_game = curr_games[req.ip] = new Game(true);
    const com_move = make_move(curr_game, curr_game.make_computer_move, req.ip);
    res.status(200).json({started: true, row: com_move.row, col: com_move.col});
});

server.get("/resign", (req, res) => {
    if (req.ip in curr_games) delete curr_games[req.ip];
    res.status(200).json({resigned: true});
});

server.listen(PORT, "localhost", err => {
    if (err) console.error(err);
    else console.log(`Server running on port ${PORT}`)
});
