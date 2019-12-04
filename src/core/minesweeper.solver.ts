import { Field, FieldCell, FieldCellMode } from "./minesweeper.typing";

export interface SolveStep {
    mark: FieldCell[];
    open: FieldCell[];
    probability: FieldCell[];
}

export function solveMinesweeper(field: Field): SolveStep {
    const mark: Set<FieldCell> = new Set();
    const open: Set<FieldCell> = new Set();
    const probability: Set<FieldCell> = new Set();
    let empty = true;
    for (let row = 0; row < field.length; row++) {
        for (let cellIndex = 0; cellIndex < field[row].length; cellIndex++) {
            const cell = getCell(field, cellIndex, row) as FieldCell;
            if (isOpened(cell)) {
                empty = false;
                const group = groupCells(field, cellIndex, row);
                group.blank.forEach((pos) => resolveCell(field, cell, mark, open, probability));
            }
        }
    }
    if (empty) {
        const maxRow = field.length - 1;
        const maxCell = field[0].length - 1;
        const x = Math.ceil(Math.random() * 100) % maxCell;
        const y = Math.ceil(Math.random() * 100) % maxRow;
        return {
            mark: [],
            open: [getCell(field, x, y) as FieldCell],
            probability: []
        }
    }
    if (!mark.size && !open.size) {
        for (let row = 0; row < field.length; row++) {
            for (let cell = 0; cell < field[row].length; cell++) {
                if (isBlank(field, cell, row)) {
                    return {
                        open: [getCell(field, cell, row) as FieldCell],
                        mark: [],
                        probability: []
                    }
                }
            }
        }
    }
    return {
        mark: Array.from(mark),
        open: Array.from(open),
        probability: Array.from(probability),
    }
}


function resolveCell(
    gameField: Field,
    cell: FieldCell,
    prevMark: Set<FieldCell>,
    prevOpen: Set<FieldCell>,
    probSet: Set<FieldCell>,
): void {
    const group = groupCells(gameField, cell.x, cell.y);
    let fullProbability = 0;
    let setProbability = false;
    let count = 0;
    let modified = false;
    for (let i = 0; i < group.opened.length; i++) {
        const cell = group.opened[i];
        const openGroups = groupCells(gameField, cell.x, cell.y);

        if (cell.bombs) {
            const blank = openGroups.blank.filter((pos) => !prevMark.has(pos) && !prevOpen.has(pos));
            if (blank) {
                const markCount = openGroups.marked.length + openGroups.blank.filter((pos) => {
                    return prevMark.has(pos);
                }).length;
                const probability = (cell.bombs - markCount) / blank.length;
                if (probability <= 0) {
                    blank.forEach((a) => prevOpen.add(a));
                    modified = true;
                } else if (probability >= 1) {
                    blank.forEach((a) => prevMark.add(a));
                    modified = true;
                    if (count <= group.opened.length * openGroups.opened.length) {
                        count++;
                        i = 0;
                    }
                } else if (probability >= 0.5) {
                    setProbability = true;
                    fullProbability += probability;
                    count++;
                }
            }

        }
    }
    if (!modified && setProbability && (fullProbability / count) >= 0.8) {
        probSet.add(cell);
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
