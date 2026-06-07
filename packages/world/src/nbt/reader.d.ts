import { NbtFile } from './types.js';
export declare class NbtReader {
    private buffer;
    private offset;
    constructor(data: Buffer | Uint8Array);
    static fromFile(filePath: string): Promise<NbtReader>;
    static fromFileSync(filePath: string): NbtReader;
    readFile(): NbtFile;
    private detectCompression;
    readTag(type: number): any;
    private readByte;
    private readShort;
    private readInt;
    private readLong;
    private readFloat;
    private readDouble;
    private readByteArray;
    private readString;
    private readListTag;
    readCompound(): {
        type: 10;
        value: Map<string, any>;
    };
    private readIntArray;
    private readLongArray;
    private ensure;
    getOffset(): number;
}
//# sourceMappingURL=reader.d.ts.map