import { useContext, useEffect, useState } from "react";
import { GameState } from "../core/game";
import { MineSweeperContext } from "./context";

export function useMineSweeper(): GameState {
    const minesweeper = useContext(MineSweeperContext);
    const [gameState, setState] = useState(minesweeper.state);
    let timer: number | void;
    useEffect(() => {
        // const off = minesweeper.on("change", (state) => {
        //     // @ts-ignore
        //     setState(state)
        //
        //     // @ts-ignore
        //
        // });
        // return () => off();
    }, [minesweeper]);
    return gameState;
}
