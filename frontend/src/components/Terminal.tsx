import { useEffect, useRef} from "react";
import {Terminal as XTerminal} from '@xterm/xterm';
import "@xterm/xterm/css/xterm.css";
import useSocket from "../hook/useSocket";


export default function Terminal(){

    const terminalRef = useRef<HTMLDivElement>(null);
    const rendered = useRef(false);
    const socket = useSocket();
    
    

    useEffect(()=>{

        if(rendered.current === true || socket === null){
            return;
        }
        rendered.current = true;
        console.log("hi");

        const term = new XTerminal({
            rows:18,
            
        });

        term.open(terminalRef.current!);
        
        
        term.onData((data)=>{
            console.log(data + "enter press to karne de ");
            socket.send(data);
        });

        socket.onmessage = (event)=>{
            term.write(event.data);
        }
        
    },[socket])

    return (
        <div 
            className="overflow-hidden w-full absolute bottom-0 left-0 right-0" 
            ref={terminalRef}
        >
        </div>
    )
}