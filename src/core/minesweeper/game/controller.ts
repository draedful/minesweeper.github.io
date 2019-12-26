import { EventEmitter } from "../../helpers/event-emitter";
import {
    GameCommandDispatcher,
    GameCommandNewRespStatus,
    GameCommandOpenResp,
    GameCommandOpenRespStatus
} from "./dispatcher.typing";
import { Field, FieldCell, FieldCellMode, GameStateEnum, MineSweeperController, MinesweeperEvents } from "./typing";


function mapCells(field: Field, cells: FieldCell[], fn: (cell: FieldCell) => FieldCell): Field {
    let copied = new Set();
    cells.forEach((cell) => {
        if (cell.mode !== FieldCellMode.Opened) {
            field[cell.y][cell.x] = fn(cell);
            if (!copied.has(cell.y)) {
                field[cell.y] = Array.from(field[cell.y]);
                copied.add(cell.y);
            }
        }
    });
    if (copied.size) {
        return Array.from(field);
    }
    return field;
}

export class MinesweeperGame extends EventEmitter<MinesweeperEvents> implements MineSweeperController {

    public level: number = 0;
    public field: Field = [];
    public loading: boolean = false;
    public state: GameStateEnum = GameStateEnum.Init;

    constructor(
        private dispatcher: GameCommandDispatcher,
    ) {
        super();
    }

    public async newGame(level: number): Promise<GameCommandNewRespStatus> {
        if (level !== this.level) {
            this.field = []
        } else {
            this.clearField();
        }
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
        const newField = mapCells(this.field, cells, (cell: FieldCell) => {
            if (cell.mode !== FieldCellMode.Opened) {
                return cell.update(cell.mode === FieldCellMode.Blank ? FieldCellMode.Marked : FieldCellMode.Blank);
            }
            return cell;
        });
        if (newField !== this.field) {
            this.emitChangeField();
        }
    }

    public close(): void {
        this.setGameState(GameStateEnum.Init);
    }

    public async openCell(...cells: FieldCell[]): Promise<GameCommandOpenResp> {
        this.setLoading(true);
        this.markCellsAsOpening(cells);
        let lastResp = await Promise.all(
            cells.map((cell) => this.dispatcher.dispatch("open", cell.id))
        )
            .then((resps) => {
                return resps.find((a, index) => {
                    switch (a.status) {
                        case GameCommandOpenRespStatus.LOSE:
                        case GameCommandOpenRespStatus.WIN:
                            return true;
                    }
                    return false;
                }) || resps[resps.length - 1];
            })
            .then((lastResp) => {
                switch (lastResp.status) {
                    case GameCommandOpenRespStatus.LOSE:
                        this.setGameState(GameStateEnum.Lose);
                        break;
                    case GameCommandOpenRespStatus.WIN:
                        this.setGameState(GameStateEnum.Win);
                        if (lastResp.message) {
                            window.localStorage.setItem(`level-${ this.level }`, lastResp.message);
                        }
                        break;
                }
                return lastResp;
            });
        await this.updateMap();
        this.setLoading(false);
        return lastResp;
    }

    public async updateMap(): Promise<void> {
        this.setLoading(true);
        const map = await this.dispatcher.dispatch("map");
        if (map) {
            let modified = false;
            for (let rowIndex = 0; rowIndex < map.length; rowIndex++) {
                let touched = false;
                let row = this.field[rowIndex];
                if (!row) {
                    row = [];
                    this.field.push(row);
                }
                for (let cellIndex = 0; cellIndex < map[rowIndex].length; cellIndex++) {
                    const value = map[rowIndex][cellIndex];
                    if (!row[cellIndex]) {
                        row.push(new FieldCell(cellIndex, rowIndex));
                        modified = true;
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
                }
                if (touched) {
                    this.field[rowIndex] = Array.from(row);
                    modified = true;
                }
            }
            // const newField = map.reduce((acc: Field, item: string[], rowIndex) => {
            //     let touched = false;
            //     let row = acc[rowIndex];
            //     if (!row) {
            //         row = [];
            //         acc.push(row);
            //     }
            //     item.forEach((value: string, cellIndex: number) => {
            //         if (!row[cellIndex]) {
            //             row.push(new FieldCell(cellIndex, rowIndex));
            //             modified = true;
            //         } else {
            //             let item = row[cellIndex];
            //             const bombs = +value;
            //             if (item.mode === FieldCellMode.Marked) {
            //                 if (!isNaN(bombs)) {
            //                     item = item.update(FieldCellMode.Opened, bombs);
            //                 }
            //             } else {
            //                 item = item.update(isNaN(bombs) ? FieldCellMode.Blank : FieldCellMode.Opened, isNaN(bombs) ? void 0 : bombs);
            //             }
            //             if (item !== row[cellIndex]) {
            //                 touched = true;
            //             }
            //             row[cellIndex] = item;
            //         }
            //     });
            //     if (touched) {
            //         acc[rowIndex] = Array.from(row);
            //         modified = true;
            //     }
            //     return acc;
            // }, this.field);
            this.setLoading(false);
            if (modified) {
                this.field = Array.from(this.field);
                this.emitChangeField();
            }
        }
    }

    protected setLoading(loading: boolean): void {
        if (this.loading !== loading) {
            this.loading = loading;
            this.emit("loading", this.loading);
        }
    }

    protected setGameState(gameState: GameStateEnum): void {
        if (this.state !== gameState) {
            this.state = gameState;
            this.emit("changeState", this.state);
        }
    }

    private emitChangeField(): void {
        this.emit("changeField", this.field);
    }

    private clearField(): void {
        this.field = this.field.map((row) => {
            return row.map((cell) => cell.update(FieldCellMode.Blank))
        });
    }

    private markCellsAsOpening(cells: FieldCell[]): void {
        mapCells(this.field, cells, (cell) => cell.update(FieldCellMode.MarkOpen));
        this.emit("changeField", Array.from(this.field));
    }

}
