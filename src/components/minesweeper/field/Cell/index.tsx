import { FieldCell, FieldCellMode } from "@minesweeper/game";
import React, { memo, useMemo } from "react";
import './index.css';

const addClassName = (className: string) => (condition: boolean): string => {
    return condition ? ' ' + className : ''
};
const cellBlankClass = addClassName('mine-cell--blank');
const cellOpenedClass = addClassName('mine-cell--opened');
const cellMarkedClass = addClassName('mine-cell--marked');
const cellColor = (bombs: number | void) => {
    if (bombs >= 0 && bombs <= 4) {
        return `mine-cell--color-${ bombs }`;
    }
    return '';
};

interface GridCellProps {
    cell: FieldCell,
}

export const Cell = memo(({ cell }: GridCellProps) => {
    const className = useMemo(() => {
        return [
            'mine-field__cell mine-cell',
            cellBlankClass(cell.mode === FieldCellMode.Blank),
            cellOpenedClass(cell.mode === FieldCellMode.Opened),
            cellMarkedClass(cell.mode === FieldCellMode.Marked),
            cellColor(cell.bombs),
        ].join(' ');
    }, [cell.mode, cell.bombs]);
    return (
        <td
            data-x={ cell.x }
            data-y={ cell.y }
            className={ className }
        >
            {
                cell.mode === FieldCellMode.Marked && '🚩'
            }
            { cell.bombs ? cell.bombs : void 0 }
        </td>
    )
});
Cell.displayName = 'Field Cell';


