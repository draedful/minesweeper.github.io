import {
    GameCommandNewRespStatus,
    GameCommandOpenResp,
    GameCommandOpenRespStatus,
    GameCommandResp,
    Row
} from "../game/dispatcher.typing";

type RegExpRepGroup = Record<'command' | 'body', string>;

const WinRegExp = /^You win\. The password for this level is: (.*)/;
const SuccessResp = 'OK';
const LoseResp = "You lose";

export function parseResp<E extends keyof GameCommandResp>(data: string): [E, string] | void {
    const match = /^(?<command>\w+):[\s\n]?(?<body>(.*|\n+)+)$/.exec(data);
    if (match) {
        const group = match.groups as RegExpRepGroup;
        const command = group.command as E;
        const body = group.body;
        return [command, body];
    }
}

export function readCommandResp<Command extends keyof GameCommandResp>(command: Command, data: string): GameCommandResp[Command] {
    switch (command) {
        case "map":
            return data
                .split('\n')
                .reduce((acc: Row[], row: string) => {
                    if (row.length > 1) {
                        acc.push(row.split('') as Row);
                    }
                    return acc;
                }, []) as GameCommandResp[Command];
        case "new":
            if (data === SuccessResp) {
                return GameCommandNewRespStatus.OK as GameCommandResp[Command];
            }
            return GameCommandNewRespStatus.Err as GameCommandResp[Command];
        case "open":
            switch (data) {
                case SuccessResp:
                    return {
                        status: GameCommandOpenRespStatus.OK,
                    } as GameCommandOpenResp as GameCommandResp[Command];
                case LoseResp:
                    return {
                        status: GameCommandOpenRespStatus.LOSE,
                    } as GameCommandOpenResp as GameCommandResp[Command];
            }
            const match = data.match(WinRegExp);
            if (match) {
                return {
                    status: GameCommandOpenRespStatus.WIN,
                    message: match[1]
                } as GameCommandOpenResp as GameCommandResp[Command];
            }

    }
    throw new Error("Unknown response " + data);
}

const DIVIDER = ' ';
export const concat = <T extends { toString(): string } | undefined | null>(...args: T[]): string => {
    return args
        .filter(Boolean)
        .join(DIVIDER);
};


export const getCommand = (data: string): string => {
    return data.split(DIVIDER)[0];
}
