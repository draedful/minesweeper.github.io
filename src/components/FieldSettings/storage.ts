import { PersistentStorage } from "@minesweeper/Storage";

export interface GameFieldSettings {
    cellSize: number,
}

export class GameFieldSettingsStorage extends PersistentStorage<GameFieldSettings> {
    constructor() {
        super({
            cellSize: 7,
        });
    }
}
