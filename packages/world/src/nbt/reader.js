import * as zlib from 'node:zlib';
import * as fsPromises from 'node:fs/promises';
import * as fs from 'node:fs';
import { NbtFormatError } from '@mcutils/core';
const TAG_TYPE_NAMES = {
    0: 'TAG_End', 1: 'TAG_Byte', 2: 'TAG_Short', 3: 'TAG_Int',
    4: 'TAG_Long', 5: 'TAG_Float', 6: 'TAG_Double', 7: 'TAG_Byte_Array',
    8: 'TAG_String', 9: 'TAG_List', 10: 'TAG_Compound', 11: 'TAG_Int_Array',
    12: 'TAG_Long_Array',
};
export class NbtReader {
    buffer;
    offset = 0;
    constructor(data) {
        this.buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    }
    static async fromFile(filePath) {
        const data = await fsPromises.readFile(filePath);
        return new NbtReader(data);
    }
    static fromFileSync(filePath) {
        const data = fs.readFileSync(filePath);
        return new NbtReader(data);
    }
    readFile() {
        const compression = this.detectCompression();
        let data;
        switch (compression) {
            case 'gzip':
                data = zlib.gunzipSync(this.buffer);
                break;
            case 'zlib':
                data = zlib.inflateSync(this.buffer);
                break;
            default: data = this.buffer;
        }
        this.buffer = data;
        this.offset = 0;
        const type = this.readByte();
        if (type !== 10)
            throw new NbtFormatError(`Root tag must be TAG_Compound, got ${TAG_TYPE_NAMES[type] ?? type}`);
        const _rootName = this.readString();
        const root = this.readCompound();
        return { root, compression };
    }
    detectCompression() {
        if (this.buffer.length < 2)
            return 'none';
        if (this.buffer[0] === 0x1f && this.buffer[1] === 0x8b)
            return 'gzip';
        if (this.buffer[0] === 0x78 && (this.buffer[1] === 0x01 || this.buffer[1] === 0x9c || this.buffer[1] === 0xda))
            return 'zlib';
        return 'none';
    }
    readTag(type) {
        switch (type) {
            case 0: return { type: 0 };
            case 1: return { type: 1, value: this.readByte() };
            case 2: return { type: 2, value: this.readShort() };
            case 3: return { type: 3, value: this.readInt() };
            case 4: return { type: 4, value: this.readLong() };
            case 5: return { type: 5, value: this.readFloat() };
            case 6: return { type: 6, value: this.readDouble() };
            case 7: return { type: 7, value: this.readByteArray() };
            case 8: return { type: 8, value: this.readString() };
            case 9: return this.readListTag();
            case 10: return this.readCompound();
            case 11: return { type: 11, value: this.readIntArray() };
            case 12: return { type: 12, value: this.readLongArray() };
            default: throw new NbtFormatError(`Unknown tag type: ${type}`, this.offset);
        }
    }
    readByte() {
        this.ensure(1);
        return this.buffer.readInt8(this.offset++);
    }
    readShort() {
        this.ensure(2);
        const val = this.buffer.readInt16BE(this.offset);
        this.offset += 2;
        return val;
    }
    readInt() {
        this.ensure(4);
        const val = this.buffer.readInt32BE(this.offset);
        this.offset += 4;
        return val;
    }
    readLong() {
        this.ensure(8);
        const val = this.buffer.readBigInt64BE(this.offset);
        this.offset += 8;
        return val;
    }
    readFloat() {
        this.ensure(4);
        const val = this.buffer.readFloatBE(this.offset);
        this.offset += 4;
        return val;
    }
    readDouble() {
        this.ensure(8);
        const val = this.buffer.readDoubleBE(this.offset);
        this.offset += 8;
        return val;
    }
    readByteArray() {
        const len = this.readInt();
        this.ensure(len);
        const arr = new Array(len);
        for (let i = 0; i < len; i++)
            arr[i] = this.buffer.readInt8(this.offset++);
        return arr;
    }
    readString() {
        const len = this.readShort();
        if (len < 0)
            throw new NbtFormatError('Negative string length', this.offset);
        this.ensure(len);
        const val = this.buffer.toString('utf8', this.offset, this.offset + len);
        this.offset += len;
        return val;
    }
    readListTag() {
        const elementType = this.readByte();
        const length = this.readInt();
        const value = new Array(length);
        for (let i = 0; i < length; i++)
            value[i] = this.readTag(elementType);
        return { type: 9, elementType, value };
    }
    readCompound() {
        const value = new Map();
        while (true) {
            const tagType = this.readByte();
            if (tagType === 0)
                break;
            if (!(tagType in TAG_TYPE_NAMES))
                throw new NbtFormatError(`Unknown tag type: ${tagType}`, this.offset - 1);
            const name = this.readString();
            const tag = this.readTag(tagType);
            value.set(name, tag);
        }
        return { type: 10, value };
    }
    readIntArray() {
        const len = this.readInt();
        this.ensure(len * 4);
        const arr = new Array(len);
        for (let i = 0; i < len; i++) {
            arr[i] = this.buffer.readInt32BE(this.offset);
            this.offset += 4;
        }
        return arr;
    }
    readLongArray() {
        const len = this.readInt();
        this.ensure(len * 8);
        const arr = new Array(len);
        for (let i = 0; i < len; i++) {
            arr[i] = this.buffer.readBigInt64BE(this.offset);
            this.offset += 8;
        }
        return arr;
    }
    ensure(bytes) {
        if (this.offset + bytes > this.buffer.length) {
            throw new NbtFormatError(`Unexpected end of data: needed ${bytes} bytes at offset ${this.offset}, but only ${this.buffer.length - this.offset} bytes remaining`, this.offset);
        }
    }
    getOffset() { return this.offset; }
}
//# sourceMappingURL=reader.js.map