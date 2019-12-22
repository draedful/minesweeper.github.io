import { EventEmitter } from "../helpers/event-emitter";

export type StorageChangeDataArgument<T> = {
    [K in keyof T]: [T[K] | undefined]
}

type StorageEvents<T> = {
    change: ['']
} & StorageChangeDataArgument<T>;

type Optional<T> = {
    [K in keyof T]?: Required<T>[K];
}

export class PersistentStorage<T> extends EventEmitter<StorageEvents<Required<T>>> {

    public get data(): Optional<T> {
        return this._data;
    }

    protected _data: Optional<T> = {};

    constructor(initial?: Optional<T>) {
        super();
        if (initial) {
            this._data = initial;
        }
    }

    public get<K extends keyof T>(key: K): T[K] | void {
        return this._data[key] || void 0;
    }

    public set<K extends keyof T>(key: K, value: Required<T>[K]): void {
        this._data = { ...this._data, [key]: value };
        // @ts-ignore
        this.emit(key, value);
    }

    public reset(): void {
        const prev = this.data;
        this._data = {};
        // @ts-ignore
        Object.keys(prev).forEach(key => this.emit(key as keyof T, undefined));
    }
}
