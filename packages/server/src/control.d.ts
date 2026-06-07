import { EventEmitter } from 'node:events';
export interface ServerControlOptions {
    jarPath: string;
    serverDir: string;
    javaPath?: string;
    minRam?: string;
    maxRam?: string;
    javaArgs?: string[];
    autoRestart?: boolean;
}
export declare class ServerController extends EventEmitter {
    private process;
    private options;
    private running;
    private restartCount;
    private buffer;
    constructor(options: ServerControlOptions);
    start(): Promise<void>;
    stop(timeout?: number): Promise<void>;
    restart(timeout?: number): Promise<void>;
    sendCommand(command: string): void;
    get isRunning(): boolean;
    get log(): string;
    private ensureEula;
    static findServerJar(dir: string): Promise<string | null>;
}
export declare function startServer(options: ServerControlOptions): Promise<ServerController>;
//# sourceMappingURL=control.d.ts.map