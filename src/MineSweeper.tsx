import React, { memo, MouseEvent, useCallback, useContext, useEffect, useState } from "react";
import { areEqual, GridChildComponentProps, VariableSizeGrid } from 'react-window';
import { MineSweeperContext } from "./App";
import { Cell, CellState, GameField, GameState } from "./core/game";
import './minesweeper.css'


function useMineSweeper(): GameState {
    const minesweeper = useContext(MineSweeperContext);
    const [gameState, setState] = useState(minesweeper.state);
    useEffect(() => {
        const off = minesweeper.on("change", setState);
        return () => off();
    }, [minesweeper]);
    return gameState;
}

const addClassName = (className: string) => (condition: boolean): string => {
    return condition ? className : ''
};

const cellBlankClass = addClassName('mine-cell--blank');
const cellOpenedClass = addClassName('mine-cell--opened');
const cellMarkedClass = addClassName('mine-cell--marked');
const cellColor = (bombs: number | undefined) => {
    if (bombs && bombs <= 4) {
        return `mine-cell--color-${ bombs }`;
    }
    return '';
}

const CellComp = ({ data, columnIndex, rowIndex, style }: GridChildComponentProps) => {
    const cell = data.field[rowIndex][columnIndex] as Cell;
    const openCell = useCallback(() => {
        if (cell.state === CellState.Blank) {
            data.open(columnIndex, rowIndex);
        }
    }, [data.open, columnIndex, rowIndex]);
    const markCell = useCallback((e: MouseEvent) => {
        data.mark(columnIndex, rowIndex);
        e.preventDefault();
    }, [data.mark, columnIndex, rowIndex]);
    return (
        <div
            style={ style }
            onClick={ openCell }
            onContextMenu={ markCell }
            className={ `mine-field__cell mine-cell ${ cellColor(cell.bombAround) } ${ cellBlankClass(cell.state === CellState.Blank) } ${ cellOpenedClass(cell.state === CellState.Opened) } ${ cellMarkedClass(cell.state === CellState.Marked) }` }
        >
            { cell.bombAround ? cell.bombAround : void 0 }
        </div>
    )
};

function isSameCells(prevCell: Cell, nextCells: Cell): boolean {
    return prevCell === nextCells && prevCell.state === nextCells.state && prevCell.bombAround === nextCells.bombAround;
}

const MemoCell = memo(CellComp,
    (prev, next) => {
        return isSameCells(prev.data.field[prev.rowIndex][prev.columnIndex], next.data.field[prev.rowIndex][prev.columnIndex]) && areEqual(prev, next);
    });


const MineField = ({ field, open, mark }: { field: GameField, open: (x: number, y: number) => void, mark: (x: number, y: number) => void }) => {

    return (
        <VariableSizeGrid
            rowHeight={ () => 20 }
            columnWidth={ () => 20 }
            rowCount={ field.length - 1 }
            itemData={ {
                field: field,
                open: open,
                mark: mark
            } }
            columnCount={ field[0].length - 1 }
            height={ 400 }
            width={ 400 }
        >
            { MemoCell }
        </VariableSizeGrid>
    )
};


export const MineSweeperComponent = () => {
    const minesweeper = useContext(MineSweeperContext);
    const gameState = useMineSweeper();
    const click = useCallback((x: number, y: number) => minesweeper.openCell(x, y), [minesweeper]);
    const mark = useCallback((x: number, y: number) => minesweeper.markCell(x, y), [minesweeper]);
    return (
        <>
            <div>
                <button onClick={ () => minesweeper.startNewGame(1) }> Level 1</button>
                <button onClick={ () => minesweeper.startNewGame(2) }> Level 2</button>
                <button onClick={ () => minesweeper.startNewGame(3) }> Level 3</button>
                <button onClick={ () => minesweeper.startNewGame(4) }> Level 4</button>
            </div>
            {
                gameState.field && gameState.field.length > 0 &&
                <MineField field={ gameState.field } open={ click } mark={ mark }/>
            }
        </>
    )
};
