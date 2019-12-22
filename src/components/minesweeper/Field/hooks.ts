import { Field, FieldCell } from "@minesweeper/game";
import { lookAround, predictFromState } from "@minesweeper/solver";
import { MouseEvent, useCallback, useMemo } from "react";
import { useSolverSettings } from "../../SolverSettings/hooks";
import { useMineSweeperActions, useMinesweeperFieldGetter } from "../hooks";

function getCellByElement(minesweeper: Field, cellEl: EventTarget): FieldCell | void {
    const td = cellEl as HTMLTableDataCellElement;
    const x = td.cellIndex;
    const y = (td.parentElement as HTMLTableRowElement).rowIndex;
    return minesweeper[y][x];
}

export const useMineSweeperTableActions = () => {
    const [openCells, markCells] = useMineSweeperActions();
    const getField = useMinesweeperFieldGetter();
    const solverSettings = useSolverSettings();

    const open = useCallback((e: MouseEvent<HTMLElement>) => {
        const cell = getCellByElement(getField(), e.target);
        if (cell) {
            if (e.metaKey) {
                const { mark, open, predict } = lookAround(getField(), cell.x, cell.y);
                if (mark.length) {
                    markCells(mark);
                }
                if (open.length) {
                    openCells(open);
                } else if (predict && predict.size) {
                    const predictedCell = predict && predictFromState(predict, getField(), solverSettings.predictBound);
                    if (predictedCell) {
                        openCells([predictedCell]);
                    }
                }
            } else {
                openCells([cell]);
            }
        }
    }, [openCells, markCells, getField, solverSettings.predictBound]);

    const mark = useCallback((e: MouseEvent<HTMLElement>) => {
        const cell = getCellByElement(getField(), e.target);
        cell && markCells([cell]);
        e.preventDefault();
    }, [markCells, getField]);

    return useMemo(() => [open, mark], [open, mark])
};
