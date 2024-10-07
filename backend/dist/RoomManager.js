"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_pty_1 = require("node-pty");
const os_1 = __importDefault(require("os"));
var shell = os_1.default.platform() === 'win32' ? 'powershell.exe' : 'bash';
class RoomManager {
    constructor() {
        this.users = new Map();
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new RoomManager();
        }
        return this.instance;
    }
    addToRoom(userId, socket) {
        // spawn a new terminal 
        var ptyProcess = node_pty_1.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.env.INIT_CWD + '/user',
            env: process.env
        });
        ptyProcess.onData((data) => {
            socket.send(data);
            console.log(`${userId} sent: %s`, data);
        });
        ptyProcess.onExit((exitCode) => {
            console.log(`${userId} exited with code %d`, exitCode);
        });
        this.users.set(userId, {
            id: userId,
            socket: socket,
            pty: ptyProcess
        });
        this.addListners(userId);
    }
    addListners(userId) {
        var _a;
        const user = this.users.get(userId);
        (_a = user.socket) === null || _a === void 0 ? void 0 : _a.on('message', (data) => {
            console.log('received: %s', data);
            user.pty.write(data);
            console.log(user.pty.pid);
        });
    }
}
exports.default = RoomManager;
