import { GameCommandResp } from "@minesweeper/game";


export type MessageHandler<E extends keyof GameCommandResp = keyof GameCommandResp> = (e: GameCommandResp[E]) => void;
export type ErrorHandler = (e: CloseEvent | Event) => void;

