import React, { memo, useMemo } from "react";
import { areEqual, GridChildComponentProps } from "react-window";
import { Cell, CellState } from "../core/game";

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
};

const CellComp = ({ data, columnIndex, rowIndex, style }: GridChildComponentProps) => {
    const cell = data[rowIndex][columnIndex] as Cell;
    const className = useMemo(() => {
        return [
            'mine-field__cell mine-cell',
            cellBlankClass(cell.state === CellState.Blank),
            cellOpenedClass(cell.state === CellState.Opened),
            cellMarkedClass(cell.state === CellState.Marked),
            cellColor(cell.bombAround),
        ].join(' ');
    }, [cell.bombAround, cell.state]);
    return (
        <div
            style={ style }
            data-position={ `${ columnIndex },${ rowIndex }` }
            className={className}
        >
            { cell.bombAround ? cell.bombAround : void 0 }
        </div>
    )
};
export const MemoCell = memo(CellComp, areEqual);
