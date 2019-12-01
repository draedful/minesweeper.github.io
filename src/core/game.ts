import produce from "immer";
import { isDevMode } from "../helpers/is_dev_mode";
import { EventEmitter } from "./event-emitter";
import { GameCommandDispatcher, Notifier, RawGameField } from "./game.typing";

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
    field: GameField | void;
}

const changeLoadingState = produce((state: GameState, loading: boolean) => {
    state.loading = loading;
});

const updateCell = produce((cell: Cell, state: CellState, bomb?: number) => {
    cell.state = state;
    cell.bombAround = bomb;
});

const changeGameMap = produce((state: GameState, gameMap: RawGameField) => {
    state.field = gameMap.reduce((acc: GameField, item: string[], rowIndex: number) => {
        const existedRow = acc[rowIndex];
        const row: Cell[] = item.map((val, cellIndex) => {
            const existedCell = existedRow && existedRow[cellIndex] || {};
            let state = existedCell.state || CellState.Blank;
            let bombAround = existedCell.bombAround;
            if (!isNaN(+val)) {
                state = CellState.Opened;
                bombAround = +val;
            }
            return updateCell(existedRow && existedRow[cellIndex] || {}, state, bombAround);
        });
        if (!existedRow) {
            acc.push(row);
        } else {
            acc[rowIndex] = row;
        }
        return acc;
    }, state.field as GameField);
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

export class MineSweeper extends EventEmitter<MineSweeperEvents> {

    public state: GameState = {
        loading: false,
        gameState: GameStateType.INIT,
        field: [],
    };


    constructor(
        private dispatcher: GameCommandDispatcher,
        private notifier?: Notifier,
    ) {
        super();
    }

    public async startNewGame(level: number): Promise<void> {
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

    public async openCell(x: number, y: number): Promise<void> {
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
            this.state = changeGameState(this.state, GameStateType.INIT);
            alert("You lose");
        }
    }

    public markCell(x: number, y: number): void {
        this.state = toggleCellMark(this.state, x, y);
        this.emitChange();
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


