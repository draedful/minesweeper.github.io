import React, { memo, MouseEvent, useCallback, useContext } from "react";
import { VariableSizeGrid } from 'react-window';
import { GameField, GameOpenCellResp } from "../core/game";
import { MemoCell } from "./Cell";
import { MineSweeperContext } from "./context";
import { useMineSweeper } from "./hooks";
import './minesweeper.css'


const MineField = ({ field, open, mark }: { field: GameField, open: (x: number, y: number) => void, mark: (x: number, y: number) => void }) => {
    const rowCount = field.length;
    const cellsCount = field[0].length;
    const openCell = useCallback((e: MouseEvent) => {
        // @ts-ignore
        const [x, y] = e.target.dataset.position.split(',');
        if (x && y) {
            open(+x, +y);
        }
    }, [open]);
    const markCell = useCallback((e: MouseEvent) => {
        // @ts-ignore
        const [x, y] = e.target.dataset.position.split(',');
        if (x && y) {
            mark(+x, +y);
        }
    }, [open]);
    return (
        <div onClick={ openCell } onContextMenu={ markCell }>
            <VariableSizeGrid
                rowHeight={ () => 20 }
                columnWidth={ () => 20 }
                rowCount={ rowCount }
                itemData={ field }
                columnCount={ cellsCount }
                height={ (rowCount * 20) }
                width={ (cellsCount * 20) }
            >
                { MemoCell }
            </VariableSizeGrid>
        </div>
    )
};

interface QueueItem {
    action(): Promise<any>;

    resolve: (data: any) => void;
    reject: (reject: any) => void;
}

export class PromiseQueue {
    private queue: QueueItem[] = [];
    private active: boolean = false;

    public add<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({
                action: fn,
                reject,
                resolve,
            });
            this.next();
        })
    }

    private next(): void {
        if (!this.active) {
            const item = this.queue.shift();
            if (item) {
                this.active = true;
                item.action().then(
                    (data) => {
                        this.active = false;
                        item.resolve(data);
                        this.next()
                    },
                    (error) => {
                        this.active = false;
                        item.reject(error);
                        this.next();
                    }
                )
            }
        }
    }
}

const queue = new PromiseQueue();

const GameMenu = () => {
    const minesweeper = useContext(MineSweeperContext);
    const trySolveStep = useCallback(async () => {
        const pos = minesweeper.nextStep();
        if (pos) {
            const resp = minesweeper.batchOpenCell(pos)
                .then((resp) => {
                    switch (resp) {
                        case GameOpenCellResp.CONTINUE:
                            setTimeout(trySolveStep, 0);
                            break;
                        case GameOpenCellResp.LOSE:
                            minesweeper.startNewGame(minesweeper.level as number).then(() => {
                                setTimeout(trySolveStep, 0);
                            });
                            break;
                        case GameOpenCellResp.WIN:
                            minesweeper.startNewGame(minesweeper.level as number + 1).then(() => {
                                setTimeout(trySolveStep, 0)
                            });
                            break;
                    }
                })


        }
    }, [minesweeper]);
    return (
        <div>
            <button onClick={ () => minesweeper.startNewGame(1) }> Level 1</button>
            <button onClick={ () => minesweeper.startNewGame(2) }> Level 2</button>
            <button onClick={ () => minesweeper.startNewGame(3) }> Level 3</button>
            <button onClick={ () => minesweeper.startNewGame(4) }> Level 4</button>
            <button onClick={ trySolveStep }> Next Step</button>
        </div>
    )
};

export const MineSweeperComponent = () => {
    const minesweeper = useContext(MineSweeperContext);
    const gameState = useMineSweeper();
    const click = useCallback((x: number, y: number) => minesweeper.openCell(x, y), [minesweeper]);
    const mark = useCallback((x: number, y: number) => minesweeper.markCell(x, y), [minesweeper]);


    return (
        <>
            <GameMenu />
            {
                gameState.field && gameState.field.length > 0 &&
                <MineField field={ gameState.field } open={ click } mark={ mark }/>
            }
        </>
    )
};
