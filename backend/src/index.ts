import express from "express";
import cors from "cors";
import { WebSocketServer } from 'ws';
import uuid from "uuid";
import fs from "fs/promises";
import path from "path";
import RoomManager from "./RoomManager";
import { getAllFiles, getFileLanguage, getFilesIncrementally } from "./helpers";

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

app.get('/file/content' , async(req,res )=>{
    const filePath = req.query.filePath;
    if(typeof filePath !== "string"){
        res.send("Invalid File Path");
        return;
    }
    const finalFilePath = path.join(__dirname , path.join('..' , filePath));
    const fileContent = await fs.readFile(finalFilePath);
    const language = getFileLanguage(finalFilePath);
    res.send({
        content:fileContent.toString(),
        language
    })
})

app.get('/' ,(req,res)=>{
    res.send("Hello World !!");
})

app.listen(3000,()=>{
    console.log("server started");
})