import { createContext, ReactNode, useEffect, useState } from "react";

export const ClientContext = createContext<{
  clientId: string;
  socket: WebSocket | null;
  setWsURL: React.Dispatch<React.SetStateAction<string>>;
}>({
  clientId: "",
  socket: null,
  setWsURL: () => {},
});

export default function ClientProvider({ children }: { children: ReactNode }) {
  const [clientId] = useState(String(Math.floor(Math.random() * 10000)));
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [wsURL, setWsURL] = useState("");

  useEffect(() => {
    const socket = new WebSocket(wsURL);
    setSocket(socket);
    console.log("chenged socket url");
    socket.onopen = () => {
      console.log("connected");
    };
  }, [wsURL]);

  return (
    <ClientContext.Provider
      value={{
        clientId,
        socket,
        setWsURL,
      }}>
      {children}
    </ClientContext.Provider>
  );
}
