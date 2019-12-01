import React from 'react';
import './App.css';
import { MineSweeper } from "./core/game";
import { GameServer } from "./core/game-server";
import { MineSweeperComponent } from "./MineSweeper";

const mineSweeper = new MineSweeper(new GameServer('wss://hometask.eg1236.com/game1/'));

export const MineSweeperContext = React.createContext(mineSweeper);

const App: React.FC = () => {
    return (
        <MineSweeperContext.Provider value={ mineSweeper }>
            <MineSweeperComponent/>
        </MineSweeperContext.Provider>
    );
};

export default App;
