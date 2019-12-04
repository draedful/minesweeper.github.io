import React, { memo, useMemo } from "react";
import { areEqual, GridChildComponentProps } from "react-window";
import { FieldCell, FieldCellMode } from "../core/minesweeper.typing";
import './cell.css';

const addClassName = (className: string) => (condition: boolean): string => {
    return condition ? className : ''
};
const cellBlankClass = addClassName('mine-cell--blank');
const cellOpenedClass = addClassName('mine-cell--opened');
const cellMarkedClass = addClassName('mine-cell--marked');
const cellColor = (bombs: number | void) => {
    if (bombs && bombs <= 4) {
        return `mine-cell--color-${ bombs }`;
    }
    return '';
};

function areEqualCell(prev: GridChildComponentProps, next: GridChildComponentProps): boolean {
    if (!prev.data.length !== next.data.length) {
        return false;
    }
    const prevCell = prev.data[prev.rowIndex] && prev.data[prev.rowIndex][prev.columnIndex] as FieldCell;
    const nextCell = next.data[next.rowIndex] && next.data[next.rowIndex][next.columnIndex] as FieldCell;
    return prevCell === nextCell
        && prevCell.bombs === nextCell.bombs
        && prevCell.mode === nextCell.mode
        && prevCell.id === nextCell.id;
}

const CellComp = ({ data, columnIndex, rowIndex, style }: GridChildComponentProps) => {
    const cell = data[rowIndex][columnIndex] as FieldCell;
    const className = useMemo(() => {
        return [
            'mine-field__cell mine-cell',
            cellBlankClass(cell.mode === FieldCellMode.Blank),
            cellOpenedClass(cell.mode === FieldCellMode.Opened),
            cellMarkedClass(cell.mode === FieldCellMode.Marked),
            cellColor(cell.bombs),
        ].join(' ');
    }, [cell.bombs, cell.mode]);
    return (
        <div
            style={ style }
            data-position={ `${ columnIndex },${ rowIndex }` }
            className={ className }
        >
            { cell.bombs ? cell.bombs : void 0 }
        </div>
    )
};

function areEqualGridCell(prev: GridChildComponentProps, next: GridChildComponentProps): boolean {
    return areEqualCell(prev, next) && areEqual(prev, next);
}

export const Cell = memo(CellComp, areEqualGridCell);
