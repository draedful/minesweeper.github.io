import { Field, FieldCell } from "@minesweeper/game";
import { lookAround, predictFromState } from "@minesweeper/solver/yos";
import React, { memo, MouseEvent, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MineSweeperContext } from "../hooks";
import { Cell } from "./Cell";
import './index.scss';

function useMineField(): Field {
    const mineSweeper = useContext(MineSweeperContext);
    const [field, setField] = useState((mineSweeper && mineSweeper.field) || []);
    useEffect(() => {
        if (mineSweeper) {
            return mineSweeper.on("changeField", setField);
        }
    }, [mineSweeper]);

    return field;
}

type CellDataSet = { x: string, y: string };

const useMineSweeperActions = () => {
    const mineSweeper = useContext(MineSweeperContext);
    const getCell = useCallback((e: MouseEvent) => {
        if (mineSweeper) {
            // @ts-ignore
            const dataset = e.target.dataset as CellDataSet;
            const x = +dataset.x;
            const y = +dataset.y;
            if (!isNaN(x) || !isNaN(y)) {
                return mineSweeper.field[y][x];
            }
        }
    }, [mineSweeper]);
    const open = useCallback((e: MouseEvent<HTMLElement>) => {
        const cell = getCell(e);
        if (mineSweeper && cell) {
            if (e.metaKey) {
                const { mark, open, predict } = lookAround(mineSweeper.field, cell.x, cell.y);
                if (mark.length) {
                    mineSweeper.markCell(...mark);
                }
                if (open.length) {
                    mineSweeper.openCell(...open);
                } else if (predict && predict.size) {
                    debugger;
                    const cell = predict && predictFromState(predict);
                    if (cell) {
                        mineSweeper.openCell(cell);
                    }
                }
            } else {
                mineSweeper.openCell(cell);
            }
        }
    }, [mineSweeper, getCell]);
    const mark = useCallback((e: MouseEvent<HTMLElement>) => {
        const cell = getCell(e);
        if (mineSweeper && cell) {
            mineSweeper.markCell(cell);
        }
        e.preventDefault();
    }, [mineSweeper, getCell]);
    return useMemo(() => [open, mark], [open, mark])
};

const Row = memo(({ row }: { row: FieldCell[] }) => {
    return (
        <tr>
            {
                row.map((cell) => (<Cell key={ cell.id } cell={ cell }/>))
            }
        </tr>
    )
});
Row.displayName = 'Field Row';

const useMetaKeyDown = (): boolean => {
    const [state, setState] = useState(false);
    useEffect(() => {
        const onKeydown = (e: KeyboardEvent) => setState(e.metaKey);
        window.addEventListener('keydown', onKeydown);
        window.addEventListener('keyup', () => setState(false));
        return () => window.removeEventListener('keydown', onKeydown);
    }, []);
    return state;
};

const GameBody = memo(() => {
    const field = useMineField();
    return (
        <>
            {
                field.map((row: FieldCell[], index: number) => <Row row={ row } key={ index }/>)
            }
        </>
    )
})

export const GameField = () => {
    const [open, mark] = useMineSweeperActions();
    const isMetaActive = useMetaKeyDown();
    return (
        <table className={ `table ${ isMetaActive ? 'table-auto' : '' }` } onClick={ open } onContextMenu={ mark }>
            <tbody>
            <GameBody/>
            </tbody>
        </table>
    )
};
