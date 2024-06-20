import child_process from "child_process";
const execSync = child_process.execSync;

export const DRAW = 0;
export const WIN = 1;
export const NOT_OVER = 2;

export const MAX_MOVES = 49;
export const COL_MASK = BigInt("0b11111111");
export const IS_LEGAL = BigInt("0b01111111011111110111111101111111011111110111111101111111");
export const MAX_COL_HEIGHT = 7;

export const ZERO = BigInt(0);
export const ONE = BigInt(1);

export function Game(comTurn) {
    this.computerPieces = ZERO;
    this.playerPieces = ZERO;
    this.heightMap = BigInt("0b00000001000000010000000100000001000000010000000100000001");
    this.isComputerTurn = comTurn;
    this.movesMade = 0;
}

Game.prototype.find_computer_win = function () {
    for (let i = 1; i < 10; i += Math.floor(1 / i) * 5 + 1) {
        let connections = BigInt(this.computerPieces);
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

Game.prototype.game_result = function () {
    const computer_win = this.find_computer_win();
    if (computer_win != null && computer_win.length) return computer_win;
    return this.movesMade === MAX_MOVES ? [] : undefined;
}

Game.prototype.make_computer_move = function () {
    const col = parseInt(execSync(`./c4 ${this.computerPieces} ${this.playerPieces} ${this.heightMap} ${this.movesMade}`, {encoding: "utf-8"}));
    const row = this.col_height(col);
    
    const move = this.heightMap & (COL_MASK << (BigInt(col) << BigInt(3)));
    this.computerPieces |= move;
    this.heightMap += move;
    this.movesMade++;
    this.isComputerTurn = false;
    
    return {row: row, col: col, result: this.game_result()};
}

Game.prototype.make_player_move = function (col) {
    const row = this.col_height(col);
    const row_bit = this.heightMap & (COL_MASK << (BigInt(col) << BigInt(3)));

    if (col < 0 || col >= MAX_COL_HEIGHT || row === MAX_COL_HEIGHT ||this.isComputerTurn)
        return {row: undefined, col: undefined, result: undefined};

    this.playerPieces |= row_bit;
    this.heightMap += row_bit;
    this.movesMade++;
    this.isComputerTurn = true;
    
    return {row: row, col: col, result: this.game_result()};
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

