import React, { ReactNode, useMemo } from "react";
import { GameFieldSettingsStorage } from "./storage";

export const GameFieldStorageContext = React.createContext<GameFieldSettingsStorage | null>(null);

export const GameFieldStorageContextComponent = (props: { children: ReactNode }) => {
    const value = useMemo(() => new GameFieldSettingsStorage(), []);
    return (
        <GameFieldStorageContext.Provider value={ value } { ...props }/>
    );
}
