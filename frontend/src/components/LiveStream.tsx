import { useEffect, useRef } from "react";
import Hls from "hls.js";

const HlsPlayer = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    const ip = localStorage.getItem("rtmpIp");
    if (Hls.isSupported() && videoRef.current) {
      const hls = new Hls({
        xhrSetup: (xhr) => {
          xhr.setRequestHeader("ip", ip || "13.233.16.66"); // Add custom headers
        },
      });
      hls.loadSource(`${import.meta.env.VITE_HLS_PROXY}/hls/.m3u8`);
      hls.attachMedia(videoRef.current);
    }
  }, []);

  return (
    <div className="h-screen w-screen flex justify-center items-center bg-black">
      <video ref={videoRef} controls width="70%" height="70%" />
    </div>
  );
};

export default HlsPlayer;
