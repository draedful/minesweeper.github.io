import { GameCommandDispatcher, GameCommandResp } from "@minesweeper/game";
import { isDevMode } from "../../../helpers/is_dev_mode";
import { EventEmitter } from "../../helpers/event-emitter";
import { concat, getCommand, parseResp, readCommandResp } from "./helpers";
import { ErrorHandler, MessageHandler } from "./typing";

export enum CommandServerState {
    CONNECTED,
    CLOSED,
    CONNECTING
}


interface CommandServerEvents {
    change: [CommandServerState]
}

/**
 * Implement abstract server with WebSocket as way to send and get data
 * */
export class CommandServer extends EventEmitter<CommandServerEvents> implements GameCommandDispatcher {

    public state: CommandServerState = CommandServerState.CONNECTING;

    private stream: WebSocket | undefined;
    private actions: Map<keyof GameCommandResp, [MessageHandler, ErrorHandler][]> = new Map();
    private queue: string[] = [];
    private busy: boolean = false;

    constructor(url: string) {
        super();
        this.stream = new WebSocket(url);
        this.stream.addEventListener("open", this.onOpen);
        this.stream.addEventListener('message', this.onMessage);
        this.stream.addEventListener("error", this.onError);
        this.stream.addEventListener("close", this.onClose);
    }

    public close(): void {
        if (this.stream && this.state !== CommandServerState.CLOSED) {
            this.stream.close();
            this.stream.removeEventListener("open", this.onOpen);
            this.stream.removeEventListener('message', this.onMessage);
            this.stream.removeEventListener("error", this.onError);
            this.stream.removeEventListener("close", this.onClose);
        }
    }

    public dispatch<Command extends keyof GameCommandResp>(command: Command, args?: string | number): Promise<GameCommandResp[Command]> {
        return new Promise((resolve, reject) => {
            this.queue.push(concat(command, args));
            const actions = this.actions.get(command) || [];
            actions.push([resolve as MessageHandler, reject]);
            this.actions.set(command, actions);
            this.next();
        });
    }

    protected setState(state: CommandServerState): void {
        if (this.state !== state) {
            this.state = state;
            this.emit("change", this.state);
        }
    }

    protected onOpen = (): void => {
        this.setState(CommandServerState.CONNECTED);
    };

    protected onError = (e: Event) => this.clearQueueWithError(e);

    protected onClose = (e: CloseEvent) => {
        this.clearQueueWithError(e);
        this.setState(CommandServerState.CLOSED);
    };

    protected onMessage = (e: MessageEvent): void => {
        const resp = parseResp(e.data);
        if (resp) {
            const [command, body] = resp;
            measure(command, "end");
            const actions = this.actions.get(command);
            if (actions && actions.length) {
                const action = actions.shift();
                if (action) {
                    const resp = readCommandResp(command, (body as string).trim());
                    action[0](resp);
                }
            }
        }
        this.next();
    };

    public send(command: string): void {
        if (this.stream && this.stream.readyState === WebSocket.OPEN) {
            const name = getCommand(command);
            measure(name, "start");
            return this.stream.send(command);
        }
    }

    protected clearQueueWithError(e: Event | CloseEvent): void {
        Array.from(this.actions.values())
            .forEach((cbs) => {
                cbs.forEach(([_resolve, reject]) => reject(e))
            });
        this.queue.length = 0;
        this.actions.clear();
        this.busy = false;
    }

    protected next(): void {
        if (!this.busy && this.queue.length) {
            const msg = this.queue.shift() as string;
            this.send(msg as keyof GameCommandResp);
        } else {
            this.busy = false;
        }
    }

}


function measure(name: string, dir?: 'start' | 'end'): void {
    if (isDevMode()) {
        if (dir) {
            performance.mark(`${ name }_${ dir }`);
        }
        if (!dir || dir === 'end') {
            performance.measure(name, `${ name }_start`, `${ name }_end`);
        }
    }
}
