import { useContext, useEffect, useState } from "react";
import { ServerContext } from "./context";

export const useServerState = () => {
    const server = useContext(ServerContext);
    const [state, setState] = useState(server.state);
    useEffect(() => {
        return server.on("change", setState);
    }, [server]);
    return state;
};
