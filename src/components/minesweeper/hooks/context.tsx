import { MineSweeperController, MinesweeperGame } from "@minesweeper/game";
import React, { ReactNode, useContext, useEffect, useState } from "react";
import { ServerContext } from "../../../server/context";

// TODO: use interface instead a class
export const MineSweeperContext = React.createContext<MineSweeperController | null>(null);

export const MineSweeper = ({ children, level }: { children: ReactNode, level: number }) => {
    const server = useContext(ServerContext);
    const [mineSweeper, setMineSweeper] = useState<MinesweeperGame | null>(null);
    useEffect(() => {
        setMineSweeper(new MinesweeperGame(server));
    }, [server]);
    useEffect(() => {
        if (level >= 0 && mineSweeper) {
            mineSweeper.newGame(level);
        }
    }, [level, mineSweeper]);
    console.log(mineSweeper);
    return (
        <MineSweeperContext.Provider value={ mineSweeper }>
            { children }
        </MineSweeperContext.Provider>
    )
};
