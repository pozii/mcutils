import { EventEmitter } from 'node:events';
export declare class LogWatcher extends EventEmitter {
    private rl;
    private parser;
    private watching;
    private filePath;
    watch(filePath: string, options?: {
        tail?: boolean;
    }): Promise<void>;
    stop(): void;
}
//# sourceMappingURL=watcher.d.ts.map