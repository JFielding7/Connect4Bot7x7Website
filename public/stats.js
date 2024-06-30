const URL = "https://7x7connect4bot.com/";

async function fetch_stats() {
    const stats = await (await fetch(`${URL}fetch-stats`)).json();
    stats.total_wins = stats.first_wins + stats.second_wins;
    stats.total_draws = stats.first_draws + stats.second_draws;
    stats.total_losses = stats.first_losses + stats.second_losses;
    const first_count = stats.first_wins + stats.first_draws + stats.first_losses;
    const second_count = stats.second_wins + stats.second_draws + stats.second_losses;
    const total_count = first_count + second_count;

    for (const s of ["first", "second", "total"]) {
        const games = eval(`${s}_count`);
        document.getElementById(s + "-count").textContent = `Games: ${games}`;

        const wins = eval(`stats.${s}_wins`);
        const draws = eval(`stats.${s}_draws`);
        const losses = eval(`stats.${s}_losses`);

        if (games) {
            const win_percent = wins / games * 100;
            document.getElementById(s + "-wins").textContent = `Wins: ${wins} (${win_percent.toFixed(2)}%)`;
            document.getElementById(s + "-win-bar").style.width = `${win_percent}%`

            const draw_percent = draws / games * 100;
            document.getElementById(s + "-draws").textContent = `Draws: ${draws} (${draw_percent.toFixed(2)}%)`;
            document.getElementById(s + "-draw-bar").style.width = `${draw_percent}%`

            const loss_percent = losses / games * 100;
            document.getElementById(s + "-losses").textContent = `Losses: ${losses} (${loss_percent.toFixed(2)}%)`;
            document.getElementById(s + "-loss-bar").style.width = `${loss_percent}%`
        }
        else {
            document.getElementById(s + "-wins").textContent = `Wins: ${wins}`;
            document.getElementById(s + "-draws").textContent = `Draws: ${draws}`;
            document.getElementById(s + "-losses").textContent = `Losses: ${losses}`;
        }
    }
}