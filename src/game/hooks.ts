import { useContext, useEffect, useState } from "react";
import { GameState } from "../core/game";
import { MineSweeperContext } from "./context";

export function useMineSweeper(): GameState {
    const minesweeper = useContext(MineSweeperContext);
    const [gameState, setState] = useState(minesweeper.state);
    let timer: number | void;
    useEffect(() => {
        const off = minesweeper.on("change", (state) => {
            // if (!timer) {
            //     // clearTimeout(timer);
            //     // @ts-ignore
            //     timer = setTimeout(() => {
            //         timer = void 0;
            //         setState(state)
            //     }, 1000);
            //
            // }
            // @ts-ignore

        });
        return () => off();
    }, [minesweeper]);
    return gameState;
}
