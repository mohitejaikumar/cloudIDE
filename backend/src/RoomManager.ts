import pty from 'node-pty';
import os from 'os';
import { WebSocket } from 'ws';
import { appyPatchtoFile } from './helpers';
import path from 'path';
import chokidar, { FSWatcher } from 'chokidar';



interface User{
    id:string,
    socket:WebSocket,
    pty:pty.IPty
}
var shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';


class RoomManager{

    private users: Map<string, User> = new Map();
    private static instance: RoomManager;
    private watcher: FSWatcher;

    
    private constructor(){
        this.watcher = chokidar.watch(path.join(__dirname , ".." , "user"));
         // watcher eventListners
        this.watcher.on('add' , (path)=>{
        console.log(`File ${path} is added`);
        this.sendWatcherEvent('add' , path );
        })
        .on('unlink',(path)=>{
        console.log(`File ${path} is removed`);
        this.sendWatcherEvent('unlink' , path );
        })
        .on('addDir',(path)=>{
        console.log(`Dir ${path} is added`);
        this.sendWatcherEvent('addDir' , path);
        })
        .on('unlinkDir',(path)=>{
        console.log(`Dir ${path} is removed`);
        this.sendWatcherEvent('unlinkDir' , path );
        })
    }



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
            socket.send(JSON.stringify({
                type:'terminal',
                data:data
            }));
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

    private sendWatcherEvent(event:string , filePath:string ){
        this.users.forEach((user)=>{
            user.socket.send(JSON.stringify({
                type: event,
                data:filePath
            }))
        })
    }

    private addListners(userId:string){
        
        const user = this.users.get(userId)!;

        user.socket?.on('message',async(data:string)=>{
            console.log('received: %s', data);
            const payload = JSON.parse(data);
            switch(payload.type){
                case 'terminal':{
                    user.pty.write(payload.data);
                    console.log(user.pty.pid);
                    break;
                }
                case 'filePatch':{
                    this.users.forEach((u)=>{
                        if(u.id !== userId){
                            u.socket.send(JSON.stringify({
                                type:'filePatch',
                                data:payload.data,
                                filePath:payload.filePath
                            }))
                        }
                    })
                    await appyPatchtoFile(path.join(__dirname,path.join('..' , payload.filePath)),payload.data);
                    
                }
                    
            }
        })
    }
}


export default RoomManager;