import express from "express";
import * as game from "./game.js";
import mongoose from "mongoose";
import path from "path";
import {Mutex} from 'async-mutex';

const __dirname = path.resolve();
const server = express();
const PORT = 7000;
const URI = `mongodb+srv://${process.env.USERNAME}:${process.env.PASSWORD}@7x7connect4bot.w6f5fji.mongodb.net/connect4stats?retryWrites=true&w=majority&appName=7x7Connect4Bot`;

server.use(express.static("public"));

mongoose.connect(URI).then(() => {
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
        maxLength: 63,
        default: "Random Noob"
    },
    wins: {
        type: Number,
        default: 0,
    },
    draws: {
        type: Number,
        default: 0,
    },
    losses: {
        type: Number,
        default: 0,
    },
    curr_game: Object
}, { versionKey: false });

const User = mongoose.model("User", userSchema);

server.get("", async (req, res) => {
    res.sendFile(__dirname + '/public/connect4.html');
});

server.get("/user-info", async (req, res) => {
    const user = await User.findOne({ip: req.ip});
    if (user == null) {
        const username = (await User.create({ip: req.ip}, undefined)).name;
        res.status(200).json({player_starts: undefined, name: username});
    }
    else {
        const curr_game = user.curr_game;
        if (curr_game == null) res.status(200).json({player_starts: undefined, name: user.name});
        else res.status(200).json({player_starts: curr_game.playerStarts, moves: curr_game.moves, name: user.name});
    }
});

async function make_move(user, move_func, user_ip, col) {
    const move = move_func(user.curr_game, col);
    if (move.winning_cells != null) {
        if (move.winning_cells.length) {
            user.wins += user.curr_game.isComputerTurn;
            user.losses += !user.curr_game.isComputerTurn;
        }
        else user.draws++;
        user.curr_game = null;
    }
    else user.markModified("curr_game");
    await user.save();
    return move;
}

const playerMoveMutex = new Mutex();

server.get("/move", async (req, res) => {
    await playerMoveMutex.runExclusive(async () => {
        let col = parseInt(req.query.col);
        const user = await User.findOne({ip: req.ip});

        if (isNaN(col) || user == null || user.curr_game == null) {
            res.status(200).json({row: undefined});
        }
        else {
            res.status(200).json(await make_move(user, game.make_player_move, req.ip, col));
        }
    });
});

const comMoveMutex = new Mutex();

server.get("/computer-move", async (req, res) => {
    await comMoveMutex.runExclusive(async () => {
        const user = await User.findOne({ip: req.ip});
        if (user != null && user.curr_game != null && user.curr_game.isComputerTurn) {
            console.log("hello", user.curr_game.movesMade);
            res.status(200).json(await make_move(user, game.make_computer_move, req.ip));
        } else
            res.status(200).json({row: undefined});
    });
});

server.get("/hover", async (req, res) => {
    try {
        const col = parseInt(req.query.col);
        const curr_game = (await User.findOne({ip: req.ip})).curr_game;

        if (isNaN(col) || curr_game == null || curr_game.isComputerTurn)
            res.status(200).json({row: undefined, col: undefined});
        else {
            const row = game.col_height(curr_game, col);
            if (row === game.MAX_COL_HEIGHT) res.status(200).json({row: undefined});
            else res.status(200).json({row: row, col: col});
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json({row: undefined});
    }
});

server.get("/go-first", async (req, res) => {
    const user = await User.findOne({ip: req.ip});
    if (user != null && user.curr_game == null) {
        user.curr_game = new game.Game(false);
        await user.save();
        res.status(200).json({started: true});
    }
    else res.status(200).json({started: false});
});

server.get("/go-second", async (req, res) => {
    const user = await User.findOne({ip: req.ip});
    if (user != null && user.curr_game == null) {
        user.curr_game = new game.Game(true);
        const com_move = await make_move(user, game.make_computer_move, req.ip);
        await user.save();
        res.status(200).json({started: true, row: com_move.row, col: com_move.col});
    }
    else res.status(200).json({started: false});
});

server.get("/resign", async (req, res) => {
    const user = await User.findOne({ip: req.ip});
    if (user != null && user.curr_game != null) {
        user.losses++;
        user.curr_game = null;
        await user.save();
        res.status(200).json({resigned: true});
    }
    else res.status(200).json({resigned: false});
});

server.get("/set-name", async (req, res) => {
    try {
        const user = await User.findOne({ip: req.ip});
        if (user != null) {
            user.name = req.query.name;
            await user.save();
        }
    }
    catch (e) {}
    res.status(200).end();
});
