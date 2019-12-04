import React, { useCallback, useContext } from "react";
import { GameCommandOpenRespStatus } from "../core/game.typing";
import { MineSweeperContext } from "./context";

export const GameMenu = () => {
    const mineSweeper = useContext(MineSweeperContext);
    const new1 = useCallback(() => {
        mineSweeper && mineSweeper.newGame(1);
    }, [mineSweeper]);
    const new2 = useCallback(() => {
        mineSweeper && mineSweeper.newGame(2);
    }, [mineSweeper]);
    const new3 = useCallback(() => {
        mineSweeper && mineSweeper.newGame(3);
    }, [mineSweeper]);
    const new4 = useCallback(() => {
        mineSweeper && mineSweeper.newGame(4);
    }, [mineSweeper]);
    const runAuto = useCallback(async () => {
        if (mineSweeper) {
            const open = await mineSweeper.predictOpen();
            if (open && open.length) {
                const resp = await mineSweeper.openCell(...open);
                switch (resp) {
                    case GameCommandOpenRespStatus.LOSE:
                        await mineSweeper.newGame(mineSweeper.level);
                        break;
                    case GameCommandOpenRespStatus.WIN:
                        if (mineSweeper.level < 4) {
                            await mineSweeper.newGame(mineSweeper.level + 1);
                        }
                        return;
                }
            }
            setTimeout(runAuto, 1000);
        }
    }, [mineSweeper]);
    return (
        <div>
            <button onClick={ new1 }>New 1</button>
            <button onClick={ new2 }>New 2</button>
            <button onClick={ new3 }>New 3</button>
            <button onClick={ new4 }>New 4</button>
            <button onClick={ runAuto }>runAuto</button>
        </div>
    )
};
