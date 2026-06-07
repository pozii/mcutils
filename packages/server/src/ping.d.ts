import { ServerInfo } from '@mcutils/core';
interface PingOptions {
    host: string;
    port?: number;
    timeout?: number;
    protocol?: number;
}
export declare function pingServer(options: PingOptions): Promise<ServerInfo>;
export { PingOptions };
export type { ServerInfo };
//# sourceMappingURL=ping.d.ts.map