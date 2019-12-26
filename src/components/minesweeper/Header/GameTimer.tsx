import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { GameStatsContext } from "../../GameStats/context";

export const GameTimer = () => {
    const gameStatsService = useContext(GameStatsContext);
    const fpsControl = useRef<{ delta: number, then: number, interval: number }>({
        delta: 0,
        then: 0,
        interval: 10000 / 10
    });
    const wrf = useRef<number>();
    const startTime = useRef<number>();
    const [time, setTime] = useState();
    const a = useCallback(() => {
        if (startTime.current) {
            wrf.current = window.requestAnimationFrame(a);

            const now = Date.now();
            fpsControl.current.delta = now - fpsControl.current.then;

            if (fpsControl.current.delta > fpsControl.current.interval) {

                fpsControl.current.then = now - (fpsControl.current.delta % fpsControl.current.interval);

                setTime(now - startTime.current);
            }
        }
        return () => {
            if (wrf.current) {
                window.cancelAnimationFrame(wrf.current);
                wrf.current = void 0;
            }
        }
    }, [fpsControl, setTime, startTime.current]);
    useEffect(() => {
        if (gameStatsService) {
            return gameStatsService.on("change", (data) => {
                startTime.current = data.startGame;
                if (data.stopGame) {
                    if (!wrf.current) {
                        debugger;
                    }
                    wrf.current && window.cancelAnimationFrame(wrf.current);
                } else if (data.startGame) {
                    a();
                }
            })
        }
    });
    useEffect(() => {
        if (gameStatsService) {
            return gameStatsService.on("change", (data) => {
                if (data.stopGame) {
                    wrf.current && window.cancelAnimationFrame(wrf.current);
                }
            })
        }
    });
    return <>{ time }</>
};
