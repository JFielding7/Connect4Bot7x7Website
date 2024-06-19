const URL = "http://localhost:7000/";
let player_color, computer_color;

async function send_start_request(order) {
    const res = await fetch(`${URL}${order}`, {method: "GET"});
    const data = await res.json();
    if (data.started) {
        document.getElementById("start-options").style.display = "none";
        document.getElementById("resign-option").style.display = "inline";

        player_color = "yellow";
        computer_color = "red";
        if (order === 'go-first') {
            player_color = "red";
            computer_color = "yellow";
        }
        document.getElementById("move_marker").style.background = player_color;
    }
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
    piece.className = "piece";
    piece.style.background = color;
    piece.style.left = `calc(50% + ${col * 10 - 34.25}vh)`;
    piece.style.top = "5.75vh";
    piece.style.animationName = `drop${row}${col}`;

    piece.appendChild(animation);
    document.body.appendChild(piece);
    console.log(color);
}

async function send_move_request(col, e) {
    e.preventDefault();

    const player_move = await (await fetch(`${URL}move?col=${col}`, {method: "GET"})).json();
    if (player_move.row != null) {
        document.getElementById("move_marker").style.display = "none";
        make_move(player_move.row, player_move.col, player_color);
        console.log(player_move);
    }
    else console.log("no move");

    const computer_move = await (await fetch(`${URL}computer-move`)).json();
    console.log("computer move", computer_move.row, computer_move.col);
    if (computer_move.row != null) {
        make_move(computer_move.row, computer_move.col, computer_color);
        for (const column of document.getElementById("board").getElementsByTagName("div")) {
            if (column.mouse_on) {
                console.log("Still hovering over " + column.col_num);
                await send_hover_request(parseInt(column.col_num));
            }
        }
    }
}

async function send_hover_request(col, e) {
    // e.preventDefault();

    const res = await (await fetch(`${URL}hover?col=${col}`, {method: "GET"})).json();
    if (res.row != null) {
        const move_marker = document.getElementById("move_marker");
        move_marker.style.display = "inline";
        move_marker.style.top = `calc(${75.75 - res.row * 10}vh)`;
        move_marker.style.left = `calc(50% + ${res.col * 10 - 34.25}vh)`;
    }
    console.log(`Hovering over ${res.row} ${res.col}`);
}
