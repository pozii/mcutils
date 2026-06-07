import { Player } from '@mcutils/core';
export declare function readPlayerData(worldDir: string, uuid: string): Promise<Player | null>;
export declare function readPlayerDataSync(worldDir: string, uuid: string): Player | null;
export declare function listPlayerDataFiles(worldDir: string): Promise<string[]>;
export declare function listPlayerDataFilesSync(worldDir: string): string[];
//# sourceMappingURL=playerdata.d.ts.map