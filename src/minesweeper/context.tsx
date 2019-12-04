import React, { ReactNode, useContext, useEffect, useState } from "react";
import { MinesweeperGame } from "../core/minesweeper";
import { ServerContext } from "../server/context";

// TODO: use interface instead a class
export const MineSweeperContext = React.createContext<MinesweeperGame | null>(null);

export const MineSweeper = ({ children }: { children: ReactNode }) => {
    const server = useContext(ServerContext);
    const [mineSweeper, setMineSweeper] = useState<MinesweeperGame | null>(null);
    useEffect(() => {
        setMineSweeper(new MinesweeperGame(server))
    }, [server]);
    return (
        <MineSweeperContext.Provider value={ mineSweeper }>
            { children }
        </MineSweeperContext.Provider>
    )
};
