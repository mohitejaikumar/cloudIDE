import pty from 'node-pty';
import os from 'os';
import { WebSocket } from 'ws';


interface User{
    id:string,
    socket:WebSocket,
    pty:pty.IPty
}
var shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';


class RoomManager{

    private users: Map<string, User> = new Map();
    private static instance: RoomManager;

    
    static getInstance(){
        if(!this.instance){
            this.instance = new RoomManager();
        }
        return this.instance;
    }

    addToRoom(userId:string, socket:WebSocket){
        // spawn a new terminal 
        var ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.env.INIT_CWD +'/user',
            env: process.env
        });
        ptyProcess.onData((data) => {
            socket.send(data);
            console.log(`${userId} sent: %s`, data);
        });
        ptyProcess.onExit((exitCode)=>{
            console.log(`${userId} exited with code %d`, exitCode);
        })

        this.users.set(userId,{
            id:userId,
            socket:socket,
            pty:ptyProcess
        })

        this.addListners(userId);
    }

    private addListners(userId:string){
        
        const user = this.users.get(userId)!;

        user.socket?.on('message',(data:string)=>{
            console.log('received: %s', data);
            user.pty.write(data);
            console.log(user.pty.pid);
        })
    }
}


export default RoomManager;