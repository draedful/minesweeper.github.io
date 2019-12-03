import React from "react";
import { MineSweeper } from "../core/game";
import { GameServer } from "../core/game-server";

export const mineSweeper = new MineSweeper(new GameServer('wss://hometask.eg1236.com/game1/'));
export const MineSweeperContext = React.createContext(mineSweeper);
