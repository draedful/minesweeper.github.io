import { Field, FieldCell, FieldCellMode } from "./minesweeper.typing";

export interface SolveStep {
    mark: FieldCell[];
    open: FieldCell[];
}

export function solveMinesweeper(field: Field): SolveStep {
    const mark: Set<FieldCell> = new Set();
    const open: Set<FieldCell> = new Set();
    const probability: Map<FieldCell, number> = new Map();
    const probCount: Map<FieldCell, number> = new Map()
    let empty = true;
    for (let row = 0; row < field.length; row++) {
        let touched = false;
        for (let cellIndex = 0; cellIndex < field[row].length; cellIndex++) {
            const cell = getCell(field, cellIndex, row) as FieldCell;
            if (isOpened(cell) && !mark.has(cell) && !open.has(cell)) {

                empty = false;
                const group = groupCells(field, cellIndex, row);
                const prob = checkProbability(cell, group, mark, open);
                if (prob >= 0) {
                    const reallyBlank = group.blank.filter((a) => !mark.has(a) && !open.has(a));
                    if (prob === 0) {
                        reallyBlank.forEach((a) => {
                            touched = true;
                            open.add(a);
                        });
                    } else if (prob >= 1) {
                        reallyBlank.forEach((a) => {
                            touched = true;
                            mark.add(a);
                        });
                    } else {
                        if (reallyBlank.length > 4) {
                            reallyBlank.forEach((a) => {
                                if (probability.has(a)) {
                                    const prevMaxProb = probability.get(a) as number;
                                    const count = probCount.get(a) || 1;
                                    probability.set(a, (prob + prevMaxProb) / (count + 1));
                                } else {
                                    probability.set(a, prob);
                                }
                                probCount.set(a, (probCount.get(a) || 1) + 1);
                            });
                        }
                    }
                }
            }
        }
        if (touched) {
            row -= 1;
        }
    }
    if (!mark.size && !open.size && probability.size) {
        let maxItem = Array.from(probability.entries())
            .reduce((acc, item) => {
                if (acc[1] < item[1]) {
                    return item;
                }
                return acc;
            });
        if (maxItem[1] >= .5) {
            return {
                mark: [],
                open: [maxItem[0]],
            }
        }
    }
    if (empty) {
        let attempts = 0;
        while (attempts <= 50) {
            attempts++;
            const x = Math.ceil(Math.random() * field.length);
            const y = Math.ceil(Math.random() * field[0].length);
            if (isBlank(field, x, y)) {
                return {
                    mark: Array.from(mark),
                    open: [getCell(field, x, y) as FieldCell],
                }
            }
        }
    }
    if (!mark.size && !open.size) {
        for (let row = 0; row < field.length; row++) {
            for (let cell = 0; cell < field[row].length; cell++) {
                if (isBlank(field, cell, row)) {
                    return {
                        open: [getCell(field, cell, row) as FieldCell],
                        mark: [],
                    }
                }
            }
        }
    }
    return {
        mark: Array.from(mark),
        open: Array.from(open),
    }
}

interface CellsGroup {
    marked: FieldCell[],
    opened: FieldCell[],
    blank: FieldCell[],
}

const getCell = (gameField: Field, x: number, y: number): FieldCell | null => gameField[y] && gameField[y][x] || null;

const hasCell = (gameField: Field, x: number, y: number): boolean => !!getCell(gameField, x, y);

const groupCells = (gameField: Field, x: number, y: number): CellsGroup => {
    const initial: CellsGroup = {
        marked: [],
        opened: [],
        blank: [],
    };
    return hasCell(gameField, x, y)
        ? getCellsAround(gameField, x, y)
            .reduce((acc: CellsGroup, cell: FieldCell) => {
                switch (cell.mode) {
                    case FieldCellMode.Blank:
                        acc.blank.push(cell);
                        break;
                    case FieldCellMode.Marked:
                        acc.marked.push(cell);
                        break;
                    case FieldCellMode.Opened:
                        acc.opened.push(cell);
                        break;
                }
                return acc;
            }, initial)
        : initial;
}

const isOpened = (cell: FieldCell) => {
    return cell && cell.mode === FieldCellMode.Opened && cell.bombs;
};
const isBlank = (gameField: Field, x: number, y: number) => {
    const cell = getCell(gameField, x, y);
    return cell && cell.mode === FieldCellMode.Blank;
};

function getCellsAround(gameField: Field, x: number, y: number): FieldCell[] {
    const Top = y - 1;
    const Bottom = y + 1;
    const Left = x - 1;
    const Right = x + 1;
    return [
        getCell(gameField, Left, Top),
        getCell(gameField, x, Top),
        getCell(gameField, Right, Top),
        getCell(gameField, Left, y),
        getCell(gameField, Right, y),
        getCell(gameField, Left, Bottom),
        getCell(gameField, Right, Bottom),
        getCell(gameField, x, Bottom),
    ].filter(Boolean) as FieldCell[];
}

function checkProbability(
    cell: FieldCell,
    groups: CellsGroup,
    prevMark: Set<FieldCell>,
    prevOpen: Set<FieldCell>
): number {
    if (cell.bombs) {
        /*
        * Remove from blank cell which was marked or opened in step of resolving
        * */
        const blank = groups.blank.filter((pos) => !prevMark.has(pos)).length;
        if (blank) {
            const markedInSolving = groups.blank.filter((pos) => prevMark.has(pos)).length;
            const markCount = groups.marked.length + markedInSolving;
            return (cell.bombs - markCount) / blank;
        }

    }
    return -1;
}
