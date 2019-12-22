import { MineSweeperController, MinesweeperGame } from "@minesweeper/game";
import React, { ReactNode, useContext, useEffect, useMemo } from "react";
import { ServerContext } from "../../../server/context";

export const MineSweeperContext = React.createContext<MineSweeperController | void>(void 0);

export const MineSweeper = ({ children, level }: { children: ReactNode, level: number }) => {
    const server = useContext(ServerContext);
    const mineSweeper = useMemo(() => new MinesweeperGame(server), [server]);
    useEffect(() => {
        if (level >= 0 && mineSweeper) {
            mineSweeper.newGame(level);
        }
    }, [level, mineSweeper]);
    return (
        <MineSweeperContext.Provider value={ mineSweeper }>
            { children }
        </MineSweeperContext.Provider>
    )
};
