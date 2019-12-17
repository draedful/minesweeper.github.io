type Cell = string;
export type Row = Cell[];
export type RawGameField = Row[];


export enum GameCommandOpenRespStatus {
    OK,
    WIN,
    LOSE
}

export enum GameCommandNewRespStatus {
    OK,
    Err,
}

export interface GameCommandOpenResp {
    status: GameCommandOpenRespStatus,
    message?: string;
}

export interface GameCommandResp {
    new: GameCommandNewRespStatus;
    open: GameCommandOpenResp;
    map: RawGameField;
}

export interface GameCommandDispatcher {
    dispatch<Command extends keyof GameCommandResp>(command: Command, args?: string | number): Promise<GameCommandResp[Command]>;

    send(msg: string): void;
}


