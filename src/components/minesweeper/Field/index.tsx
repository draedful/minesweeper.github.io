import { Field, FieldCell } from "@minesweeper/game";
import React, { memo, useMemo } from "react";
import { useMetaKeyDown } from "../../hooks";
import { useMinesweeperField } from "../hooks";
import { useMineSweeperTableActions } from "./hooks";
import './index.scss';
import { TableRow } from "./Row";


const GameBody = memo(({ field }: { field: Field }) => {
    return (
        <>
            {
                field.map((row: FieldCell[], index: number) => <TableRow row={ row } key={ index }/>)
            }
        </>
    )
});

export const GameField = () => {
    const field = useMinesweeperField();
    const [open, mark] = useMineSweeperTableActions();
    const isMetaActive = useMetaKeyDown();
    const classNames = useMemo(() => `table ${ isMetaActive ? 'table-auto' : '' }`, [isMetaActive]);
    return (
        <table className={ classNames } onClick={ open } onContextMenu={ mark }>
            <tbody>
            <GameBody field={ field }/>
            </tbody>
        </table>
    )
};
