const URL = "http://localhost:7000/";

async function send_start_request (order) {
    const res = await fetch(`${URL}${order}`, {method: "GET"});
    const data = await res.json();
    console.log(data);
}