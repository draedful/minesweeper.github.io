import { GameCommandOpenResp, GameCommandOpenRespStatus } from "@minesweeper/game";
import { checkPredict, lookAtField, openRandomCell, predictFromState, SolveFieldState } from "@minesweeper/solver";
import { useCallback, useRef } from "react";
import { useGameStatsGetter } from "../GameStats/hooks";
import { useSolverSettings } from "../SolverSettings/hooks";
import { useMineSweeperActions, useMinesweeperFieldGetter, useMinesweeperRestart } from "./hooks";

export const useAutoSolver = () => {
    const solveTimerHandler = useRef<number>();
    const lasPredictRef = useRef<Required<SolveFieldState>['predict']>();
    const [openCells, markCells] = useMineSweeperActions();
    const getStats = useGameStatsGetter();
    const getField = useMinesweeperFieldGetter();
    const restart = useMinesweeperRestart();

    const solverSettings = useSolverSettings();

    const applySolveFieldState = useCallback((state: Partial<SolveFieldState>): Promise<GameCommandOpenResp> => {
        lasPredictRef.current = state.predict;

        if (state.mark && state.mark.length) {
            markCells(state.mark);
        }
        if (state.open && state.open.length) {
            return openCells(state.open);
        }

        return Promise.reject('Nothing to open');
    }, [lasPredictRef, openCells, markCells]);

    const solve = useCallback(async () => {
        let state: SolveFieldState | void = void 0;
        const field = getField();
        if (lasPredictRef.current && lasPredictRef.current.size) {
            state = checkPredict(field, lasPredictRef.current);
        }

        if (!state || !state.open.length) {
            state = lookAtField(field, state ? state : void 0);
        }

        if ((!state.open || !state.open.length) && state.predict && state.predict.size) {
            const predictedCell = predictFromState(state.predict, field, solverSettings.predictBound);
            if (predictedCell) {
                state = {
                    mark: [],
                    open: [predictedCell],
                };
            } else if (solverSettings.selectRandomCellIfNoAnyChoice) {
                const randomCell = openRandomCell(field);
                if (randomCell) {
                    state = {
                        ...state,
                        open: [randomCell]
                    }
                }
            }
        }

        if (!state.open.length) {
            const stats = getStats();
            if (stats && !stats.startGame) {
                const randomCell = openRandomCell(field);
                if (randomCell) {
                    state = {
                        ...state,
                        open: [randomCell]
                    }
                }
            }
        }

        if (state) {
            const resp = await applySolveFieldState(state);
            switch (resp.status) {
                case GameCommandOpenRespStatus.WIN:
                    lasPredictRef.current = void 0;
                    break;
                case GameCommandOpenRespStatus.LOSE:
                    lasPredictRef.current = void 0;
                    await restart();
                    solveTimerHandler.current = setTimeout(solve);
                    break;
                case GameCommandOpenRespStatus.OK:
                    solveTimerHandler.current = setTimeout(solve, solverSettings.stepTimeout);
                    break;
            }
        }
    }, [getField, getStats, restart, lasPredictRef, applySolveFieldState, solverSettings]);

    return [solve, useCallback(() => {
        debugger;
        if (solveTimerHandler.current) {
            clearTimeout(solveTimerHandler.current);
        }
    }, [solveTimerHandler])];
};
