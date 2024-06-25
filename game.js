import child_process from "child_process";
const execSync = child_process.execSync;

export const MAX_MOVES = 49;
export const COL_MASK = BigInt("0b11111111");
export const MAX_COL_HEIGHT = 7;
export const COLS = 7;

export const ZERO = BigInt(0);
export const ONE = BigInt(1);

export function Game(comTurn) {
    this.computerPieces = ZERO;
    this.playerPieces = ZERO;
    this.heightMap = BigInt("0b00000001000000010000000100000001000000010000000100000001");
    this.isComputerTurn = comTurn;
    this.playerStarts = !comTurn;
    this.movesMade = 0;
    this.moves = [];
    make_serializable(this);
}

export function find_win(pieces) {
    for (let i = 1; i < 10; i += Math.floor(1 / i) * 5 + 1) {
        let connections = pieces;
        for (let j = 0; j < 3; j++) connections = connections & (connections >> BigInt(i));
        if (connections !== ZERO) {
            let start = 0;
            while ((connections & ONE) === ZERO) {
                connections >>= ONE;
                start++;
            }
            return [start, start + i, start + 2 * i, start + 3 * i];
        }
    }
}

export function game_result(game) {
    let win = game.isComputerTurn ? find_win(game.playerPieces) : find_win(game.computerPieces);
    if (win != null && win.length) return win;
    return game.movesMade === MAX_MOVES ? [] : undefined;
}

export function make_computer_move(game) {
    game.heightMap = BigInt(game.heightMap);
    game.computerPieces = BigInt(game.computerPieces);

    const col = parseInt(execSync(`./c4 ${game.computerPieces} ${game.playerPieces} ${game.heightMap} ${game.movesMade}`, {encoding: "utf-8"}));
    const row = col_height(game, col);
    game.moves.push({row: row, col: col});
    
    const move = game.heightMap & (COL_MASK << (BigInt(col) << BigInt(3)));
    game.computerPieces |= move;
    game.heightMap += move;
    game.movesMade++;
    game.isComputerTurn = false;
    return {row: row, col: col, winning_cells: game_result(game)};
}

export function make_player_move(game, col) {
    game.heightMap = BigInt(game.heightMap);
    game.playerPieces = BigInt(game.playerPieces);

    if (col < 0 || col >= COLS || game.isComputerTurn)
        return {row: undefined, col: undefined, result: undefined};

    const row = col_height(game, col);
    if (row === MAX_COL_HEIGHT)
        return {row: undefined, col: undefined, result: undefined};

    game.moves.push({row: row, col: col});
    const row_bit = game.heightMap & (COL_MASK << (BigInt(col) << BigInt(3)));
    game.playerPieces |= row_bit;
    game.heightMap += row_bit;
    game.movesMade++;
    game.isComputerTurn = true;
    return {row: row, col: col, winning_cells: game_result(game)};
}

export function col_height(game, col) {
    let colBits = BigInt(game.heightMap) >> (BigInt(col) << BigInt(3));
    let height = 0;
    while ((colBits & ONE) === ZERO) {
        colBits >>= ONE;
        height++;
    }
    return height;
}

export function make_serializable(game) {
    game.heightMap = String(game.heightMap);
    game.playerPieces = String(game.playerPieces);
    game.computerPieces = String(game.computerPieces);
    return game;
}
