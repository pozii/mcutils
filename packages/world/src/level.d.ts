import { NbtTagCompound } from './nbt/types.js';
import { WorldInfo } from '@mcutils/core';
export interface LevelData {
    data: NbtTagCompound;
    info: WorldInfo;
    raw: Record<string, unknown>;
}
export declare function readLevelDat(worldDir: string): Promise<LevelData>;
export declare function readLevelDatSync(worldDir: string): LevelData;
export declare function listWorlds(serverDir: string): Promise<string[]>;
export declare function listWorldsSync(serverDir: string): string[];
//# sourceMappingURL=level.d.ts.map