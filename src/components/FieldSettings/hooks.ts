import { useCallback, useContext, useEffect, useState } from "react";
import { GameFieldStorageContext } from "./context";


export const useGameFieldCellSizeState = (initSize: number = 7): [number, (size: number) => void] => {
    const gameFieldStorage = useContext(GameFieldStorageContext);
    const [cellSize, setCellSize] = useState<number>((gameFieldStorage && gameFieldStorage.get("cellSize")) || initSize);
    useEffect(() => {
        if (gameFieldStorage) {
            return gameFieldStorage.on("cellSize", (val: number | undefined) => {
                setCellSize(val || initSize);
            });
        }
    }, [gameFieldStorage, setCellSize, initSize]);
    const saveCellSize = useCallback((size: number) => {
        gameFieldStorage && gameFieldStorage.set("cellSize", size);
    }, [gameFieldStorage]);
    return [cellSize, saveCellSize];
};
