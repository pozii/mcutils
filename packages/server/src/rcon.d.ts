import { RconConnectionOptions } from '@mcutils/core';
export declare class RconClient {
    private options;
    private socket;
    private authenticated;
    private requestId;
    private pending;
    private buffer;
    private timeout;
    constructor(options: RconConnectionOptions);
    connect(): Promise<void>;
    sendCommand(command: string): Promise<string>;
    exec(command: string): Promise<string>;
    run(commands: string[]): Promise<string[]>;
    close(): void;
    get isAuthenticated(): boolean;
    get isConnected(): boolean;
    private authenticate;
    private sendPacket;
    private createPacket;
    private handleData;
}
export declare function rconCommand(options: RconConnectionOptions, command: string): Promise<string>;
export declare function rconCommands(options: RconConnectionOptions, commands: string[]): Promise<string[]>;
//# sourceMappingURL=rcon.d.ts.map