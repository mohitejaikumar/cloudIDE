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
const node_pty_1 = require("node-pty");
const os_1 = __importDefault(require("os"));
const helpers_1 = require("./helpers");
const path_1 = __importDefault(require("path"));
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
            socket.send(JSON.stringify({
                type: 'terminal',
                data: data
            }));
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
        (_a = user.socket) === null || _a === void 0 ? void 0 : _a.on('message', (data) => __awaiter(this, void 0, void 0, function* () {
            console.log('received: %s', data);
            const payload = JSON.parse(data);
            switch (payload.type) {
                case 'terminal': {
                    user.pty.write(payload.data);
                    console.log(user.pty.pid);
                    break;
                }
                case 'filePatch': {
                    this.users.forEach((u) => {
                        if (u.id !== userId) {
                            u.socket.send(JSON.stringify({
                                type: 'filePatch',
                                data: payload.data,
                                filePath: payload.filePath
                            }));
                        }
                    });
                    yield (0, helpers_1.appyPatchtoFile)(path_1.default.join(__dirname, path_1.default.join('..', payload.filePath)), payload.data);
                }
            }
        }));
    }
}
exports.default = RoomManager;
