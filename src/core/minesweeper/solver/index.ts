import { Field, FieldCell, FieldCellMode } from "../game";

export interface SolveStep {
    marked: FieldCell[],
    open: FieldCell[]
}

const open: FieldCell[] = [];
const marked: FieldCell[] = [];
const probability: Map<FieldCell, number> = new Map();

const Result = {
    marked: marked,
    open: open,
};

export function predictCellAround(field: Field, cell: FieldCell): SolveStep {
    const mark: FieldCell[] = [];
    const open: FieldCell[] = [];
    test(field, cell, open, mark);
    return {
        marked: Array.from(marked),
        open: Array.from(open)
    };
}

const test = (field: Field, cell: FieldCell, open: FieldCell[] = [], marked: FieldCell[] = [], probMap?: Map<FieldCell, number>) => {
    const NotTouched = (cell: FieldCell) => !open.includes(cell) && !marked.includes(cell);
    if (isOpened(cell) && cell.bombs) {
        const group = groupCells(field, cell.x, cell.y, true);
        for (let i = 0; i < group.opened.length; i++) {
            const openedCell = group.opened[i];
            if (openedCell.bombs) {
                let touched = false;
                const groupOpened = groupCells(field, openedCell.x, openedCell.y, true);
                const reallyBlank = groupOpened.blank.filter(NotTouched);
                if (reallyBlank.length) {
                    const prob = checkProbabilityWithState(openedCell, groupOpened, marked, open);
                    if (prob >= 0) {
                        if (prob === 0) {
                            reallyBlank.forEach((a) => {
                                open.push(a);
                                probMap && probMap.has(a) && probMap.delete(a);
                            });
                            touched = true;
                        } else if (prob >= 1) {
                            reallyBlank.forEach((a) => {
                                marked.push(a);
                                probMap && probMap.has(a) && probMap.delete(a);
                            });
                            touched = true;
                        } else if (probMap) {
                            // TODO: re-check
                            // We may find
                            reallyBlank.forEach((a) => {
                                if (probMap.has(a)) {
                                    const prevMaxProb = probability.get(a) as number;
                                    probMap.set(a, Math.max(prob, prevMaxProb || 0));
                                } else {
                                    probMap.set(a, prob);
                                }
                            });
                        }
                    }
                    if (touched) {
                        i = -1;
                    }
                }
            }
        }

        if (probMap && probMap.size) {
            const cells = Array.from(probMap.keys());
            for (let j = 0; j < cells.length; j++) {
                const cell = cells[j];
                const origProb = probMap.get(cell) as number;
                const group = groupCells(field, cell.x, cell.y, true);
                let maxProb = -1;
                for (let i = 0; i < group.opened.length; i++) {
                    const openedCell = group.opened[i];
                    if (openedCell.bombs) {
                        const groupOpened = groupCells(field, openedCell.x, openedCell.y, true);
                        if (groupOpened.blank.length) {
                            maxProb = Math.max(maxProb, checkProbabilityWithState(openedCell, groupOpened, marked, open));
                        }
                    }
                }
                if (maxProb >= 0) {
                    if (maxProb !== origProb) {
                        if (maxProb === 0) {
                            open.push(cell);
                            probMap.delete(cell);
                            cells.splice(j, 1);
                            j = -1;
                        } else if (maxProb >= 1) {
                            marked.push(cell);
                            probMap.delete(cell);
                            cells.splice(j, 1);
                            j = -1;
                        } else if (probMap) {
                            probMap.set(cell, Math.max(maxProb, origProb));
                        }
                    }

                } else {
                    probMap.delete(cell);
                }
            }
        }
    }
}

export function solveMinesweeper(field: Field): SolveStep {
    open.length = 0;
    marked.length = 0;
    probability.clear();
    let empty = true;
    for (let row = 1; row < field.length; row++) {
        let touched = false;
        for (let cellIndex = 0; cellIndex < field[row].length; cellIndex++) {
            const cell = getCell(field, cellIndex, row) as FieldCell;
            if (isOpened(cell)) {
                const prevOpen = open.length;
                const preMark = marked.length;
                empty = false;
                test(field, cell, open, marked, probability);
                if (preMark !== marked.length && prevOpen !== open.length) {
                    touched = true;
                }
            }
        }
        if (touched) {
            row -= 2;
        }
    }
    if (!open.length && probability.size) {
        let maxItem = Array.from(probability.entries())
            .reduce((acc, item) => {
                if (acc[1] > item[1]) {
                    return item;
                }
                return acc;
            });
        if (maxItem[1] <= .5) {
            console.log('choose max prob item', Array.from(probability.values()), maxItem);
            return {
                open: [maxItem[0]],
                marked,
            };
        }
    }
    const result = Result;
    result.marked = marked;
    result.open = open;
    if (empty) {
        let attempts = 0;
        while (attempts <= 50) {
            attempts++;
            const x = Math.ceil(Math.random() * field.length);
            const y = Math.ceil(Math.random() * field[0].length);
            if (isBlank(field, x, y)) {
                return {
                    marked: Array.from(marked),
                    open: [getCell(field, x, y) as FieldCell]
                };
            }
        }
    }
    if (!open.length) {
        for (let row = 0; row < field.length; row++) {
            for (let cell = 0; cell < field[row].length; cell++) {
                if (isBlank(field, cell, row)) {
                    return {
                        marked: Array.from(marked),
                        open: [getCell(field, cell, row) as FieldCell]
                    };
                }
            }
        }
    }
    return {
        marked: Array.from(marked),
        open: Array.from(open)
    };
}

interface CellsGroup {
    marked: FieldCell[],
    opened: FieldCell[],
    blank: FieldCell[],
}

const getCell = (gameField: Field, x: number, y: number): FieldCell | null => gameField[y] && gameField[y][x] || null;

const hasCell = (gameField: Field, x: number, y: number): boolean => !!getCell(gameField, x, y);

const groupCells = (gameField: Field, x: number, y: number, include: boolean = false): CellsGroup => {
    const initial: CellsGroup = {
        marked: [],
        opened: [],
        blank: [],
    };
    if (include) {
        initial.opened.push(getCell(gameField, x, y) as FieldCell);
    }
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
};

const getCellsAroundByType = (field: Field, x: number, y: number, mode: FieldCellMode): FieldCell[] => {
    const opened: FieldCell[] = [];
    return getCellsAround(field, x, y)
        .reduce((acc: FieldCell[], cell: FieldCell) => {
            if (cell.mode === mode) {
                acc.push(cell);
            }
            return acc;
        }, opened);
};

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
): number {
    if (cell.bombs) {
        if (groups.blank.length) {
            return (cell.bombs - groups.marked.length) / groups.blank.length;
        }
    }
    return -1;
}

function checkProbabilityWithState(
    cell: FieldCell,
    groups: CellsGroup,
    marked: FieldCell[],
    open: FieldCell[],
): number {
    if (cell.bombs) {
        const blankCount = groups.blank.filter((i) => !marked.includes(i) && !open.includes(i)).length;
        if (blankCount) {
            const marker = groups.marked.length + groups.blank.filter((i) => marked.includes(i)).length;
            return (cell.bombs - marker) / blankCount;
        }
    }
    return -1;
}
