import { Field, FieldCell, FieldCellMode } from "@minesweeper/game";

const getCell = (gameField: Field, x: number, y: number): FieldCell | void => (gameField[y] && gameField[y][x]) || void 0;
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
    predict?: Map<FieldCell, number[]>,
}

function getBlankWithState(cells: FieldCell[], fieldState: SolveFieldState): FieldCell[] {
    return cells.filter(c => !fieldState.mark.includes(c) && !fieldState.open.includes(c));
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
        const prev = map.get(c) || [];
        if (!prev.includes(prob)) {
            prev.push(prob);
        }
        map.set(c, prev);
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
    const groups = getCellsAround(field, x, y, true);
    const predicted = new Set();// set of cells which already used for predict
    if (groups.opened.length) {
        for (let i = 0; i < groups.opened.length; i++) {
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
    return fieldState;
}

export function lookAtField(field: Field, solveState: SolveFieldState = {
    mark: [],
    open: [],
    predict: new Map(),
}): SolveFieldState {
    for (let rowIndex = 1; rowIndex < field.length; rowIndex += 2) {
        if (field[rowIndex]) {
            for (let cellIndex = 1; cellIndex < field[rowIndex].length; cellIndex += 2) {
                let prevMark = solveState.mark.length;
                let prevOpen = solveState.open.length;
                lookAround(field, cellIndex, rowIndex, solveState);
                if (prevMark !== solveState.mark.length || prevOpen !== solveState.open.length) {
                    rowIndex = Math.max(1, rowIndex - 4);
                    break;
                }
            }
        }
    }

    return solveState;
}


export function predictFromState(predictMap: Required<SolveFieldState>['predict'], field?: Field, maxProb: number = 1): FieldCell | void {
    let items = Array.from(predictMap.entries());
    const groups = items.reduce((acc: Map<number, FieldCell[]>, [cell, prob]) => {
        const average = prob.reduce((a, b) => a + b) / prob.length;
        const cellsSet = acc.get(average) || [];
        cellsSet.push(cell);
        acc.set(average, cellsSet);
        return acc;
    }, new Map());

    const minProb = Math.min(...Array.from(groups.keys()));
    const cells = groups.get(minProb) as FieldCell[];

    return cells[Math.floor(Math.random() * cells.length)];
}

export function openRandomCell(field: Field): FieldCell | void {
    let attempts = 0;
    while (attempts <= field.length * 2) {
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


export function checkPredict(field: Field, predict: Required<SolveFieldState>['predict']): SolveFieldState {
    const context = {
        open: [],
        mark: [],
        predict: new Map(),
    };
    predict.forEach((a, cell) => {
        lookAround(field, cell.x, cell.y, context);
    });
    return context;
}


