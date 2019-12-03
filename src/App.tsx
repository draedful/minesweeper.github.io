import React from 'react';
import './App.css';
import { mineSweeper, MineSweeperContext } from "./game/context";
import { MineSweeperComponent } from "./game/MineSweeper";

const App: React.FC = () => {
    return (
        <MineSweeperContext.Provider value={ mineSweeper }>
            <MineSweeperComponent/>
        </MineSweeperContext.Provider>
    );
};

export default App;
