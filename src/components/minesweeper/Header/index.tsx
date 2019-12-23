import React from "react";
import { Button } from "../../Button";
import { useMinesweeperRestart } from "../hooks";
import { useAutoSolver } from "../solver.hooks";
import { GameStateIndicator } from "./GameStateIndicator";
import { GameTimer } from "./GameTimer";
import './index.scss';

export const GameHeader = ({ close }: { close: () => void }) => {
    const restart = useMinesweeperRestart();
    const solve = useAutoSolver();
    return (
        <div className='minesweeper-header'>
            <Button onClick={ close }>Close Game</Button>
            <div className='minesweeper-header__center'>
                <Button className='bombs-indicator' onClick={ restart }>
                    <GameStateIndicator/>
                </Button>
                <GameTimer/>
            </div>
            <Button onClick={ solve }>Run Auto-Solver
            </Button>
        </div>
    )
};
