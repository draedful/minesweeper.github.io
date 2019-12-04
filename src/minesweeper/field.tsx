import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { VariableSizeGrid } from "react-window";
import { Field, GameStateEnum } from "../core/minesweeper.typing";
import { Cell } from "./Cell";
import { MineSweeperContext } from "./context";

function useMineSweeper(): [Field, GameStateEnum, boolean] {
    const mineSweeper = useContext(MineSweeperContext);
    const [field, setField] = useState(mineSweeper && mineSweeper.field || []);
    const [loading, setLoading] = useState(mineSweeper && mineSweeper.loading || false);
    const [state, setState] = useState(mineSweeper && mineSweeper.state || GameStateEnum.Init);

    useEffect(() => {
        if (mineSweeper) {
            let timer: any;
            const onChangeField = mineSweeper.on("changeField", (field) => {
                if (!timer) {
                    timer = setTimeout(() => {
                        setField(field);
                        timer = null;
                    })
                }
            });
            // const onChangeLoading = mineSweeper.on("loading", (loading) => {
            //     if (!timer) {
            //         timer = setTimeout(() => {
            //             setLoading(loading);
            //             timer = null;
            //         })
            //     }
            // });
            // const onChangeState = mineSweeper.on("changeState", (state) => {
            //     if (!timer) {
            //         timer = setTimeout(() => {
            //             setState(state);
            //             timer = null;
            //         })
            //     }
            // });
            return () => {
                onChangeField();
                // onChangeLoading();
                // onChangeState();
            }
        }

    }, [mineSweeper]);

    return [field, state, loading];
}


export const GameField = () => {
    const [field, _state, loading] = useMineSweeper();
    const rowCount = field.length;
    const cellsCount = rowCount ? field[0].length : 0;
    const getSize = useCallback(() => 20, []);
    const height = useMemo(() => Math.min(rowCount * 20, 600), [rowCount]);
    const width = useMemo(() => Math.min(cellsCount * 20, 400), [cellsCount]);
    return (
        <VariableSizeGrid
            rowHeight={ getSize }
            columnWidth={ getSize }
            rowCount={ rowCount }
            itemData={ field }
            columnCount={ cellsCount }
            height={ height }
            width={ width }
        >
            { Cell }
        </VariableSizeGrid>
    )
};
