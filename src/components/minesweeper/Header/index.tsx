import React, { useCallback, useRef, useState } from "react";
import { Button } from "../../Button";
import { useMinesweeperRestart } from "../hooks";
import { useAutoSolver } from "../solver.hooks";
import { GameStateIndicator } from "./GameStateIndicator";
import './index.scss';

export const GameHeader = ({ close }: { close: () => void }) => {
    const [autoSolverRunned, setAutoSolverRinned] = useState(false);
    const restart = useMinesweeperRestart();
    const [solve, stop] = useAutoSolver();
    const toggleAutoSolver = useCallback(() => {
        if (autoSolverRunned) {
            setAutoSolverRinned(false);
            stop();
        } else {
            setAutoSolverRinned(true);
            solve();
        }
    }, [solve, stop, autoSolverRunned, setAutoSolverRinned]);
    return (
        <div className='minesweeper-header'>
            <Button onClick={ close }>Close Game</Button>
            <div className='minesweeper-header__center'>
                <Button className='bombs-indicator' onClick={ restart }>
                    <GameStateIndicator/>
                </Button>
                {/*<GameTimer/>*/ }
            </div>
            <Button onClick={ toggleAutoSolver }>
                { autoSolverRunned ? 'Stop Auto-Solver' : 'Run Auto-Solver' }
            </Button>
        </div>
    )
};
