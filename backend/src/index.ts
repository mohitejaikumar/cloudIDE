import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import fs from "fs/promises";
import path from "path";
import RoomManager from "./RoomManager";
import http from "http";
import {
  getFileLanguage,
  getFilesIncrementally,
  removeTrailingSlash,
} from "./helpers";

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer();
server.timeout = 0;
const wss = new WebSocketServer({ server });

server.listen(8080, () => {
  console.log("Web Socket Server is listening on port 8080");
});

wss.on("connection", function connection(ws) {
  ws.on("error", console.error);
  ws.on("message", (data: string) => {
    const { type, clientId } = JSON.parse(data);
    if (type === "join") {
      RoomManager.getInstance().addToRoom(clientId, ws);
    }
  });
});

app.get("/files", async (req, res) => {
  const dirPath = req.query.dirPath;
  if (typeof dirPath !== "string") {
    res.send("Invalid Directory");
    return;
  }
  const finalDirPath = path.join(__dirname, path.join("..", dirPath));
  const result = await getFilesIncrementally(
    finalDirPath,
    dirPath.split("/").filter(Boolean).pop() || "user"
  );

  res.send(result);
});

app.get("/file/content", async (req, res) => {
  let filePath = req.query.filePath;
  if (typeof filePath !== "string") {
    res.send("Invalid File Path");
    return;
  }
  filePath = removeTrailingSlash(filePath);
  const finalFilePath = path.join(__dirname, path.join("..", filePath));
  const fileContent = await fs.readFile(finalFilePath);
  const language = getFileLanguage(finalFilePath);
  res.send({
    content: fileContent.toString(),
    language,
  });
});

app.get("/", (req, res) => {
  res.send("Hello World !!");
});

app.listen(3000, () => {
  console.log("server started");
});
