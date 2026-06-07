export interface QueryResult {
    motd: string;
    gameType: string;
    gameId: string;
    version: string;
    plugins: string;
    map: string;
    numPlayers: number;
    maxPlayers: number;
    hostPort: number;
    hostIp: string;
    players: string[];
    raw: Record<string, string>;
}
export declare function queryServer(host: string, port?: number, timeout?: number, full?: boolean): Promise<QueryResult>;
//# sourceMappingURL=query.d.ts.map