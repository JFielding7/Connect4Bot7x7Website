const express = require("express");
const server = express();
const PORT = 7000;

server.use(express.static('public'));

server.get('', (req, res) => {
    console.log(req.url);
   res.sendFile(__dirname + '/public/connect4bot7x7.html');
});

server.get('/:dynamic', (req, res) => {
    console.log(req.query);
    res.status(200).json({col: req.query.move});
});

server.listen(PORT, err => {
    if (err) {
        console.error(err);
    }
    else {
        console.log(`Server running on port ${PORT}`)
    }
});
