import React, { useCallback, useEffect, useMemo } from "react";
import { Button } from "../Button";
import { useGameFieldCellSizeState } from "../FieldSettings/hooks";
import { GameField } from "./Field";
import { GameHeader } from "./Header";
import './index.scss';

const MIN_CELL_SIZE = 6; // NOTION: 6 - is the min available font-size for default fonts
const MAX_CELL_SIZE = 15;

function useMIneSweeperCellSizeWithControls(): [number, () => void, () => void] {
    const [size, setSize] = useGameFieldCellSizeState(7);

    const plus = useCallback(() => {
        if (size <= MAX_CELL_SIZE) {
            setSize(size + 1);
        }
    }, [size, setSize]);
    const minus = useCallback(() => {
        if (size >= MIN_CELL_SIZE) {
            setSize(size - 1);
        }
    }, [size, setSize]);

    useEffect(() => {
        function onKeydown(e: KeyboardEvent) {
            if (e.metaKey) {
                switch (e.key) {
                    case '+':
                        e.preventDefault();
                        plus();
                        break;
                    case '-' :
                        e.preventDefault();
                        minus();
                        break;
                }
            }
        }

        document.addEventListener('keydown', onKeydown);
        return () => document.removeEventListener("keydown", onKeydown);
    }, [plus, minus]);
    return [size, plus, minus];
}

interface MinesweeperGameProps {
    close: () => void;
}

export const MinesweeperGame = ({ close }: MinesweeperGameProps) => {
    const [size, plus, minus] = useMIneSweeperCellSizeWithControls();
    const plusAvailable = useMemo(() => size <= MAX_CELL_SIZE, [size]);
    const minusAvailable = useMemo(() => size >= MIN_CELL_SIZE, [size]);
    const styles = useMemo(() => ({ fontSize: size }), [size]);

    return (
        <div className='minesweeper-body'>
            <div className="minesweeper-game">
                <div className='minesweeper-game__header'>
                    <GameHeader close={ close }/>
                </div>
                <div className='minesweeper-game__field minesweeper-game-field' style={ styles }>
                    <GameField/>
                </div>
            </div>
            <div className='minesweeper-game-field__config'>
                <Button disabled={ !plusAvailable } onClick={ plus }>+</Button>
                <Button disabled={ !minusAvailable } onClick={ minus }>-</Button>
            </div>
        </div>
    );
};
