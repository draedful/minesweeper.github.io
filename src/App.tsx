import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import { GameField } from "./Game/GameField";

function concat<T>(...args: T[]): string {
    return args.filter(Boolean).join(' ');
}

export enum GameFieldCellType {
    Marked = 'marked',
    Empty = 'empty'
}

export type IGameField = (number | GameFieldCellType)[][];
export type OpenCellFn = (x: number, y: number) => Promise<void>;
export type NewGameFn = () => Promise<void>;

export enum GameState {
    INIT,
    LOADING,
    ACTIVE,
    LOSE,
}

type Dispatch = (command: 'new' | 'map' | 'open', args?: string) => Promise<string>;

function useMap(dispatch: Dispatch): [IGameField, GameState, OpenCellFn, NewGameFn] {
    const [state, setState] = useState(GameState.INIT);
    const [gameField, setGameField] = useState<IGameField>([]);

    const getMap = useCallback(async () => {
        const map = await dispatch("map");
        const field = map.split('\n')
            .filter((items) => items.length > 1) // TODO: detect a newline I'm lazy
            .reduce((acc: IGameField, row: string) => {
                acc.push(row.split('').map((val) => {
                    if (!isNaN(+val)) {
                        return +val;
                    }
                    return GameFieldCellType.Empty;
                }));
                return acc;
            }, [] as IGameField);
        setGameField(field);
    }, [dispatch]);

    const openCell = useCallback(async (x: number, y: number) => {
        try {
            const resp = await dispatch("open", `${ x } ${ y }`);
            if (resp === 'OK') {
                await getMap();
            } else if (resp === 'You lose') {
                const startNewGame = window.confirm('Yu lose, start a new game?');
                if (startNewGame) {
                    newGame();
                }
            }
        } catch (e) {
            setState(GameState.INIT);
            console.error(e);
        }
    }, [dispatch, getMap]);


    const newGame = useCallback(async () => {
        try {
            let level: number;
            while (true) {
                const res = prompt("Choose a level 1,2,3,4");
                if (res) {
                    const levelNUmber = +res;
                    if (levelNUmber && levelNUmber > 0 && levelNUmber <= 4) {
                        // @ts-ignore
                        level = levelNUmber;
                        break;
                    }
                }
            }
            const resp = await dispatch("new", `${ level }`);
            if (resp === 'OK') {
                await getMap();
            }
        } catch (e) {
            setState(GameState.INIT);
            console.error(e);
        }
    }, [dispatch, getMap]);

    useEffect(() => {
        if (state === GameState.INIT) {
            newGame()
        }
    }, [state]);

    return [gameField, state, openCell, newGame];
}

function useWS(url: string): Dispatch {
    const [ws, setWs] = useState<WebSocket | null>(null);

    useEffect(() => {
        setWs(new WebSocket(url));
        return () => {
            ws && ws.close();
        }
    }, [url]);

    return useCallback((command: 'new' | 'map' | 'open', args?: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (ws) {
                ws.send(concat(command, args));
                const respRegExp = new RegExp(`^(${ command }):[\\s\\n]?((.*|\\n)+)`, 'gm');
                const onMessage = (e: MessageEvent) => {
                    const data = e.data as string;
                    const respMatch = respRegExp.exec(data);
                    console.log(data, respMatch);
                    if (respMatch) {
                        const [_initial, respCommand, body] = respMatch;
                        if (respCommand === command) {
                            resolve(body);
                        }
                        removeListeners();
                    }
                };

                const onError = (e: Event | CloseEvent) => {
                    reject(e);
                    removeListeners();
                };

                const removeListeners = () => {
                    ws.removeEventListener("message", onMessage);
                    ws.removeEventListener("error", onError);
                    ws.removeEventListener("close", onError);
                };
                ws.addEventListener("message", onMessage);
                ws.addEventListener("error", onError, { once: true });
                ws.addEventListener("close", onError, { once: true });
            } else {
                reject()
            }
        })
    }, [ws]);
}

const App: React.FC = () => {
    const dispatch = useWS('wss://hometask.eg1236.com/game1/');
    const [field, state, openCell, newGame] = useMap(dispatch);
    return (
        <div className="App">
            Field { field && <GameField cells={ field } openCell={ openCell }/> }
            state { state }
            <button onClick={ () => newGame() }>NewGame</button>
        </div>
    );
}

export default App;
