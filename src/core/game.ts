import produce from "immer";
import { isDevMode } from "../helpers/is_dev_mode";
import { EventEmitter } from "./event-emitter";
import { GameCommandDispatcher, Notifier, RawGameField } from "./game.typing";
import { PromiseQueue } from "./helpers/queue";

export enum GameStateType {
    INIT,
    ACTIVE,
}

export interface MineSweeperEvents {
    change: [GameState],
}

export enum CellState {
    Blank,
    Opened,
    Marked,
}

export interface Cell {
    state: CellState,
    bombAround?: number,
}

export type GameField = Cell[][];

export interface GameState {
    loading: boolean;
    gameState: GameStateType,
    field: GameField;
    meta: {
        activeRows: number[],
    }
}

type Pos = [number, number];

const changeLoadingState = produce((state: GameState, loading: boolean) => {
    state.loading = loading;
});

const updateCell = produce((cell: Cell, state: CellState, bomb?: number) => {
    cell.state = state;
    cell.bombAround = bomb;
});

const markCells = produce((state: GameState, indexes: Pos[]) => {
    indexes.forEach(([x, y]) => {
        if (state.field) {
            state.field[y][x].state = CellState.Marked;
        }
    })
});

const changeGameMap = produce((state: GameState, gameMap: RawGameField) => {
    const activeRows: number[] = [];
    state.field = gameMap.reduce((acc: GameField, item: string[], rowIndex: number) => {
        const existedRow = acc[rowIndex];
        let activeItems = 0;
        const row: Cell[] = item.map((val, cellIndex) => {
            const existedCell = existedRow && existedRow[cellIndex] || {};
            let state = existedCell.state || CellState.Blank;
            let bombAround = existedCell.bombAround;
            if (state !== CellState.Blank) {
                activeItems++;
            }
            if (!isNaN(+val)) {
                state = CellState.Opened;
                bombAround = +val;
            }
            return updateCell(existedRow && existedRow[cellIndex] || {}, state, bombAround);
        });
        if (activeItems > 0 && activeItems < row.length) {
            activeRows.push(rowIndex);
        }
        if (!existedRow) {
            acc.push(row);
        } else {
            acc[rowIndex] = row;
        }
        return acc;
    }, state.field as GameField);
    state.meta.activeRows = activeRows;
});

const resetMap = produce((state: GameState) => {
    state.field = [];
});

const changeGameState = produce((state: GameState, gameState: GameStateType) => {
    state.gameState = gameState;
});

const toggleCellMark = produce((state: GameState, x: number, y: number) => {
    if (state.field && state.field[y] && state.field[y][x]) {
        state.field[y][x] = updateCell(state.field[y][x], state.field[y][x].state === CellState.Marked ? CellState.Blank : CellState.Marked);
    }
});

export enum GameOpenCellResp {
    WIN,
    LOSE,
    CONTINUE
}

const WinRegExp = /^You win\. The password for this level is: (.*)/;

export class MineSweeper extends EventEmitter<MineSweeperEvents> {

    public state: GameState = {
        loading: false,
        gameState: GameStateType.INIT,
        field: [],
        meta: { activeRows: [] }
    };

    public level: number | undefined;

    private queue: PromiseQueue = new PromiseQueue();

    constructor(
        private dispatcher: GameCommandDispatcher,
        private notifier?: Notifier,
    ) {
        super();
    }

    public async startNewGame(level: number): Promise<void> {
        this.level = level;
        this.setLoading(true);
        this.state = changeGameState(resetMap(this.state), GameStateType.INIT);
        this.emitChange();
        const resp = await this.dispatcher.dispatch("new", level);
        if (resp === "OK") {
            const map = await this.dispatcher.dispatch("map");
            if (map) {
                this.applyField(map);
                this.setLoading(false);
                this.state = changeGameState(this.state, GameStateType.ACTIVE);
                this.emitChange();
            }
        }
    }

    public async openCell(x: number, y: number): Promise<GameOpenCellResp> {
        // @ts-ignore
        if (isOpened(getCell(this.state.field, x, y)) as Cell) {
            return Promise.resolve(GameOpenCellResp.CONTINUE);
        }
        this.setLoading(true, { emit: false });
        const resp = await this.dispatcher.dispatch("open", `${ x } ${ y }`);
        if (resp === "OK") {
            const map = await this.dispatcher.dispatch("map");
            if (map) {
                this.applyField(map);
                this.setLoading(false);
                this.emitChange();
            }
        } else if (resp === "You lose") {
            console.log('loose');
            this.state = changeGameState(this.state, GameStateType.INIT);
            return GameOpenCellResp.LOSE;
        } else if (resp.match(WinRegExp)) {
            window.localStorage.setItem('level' + this.level, resp);
            return GameOpenCellResp.WIN;
        }
        return GameOpenCellResp.CONTINUE;
    }

    public async batchOpenCell(pos: Pos[]): Promise<GameOpenCellResp> {
        this.setLoading(true, { emit: false });
        const resp = await Promise.all(pos.map((p) => {
            return this.queue.add(() => {
                const cell = getCell(this.state.field, p[0], p[1]);
                if (cell && isOpened(cell)) {
                    return Promise.resolve('OK');
                } else if (!cell) {
                    return Promise.reject();
                }
                return this.dispatcher.dispatch("open", `${ p[0] } ${ p[1] }`)
            }).then((resp) => {
                if (resp === "You lose") {
                    if (p.join(',') === this.randomSelect.join(',')) {
                        console.log('loose with random', this.randomSelect);
                    } else {
                        console.log('loose');
                    }
                }
                return resp as string;
            })
        }))
            .then((resp: string[]) => resp.pop());

        if (resp === "OK") {
            const map = await this.dispatcher.dispatch("map");
            if (map) {
                this.applyField(map);
                this.setLoading(false);
                this.emitChange();
            }
        } else if (resp === "You lose") {
            this.state = changeGameState(this.state, GameStateType.INIT);
            return GameOpenCellResp.LOSE;
        } else if (resp && resp.match(WinRegExp)) {
            window.localStorage.setItem('level' + this.level, resp);
            return GameOpenCellResp.WIN;
        }
        return GameOpenCellResp.CONTINUE;
    }

    public markCell(x: number, y: number): void {
        this.state = toggleCellMark(this.state, x, y);
        this.emitChange();
    }

    private randomSelect: Pos = [-1, -1];

    public nextStep(): Pos[] | null {
        if (this.state.field) {
            // const clickTo = this.startOpening();
            const clickTo = this.markGameField();
            if (clickTo && clickTo.length) {
                return clickTo;
            } else {
                this.emitChange();
            }

            for (let rowIndex = 0; rowIndex < this.state.field.length; rowIndex++) {
                for (let cellIndex = 0; cellIndex < this.state.field[rowIndex].length; cellIndex += 2) {
                    if (isBlank(this.state.field[rowIndex][cellIndex])) {
                        console.log('try to guess + 2', cellIndex, rowIndex);
                        this.randomSelect[0] = cellIndex;
                        this.randomSelect[1] = rowIndex;
                        return [[cellIndex, rowIndex]];
                    }
                }
            }
            for (let rowIndex = 0; rowIndex < this.state.field.length; rowIndex++) {
                for (let cellIndex = 0; cellIndex < this.state.field[rowIndex].length; cellIndex += 1) {
                    if (isBlank(this.state.field[rowIndex][cellIndex])) {
                        console.log('try to guess + 1', cellIndex, rowIndex);
                        this.randomSelect[0] = cellIndex;
                        this.randomSelect[1] = rowIndex;
                        return [[cellIndex, rowIndex]];
                    }
                }
            }
        }
        return null;
    }

    private markGameField(): Pos[] | void {
        const open = [];
        const cache = new Set();
        if (this.state.meta.activeRows.length) {
            for (let activeRowsIndex = this.state.meta.activeRows[0] || 0; activeRowsIndex < this.state.meta.activeRows.length; activeRowsIndex++) {
                const cellsCount = this.state.field[0].length;
                for (let cellIndex = 0; cellIndex < cellsCount; cellIndex++) {
                    const rowIndex = this.state.meta.activeRows[activeRowsIndex];
                    if (!this.state.meta.activeRows.includes(rowIndex)) continue;
                    const cell = getCell(this.state.field, cellIndex, rowIndex) as Cell;
                    if (isOpened(cell) && cell.bombAround as number > 0) {
                        const { marked, opened, blank } = groupCells(
                            this.state.field,
                            getCellsAround(this.state.field, cellIndex, rowIndex)
                        );
                        if (opened.length && blank.length) {
                            if (blank.length === (cell.bombAround as number - marked.length)) {
                                this.state = markCells(this.state, blank);
                                cellIndex--;
                                continue;
                            }
                            const id = blank[0].join('');
                            if (marked.length === cell.bombAround && !cache.has(id)) {
                                cache.add(id);
                                open.push(blank[0]);
                            }
                        }
                    }
                }
            }
        }
        return open;
    }

    protected setLoading(loading: boolean, conf?: { emit: boolean }): void {
        if (this.state.loading !== loading) {
            this.state = changeLoadingState(this.state, loading);
            (!conf || conf.emit) && this.emitChange()
        } else if (isDevMode()) {
            console.warn('Attempt to set the same loading state');
        }
    }

    protected emitChange(): void {
        this.emit("change", this.state);
    }

    protected applyField(map: RawGameField): void {
        this.state = changeGameMap(this.state, map);
    }

}

function getCell(gameField: GameField, x: number, y: number): Cell | null {
    if (y >= 0 && x >= 0) {
        const row = gameField[y];
        if (row && row.length > x) {
            return row[x];
        }
    }
    return null;
}

function hasCell(gameField: GameField, x: number, y: number): boolean {
    if (y >= 0 && x >= 0) {
        const row = gameField[y];
        return row && row.length > x;
    }
    return false;
}

const isBlank = (cell: Cell): boolean => cell.state === CellState.Blank;
const isOpened = (cell: Cell): boolean => cell.state === CellState.Opened;

function isBlankCell(gameField: GameField, x: number, y: number): boolean {
    const cell = getCell(gameField, x, y);
    return !!cell && cell.state === CellState.Blank;
}

function getCellsAround(gameField: GameField, x: number, y: number): Pos[] {
    const Top = y - 1;
    const Bottom = y + 1;
    const Left = x - 1;
    const Right = x + 1;
    const pos: Pos[] = [];
    hasCell(gameField, Left, Top) && pos.push([Left, Top]);
    hasCell(gameField, x, Top) && pos.push([x, Top]);
    hasCell(gameField, Right, Top) && pos.push([Right, Top]);
    hasCell(gameField, Left, y) && pos.push([Left, y]);
    hasCell(gameField, Right, y) && pos.push([Right, y]);
    hasCell(gameField, Left, Bottom) && pos.push([Left, Bottom]);
    hasCell(gameField, Right, Bottom) && pos.push([Right, Bottom]);
    hasCell(gameField, x, Bottom) && pos.push([x, Bottom]);
    return pos;
}

interface CellsGroup {
    marked: Pos[],
    opened: Pos[],
    blank: Pos[],
}

function groupCells(gameField: GameField, indexes: Pos[]): CellsGroup {
    return indexes.reduce((acc: CellsGroup, pos: Pos) => {
        const cell = getCell(gameField, pos[0], pos[1]) as Cell;
        switch (cell.state) {
            case CellState.Blank:
                acc.blank.push(pos);
                break;
            case CellState.Marked:
                acc.marked.push(pos);
                break;
            case CellState.Opened:
                acc.opened.push(pos);
                break;
        }
        return acc;
    }, {
        marked: [],
        opened: [],
        blank: [],
    } as CellsGroup)
}

