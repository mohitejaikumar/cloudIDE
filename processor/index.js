import { WebSocketServer } from "ws";
import { spawn, exec } from "child_process";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const wss = new WebSocketServer({ port: 8082 });
let isConnected = false;
const options = [
  "-i",
  "-",
  "-c:v",
  "libx264",
  "-preset",
  "ultrafast",
  "-tune",
  "zerolatency",
  "-r",
  `${25}`,
  "-g",
  `${25 * 2}`,
  "-keyint_min",
  25,
  "-crf",
  "25",
  "-pix_fmt",
  "yuv420p",
  "-sc_threshold",
  "0",
  "-profile:v",
  "main",
  "-level",
  "3.1",
  "-c:a",
  "aac",
  "-b:a",
  "128k",
  "-ar",
  128000 / 4,
  "-f",
  "flv",
  "rtmp://localhost:1935/live", // RTMP endpoint
];

const ffmpegProcess = spawn("ffmpeg", options);

ffmpegProcess.stdout.on("data", (data) => {
  console.log(`ffmpeg stdout: ${data}`);
});

ffmpegProcess.stderr.on("data", (data) => {
  console.error(`ffmpeg stderr: ${data}`);
});

ffmpegProcess.on("close", (code) => {
  console.log(`ffmpeg process exited with code ${code}`);
});

setTimeout(() => {
  if (!isConnected) {
    killAllProcesses();
  }
}, 30000);

// just health check

app.get("/", (req, res) => {
  res.send({
    status: "ok",
  });
});

app.listen(8081, () => {
  console.log("Listening on port 8081");
});

wss.on("connection", function connection(ws) {
  console.log("connected");
  ws.on("error", console.error);

  ws.on("message", function message(data) {
    isConnected = true;
    // console.log('Binary Stream Incommming...', data);
    ffmpegProcess.stdin.write(data, (err) => {
      console.log("Err", err);
    });
  });
  ws.on("close", () => {
    setTimeout(() => {
      killAllProcesses();
    }, 10000);
  });
});

function killAllProcesses() {
  killProcessOnPort(1935);
  killProcessOnPort(8081);
  killProcessOnPort(8083);
}

function killProcessOnPort(port) {
  const command = `lsof -t -i:${port} | xargs kill -9`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(`Failed to kill process on port ${port}:`, err.message);
      return;
    }
    if (stderr) {
      console.error(`Error output:`, stderr);
      return;
    }
    console.log(`Successfully killed processes on port ${port}`);
    if (port === 8083) {
      process.exit(0);
    }
  });
}
