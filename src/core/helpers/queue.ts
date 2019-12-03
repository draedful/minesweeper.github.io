interface QueueItem {
    action(): Promise<any>;

    resolve: (data: any) => void;
    reject: (reject: any) => void;
}

export class PromiseQueue {
    private queue: QueueItem[] = [];
    private active: boolean = false;

    public add<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({
                action: fn,
                reject,
                resolve,
            });
            this.next();
        })
    }

    private next(): void {
        if (!this.active) {
            const item = this.queue.shift();
            if (item) {
                this.active = true;
                item.action().then(
                    (data) => {
                        this.active = false;
                        item.resolve(data);
                        this.next()
                    },
                    (error) => {
                        this.active = false;
                        item.reject(error);
                        this.next();
                    }
                )
            }
        }
    }
}
