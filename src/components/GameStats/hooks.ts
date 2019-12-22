import { MarkTypes } from "@minesweeper/Stats";
import { useCallback, useContext } from "react";
import { GameStatsContext } from "./context";

export const useGameStatsMark = (): (markName: MarkTypes, times?: number) => void => {
    const gameStatsService = useContext(GameStatsContext);
    return useCallback((name: MarkTypes, times: number = 1) => {
        if (gameStatsService) {
            for (let i = 0; i < times; i++) {
                gameStatsService.mark(name);
            }
        }
    }, [gameStatsService]);
};
