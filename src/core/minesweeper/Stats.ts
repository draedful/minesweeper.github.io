import { EventEmitter } from "../helpers/event-emitter";

export interface GameStatsData {
    stopGame?: number;
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
        switch (markName) {
            case "startGame":
                if (!this.state.startGame) {
                    this.state.startGame = Date.now();
                }
                break;
            case "stopGame":
                if (!this.state.stopGame) {
                    this.state.stopGame = Date.now();
                }
                break;
            default:
                const prevVal = this.state[markName] || 0;
                this.state[markName] = prevVal + 1;
        }
        this.emit("change", this.state);
    }
}
