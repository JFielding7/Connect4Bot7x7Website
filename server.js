import express from "express";
import {Game, MAX_COL_HEIGHT} from "./game.js";
import mongoose from "mongoose";
import path from "path";

const __dirname = path.resolve();
const server = express();
const PORT = 7000;
const URI = `mongodb+srv://${process.env.USERNAME}:${process.env.PASSWORD}@7x7connect4bot.w6f5fji.mongodb.net/connect4stats?retryWrites=true&w=majority&appName=7x7Connect4Bot`;

server.use(express.static("public"));
const curr_games = {};

mongoose.connect(URI).then(async () => {
    server.listen(PORT, "localhost", err => {
        if (err) console.error(err);
        else console.log(`Server running on port ${PORT}`)
    });
});

const userSchema = new mongoose.Schema({
    ip: {
        type: String,
        required: true
    },
    name: {
        type: String,
        // required: true,
        maxLength: 63,
        default: "Random Noob"
    },
    wins: {
        type: Number,
        // required: true,
        default: 0,
    },
    draws: {
        type: Number,
        // required: true,
        default: 0,
    },
    losses: {
        type: Number,
        // required: true,
        default: 0,
    },
}, { versionKey: false });

const User = mongoose.model("User", userSchema);

server.get("", async (req, res) => {
    res.sendFile(__dirname + '/public/connect4.html');
    // const user = await User.create({ip: req.ip, name: "DK", wins: Infinity}, undefined);
    const user = await User.findOne({ ip: req.ip });
    if (user == null) {
        await User.create({ip: req.ip}, undefined);
    }
    else console.log("User exists");
});

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
