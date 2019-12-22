import React, { useCallback, useState } from 'react';
import './App.scss';
import { GameFieldStorageContextComponent } from "./components/FieldSettings/context";
import { GameStatsScope } from "./components/GameStats/context";
import { MinesweeperGame } from "./components/minesweeper";
import { MineSweeper } from "./components/minesweeper/hooks/context";
import { Menu } from "./components/minesweeper/menu";
import { LoadingDialog } from "./components/server/LoadingDialog";
import { ServerProvider } from "./server/context";

const Game = () => {
    const [level, setLevel] = useState<number | null>(null);
    const close = useCallback(() => setLevel(null), []);
    if (level === null) {
        return <Menu onSelect={ (level) => setLevel(level) }/>
    }
    return (
        <GameStatsScope>
            <MineSweeper level={ level }>
                <MinesweeperGame close={ close }/>
            </MineSweeper>
        </GameStatsScope>

    )
};

const App: React.FC = () => {
    return (
        <ServerProvider>
            <LoadingDialog/>
            <div className="game-wrapper">
                <GameFieldStorageContextComponent>
                    <Game/>
                </GameFieldStorageContextComponent>
            </div>
        </ServerProvider>
    );
};

export default App;
