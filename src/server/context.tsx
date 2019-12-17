import { CommandServer } from "@minesweeper/server";
import React, { ReactNode } from "react";

// TODO: use env to get ws url
const server = new CommandServer('wss://hometask.eg1236.com/game1/');

export const ServerContext = React.createContext(server);

export const ServerProvider = ({ children }: { children: ReactNode }) => {
    return (
        <ServerContext.Provider value={ server }>
            { children }
        </ServerContext.Provider>
    )
};
