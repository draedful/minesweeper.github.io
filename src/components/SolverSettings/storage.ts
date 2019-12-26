import { PersistentStorage } from "@minesweeper/Storage";

export interface SolverSettings {
    stepTimeout?: number;
    predictBound?: number;
    selectRandomCellIfNoAnyChoice?: boolean;
}

export const DefaultSolverSettings = {
    stepTimeout: 10,
    predictBound: 0.7,
    selectRandomCellIfNoAnyChoice: true,
};

export class SolverSettingsStorage extends PersistentStorage<SolverSettings> {

    constructor(initial: Partial<SolverSettings> = {}) {
        super({
            ...DefaultSolverSettings,
            ...initial,
        });
    }

}
