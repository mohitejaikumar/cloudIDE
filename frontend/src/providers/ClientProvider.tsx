/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, ReactNode, useEffect, useState } from "react";

export const ClientContext = createContext<{
  clientId: string;
  socket: WebSocket | null;
  setWsURL: React.Dispatch<React.SetStateAction<string>>;
  setHandles: React.Dispatch<
    React.SetStateAction<{ [key: string]: (payload: any) => void }>
  >;
}>({
  clientId: "",
  socket: null,
  setWsURL: () => {},
  setHandles: () => {},
});

export default function ClientProvider({ children }: { children: ReactNode }) {
  const [clientId] = useState(String(Math.floor(Math.random() * 10000)));
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [wsURL, setWsURL] = useState("");
  const [handles, setHandles] = useState<{
    [key: string]: (payload: any) => void;
  }>({});

  useEffect(() => {
    const soc = new WebSocket(wsURL);

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

  useEffect(() => {
    if (socket === null) return;
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      handles[payload.type]?.(payload);
    };
  }, [socket, handles]);

  return (
    <ClientContext.Provider
      value={{
        clientId,
        socket,
        setWsURL,
        setHandles,
      }}>
      {children}
    </ClientContext.Provider>
  );
}
