import { GameCommandDispatcher, GameCommandNewRespStatus, GameCommandOpenRespStatus } from "./game.typing";
import { EventEmitter } from "./helpers/event-emitter";
import { solveMinesweeper } from "./minesweeper.solver";
import {
    Field,
    FieldCell,
    FieldCellMode,
    GameStateEnum,
    MinesweeperEvents,
    MineSweeperManipulator
} from "./minesweeper.typing";


export class MinesweeperGame extends EventEmitter<MinesweeperEvents> implements MineSweeperManipulator {

    public get field(): Field {
        return this.gameField;
    }

    public get loading(): boolean {
        return this.isLoading;
    }

    public get state(): GameStateEnum {
        return this.gameState;
    }

    protected gameField: Field = [];
    protected isLoading: boolean = false;
    protected gameState: GameStateEnum = GameStateEnum.Init;
    public level: number = 0;

    constructor(
        private dispatcher: GameCommandDispatcher,
    ) {
        super();
    }

    public async newGame(level: number): Promise<void> {
        this.level = level;
        this.setLoading(true);
        const resp = await this.dispatcher.dispatch('new', level);
        if (resp === GameCommandNewRespStatus.OK) {
            this.gameField = [];
            await this.updateMap();
            this.setGameState(GameStateEnum.Active);
        }
        this.setLoading(false);
    }

    public async openCell(...cells: FieldCell[]): Promise<GameCommandOpenRespStatus> {
        let lastResp;
        this.setLoading(true);
        while (cells.length) {
            const cell = cells.shift() as FieldCell;
            if (cell.mode === FieldCellMode.Opened) {
                continue;
            }
            lastResp = await this.dispatcher.dispatch("open", cell.id);
            if (
                lastResp.status === GameCommandOpenRespStatus.LOSE
                || lastResp.status === GameCommandOpenRespStatus.WIN
            ) {
                break;
            }
        }
        if (lastResp) {
            switch (lastResp.status) {
                case GameCommandOpenRespStatus.LOSE:
                    this.setLoading(false);
                    this.setGameState(GameStateEnum.Init);
                    return lastResp.status;
                case GameCommandOpenRespStatus.WIN:
                    if (lastResp.message) {
                        window.localStorage.setItem(`level-${ this.level }`, lastResp.message);
                    } else {
                        console.log('User is won but password did not passed');
                    }
                    this.setLoading(false);
                    this.setGameState(GameStateEnum.Init);
                    return lastResp.status;
                case GameCommandOpenRespStatus.OK:
                    await this.updateMap();
            }
        }
        this.setLoading(false);
        return GameCommandOpenRespStatus.OK;
    }

    public async predictOpen() {
        const resp = solveMinesweeper(this.field);
        if (resp.mark.length) {
            this.markCells(...resp.mark);
        }
        if (resp.probability.length) {
            return resp.probability;
        }
        return resp.open;
    }

    public markCells(...cells: FieldCell[]): void {
        cells.forEach((cell) => {
            if (cell.mode === FieldCellMode.Blank) {
                cell.setMode(FieldCellMode.Marked)
            }
        });
        this.emit("changeField", this.gameField.slice());
    }

    public async updateMap(): Promise<void> {
        this.isLoading = false;
        this.emit("loading", this.isLoading);
        const map = await this.dispatcher.dispatch("map");
        if (map) {
            this.gameField = map.reduce((acc: Field, item: string[], rowIndex) => {
                let row = acc[rowIndex];
                if (!row) {
                    row = [];
                    acc.push(row);
                }
                item.forEach((value: string, cellIndex: number) => {
                    let item = row[cellIndex];
                    if (!item) {
                        item = new FieldCell(cellIndex, rowIndex);
                        row.push(item);
                    }
                    const bombs = +value;
                    if (!isNaN(bombs)) {
                        item.applyBombs(bombs);
                        item.setMode(FieldCellMode.Opened);
                    }

                });
                return acc;
            }, this.gameField.slice());
            this.emit("changeField", this.gameField);
        }

    }

    protected setLoading(loading: boolean): void {
        if (this.isLoading !== loading) {
            this.isLoading = loading;
            this.emit("loading", this.isLoading);
        }
    }

    protected setGameState(gameState: GameStateEnum): void {
        if (this.gameState !== gameState) {
            this.gameState = gameState;
            this.emit("changeState", this.gameState);
        }
    }

}
