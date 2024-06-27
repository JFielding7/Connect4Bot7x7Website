import child_process from "child_process";
const execSync = child_process.execSync;

export const MAX_MOVES = 49;
export const COL_MASK = BigInt("0b11111111");
export const MAX_COL_HEIGHT = 7;
export const COLS = 7;

export const ZERO = BigInt(0);
export const ONE = BigInt(1);

export function Game(comTurn) {
    this.com_pieces = ZERO;
    this.player_pieces = ZERO;
    this.height_map = BigInt("0b00000001000000010000000100000001000000010000000100000001");
    this.is_com_turn = comTurn;
    this.player_starts = !comTurn;
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
    let win = game.is_com_turn ? find_win(game.player_pieces) : find_win(game.com_pieces);
    if (win != null && win.length) return win;
    return game.moves.length === MAX_MOVES ? [] : undefined;
}

export function make_computer_move(game) {
    game.height_map = BigInt(game.height_map);
    game.com_pieces = BigInt(game.com_pieces);

    const col = parseInt(execSync(`./c4 ${game.com_pieces} ${game.player_pieces} ${game.height_map} ${game.moves.length}`, {encoding: "utf-8"}));
    const row = col_height(game, col);
    game.moves.push({row: row, col: col});
    
    const move = game.height_map & (COL_MASK << (BigInt(col) << BigInt(3)));
    game.com_pieces |= move;
    game.height_map += move;
    game.is_com_turn = false;
    return {row: row, col: col, winning_cells: game_result(game)};
}

export function make_player_move(game, col) {
    game.height_map = BigInt(game.height_map);
    game.player_pieces = BigInt(game.player_pieces);

    if (col < 0 || col >= COLS || game.is_com_turn)
        return {row: undefined, col: undefined, result: undefined};

    const row = col_height(game, col);
    if (row === MAX_COL_HEIGHT)
        return {row: undefined, col: undefined, result: undefined};

    game.moves.push({row: row, col: col});
    const row_bit = game.height_map & (COL_MASK << (BigInt(col) << BigInt(3)));
    game.player_pieces |= row_bit;
    game.height_map += row_bit;
    game.is_com_turn = true;
    return {row: row, col: col, winning_cells: game_result(game)};
}

export function col_height(game, col) {
    let colBits = BigInt(game.height_map) >> (BigInt(col) << BigInt(3));
    let height = 0;
    while ((colBits & ONE) === ZERO) {
        colBits >>= ONE;
        height++;
    }
    return height;
}

export function make_serializable(game) {
    game.height_map = String(game.height_map);
    game.player_pieces = String(game.player_pieces);
    game.com_pieces = String(game.com_pieces);
    return game;
}
