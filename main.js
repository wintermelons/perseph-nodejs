const http = require("http");
const request = require("request");
const url = require("url");

const port = parseInt(process.argv[2]);
const serverId = "localhost:" + port.toString();

let network = new Set(),
    storage = new Map();

function forwardRequest(url) {
    console.log("forwarding request", url);
    return new Promise((resolve, reject) => {
        request("http://" + url, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>');
            }
            resolve(body);
        });
    });
}

const handler = async function(req, res) {
  let retcode = 200, start = new Date();
  console.log(serverId, "HTTP", req.httpVersion, start, req.method, req.url);

  let reqUrl = url.parse(req.url, true);

  // Get status of the server.
  if (req.method === "GET" && reqUrl.pathname === "/status") {
    res.end(`Connections: ${network.size} Storage: ${storage.size}\n`);

  // Request throughout the network for a key.
  } else if (req.method === "GET" && reqUrl.pathname === "/request") {
    console.log(reqUrl.query, reqUrl.query.hops);
    let reqKey = reqUrl.query.key;
    
    let numHopsRemaining = 6;
    if (reqUrl.query.hops !== undefined) {
      numHopsRemaining = parseInt(reqUrl.query.hops) - 1;
      if (numHopsRemaining <= 0) {
        console.log("no hops remaining");
        retcode = 500;
        res.writeHead(500, {"Content-Type": "text/plain"});
        res.end("Resource not found\n");
        return;
      }
    }

    if (storage.has(reqKey)) {
      res.end(`${serverId}\n`);
    } else {
      
      //let networkArray = network.values();
      //for(const peer in networkArray) {
      for(const peer of network) {
        try {
          console.log("Executing request for peer", peer);
          let p = await forwardRequest(peer + "/request?key=" + reqKey + "&hops=" + numHopsRemaining);
          res.end(p);
          return;
        } catch (err) {
            console.log("Did not find in peer", peer, err);
          }
      }

      retcode = 500;
      res.writeHead(500, {"Content-Type": "text/plain"});
      res.end("Resource not found\n");
    }

  // Get the value of a key from node.
  } else if (req.method === "GET" && reqUrl.pathname === "/get") {
    let reqKey = reqUrl.query.key;
    if (storage.has(reqKey)) {
      res.end(storage.get(reqKey));
    } else {
      retcode = 500;
      res.writeHead(500, {"Content-Type": "text/plain"});
      res.end("Resource not found\n");
    }
  
  // Store a key/value into the node locally.
  } else if (req.method === "POST" && reqUrl.pathname === "/store") {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      let data = JSON.parse(body);
      storage.set(data.key, data.value);
      res.end(`New key added ${data.key}\n`);
    });
  
  // Add a neighbor to the node.
  } else if (req.method === "POST" && reqUrl.pathname === "/connect") {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      let data = JSON.parse(body);
      network.add(data.endpoint);
      res.end(`Endpoint added ${data.endpoint}\n`);
    });

  // 404 Not found.
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
