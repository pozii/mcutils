import { ChunkInfo } from '@mcutils/core';
export interface RegionLocation {
    offset: number;
    size: number;
}
export interface RegionTimestamp {
    timestamp: number;
}
export declare class RegionFile {
    private locations;
    private timestamps;
    private filePath;
    private fd?;
    constructor(filePath: string);
    static open(filePath: string): Promise<RegionFile>;
    static openSync(filePath: string): RegionFile;
    private load;
    private loadSync;
    private parseHeader;
    readChunk(chunkX: number, chunkZ: number): Promise<ChunkInfo | null>;
    readChunkSync(chunkX: number, chunkZ: number): ChunkInfo | null;
    private parseChunkData;
    private parseChunkBuffer;
    private parseChunkNbt;
    private parseSection;
    private parseBlockEntity;
    private parseEntity;
    private parsePosition;
    private parseRotation;
    getLocation(chunkX: number, chunkZ: number): RegionLocation;
    getTimestamp(chunkX: number, chunkZ: number): number;
    close(): Promise<void>;
}
export declare function listRegionFiles(worldDir: string, dimension?: string): Promise<string[]>;
export declare function listRegionFilesSync(worldDir: string, dimension?: string): string[];
export declare function parseRegionFileName(fileName: string): {
    x: number;
    z: number;
} | null;
//# sourceMappingURL=reader.d.ts.map