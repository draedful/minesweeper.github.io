import { GameStatsData, MarkTypes } from "@minesweeper/Stats";
import { useCallback, useContext, useEffect, useState } from "react";
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

export const useGameStatsReset = (): () => void => {
    const gameStatsService = useContext(GameStatsContext);
    return useCallback(() => {
        if (gameStatsService) {
            console.log(gameStatsService.getStats());
            gameStatsService.mark("stopGame");
            gameStatsService.reset();
        }
    }, [gameStatsService]);
};

export const useGameStatsGetter = () => {
    const gameStatsService = useContext(GameStatsContext);
    return useCallback(() => {
        return gameStatsService && gameStatsService.getStats();
    }, [gameStatsService]);
};

export const useGameStatsData = <K extends keyof GameStatsData>(name: K): GameStatsData[K] | void => {
    const gameStatsService = useContext(GameStatsContext);
    const [value, setValue] = useState(gameStatsService && gameStatsService.getStats()[name]);
    useEffect(() => {
        if (gameStatsService) {
            return gameStatsService.on("change", (data) => {
                setValue(data[name]);
            })
        }
    });
    return value;
};
