import { useEffect, useRef} from "react";
import {Terminal as XTerminal} from '@xterm/xterm';
import "@xterm/xterm/css/xterm.css";
import useSocket from "../hook/useSocket";


export default function Terminal({url}:{url:string}){

    const terminalRef = useRef<HTMLDivElement>(null);
    const rendered = useRef(false);
    const socket = useSocket(url);
    
    

    useEffect(()=>{

        if(rendered.current === true || socket === null){
            return;
        }
        rendered.current = true;
        

        const term = new XTerminal({
            rows:25,
            cols: 120,
        });

        term.open(terminalRef.current!);
        
        
        term.onData((data)=>{
            
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