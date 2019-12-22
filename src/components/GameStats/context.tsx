import { GameStatsService } from "@minesweeper/Stats";
import React, { ReactNode, useMemo } from "react";

export const GameStatsContext = React.createContext<GameStatsService | void>(void 0);

export const GameStatsScope = ({ children }: { children: ReactNode }) => {
    const gameStatsService = useMemo(() => new GameStatsService(), []);
    return (
        <GameStatsContext.Provider value={ gameStatsService }>
            { children }
        </GameStatsContext.Provider>
    )
};
