const express = require("express");
var app = express();
var path = require('path');

var htmlPath = __dirname + "/html"

var indexPaths = ["/","/profile","/submit","/release","/setup","/recover-account"];

app.use("/res", express.static(path.join(htmlPath + "/res")));

app.get(indexPaths, (req, res) => {
	res.sendFile(path.join(htmlPath + '/index.html'));
});
app.get("/login*", (req, res) => {
	res.sendFile(path.join(htmlPath + '/login.html'));
});
app.get("/auth*", (req, res) => {
	res.sendFile(path.join(htmlPath + '/login-callback.html'));
});
app.get("/favicon.ico", (req, res) => {
	res.sendFile(path.join(htmlPath + "/favicon.ico"))
});

app.listen(8082, () => {
	console.log("Started listening on port 8082");
});
