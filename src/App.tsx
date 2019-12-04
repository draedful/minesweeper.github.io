import React from 'react';
import './App.css';
import { MineSweeper } from "./minesweeper/context";
import { GameField } from "./minesweeper/field";
import { GameMenu } from "./minesweeper/GameMenu";
import { ServerProvider } from "./server/context";

const App: React.FC = () => {
    return (
        <ServerProvider>
            <MineSweeper>
                <GameMenu/>
                <GameField/>
            </MineSweeper>
        </ServerProvider>
    );
};

export default App;
