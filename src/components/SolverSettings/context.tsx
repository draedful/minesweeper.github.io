import React, { ReactNode, useMemo } from "react";
import { SolverSettingsStorage } from "./storage";

export const SolverSettingsContext = React.createContext<SolverSettingsStorage | void>(void 0);

export const SolverSettingsScope = ({ children }: { children: ReactNode }) => {
    const solverSettingsStorage = useMemo(() => new SolverSettingsStorage(), []);
    return (
        <SolverSettingsContext.Provider value={ solverSettingsStorage }>
            { children }
        </SolverSettingsContext.Provider>
    );
};
