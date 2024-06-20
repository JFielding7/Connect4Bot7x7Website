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
        for (const p of document.getElementsByClassName("piece")) {
            console.log(p.getAttribute("name"));
        }
        [...document.getElementsByName("game-piece")].forEach(piece => piece.remove());

        player_color = "yellow";
        computer_color = "red";
        if (order === 'go-first') {
            player_color = "red";
            computer_color = "yellow";
        }
        document.getElementById("move_marker").style.background = player_color;
    }
    if (data.row != null) make_move(data.row, data.col, computer_color);
}

async function send_resign_request() {
    const res = await fetch(`${URL}resign`, {method: "GET"});
    await res.json();
    document.getElementById("start-options").style.display = "inline";
    document.getElementById("resign-option").style.display = "none";
}

function make_move(row, col, color) {
    const animation = document.createElement("style");
    animation.setAttribute("type", "text/css");
    animation.innerHTML = `@keyframes drop${row}${col} { 100% {top: ${75.75 - row * 10}vh} }`;

    const piece = document.createElement("span");
    piece.cell = col * (ROWS + 1) + row;
    piece.className = "piece";
    piece.setAttribute("name", "game-piece");
    piece.style.background = color;
    piece.style.left = `calc(50% + ${col * 10 - 34.25}vh)`;
    piece.style.top = "5.75vh";
    piece.style.animationName = `drop${row}${col}`;

    piece.appendChild(animation);
    document.body.appendChild(piece);
}

function show_result(winning_cells) {
    if (winning_cells == null) return;
    for (const piece of document.getElementsByClassName("piece")) {
        if (!winning_cells.includes(piece.cell)) piece.style.opacity = FADED;
    }

    document.getElementById("resign-option").style.display = "none";
    document.getElementById("start-options").style.display = "inline";
}

async function send_move_request(col, e) {
    e.preventDefault();

    const player_move = await (await fetch(`${URL}move?col=${col}`, {method: "GET"})).json();
    if (player_move.row != null) {
        document.getElementById("move_marker").style.display = "none";
        make_move(player_move.row, player_move.col, player_color);
        // console.log("Player move", player_move);
    }
    show_result(player_move.result);

    const computer_move = await (await fetch(`${URL}computer-move`)).json();

    if (computer_move.row != null) {
        make_move(computer_move.row, computer_move.col, computer_color);
        for (const column of document.getElementById("board").getElementsByTagName("div")) {
            if (column.mouse_on) await send_hover_request(parseInt(column.col_num));
        }
    }
    show_result(computer_move.result);
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
