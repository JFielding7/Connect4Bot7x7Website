import express from "express";
import fs from "fs";
import https from "https";
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
    const options = {
        key: fs.readFileSync("/home/ubuntu/ssl/key.pem"),
        cert: fs.readFileSync("/home/ubuntu/ssl/cert.pem")
    };

    https.createServer(options, server).listen(PORT, "0.0.0.0", err => {
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
        default: "NPC"
    },
    stats: {
        first_wins: {
            type: Number,
            default: 0
        },
        first_losses: {
            type: Number,
            default: 0
        },
        first_draws: {
            type: Number,
            default: 0
        },
        second_wins: {
            type: Number,
            default: 0
        },
        second_losses: {
            type: Number,
            default: 0
        },
        second_draws: {
            type: Number,
            default: 0
        }
    },
    curr_game: Object
}, { versionKey: false });

const User = mongoose.model("User", userSchema);

server.get("", async (req, res) => {
    res.sendFile(__dirname + '/public/connect4.html');
});

server.get("/user-info", async (req, res) => {
    try {
        const curr_ip = req.header('x-forwarded-for');
        const user = await User.findOne({ip: curr_ip});
        if (user == null) {
            const username = (await User.create({ip: curr_ip})).name;
            res.status(200).json({player_starts: undefined, name: username});
        } else {
            const curr_game = user.curr_game;
            if (curr_game == null) res.status(200).json({player_starts: undefined, name: user.name});
            else res.status(200).json({player_starts: curr_game.player_starts, moves: curr_game.moves, name: user.name});
        }
    }
    catch (e) {
        console.log(e);
    }
});

function update_stats(user, is_winner) {
    if (user.curr_game.player_starts) {
        if (is_winner) {
            user.stats.first_wins += user.curr_game.is_com_turn;
            user.stats.first_losses += !user.curr_game.is_com_turn;
        }
        else user.stats.first_draws++;
    }
    else {
        if (is_winner) {
            user.stats.second_wins += user.curr_game.is_com_turn;
            user.stats.second_losses += !user.curr_game.is_com_turn;
        }
        else user.stats.second_draws++;
    }
}

async function make_move(user, move_func, user_ip, col) {
    const move = move_func(user.curr_game, col);
    if (move.winning_cells != null) {
        update_stats(user, move.winning_cells.length);
        user.curr_game = null;
    }
    else user.markModified("curr_game");
    await user.save();
    return move;
}

const move_mutex = new Mutex();

server.get("/move", async (req, res) => {
    try {
        const curr_ip = req.header('x-forwarded-for');
        await move_mutex.runExclusive(async () => {
            let col = parseInt(req.query.col);
            const user = await User.findOne({ip: curr_ip});

            if (isNaN(col) || user == null || user.curr_game == null) {
                res.status(200).json({row: undefined});
            } else {
                res.status(200).json(await make_move(user, game.make_player_move, curr_ip, col));
            }
        });
    }
    catch (e) {
        console.log(e);
    }
});

server.get("/computer-move", async (req, res) => {
    try {
        const curr_ip = req.header('x-forwarded-for');
        await move_mutex.runExclusive(async () => {
            const user = await User.findOne({ip: curr_ip});
            if (user != null && user.curr_game != null && user.curr_game.is_com_turn) {
                res.status(200).json(await make_move(user, game.make_computer_move, curr_ip));
            }
            else {
                res.status(200).json({row: undefined});
            }
        });
    }
    catch (e) {
        console.log(e);
    }
});

server.get("/hover", async (req, res) => {
    try {
        const curr_ip = req.header('x-forwarded-for');
        const col = parseInt(req.query.col);
        const curr_game = (await User.findOne({ip: curr_ip})).curr_game;

        if (isNaN(col) || curr_game == null || curr_game.is_com_turn)
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
    try {
        const curr_ip = req.header('x-forwarded-for');
        const user = await User.findOne({ip: curr_ip});
        if (user != null && user.curr_game == null) {
            user.curr_game = new game.Game(false);
            await user.save();
            res.status(200).json({started: true});
        } else res.status(200).json({started: false});
    }
    catch (e) {
        console.log(e);
    }
});

server.get("/go-second", async (req, res) => {
    try {
        const curr_ip = req.header('x-forwarded-for');
        const user = await User.findOne({ip: curr_ip});
        if (user != null && user.curr_game == null) {
            user.curr_game = new game.Game(true);
            const com_move = await make_move(user, game.make_computer_move, curr_ip);
            await user.save();
            res.status(200).json({started: true, row: com_move.row, col: com_move.col});
        } else res.status(200).json({started: false});
    }
    catch (e) {
        console.log(e);
    }
});

server.get("/resign", async (req, res) => {
    try {
        const curr_ip = req.header('x-forwarded-for');
        const user = await User.findOne({ip: curr_ip});
        if (user != null && user.curr_game != null) {
            if (user.curr_game.player_starts) user.stats.first_losses++;
            else user.stats.second_losses++;
            user.curr_game = null;
            await user.save();
            res.status(200).json({resigned: true});
        }
        else res.status(200).json({resigned: false});
    }
    catch (e) {
        console.log(e);
    }
});

server.get("/set-name", async (req, res) => {
    try {
        const curr_ip = req.header('x-forwarded-for');
        const user = await User.findOne({ip: curr_ip});
        if (user != null) {
            user.name = req.query.name;
            await user.save();
        }
        res.status(200).end();
    }
    catch (e) {
        console.log(e);
    }
});

server.get("/stats", (req, res) => {
    res.sendFile(__dirname + '/public/stats.html');
})

server.get("/fetch-stats", async (req, res) => {
    try {
        const curr_ip = req.header('x-forwarded-for');
        let user = await User.findOne({ip: curr_ip});
        if (user == null) user = await User.create({ip: curr_ip});
        res.status(200).json(user.stats);
    }
    catch (e) {
        console.log(e);
    }
});
