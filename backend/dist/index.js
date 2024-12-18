"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const ws_1 = require("ws");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const RoomManager_1 = __importDefault(require("./RoomManager"));
const http_1 = __importDefault(require("http"));
const helpers_1 = require("./helpers");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const server = http_1.default.createServer();
server.timeout = 0;
const wss = new ws_1.WebSocketServer({ server });
server.listen(8080, () => {
    console.log("Web Socket Server is listening on port 8080");
});
wss.on("connection", function connection(ws) {
    ws.on("error", console.error);
    ws.on("message", (data) => {
        const { type, clientId } = JSON.parse(data);
        if (type === "join") {
            RoomManager_1.default.getInstance().addToRoom(clientId, ws);
        }
    });
});
app.get("/files", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const dirPath = req.query.dirPath;
    if (typeof dirPath !== "string") {
        res.send("Invalid Directory");
        return;
    }
    const finalDirPath = path_1.default.join(__dirname, path_1.default.join("..", dirPath));
    const result = yield (0, helpers_1.getFilesIncrementally)(finalDirPath, dirPath.split("/").filter(Boolean).pop() || "user");
    res.send(result);
}));
app.get("/file/content", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let filePath = req.query.filePath;
    if (typeof filePath !== "string") {
        res.send("Invalid File Path");
        return;
    }
    filePath = (0, helpers_1.removeTrailingSlash)(filePath);
    const finalFilePath = path_1.default.join(__dirname, path_1.default.join("..", filePath));
    const fileContent = yield promises_1.default.readFile(finalFilePath);
    const language = (0, helpers_1.getFileLanguage)(finalFilePath);
    res.send({
        content: fileContent.toString(),
        language,
    });
}));
app.get("/", (req, res) => {
    res.send("Hello World !!");
});
app.listen(3000, () => {
    console.log("server started");
});
