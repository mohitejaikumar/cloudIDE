import { useEffect, useState } from "react";
import ReactPlayer from "react-player";

export default function LiveStream() {
  const [rtmpIp, setRtmpIp] = useState("");

  useEffect(() => {
    const ip = localStorage.getItem("rtmpIp");
    if (ip) {
      setRtmpIp(ip);
    }
  }, []);

  return (
    <div className="min-h-screen w-screen flex flex-col items-center bg-zinc-900 py-10">
      <ReactPlayer
        url={`http://${rtmpIp}:8083/hls/.m3u8`}
        controls={true}
        height="70%"
        width="70%"
      />
      <div className="mt-5"></div>
    </div>
  );
}
