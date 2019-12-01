import { GameCommandDispatcher, GameCommandResp, Row } from "./game.typing";
import { concat } from "./helpers/concat";

const getCommandPattern = (command: string): RegExp => new RegExp(`^(${ command }):[\\s\\n]?((.*|\\n)+)`, 'm');

/*
* Implement GameCommandDispatcher interface on class, closer to game's Business Logic
* */
export class GameServer implements GameCommandDispatcher {

    private webSocket: WebSocket;

    // TODO: add reconnect on closing connection not by user
    // TODO: add connect method
    // TODO: add disconnect method
    // TODO: add stack to store messages to send if connection is not ready
    constructor(
        private readonly url: string
    ) {
        this.webSocket = new WebSocket(url);
    }

    dispatch<Command extends keyof GameCommandResp>(command: Command, args?: string): Promise<GameCommandResp[Command]> {
        if (this.isOpen()) {
            return new Promise((resolve, reject) => {
                this.webSocket.send(concat(command, args));
                const onMessage = (e: MessageEvent) => {
                    const msgPattern = getCommandPattern(command);
                    const respMatch = msgPattern.exec(e.data);
                    if (respMatch) {
                        const respCommand = respMatch[1];
                        if (respCommand && respCommand === command) {
                            // TODO: check is body presented
                            resolve(this.readCommandResp(command, respMatch[2]));
                            removeListeners();
                        }
                    }
                };

                const onError = (e: Event | CloseEvent) => {
                    reject(e);
                    removeListeners();
                };
                const removeListeners = () => {
                    this.webSocket.removeEventListener("message", onMessage);
                    this.webSocket.removeEventListener("error", onError);
                    this.webSocket.removeEventListener("close", onError);
                };
                this.webSocket.addEventListener("message", onMessage);
                this.webSocket.addEventListener("error", onError, { once: true });
                this.webSocket.addEventListener("close", onError, { once: true });
            })
        }
        return Promise.reject(new Error('Connection is not established'))
    }

    public isOpen(): boolean {
        return this.webSocket.readyState === WebSocket.OPEN;
    }

    public send(message: string): void {
        this.webSocket.send(message);
    }

    private readCommandResp<Command extends keyof GameCommandResp>(command: Command, data: string): GameCommandResp[Command] {
        switch (command) {
            case "map":
                return data
                    .split('\n')
                    .reduce((acc: Row[], row: string) => {
                        acc.push(row.split('') as Row);
                        return acc;
                    }, []) as GameCommandResp[Command]

        }
        return data as GameCommandResp[Command];

    }
}



