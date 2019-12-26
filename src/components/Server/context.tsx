import { CommandServer } from "@minesweeper/server";
import React, { ReactNode } from "react";
import { WS_SERVER } from "../../helpers/env";

// TODO: use env to get ws url
const server = new CommandServer(WS_SERVER);

export const ServerContext = React.createContext(server);

export const ServerProvider = ({ children }: { children: ReactNode }) => {
    return (
        <ServerContext.Provider value={ server }>
            { children }
        </ServerContext.Provider>
    )
};
