import React from "react";
import { IGameField } from "../../App";
import { Cell } from "./cell";
import './index.css'

export const GameField = ({ cells, openCell }: { cells: IGameField, openCell: (x: number, y: number) => unknown }) => (
    <table className="game-field">
        <tbody>
        {
            cells.map((row, rowIndex) => {
                return (
                    <tr key={ rowIndex }>
                        {
                            row.map((cell, index) => (
                                <Cell openCell={ () => openCell(index, rowIndex) } key={ index } cell={ cell }/>
                            ))
                        }
                    </tr>
                )
            })
        }
        </tbody>
    </table>
);
