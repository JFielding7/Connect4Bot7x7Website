const express = require("express");
const server = express();
const PORT = 7000;
const execSync = require('child_process').execSync;

server.use(express.static('public'));

server.get('', (req, res) => {
    console.log(req.url);
    res.sendFile(__dirname + '/public/connect4bot7x7.html');
});

server.get('/move', (req, res) => {
    res.status(200).json({col: req.query.col});
});

server.get('/hover', (req, res) => {
    res.status(200).json({col: req.query.col});
});

server.get('/go-first', (req, res) => {
    execSync('go-first', (err, stdout, stderr) => {})
});

server.get('/go-second', (req, res) => {

});

server.get('/resign', (req, res) => {

});

server.listen(PORT, err => {
    if (err) {
        console.error(err);
    }
    else {
        console.log(`Server running on port ${PORT}`)
    }
});
