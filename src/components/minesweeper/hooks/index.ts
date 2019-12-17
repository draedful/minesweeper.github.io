import { GameStateEnum } from "@minesweeper/game";
import { useCallback, useContext, useEffect, useState } from "react";
import { MineSweeperContext } from "./context";

export const useMinesweeperState = (): GameStateEnum => {
    const minesweeper = useContext(MineSweeperContext);
    const [state, setState] = useState((minesweeper && minesweeper.state) || GameStateEnum.Init);
    useEffect(() => {
        if (minesweeper) {
            return minesweeper.on("changeState", setState);
        }
    }, [minesweeper]);
    return state;
};

export const useMinesweeperLoading = (): boolean => {
    const minesweeper = useContext(MineSweeperContext);
    const [loading, setLoading] = useState((minesweeper && minesweeper.loading) || false);
    useEffect(() => {
        if (minesweeper) {
            return minesweeper.on("loading", setLoading);
        }
    }, [minesweeper]);
    return loading;
};

export const useMinesweeperClose = (): () => void => {
    const minesweeper = useContext(MineSweeperContext);
    return useCallback(() => {
        if (minesweeper) {
            minesweeper.close();
        }
    }, [minesweeper])
};
export const useMinesweeperRestart = (): () => void => {
    const minesweeper = useContext(MineSweeperContext);
    return useCallback(() => {
        if (minesweeper) {
            minesweeper.newGame(minesweeper.level);
        }
    }, [minesweeper])
};



export * from './context';
