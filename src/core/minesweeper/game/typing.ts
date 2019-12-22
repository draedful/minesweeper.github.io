import { EventEmitter } from "../../helpers/event-emitter";
import { GameCommandNewRespStatus, GameCommandOpenResp } from "./dispatcher.typing";

export type Field = FieldCell[][];

export enum GameStateEnum {
    Init,
    Active,
    Win,
    Lose
}

export enum FieldCellMode {
    Blank,
    Marked,
    Opened,
    MarkOpen
}

export class FieldCell {

    public bombs: number | void = void 0;
    public mode: FieldCellMode = FieldCellMode.Blank;

    public readonly id: string;

    constructor(
        public readonly x: number,
        public readonly y: number,
    ) {
        this.id = `${ x } ${ y }`;
    }

    public setMode(mode: FieldCellMode): FieldCell {
        this.mode = mode;
        return this;
    }

    public applyBombs(bombs: number): FieldCell {
        this.bombs = bombs;
        return this;
    }

    public update(mode: FieldCellMode, bombs?: number): FieldCell {
        if (mode !== this.mode || bombs !== this.bombs) {
            const cell = new FieldCell(this.x, this.y).setMode(mode);
            if (bombs) {
                cell.applyBombs(bombs)
            }
            return cell
        }
        return this;
    }

}

export interface MinesweeperEvents {
    loading: [boolean],
    changeField: [Field];
    changeState: [GameStateEnum];
    allOpening: [GameCommandOpenResp],
}

export interface MineSweeperController extends EventEmitter<MinesweeperEvents> {

    readonly field: Field;
    readonly loading: boolean;
    readonly state: GameStateEnum;
    readonly level: number;

    newGame(level: number): Promise<GameCommandNewRespStatus>;

    openCell(...cells: FieldCell[]): Promise<GameCommandOpenResp>;

    updateMap(): void;

    markCell(...cells: FieldCell[]): void;

    close(): void;

}
