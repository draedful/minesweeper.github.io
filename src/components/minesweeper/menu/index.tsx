import React, { MouseEvent, useCallback } from "react";
import { Button } from "../../Button";
import './index.scss';

interface MenuProps {
    onSelect: (level: number) => void;
}

export const Menu = ({ onSelect }: MenuProps) => {
    const start = useCallback((e: MouseEvent<HTMLElement>) => {
        if (e.target) {
            // @ts-ignore TODO
            const dataset = e.target.dataset as { level: string };
            if (!isNaN(+dataset.level)) {
                onSelect(+dataset.level);
            }
        }
    }, [onSelect]);

    return (
        <div className="minesweeper-buttons" onClick={ start }>
            <Button className="minesweeper-buttons__item" data-level={ 1 }>Level 1</Button>
            <Button className="minesweeper-buttons__item" data-level={ 2 }>Level 2</Button>
            <Button className="minesweeper-buttons__item" data-level={ 3 }>Level 3</Button>
            <Button className="minesweeper-buttons__item" data-level={ 4 }>Level 4</Button>
        </div>
    )
};
