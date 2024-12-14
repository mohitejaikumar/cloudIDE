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
