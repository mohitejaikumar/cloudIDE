import { useContext } from "react";
import { ClientContext } from "../providers/ClientProvider";

export default function useClient() {
  const { clientId, socket, setWsURL, setHandles } =
    useContext(ClientContext);

  return {
    clientId,
    socket,
    setWsURL,
    setHandles,
  };
}
