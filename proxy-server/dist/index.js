"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_proxy_1 = __importDefault(require("http-proxy"));
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const url_1 = require("url");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
// Create the main server
const server = http_1.default.createServer(app);
const availableProxy = new Map();
app.use((req, res) => {
    console.log(`Incoming request URL: ${req.url}`);
    const ip = req.headers["path"];
    const clientId = String(req.headers["client-id"]) || "";
    if (ip) {
        // Construct the target URL using the `path` parameter
        const target = `http://${ip}`;
        console.log(`Proxying HTTP request to: ${target}`);
        let proxy;
        if (availableProxy.has(clientId)) {
            proxy = availableProxy.get(clientId);
            if (!proxy) {
                // If proxy is undefined
                res.writeHead(400, { "Content-Type": "text/plain" });
                res.end('Missing "path" query parameter. Use ?path={ip}');
                return;
            }
        }
        else {
            proxy = http_proxy_1.default.createProxyServer({
                ws: true,
                timeout: 0,
                proxyTimeout: 0,
            });
            availableProxy.set(clientId, proxy);
        }
        // Forward the HTTP request to the target
        proxy.web(req, res, { target, changeOrigin: true, ws: true, timeout: 0, proxyTimeout: 0 }, (error) => {
            console.error("Error while proxying HTTP request:", error.message || error);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("An error occurred with the HTTP proxy.");
        });
    }
    else {
        // If the `path` parameter is missing, return a 400 Bad Request
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end('Missing "path" query parameter. Use ?path={ip}');
    }
});
// Handle WebSocket connections for dynamic IPs
server.on("upgrade", (req, socket, head) => {
    const parsedUrl = new url_1.URL(req.url, `https://${req.headers.host}`);
    const ip = parsedUrl.searchParams.get("path"); // Extract the `path` parameter
    const clientId = parsedUrl.searchParams.get("clientId") || "";
    if (ip) {
        // Construct the WebSocket target URL using the `path` parameter
        const target = `ws://${ip}`;
        console.log(`Proxying WebSocket connection to: ${target}`);
        let proxy;
        if (availableProxy.has(clientId)) {
            proxy = availableProxy.get(clientId);
            if (!proxy) {
                // If the `path` parameter is missing, close the WebSocket connection
                console.log('Missing "path" query parameter for WebSocket connection');
                socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
                socket.destroy();
                return;
            }
        }
        else {
            proxy = http_proxy_1.default.createProxyServer({
                ws: true,
                timeout: 0,
                proxyTimeout: 0,
            });
            availableProxy.set(clientId, proxy);
        }
        // Forward the WebSocket request to the target
        proxy.ws(req, socket, head, { target, timeout: 0, proxyTimeout: 0, changeOrigin: true }, (error) => {
            console.error("Error while proxying WebSocket connection:", error.message || error);
            socket.end("An error occurred with the WebSocket proxy.");
        });
    }
    else {
        // If the `path` parameter is missing, close the WebSocket connection
        console.log('Missing "path" query parameter for WebSocket connection');
        socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
        socket.destroy();
    }
});
// Start the server on a specified port
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Central reverse proxy server running on http://localhost:${PORT}`);
});
