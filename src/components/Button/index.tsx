import React from "react";
import './index.scss';

export const Button = (props: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => (
    <button { ...props } className={ `minesweeper-button ${ props.className }` }/>
);
