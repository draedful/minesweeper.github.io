import { EventEmitter } from "./helpers/event-emitter";

export type Field = FieldCell[][];

export enum GameStateEnum {
    Init,
    Active
}

export interface MinesweeperEvents {
    loading: [boolean],
    changeField: [Field];
    changeState: [GameStateEnum];
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

    public setMode(mode: FieldCellMode): void {
        this.mode = mode;
    }

    public applyBombs(bombs: number): void {
        this.bombs = bombs;
    }

}

export enum FieldCellMode {
    Blank,
    Marked,
    Opened
}

export interface MineSweeperManipulator extends EventEmitter<MinesweeperEvents> {

}
