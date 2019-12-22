import React from "react";
import { Button } from "../../Button";
import { useMinesweeperRestart } from "../hooks";
import { useAutoSolver } from "../solver.hooks";
import { GameStateIndicator } from "./GameStateIndicator";


export const GameHeader = ({ close }: { close: () => void }) => {
    const restart = useMinesweeperRestart();
    const solve = useAutoSolver();
    return (
        <div className='minesweeper-header'>
            <Button onClick={ close }>Close Game</Button>
            <Button className='bombs-indicator' onClick={ restart }>
                <GameStateIndicator/>
            </Button>
            <Button onClick={ solve }>Run Auto-Solver</Button>
        </div>
    )
};
