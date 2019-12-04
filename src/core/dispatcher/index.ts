import { GameCommandDispatcher, GameCommandResp } from "../game.typing";
import { concat } from "../helpers/concat";
import { parseResp, readCommandResp } from "./helpers";
import { ErrorHandler, MessageHandler } from "./typing";

/**
 * Implement abstract server with WebSocket as way to send and get data
 * */
export class CommandServer implements GameCommandDispatcher {

    private stream: WebSocket;
    private actions: Map<keyof GameCommandResp, [MessageHandler, ErrorHandler][]> = new Map();
    private queue: string[] = [];
    private active: boolean = false;

    constructor(url: string) {
        this.stream = new WebSocket(url);
        this.stream.addEventListener('message', this.onMessage);
        this.stream.addEventListener("error", this.onError);
        this.stream.addEventListener("close", this.onError);
    }

    protected onError = (e: CloseEvent | Event) => {
        // TODO: fix tsconfig. to figure out hot to fix it, just remove this @ts-ignore
        // @ts-ignore
        Array.from(this.actions.values())
            .forEach((cbs) => {
                cbs.forEach(([_resolve, reject]) => reject(e))
            });
        this.actions.clear();
        this.queue.length = 0;
        this.active = false;
    };

    protected onMessage = (e: MessageEvent): void => {
        const resp = parseResp(e.data);
        if (resp) {
            const [command, body] = resp;
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

    /**
     * Do not send data. Just save a message an resolve action. and try to start by call method next
     * */
    public dispatch<Command extends keyof GameCommandResp>(command: Command, args?: string | number): Promise<GameCommandResp[Command]> {
        return new Promise((resolve, reject) => {
            this.queue.push(concat(command, args));
            const actions = this.actions.get(command) || [];
            // @ts-ignore TODO: fix typing
            actions.push([resolve as MessageHandler<Command>, reject]);
            this.actions.set(command, actions);
            this.next();
        });
    }

    protected send(command: string): void {
        if (this.stream.readyState === WebSocket.OPEN) {
            this.stream.send(command);
        }
    }

    protected next(): void {
        if (!this.active && this.queue.length) {
            this.send(this.queue.shift() as keyof GameCommandResp);
        } else {
            this.active = false;
        }
    }

}
