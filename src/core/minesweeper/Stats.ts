import { isDevMode } from "../../helpers/is_dev_mode";
import { EventEmitter } from "../helpers/event-emitter";

export interface GameStatsData {
    startGame?: number;
    open?: number;
    mark?: number;
    predict?: number;
}

export interface GameStateEvents {
    change: [GameStatsData]
}

export type MarkTypes = keyof GameStatsData;

export class GameStatsService extends EventEmitter<GameStateEvents> {

    protected state: GameStatsData = {
        open: 0,
        mark: 0,
        predict: 0,
    };

    public getStats(): GameStatsData {
        return this.state;
    }

    public reset(): void {
        this.state = {
            open: 0,
            mark: 0,
            predict: 0,
        };
    }

    public mark(markName: MarkTypes): void {
        if (markName === "startGame") {
            if (this.state[markName] && isDevMode()) {
                throw new Error('Game already started');
            }
            this.state[markName] = Date.now();
            return
        }
        const prevVal = this.state[markName] || 0;
        this.state[markName] = prevVal + 1;
    }
}
