import { createContext, ReactNode, useEffect, useState } from "react";
import { EventEmitter } from "eventemitter3";

export const ClientContext = createContext<{
  clientId: string;
  socket: WebSocket | null;
  setWsURL: React.Dispatch<React.SetStateAction<string>>;
  socketEmitter: EventEmitter;
}>({
  clientId: "",
  socket: null,
  setWsURL: () => {},
  socketEmitter: new EventEmitter(),
});

export default function ClientProvider({ children }: { children: ReactNode }) {
  const [clientId] = useState(String(Math.floor(Math.random() * 10000)));
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [wsURL, setWsURL] = useState("");
  const socketEmitter = new EventEmitter();

  useEffect(() => {
    const soc = new WebSocket(wsURL);
    soc.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      console.log("onmessage", payload, socketEmitter);
      socketEmitter.emit(payload.type, payload);
    };
    soc.onopen = () => {
      console.log("chenged socket url");
      setSocket(soc);
      soc.send(
        JSON.stringify({
          type: "join",
          clientId: clientId,
        })
      );
    };
  }, [wsURL, clientId]);

  return (
    <ClientContext.Provider
      value={{
        clientId,
        socket,
        setWsURL,
        socketEmitter,
      }}>
      {children}
    </ClientContext.Provider>
  );
}
