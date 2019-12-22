import { useContext, useEffect, useState } from "react";
import { SolverSettingsContext } from "./context";
import { DefaultSolverSettings, SolverSettings } from "./storage";

export const useSolverSettings = (): SolverSettings => {
    const gameFieldSettingsStorage = useContext(SolverSettingsContext);
    const [gameFieldSettings, setGameFieldSettings] = useState((gameFieldSettingsStorage && gameFieldSettingsStorage.data) || DefaultSolverSettings);
    useEffect(() => {
        if (gameFieldSettingsStorage) {
            return gameFieldSettingsStorage.on('change', () => {
                setGameFieldSettings(gameFieldSettingsStorage.data);
            })
        }
    });
    return gameFieldSettings;
};
