import React from "react";
import { GameFieldCellType } from "../../App";

export const Cell = ({ cell, openCell }: { cell: (number | GameFieldCellType), openCell: () => unknown }) => {
    return (
        <td className={ `game-field__cell ${ cell === undefined ? 'mod-empty' : '' }` }
            onClick={ () => openCell() }>
            { cell || '' }
        </td>
    )
}
