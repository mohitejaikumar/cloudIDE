import ReactPlayer from "react-player";





export default function LiveStream(){
    return (
        <div>
            <ReactPlayer url={`http://localhost:8083/hls/.m3u8`} controls />
        </div>
    )
}