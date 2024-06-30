const URL = "https://7x7connect4bot/";
const ROWS = 7, COLS = 7;
const FADED = ".25";
const A_CODE = 65;

let player_color, computer_color;
let moves_made = 0;

async function send_game_state_request() {
    const res = await (await fetch(`${URL}user-info`, {method: "GET"})).json();
    if (res.moves != null) {
        set_up_game_start(res.player_starts);
        const colors = ['red', 'yellow'];
        for (const [i, move] of res.moves.entries()) {
            make_move(move, colors[i & 1]);
        }
    }
    document.getElementById("name").value = res.name;
}

function set_up_game_start(player_starts) {
    player_color = "yellow";
    computer_color = "red";
    if (player_starts) {
        player_color = "red";
        computer_color = "yellow";
    }
    document.getElementById("move-marker").style.background = player_color;
    document.getElementById("start-options").style.display = "none";
    document.getElementById("resign-option").style.display = "inline";
    document.getElementById("move-log").children[0].innerText = "0. Starting Position";
}

async function send_start_request(order) {
    const res = await (await fetch(`${URL}${order}`, {method: "GET"})).json();
    if (res.started) {
        moves_made = 0;
        document.getElementById("result-message").innerText = "";
        [...document.getElementsByName("game-piece")].forEach(piece => piece.remove());
        set_up_game_start(order === 'go-first');
        if (res.row != null) make_move(res, computer_color);
    }
}

async function send_resign_request() {
    await (await fetch(`${URL}resign`, {method: "GET"})).json();
    document.getElementById("resign-option").style.display = "none";
    document.getElementById("start-options").style.display = "inline";
    document.getElementById("result-message").innerText = "Computer Wins By Resignation!"
}

function cycle_through_winning_pieces(winning_pieces) {
    const animations = [
        `@keyframes a0 { 
            0% {opacity: 1}
            16.66% {opacity: 1}
            16.67% {opacity: ${FADED}}
            100% {opacity: ${FADED}}
        }`,
        `@keyframes a1 { 
            16.6% {opacity: ${FADED}}
            16.66% {opacity: 1}
            33.3% {opacity: 1}
            33.33% {opacity: ${FADED}}
            83.3% {opacity: ${FADED}}
            83.33% {opacity: 1}
            100% {opacity: 1}
        }`,
        `@keyframes a2 { 
            33.3% {opacity: ${FADED}}
            33.33% {opacity: 1}
            49.9% {opacity: 1}
            50% {opacity: ${FADED}}
            66.6% {opacity: ${FADED}}
            66.66% {opacity: 1}
            83.3% {opacity: 1}
            83.33% {opacity: ${FADED}}
        }`,
        `@keyframes a3 { 
            49.9% {opacity: ${FADED}}
            50% {opacity: 1}
            66.6% {opacity: 1}
            66.66% {opacity: ${FADED}}
        }`,
    ];
    for (const [i, piece] of winning_pieces.sort((a, b) => a.cell - b.cell).entries()) {
        const animation = document.createElement("style");
        animation.setAttribute("type", "text/css");
        animation.innerHTML = animations[i];
        piece.style.animationName = `a${i}`;
        piece.style.animationDuration = "2s";
        piece.style.animationIterationCount = "infinite";
        piece.appendChild(animation);
    }
}

function show_result(winning_cells) {
    if (winning_cells == null) return;

    const winning_pieces = [];
    for (const piece of document.getElementsByClassName("piece")) {
        if (winning_cells.includes(piece.cell)) winning_pieces.push(piece);
        piece.style.opacity = FADED;
    }
    if (winning_pieces.length) cycle_through_winning_pieces(winning_pieces);

    document.getElementById("result-message").innerText = winning_cells.length ? "Computer Wins!" : "Draw!";
    document.getElementById("resign-option").style.display = "none";
    document.getElementById("start-options").style.display = "inline";
}

function update_move_log(col) {
    moves_made++;
    let move_str;
    if (moves_made & 1)
        move_str = `\n${moves_made + 1 >> 1}.${moves_made < 18 ? '  ' : ' '}${String.fromCharCode(col + A_CODE)}`;
    else move_str = `    ${String.fromCharCode(col + A_CODE)}`;
    document.getElementById("move-log").children[0].innerText += move_str;
}

function make_move(move, color) {
    update_move_log(move.col);

    const vertical_pos = `${75.75 - move.row * 10}vh`
    const piece = document.createElement("span");
    piece.cell = move.col * (ROWS + 1) + move.row;
    piece.className = "piece";
    piece.setAttribute("name", "game-piece");
    piece.style.background = color;
    piece.style.top = vertical_pos;
    piece.style.left = `calc(50% + ${move.col * 10 - 34.25}vh)`;

    const animation = document.createElement("style");
    animation.setAttribute("type", "text/css");
    animation.innerHTML = `@keyframes drop${move.row}${move.col} { from { top: 5.75vh } to { top: ${vertical_pos} } }`;
    piece.style.animationName = `drop${move.row}${move.col}`;
    piece.addEventListener("animationend", () => show_result(move.winning_cells));
    piece.appendChild(animation);

    document.body.appendChild(piece);
}

async function send_move_request(col) {
    const player_move = await (await fetch(`${URL}move?col=${col}`, {method: "GET"})).json();
    if (player_move.row != null) {
        document.getElementById("move-marker").style.display = "none";
        make_move(player_move, player_color);
    }

    const computer_move = await (await fetch(`${URL}computer-move`, {method: "GET"})).json();
    if (computer_move.row != null) {
        make_move(computer_move, computer_color);
        for (const column of document.getElementById("board").getElementsByTagName("div")) {
            if (column.mouse_on) await send_hover_request(parseInt(column.col_num));
        }
    }
}

async function send_hover_request(col) {
    const res = await (await fetch(`${URL}hover?col=${col}`, {method: "GET"})).json();
    if (res.row != null) {
        const move_marker = document.getElementById("move-marker");
        move_marker.style.display = "inline";
        move_marker.style.top = `calc(${75.75 - res.row * 10}vh)`;
        move_marker.style.left = `calc(50% + ${res.col * 10 - 34.25}vh)`;
    }
}

async function send_set_name_request(name) {
    await fetch(`${URL}set-name?name=${name}`, {method: "GET"});
}
