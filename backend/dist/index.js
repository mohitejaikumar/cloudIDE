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
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const RoomManager_1 = __importDefault(require("./RoomManager"));
const helpers_1 = require("./helpers");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const wss = new ws_1.WebSocketServer({ port: 8080 });
wss.on('connection', function connection(ws) {
    ws.on('error', console.error);
    const userId = uuid_1.v4();
    RoomManager_1.default.getInstance().addToRoom(userId, ws);
});
app.get('/files', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const dirPath = req.query.dirPath;
    if (typeof dirPath !== "string") {
        res.send("Invalid Directory");
        return;
    }
    const finalDirPath = path_1.default.join(__dirname, path_1.default.join('..', dirPath));
    const result = yield (0, helpers_1.getFilesIncrementally)(finalDirPath, dirPath.split('/').pop() || "user");
    console.log(result);
    res.send(result);
}));
app.get('/', (req, res) => {
    res.send("Hello World !!");
});
app.listen(3000, () => {
    console.log("server started");
});
