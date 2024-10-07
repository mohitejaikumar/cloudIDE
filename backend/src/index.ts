import express from "express";
import cors from "cors";
import { WebSocketServer } from 'ws';
import uuid from "uuid";
import fs from "fs";
import path from "path";
import RoomManager from "./RoomManager";
import { getAllFiles, getFilesIncrementally } from "./helpers";

const app = express();
app.use(cors());
app.use(express.json());

const wss = new WebSocketServer({ port: 8080 });


wss.on('connection', function connection(ws) {
    ws.on('error', console.error);
    const userId = uuid.v4();
    RoomManager.getInstance().addToRoom(userId,ws);
});

app.get('/files' , async (req,res)=>{
    const dirPath = req.query.dirPath;
    if(typeof dirPath !== "string"){
        res.send("Invalid Directory");
        return;
    }
    const finalDirPath = path.join(__dirname , path.join('..' , dirPath));
    const result = await getFilesIncrementally(finalDirPath,dirPath.split('/').pop() || "user");
    console.log(result);
    res.send(result);
})

app.get('/' ,(req,res)=>{
    res.send("Hello World !!");
})

app.listen(3000,()=>{
    console.log("server started");
})