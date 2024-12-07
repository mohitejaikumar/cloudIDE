import { WebSocketServer } from 'ws';
import { spawn } from 'child_process'


const wss = new WebSocketServer({ port: 8082 });

const options = [
    '-i',
    '-',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-r', `${25}`,
    '-g', `${25 * 2}`,
    '-keyint_min', 25,
    '-crf', '25',
    '-pix_fmt', 'yuv420p',
    '-sc_threshold', '0',
    '-profile:v', 'main',
    '-level', '3.1',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', 128000 / 4,
    '-f', 'flv',
    'rtmp://localhost:1935/live',  // RTMP endpoint
];



const ffmpegProcess = spawn('ffmpeg', options);

ffmpegProcess.stdout.on('data', (data) => {
    console.log(`ffmpeg stdout: ${data}`);
});

ffmpegProcess.stderr.on('data', (data) => {
    console.error(`ffmpeg stderr: ${data}`);
});

ffmpegProcess.on('close', (code) => {
    console.log(`ffmpeg process exited with code ${code}`);
});



wss.on('connection', function connection(ws) {
    console.log('connected');
    ws.on('error', console.error);

    ws.on('message', function message(data) {
        
            // console.log('Binary Stream Incommming...', data);
            ffmpegProcess.stdin.write(data, (err) => {
                console.log('Err', err)
            })
        
    });
});

