import { FieldCell } from "@minesweeper/game";
import React, { memo } from "react";
import { Cell } from "./Cell";

export const TableRow = memo(({ row }: { row: FieldCell[] }) => {
    return (
        <tr>
            {
                row.map((cell) => (<Cell key={ cell.id } cell={ cell }/>))
            }
        </tr>
    )
});
TableRow.displayName = 'Field Row';
