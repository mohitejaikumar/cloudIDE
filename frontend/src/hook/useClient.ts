import { useContext } from "react";
import { ClientContext } from "../providers/ClientProvider";

export default function useClient() {
  const { clientId, socket, setWsURL } = useContext(ClientContext);

  return {
    clientId,
    socket,
    setWsURL,
  };
}
