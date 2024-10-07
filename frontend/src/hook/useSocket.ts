import { useEffect, useState } from "react";


export default function useSocket(){
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(()=>{
        const socket = new WebSocket("ws://localhost:8080");
        setSocket(socket);

        socket.onopen = ()=>{
            console.log("connected");
        }
    },[]);

    return socket;
}