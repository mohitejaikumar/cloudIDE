import { useEffect, useRef } from "react";
import { Terminal as XTerminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import useClient from "../hook/useClient";

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);
  const { socket } = useClient();
  const fitAddonRef = useRef<FitAddon | null>(null);

  console.log(socket);

  function handleResize() {
    if (fitAddonRef.current === null || fitAddonRef.current === undefined) {
      console.log("fitAddone is null");
      return;
    }
    console.log("resize");
    fitAddonRef.current.fit();
  }

  useEffect(() => {
    if (rendered.current === true || socket === null) {
      return;
    }
    rendered.current = true;

    const term = new XTerminal({
      scrollSensitivity: 0,
    });
    const fitAddon = new FitAddon();
    console.log("fitAddone", fitAddon);
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);
    term.open(terminalRef.current!);
    fitAddon.fit();

    term.onData((data) => {
      socket.send(
        JSON.stringify({
          type: "terminal",
          data: data,
        })
      );
    });

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      switch (payload.type) {
        case "terminal":
          term.write(payload.data);
          break;
        default:
          break;
      }
    };
    const resizeObserver = new ResizeObserver(handleResize);

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      if (terminalRef.current) {
        resizeObserver.unobserve(terminalRef.current);
      }
    };
  }, [socket]);

  return (
    <div
      className="overflow-x-hidden overflow-y-hidden h-full bg-black"
      ref={terminalRef}></div>
  );
}
