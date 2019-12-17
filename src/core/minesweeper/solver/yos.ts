// yet-another solver

import { Field, FieldCell, FieldCellMode } from "@minesweeper/game";

const getCell = (gameField: Field, x: number, y: number): FieldCell | void => gameField[y] && gameField[y][x] || undefined;
const isBlank = (gameField: Field, x: number, y: number): boolean => {
    const cell = getCell(gameField, x, y);
    return !!cell && cell.mode === FieldCellMode.Blank;
};

interface CellsAround {
    marked: FieldCell[],
    opened: FieldCell[],
    blank: FieldCell[],
}

function getCellsAround(field: Field, x: number, y: number, include?: boolean): CellsAround {
    const top = y - 1;
    const bottom = y + 1;
    const left = x - 1;
    const right = x + 1;
    return [
        include && getCell(field, x, y),
        getCell(field, left, top),
        getCell(field, x, top),
        getCell(field, right, top),
        getCell(field, left, y),
        getCell(field, right, y),
        getCell(field, left, bottom),
        getCell(field, right, bottom),
        getCell(field, x, bottom),
    ]
        .reduce((acc: CellsAround, item: FieldCell | void | false) => {
            if (item) {
                switch (item.mode) {
                    case FieldCellMode.Blank:
                        acc.blank.push(item);
                        break;
                    case FieldCellMode.Opened:
                        acc.opened.push(item);
                        break;
                    case FieldCellMode.Marked:
                        acc.marked.push(item);
                        break;
                }
            }
            return acc;
        }, { marked: [], opened: [], blank: [] });
}

export interface SolveFieldState {
    mark: FieldCell[],
    open: FieldCell[],
    predict?: Map<FieldCell, number>,
}

function getBlankWithState(cells: FieldCell[], fieldState: SolveFieldState): FieldCell[] {
    return cells.filter(c => !fieldState.mark.includes(c) && !fieldState.open.includes(c));
}

function getMarkedFromBlankWithState(cells: FieldCell[], fieldState: SolveFieldState): FieldCell[] {
    return cells.filter(c => fieldState.mark.includes(c));
}

function predictIsBombAroundInBlankCells(
    field: Field,
    cell: FieldCell,
    fieldState: SolveFieldState,
): number {
    if (cell.bombs) {
        const { marked, blank } = getCellsAround(field, cell.x, cell.y);
        const blankCount = getBlankWithState(blank, fieldState).length;
        const markedCount = marked.length + blank.filter((i) => fieldState.mark.includes(i)).length;
        if (blankCount) {
            return (cell.bombs - markedCount) / blankCount;
        }
    }
    return -1;
}

function setProbMapWithRisk(map: Required<SolveFieldState>['predict'], cells: FieldCell[], prob: number): void {
    cells.forEach((c) => {
        if (map.has(c)) {
            map.set(c, Math.max(prob, map.get(c) || 0));
        } else {
            map.set(c, prob);
        }
    })
}

function removeCellFromProbMap(map: Required<SolveFieldState>['predict'], cells: FieldCell[]): void {
    cells.forEach((c) => map.delete(c));
}

export function lookAround(field: Field, x: number, y: number, fieldState: SolveFieldState = {
    mark: [],
    open: [],
    predict: new Map()
}): SolveFieldState {
    false && performance.mark(`start looking around x=${ x } y=${ y }`);
    let iterations = 0;
    const groups = getCellsAround(field, x, y, true);
    const predicted = new Set();// set of cells which already used for predict
    if (groups.opened.length) {
        for (let i = 0; i < groups.opened.length; i++) {
            iterations++;
            const cell = groups.opened[i];
            if (!predicted.has(cell) && cell.bombs) {
                const groups1 = getCellsAround(field, cell.x, cell.y);
                const blankCells = getBlankWithState(groups1.blank, fieldState);
                if (!blankCells.length) continue;

                const risk = predictIsBombAroundInBlankCells(field, cell, fieldState);
                if (risk >= 0) {
                    let touched = false;
                    switch (risk) {
                        case 0:
                            fieldState.open.push(...blankCells);
                            fieldState.predict && removeCellFromProbMap(fieldState.predict, blankCells);
                            predicted.add(cell);
                            touched = true;
                            break;
                        case 1:
                            fieldState.mark.push(...blankCells);
                            fieldState.predict && removeCellFromProbMap(fieldState.predict, blankCells);
                            predicted.add(cell);
                            touched = true;
                            break;
                        default:
                            if (fieldState.predict) {
                                setProbMapWithRisk(fieldState.predict, blankCells, risk);
                            }
                    }
                    if (touched) {
                        i = 0 - 1; // repeat
                    }
                }
            }
        }
    }
    false && performance.mark(`stop looking around x=${ x } y=${ y }`);
    false && performance.measure(`looking around x=${ x } y=${ y }, take=${ iterations }`, `start looking around x=${ x } y=${ y }`, `stop looking around x=${ x } y=${ y }`);
    return fieldState;
}

export function lookAtField(field: Field): SolveFieldState {
    const solveState = {
        mark: [],
        open: [],
        predict: new Map(),
    };
    for (let rowIndex = 1; rowIndex < field.length; rowIndex += 2) {
        if (field[rowIndex]) {
            for (let cellIndex = 1; cellIndex < field[rowIndex].length; cellIndex += 2) {
                let prevMark = solveState.mark.length;
                let prevOpen = solveState.open.length;
                lookAround(field, cellIndex, rowIndex, solveState);
                if (prevMark !== solveState.mark.length || prevOpen !== solveState.open.length) {
                    rowIndex -= 4;
                    break;
                }
            }
        }

    }

    return solveState;
}


export function predictFromState(predictMap: Required<SolveFieldState>['predict']): FieldCell | void {
    const minRiskCell = Array.from(predictMap.entries()).reduce((cellA, cellB) => {
        if (cellB[1] < cellA[1]) {
            return cellB;
        }
        return cellA;
    });
    if (minRiskCell[1] <= 0.5) {
        return minRiskCell[0];
    }
    return void 0;
}

export function openRandomCell(field: Field): FieldCell | void {
    let attempts = 0;
    while (attempts <= 50) {
        attempts++;
        const x = Math.ceil(Math.random() * field.length);
        const y = Math.ceil(Math.random() * field[0].length);
        if (isBlank(field, x, y)) {
            return getCell(field, x, y) as FieldCell;
        }
    }
    for (let row = 0; row < field.length; row++) {
        for (let cell = 0; cell < field[row].length; cell++) {
            if (isBlank(field, cell, row)) {
                return getCell(field, cell, row) as FieldCell;
            }
        }
    }
    // TODO: Theoretically unreachable branch, because until we not win we have at least two blank cells
    return void 0;
}
