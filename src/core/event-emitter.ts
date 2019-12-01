export type EventHandler<Args extends any[]> = (...args: Args) => void;


export class EventEmitter<E extends Record<string, any>> {

    private handlers: Map<keyof E, Set<EventHandler<E[keyof E]>>> = new Map();

    public on<Event extends keyof E>(event: Event, fn: EventHandler<E[Event]>): () => void {
        const handlers = this.getHandlers<Event>(event) || new Set<EventHandler<E[Event]>>();
        handlers.add(fn);
        // @ts-ignore
        this.handlers.set(event, handlers);

        return () => {
            const handlers = this.getHandlers(event);
            if (handlers) {
                handlers.delete(fn);
            }
        }

    }

    protected emit<Event extends keyof E>(event: Event, ...args: E[Event]): void {
        const handlers = this.getHandlers(event);
        if (handlers) {
            handlers.forEach((fn: EventHandler<E[Event]>) => setTimeout(fn, 0, ...args));
        }
    }

    protected getHandlers<Event extends keyof E>(event: Event): Set<EventHandler<E[Event]>> | void {
        return this.handlers.get(event);
    }


}
