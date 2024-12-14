import { useEffect, useRef, useState } from "react";
import { Terminal as XTerminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import useClient from "../hook/useClient";

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);
  const { clientId, socket, socketEmitter } = useClient();
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [uiTerm, setUiTerm] = useState<XTerminal | null>(null);

  function handleResize() {
    if (fitAddonRef.current === null || fitAddonRef.current === undefined) {
      console.log("fitAddone is null");
      return;
    }
    console.log("resize");
    fitAddonRef.current.fit();
  }

  useEffect(() => {
    if (socket === null) return;
    rendered.current = true;

    const term = new XTerminal();
    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);
    term.open(terminalRef.current!);
    fitAddon.fit();

    term.onData((data) => {
      socket?.send(
        JSON.stringify({
          type: "terminal",
          data: data,
          clientId: clientId,
        })
      );
    });
    setUiTerm(term);
    const resizeObserver = new ResizeObserver(handleResize);

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      if (terminalRef.current) {
        resizeObserver.unobserve(terminalRef.current);
      }
    };
  }, [socket, clientId]);

  useEffect(() => {
    if (socket && uiTerm) {
      socket.send(
        JSON.stringify({
          type: "terminal",
          data: "\n",
          clientId: clientId,
        })
      );
      socketEmitter.on("terminal", (payload) => {
        console.log("terminal", payload);
        uiTerm.write(payload.data);
      });
    }
  }, [socket, uiTerm, clientId]);

  if (socket === null) return <div>Loading ...</div>;

  return (
    <>
      <div
        className="overflow-x-hidden overflow-y-hidden h-full bg-black"
        ref={terminalRef}></div>
    </>
  );
}
