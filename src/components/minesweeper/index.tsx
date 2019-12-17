import { FieldCell, GameCommandOpenRespStatus, GameStateEnum } from "@minesweeper/game";
import { lookAtField, openRandomCell, predictFromState } from "@minesweeper/solver/yos";
import React, { useCallback, useContext, useLayoutEffect, useState } from "react";
import { Button } from "../Button";
import { GameField } from "./field";
import { MineSweeperContext, useMinesweeperLoading, useMinesweeperRestart, useMinesweeperState } from "./hooks";
import './index.scss';

const GameSmile = () => {
    const loading = useMinesweeperLoading();
    const state = useMinesweeperState();
    switch (state) {
        case GameStateEnum.Win:
            return (<>🥳</>);
        case GameStateEnum.Lose:
            return (<>😢</>);
    }
    return (<>{ loading ? '🤔' : '🙂' }</>)
};

const useAutoSolver = () => {
    const mineSweeper = useContext(MineSweeperContext);
    const [activeSolver, setSolverActive] = useState<Function | null>(null);
    const fn = useCallback(async () => {
        if (mineSweeper) {
            let opening: FieldCell[] = [];
            if (!mineSweeper.startTime) {
                const cell = openRandomCell(mineSweeper.field);
                if (cell) {
                    opening = [cell];
                }
            } else {
                const data = lookAtField(mineSweeper.field);
                const { mark, open, predict } = data;
                if (mark.length) {
                    mineSweeper.markCell(...mark);
                }
                opening = open;
                if (!opening.length && predict && predict.size) {
                    const cell = predictFromState(predict);
                    if (cell) {
                        opening = [cell];
                    }
                }
            }

            if (opening.length) {
                const resp = await mineSweeper.openCell(...opening);
                if (resp) {
                    if (resp.status === GameCommandOpenRespStatus.OK) {
                        setSolverActive(() => () => fn());
                    }
                    if (resp.status === GameCommandOpenRespStatus.LOSE) {
                        await mineSweeper.newGame(mineSweeper.level);
                        setSolverActive(() => () => fn());
                    }
                }
            }
        }
    }, [mineSweeper]);
    useLayoutEffect(() => {
        if (activeSolver) {
            activeSolver();
        }
    }, [activeSolver]);
    return fn;
};

const GameStats = ({ close }: { close: () => void }) => {
    const restart = useMinesweeperRestart();
    const solve = useAutoSolver();
    return (
        <div className='minesweeper-header'>
            <Button onClick={ close }>Close Game</Button>
            <Button className='bombs-indicator' onClick={ restart }>
                <GameSmile/>
            </Button>
            <Button onClick={ solve }>Run Auto-Solver</Button>
        </div>
    )
};

interface MinesweeperGameProps {
    close: () => void;
}

export const MinesweeperGame = ({ close }: MinesweeperGameProps) => {
    return (
        <div className='minesweeper-body'>
            <div className="minesweeper-game">
                <div className='minesweeper-game__header'>
                    <GameStats close={ close }/>
                </div>
                <div className='minesweeper-game__field'>
                    <GameField/>
                </div>
            </div>
        </div>
    );
};
