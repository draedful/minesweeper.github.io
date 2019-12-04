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
}

export enum NotificationType {
    Error,
    Success,
}

export enum NotificationSubtype {
    Lose,
    Win,
    Error
}

export interface NotificationRequestTypes {
    new_game: number | null,
    restart: boolean,
}

export interface Notifier {
    notify(type: NotificationType, subType: NotificationSubtype): void;

    request<Type extends keyof NotificationRequestTypes>(type: Type): Promise<NotificationRequestTypes[Type]>;
}


