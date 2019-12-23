import {
    Field,
    FieldCell,
    GameCommandNewRespStatus,
    GameCommandOpenRespStatus,
    GameStateEnum,
    MineSweeperController
} from "@minesweeper/game";
import { useCallback, useContext, useEffect, useState } from "react";
import { useGameStatsMark, useGameStatsReset } from "../../GameStats/hooks";
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

export const useMinesweeperRestart = (): () => Promise<GameCommandNewRespStatus> => {
    const minesweeper = useContext(MineSweeperContext);
    const a = useGameStatsReset();
    return useCallback(() => {
        if (minesweeper) {
            a();
            return minesweeper.newGame(minesweeper.level);
        }
        return Promise.reject(new Error('Minesweeper controller is not exist'));
    }, [minesweeper])
};

export function useMinesweeperField(): Field {
    const mineSweeper = useContext(MineSweeperContext);
    const [field, setField] = useState((mineSweeper && mineSweeper.field) || []);
    useEffect(() => {
        if (mineSweeper) {
            return mineSweeper.on("changeField", setField);
        }
    }, [mineSweeper]);

    return field;
}

export const useMinesweeperFieldGetter = (): () => Field => {
    const mineSweeper = useContext(MineSweeperContext);
    return useCallback(() => {
        return (mineSweeper as MineSweeperController).field;
    }, [mineSweeper]);
};

export type OpenCellsFn = (cells: FieldCell[]) => ReturnType<MineSweeperController['openCell']>;
export type MarkCellsFn = (cells: FieldCell[]) => ReturnType<MineSweeperController['markCell']>;

export const useMineSweeperActions = (): [OpenCellsFn, MarkCellsFn] => {
    const mineSweeper = useContext(MineSweeperContext);
    const markStat = useGameStatsMark();

    const open = useCallback((cells: FieldCell[]) => {
        if (mineSweeper && cells.length) {
            markStat("startGame");
            markStat("open", cells.length);
            return mineSweeper.openCell(...cells)
                .then((resp) => {
                    if(resp.status !== GameCommandOpenRespStatus.OK) {
                        markStat("stopGame");
                    }
                    return resp;
                })
        }
        return Promise.resolve({ status: GameCommandOpenRespStatus.OK });
    }, [mineSweeper, markStat]) as OpenCellsFn;

    const mark = useCallback((cells: FieldCell[]) => {
        if (mineSweeper && cells.length) {
            markStat("startGame");
            markStat("mark", cells.length);
            mineSweeper.markCell(...cells);
        }
    }, [mineSweeper, markStat]) as MarkCellsFn;

    return [open, mark];
};
