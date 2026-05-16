const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PORT = 4173;
const ROOT = __dirname;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const server = http.createServer(function (request, response) {
  const requestPath = decodeURIComponent(request.url.split("?")[0]);
  const filePath = path.join(ROOT, requestPath === "/" ? "index.html" : requestPath);

  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, function (error, content) {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": TYPES[path.extname(filePath)] || "application/octet-stream"
    });
    response.end(content);
  });
});

server.listen(PORT, function () {
  console.log("Recettes Famille: http://localhost:" + PORT);
  Object.values(os.networkInterfaces()).flat().forEach(function (network) {
    if (network && network.family === "IPv4" && !network.internal) {
      console.log("Réseau local: http://" + network.address + ":" + PORT);
    }
  });
});
