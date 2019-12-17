import React, { useCallback, useState } from 'react';
import './App.scss';
import { MinesweeperGame } from "./components/minesweeper";
import { MineSweeper } from "./components/minesweeper/hooks";
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
        <MineSweeper level={ level }>
            <MinesweeperGame close={ close }/>
        </MineSweeper>
    )
};

const App: React.FC = () => {
    return (
        <ServerProvider>
            <LoadingDialog/>
            <div className="game-wrapper">
                <Game/>
            </div>
        </ServerProvider>
    );
};

export default App;
