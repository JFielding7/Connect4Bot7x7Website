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
    this.heightMap = BigInt("0b00000001_00000001_00000001_00000001_00000001_00000001_00000001");
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
    const move = this.heightMap & (COL_MASK << (col << 3));
    this.computerPieces |= move;
    this.heightMap += move;
    this.movesMade++;
    this.isComputerTurn = false;
    return col;
}

Game.prototype.make_player_move = function (col) {
    col = BigInt(col);
    const move = this.heightMap & (COL_MASK << (col << 3));
    if (this.isComputerTurn || (move & IS_LEGAL) === ZERO) return false;
    this.playerPieces |= move;
    this.heightMap += move;
    this.movesMade++;
    this.isComputerTurn = true;
    return true;
}

Game.prototype.lowest_empty_slot = function (col) {
    if (this.isComputerTurn) return null;
    let colBits = this.heightMap >> (BigInt(col) << 3);
    let height = 0;
    while ((colBits & ONE) === ZERO) {
        colBits >>= ONE;
        height++;
    }
    return height < MAX_HEIGHT ? height : null;
}
