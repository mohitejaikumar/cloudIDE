import { useEffect, useRef} from "react";
import {Terminal as XTerminal} from '@xterm/xterm';
import "@xterm/xterm/css/xterm.css";
import useSocket from "../hook/useSocket";


export default function Terminal(){

    const terminalRef = useRef<HTMLDivElement>(null);
    const rendered = useRef(false);
    const socket = useSocket("ws://localhost:8080");
    
    

    useEffect(()=>{

        if(rendered.current === true || socket === null){
            return;
        }
        rendered.current = true;
        console.log("hi");

        const term = new XTerminal({
            rows:25,
            cols: 120,
        });

        term.open(terminalRef.current!);
        
        
        term.onData((data)=>{
            console.log(data + "enter press to karne de ");
            socket.send(JSON.stringify({
                type:'terminal',
                data:data
            }));
        });

        socket.onmessage = (event)=>{
            const payload = JSON.parse(event.data);

            switch(payload.type){
                case 'terminal':
                    term.write(payload.data);
                    break;
                default:
                    break;
            }
            
        }
        
    },[socket])

    return (
        <div 
            className="overflow-x-hidden  w-full h-[35%] absolute bottom-0 left-0 right-0 custom-scrollbar  py-1 bg-black word-wrap" 
            ref={terminalRef}
        >
        </div>
    )
}