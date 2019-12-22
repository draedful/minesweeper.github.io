import { GameStateEnum } from "@minesweeper/game";
import React from "react";
import { useMinesweeperLoading, useMinesweeperState } from "../hooks";

export const GameStateIndicator = () => {
    const loading = useMinesweeperLoading();
    const state = useMinesweeperState();
    switch (state) {
        case GameStateEnum.Win:
            return (<>🥳</>);
        case GameStateEnum.Lose:
            return (<>😢</>);
    }
    return (<>{ loading ? '🤔' : '🙂' }</>)
};
