const URL = "http://localhost:7000/";
const ROWS = 7, COLS = 7;
const FADED = ".25";

let player_color, computer_color;

async function send_start_request(order) {
    const res = await fetch(`${URL}${order}`, {method: "GET"});
    const data = await res.json();

    if (data.started) {
        document.getElementById("start-options").style.display = "none";
        document.getElementById("resign-option").style.display = "inline";
        document.getElementById("result-message").innerText = "";
        [...document.getElementsByName("game-piece")].forEach(piece => piece.remove());

        player_color = "yellow";
        computer_color = "red";
        if (order === 'go-first') {
            player_color = "red";
            computer_color = "yellow";
        }
        document.getElementById("move_marker").style.background = player_color;
    }
    if (data.row != null) make_move(data, computer_color);
}

async function send_resign_request() {
    const res = await fetch(`${URL}resign`, {method: "GET"});
    await res.json();

    document.getElementById("start-options").style.display = "inline";
    document.getElementById("resign-option").style.display = "none";
    [...document.getElementsByName("game-piece")].forEach(piece => piece.remove());
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

function make_move(move, color) {
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
    piece.addEventListener("animationend", () => show_result(move.result));
    piece.appendChild(animation);

    document.body.appendChild(piece);
}

async function send_move_request(col, e) {
    e.preventDefault();

    const player_move = await (await fetch(`${URL}move?col=${col}`, {method: "GET"})).json();
    if (player_move.row != null) {
        document.getElementById("move_marker").style.display = "none";
        make_move(player_move, player_color);
    }

    const computer_move = await (await fetch(`${URL}computer-move`)).json();

    if (computer_move.row != null) {
        make_move(computer_move, computer_color);
        for (const column of document.getElementById("board").getElementsByTagName("div")) {
            if (column.mouse_on) await send_hover_request(parseInt(column.col_num));
        }
    }
}

async function send_hover_request(col, e) {
    if (e != null) e.preventDefault();

    const res = await (await fetch(`${URL}hover?col=${col}`, {method: "GET"})).json();
    if (res.row != null) {
        const move_marker = document.getElementById("move_marker");
        move_marker.style.display = "inline";
        move_marker.style.top = `calc(${75.75 - res.row * 10}vh)`;
        move_marker.style.left = `calc(50% + ${res.col * 10 - 34.25}vh)`;
    }
}
