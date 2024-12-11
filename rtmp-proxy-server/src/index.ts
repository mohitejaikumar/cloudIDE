import httpProxy from "http-proxy";
import http from "http";
import express from "express";
import cors from "cors";
import { URL } from "url";

// Create a proxy server instance with WebSocket support enabled
const proxy = httpProxy.createProxyServer({
  ws: true,
});

const app = express();
app.use(cors());

// Create the main server
const server = http.createServer(app);

app.use((req, res) => {
  console.log(`Incoming request URL: ${req.url}`);

  const ip = req.headers["ip"];
  console.log(ip);
  if (ip) {
    // Construct the target URL using the `path` parameter
    const target = `http://${ip}:8083`;
    console.log(`Proxying HTTP request to: ${target}`);

    // Forward the HTTP request to the target
    proxy.web(req, res, { target }, (error) => {
      console.error(
        "Error while proxying HTTP request:",
        error.message || error
      );
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("An error occurred with the HTTP proxy.");
    });
  } else {
    // If the `path` parameter is missing, return a 400 Bad Request
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end('Missing "path" query parameter. Use ?path={ip}');
  }
});

// Handle WebSocket connections for dynamic IPs
server.on("upgrade", (req, socket, head) => {
  const parsedUrl = new URL(req.url!, `https://${req.headers.host}`);
  const ip = parsedUrl.searchParams.get("path"); // Extract the `path` parameter

  if (ip) {
    // Construct the WebSocket target URL using the `path` parameter
    const target = `ws://${ip}`;
    console.log(`Proxying WebSocket connection to: ${target}`);

    // Forward the WebSocket request to the target
    proxy.ws(req, socket, head, { target }, (error) => {
      console.error(
        "Error while proxying WebSocket connection:",
        error.message || error
      );
      socket.end("An error occurred with the WebSocket proxy.");
    });
  } else {
    // If the `path` parameter is missing, close the WebSocket connection
    console.log('Missing "path" query parameter for WebSocket connection');
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
  }
});

// Start the server on a specified port
const PORT = 8081;
server.listen(PORT, () => {
  console.log(
    `Central reverse proxy server running on http://localhost:${PORT}`
  );
});

// Improved error handling for both HTTP and WebSocket responses
proxy.on("error", (err, req, res) => {
  console.error("Proxy error:", err);

  // If res is a ServerResponse object (HTTP), handle it accordingly
  if (res instanceof http.ServerResponse && !res.headersSent) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("An error occurred with the proxy.");
  } else if (res instanceof require("net").Socket) {
    // If res is a Socket (WebSocket), write a generic error and destroy the socket
    res.end();
    res.destroy();
  }
});
