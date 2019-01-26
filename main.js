const http = require("http");
const request = require("request");
const url = require("url");

const port = parseInt(process.argv[2]);
const serverId = "p:" + port.toString();

let network = new Map(),
    storage = new Map();

const handler = (req, res) => {
  let retcode = 200, start = new Date();
  console.log(serverId, "HTTP", req.httpVersion, start, req.method, req.url);

  let reqUrl = url.parse(req.url, true);

  if (req.method === "GET" && reqUrl.pathname === "/status") {
    res.end(`Connections: ${network.size} Storage: ${storage.size}\n`);
  } else if (req.method === "GET" && reqUrl.pathname === "/request") {
  } else if (req.method === "GET" && reqUrl.pathname === "/get") {
  } else if (req.method === "POST" && reqUrl.pathname === "/store") {

    storage.set("", );
  } else if (req.method === "POST" && reqUrl.pathname === "/connect") {
  } else {
    retcode = 404;
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.end("404 Not found.\n");
  }

  console.log(serverId, "  -responded with", retcode, "in", new Date() - start, "ms");
};

const server = http.createServer(handler);

console.log("Starting server on", port);

server.listen(port, (err) => {
  if (err) {
    console.log("Could not start server:", err);
    return;
  }

  console.log("Server is online and listening");
  console.log("---");
});
