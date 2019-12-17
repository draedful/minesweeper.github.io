import { EventEmitter } from "../../helpers/event-emitter";
import {
    GameCommandDispatcher,
    GameCommandNewRespStatus,
    GameCommandOpenResp,
    GameCommandOpenRespStatus
} from "./dispatcher.typing";
import { Field, FieldCell, FieldCellMode, GameStateEnum, MineSweeperController, MinesweeperEvents } from "./typing";


export class MinesweeperGame extends EventEmitter<MinesweeperEvents> implements MineSweeperController {

    public get field(): Field {
        return this.gameField;
    }

    public get loading(): boolean {
        return this.isLoading;
    }

    public get state(): GameStateEnum {
        return this.gameState;
    }

    public startTime: number | void = void 0;
    public level: number = 0;

    protected gameField: Field = [];
    protected isLoading: boolean = false;
    protected gameState: GameStateEnum = GameStateEnum.Init;


    constructor(
        private dispatcher: GameCommandDispatcher,
    ) {
        super();
    }


    public async newGame(level: number): Promise<GameCommandNewRespStatus> {
        if (level !== this.level) {
            this.gameField = []
        } else {
            this.clearField();
        }
        this.startTime = void 0;
        this.emitChangeField();
        this.level = level;
        this.setLoading(true);
        const resp = await this.dispatcher.dispatch('new', level);
        if (resp === GameCommandNewRespStatus.OK) {
            await this.updateMap();
            this.setGameState(GameStateEnum.Active);
        }
        this.setLoading(false);
        return resp;
    }

    public markCell(...cells: FieldCell[]): void {
        this.applyStartTime();
        let copied = new Set();
        cells.forEach((cell) => {
            if (cell.mode === FieldCellMode.Blank) {
                this.gameField[cell.y][cell.x] = cell.update(FieldCellMode.Marked);
                if (!copied.has(cell.y)) {
                    this.gameField[cell.y] = Array.from(this.gameField[cell.y]);
                    copied.add(cell.y);
                }
            }
        });
        if (copied.size) {
            this.emitChangeField();
        }
        copied.clear();
    }

    public close(): void {
        this.setGameState(GameStateEnum.Init);
    }

    public async openCell(...cells: FieldCell[]): Promise<GameCommandOpenResp | undefined> {
        let lastResp;
        this.applyStartTime();
        this.setLoading(true);
        lastResp = await Promise.all(cells.map((cell) => this.dispatcher.dispatch("open", cell.id)))
            .then((resps) => {
                return resps.find((a) => {
                    switch (a.status) {
                        case GameCommandOpenRespStatus.LOSE:
                        case GameCommandOpenRespStatus.WIN:
                            return true;
                    }
                    return false;
                }) || resps[resps.length - 1];
            });
        if (lastResp) {
            switch (lastResp.status) {
                case GameCommandOpenRespStatus.LOSE:
                    this.updateMap();
                    this.setLoading(false);
                    this.setGameState(GameStateEnum.Lose);
                    return lastResp;
                case GameCommandOpenRespStatus.WIN:
                    this.setGameState(GameStateEnum.Win);
                    console.log('WIN', this.level, lastResp.message);
                    if (lastResp.message) {
                        window.localStorage.setItem(`level-${ this.level }`, lastResp.message);
                    }
                    this.setLoading(false);
                    return lastResp;
            }
        }
        await this.updateMap();
        this.setLoading(false);
        return lastResp;
    }

    protected applyStartTime(): void {
        if (!this.startTime) {
            this.startTime = Date.now();
        }
    }

    public async updateMap(): Promise<void> {
        this.setLoading(true);
        const map = await this.dispatcher.dispatch("map");
        if (map) {
            this.gameField = map.reduce((acc: Field, item: string[], rowIndex) => {
                let touched = false;
                let row = acc[rowIndex];
                if (!row) {
                    row = [];
                    acc.push(row);
                }
                item.forEach((value: string, cellIndex: number) => {
                    if (!row[cellIndex]) {
                        row.push(new FieldCell(cellIndex, rowIndex));
                    } else {
                        let item = row[cellIndex];
                        const bombs = +value;
                        if (item.mode === FieldCellMode.Marked) {
                            if (!isNaN(bombs)) {
                                item = item.update(FieldCellMode.Opened, bombs);
                            }
                        } else {
                            item = item.update(isNaN(bombs) ? FieldCellMode.Blank : FieldCellMode.Opened, isNaN(bombs) ? void 0 : bombs);
                        }
                        if (item !== row[cellIndex]) {
                            touched = true;
                        }
                        row[cellIndex] = item;
                    }
                });
                if (touched) {
                    acc[rowIndex] = Array.from(row);
                }
                return acc;
            }, this.gameField);
            this.emitChangeField();
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

    private emitChangeField(): void {
        this.emit("changeField", Array.from(this.field))
    }

    private clearField(): void {
        this.gameField = this.gameField.map((row) => {
            return row.map((cell) => cell.update(FieldCellMode.Blank))
        });
    }

}
