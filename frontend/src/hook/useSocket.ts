import { useEffect, useState } from "react";


export default function useSocket(url:string){
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(()=>{
        const socket = new WebSocket(url);
        setSocket(socket);

        socket.onopen = ()=>{
            console.log("connected");
        }
    },[]);

    
    return socket;
}