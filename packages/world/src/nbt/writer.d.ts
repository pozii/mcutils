import { NbtTagCompound, NbtFile } from './types.js';
export declare class NbtWriter {
    private capacity;
    private buffer;
    private offset;
    constructor(capacity?: number);
    writeFile(file: NbtFile, rootName?: string): Buffer;
    writeCompoundTag(compound: NbtTagCompound, name: string): void;
    private writeTag;
    private writeCompoundContents;
    private writeByte;
    private writeShort;
    private writeInt;
    private writeLong;
    private writeFloat;
    private writeDouble;
    private writeByteArray;
    private writeString;
    private writeListTag;
    private writeIntArray;
    private writeLongArray;
    private ensure;
    private slice;
}
//# sourceMappingURL=writer.d.ts.map