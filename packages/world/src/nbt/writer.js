import * as zlib from 'node:zlib';
import { NBT_TAG_END, NBT_TAG_BYTE, NBT_TAG_SHORT, NBT_TAG_INT, NBT_TAG_LONG, NBT_TAG_FLOAT, NBT_TAG_DOUBLE, NBT_TAG_BYTE_ARRAY, NBT_TAG_STRING, NBT_TAG_LIST, NBT_TAG_COMPOUND, NBT_TAG_INT_ARRAY, NBT_TAG_LONG_ARRAY, } from './types.js';
export class NbtWriter {
    capacity;
    buffer;
    offset = 0;
    constructor(capacity = 8192) {
        this.capacity = capacity;
        this.buffer = Buffer.alloc(capacity);
    }
    writeFile(file, rootName = '') {
        this.offset = 0;
        this.writeCompoundTag(file.root, rootName);
        const raw = this.slice();
        switch (file.compression) {
            case 'gzip': return zlib.gzipSync(raw);
            case 'zlib': return zlib.deflateSync(raw);
            default: return raw;
        }
    }
    writeCompoundTag(compound, name) {
        this.writeByte(NBT_TAG_COMPOUND);
        this.writeString(name);
        for (const [key, tag] of compound.value) {
            this.writeTag(tag, key);
        }
        this.writeByte(NBT_TAG_END);
    }
    writeTag(tag, name) {
        this.writeByte(tag.type);
        this.writeString(name);
        switch (tag.type) {
            case NBT_TAG_BYTE:
                this.writeByte(tag.value);
                break;
            case NBT_TAG_SHORT:
                this.writeShort(tag.value);
                break;
            case NBT_TAG_INT:
                this.writeInt(tag.value);
                break;
            case NBT_TAG_LONG:
                this.writeLong(tag.value);
                break;
            case NBT_TAG_FLOAT:
                this.writeFloat(tag.value);
                break;
            case NBT_TAG_DOUBLE:
                this.writeDouble(tag.value);
                break;
            case NBT_TAG_BYTE_ARRAY:
                this.writeByteArray(tag.value);
                break;
            case NBT_TAG_STRING:
                this.writeString(tag.value);
                break;
            case NBT_TAG_LIST:
                this.writeListTag(tag);
                break;
            case NBT_TAG_COMPOUND:
                this.writeCompoundContents(tag);
                break;
            case NBT_TAG_INT_ARRAY:
                this.writeIntArray(tag.value);
                break;
            case NBT_TAG_LONG_ARRAY:
                this.writeLongArray(tag.value);
                break;
        }
    }
    writeCompoundContents(compound) {
        for (const [key, tag] of compound.value) {
            this.writeTag(tag, key);
        }
        this.writeByte(NBT_TAG_END);
    }
    writeByte(value) {
        this.ensure(1);
        this.buffer[this.offset++] = value & 0xFF;
    }
    writeShort(value) {
        this.ensure(2);
        this.buffer.writeInt16BE(value, this.offset);
        this.offset += 2;
    }
    writeInt(value) {
        this.ensure(4);
        this.buffer.writeInt32BE(value, this.offset);
        this.offset += 4;
    }
    writeLong(value) {
        this.ensure(8);
        this.buffer.writeBigInt64BE(value, this.offset);
        this.offset += 8;
    }
    writeFloat(value) {
        this.ensure(4);
        this.buffer.writeFloatBE(value, this.offset);
        this.offset += 4;
    }
    writeDouble(value) {
        this.ensure(8);
        this.buffer.writeDoubleBE(value, this.offset);
        this.offset += 8;
    }
    writeByteArray(value) {
        this.writeInt(value.length);
        this.ensure(value.length);
        for (let i = 0; i < value.length; i++) {
            this.buffer[this.offset++] = value[i] & 0xFF;
        }
    }
    writeString(value) {
        const encoded = Buffer.from(value, 'utf8');
        this.writeShort(encoded.length);
        this.ensure(encoded.length);
        encoded.copy(this.buffer, this.offset);
        this.offset += encoded.length;
    }
    writeListTag(list) {
        this.writeByte(list.elementType);
        this.writeInt(list.value.length);
        for (const tag of list.value) {
            switch (list.elementType) {
                case NBT_TAG_BYTE:
                    this.writeByte(tag.value);
                    break;
                case NBT_TAG_SHORT:
                    this.writeShort(tag.value);
                    break;
                case NBT_TAG_INT:
                    this.writeInt(tag.value);
                    break;
                case NBT_TAG_LONG:
                    this.writeLong(tag.value);
                    break;
                case NBT_TAG_FLOAT:
                    this.writeFloat(tag.value);
                    break;
                case NBT_TAG_DOUBLE:
                    this.writeDouble(tag.value);
                    break;
                case NBT_TAG_BYTE_ARRAY:
                    this.writeByteArray(tag.value);
                    break;
                case NBT_TAG_STRING:
                    this.writeString(tag.value);
                    break;
                case NBT_TAG_LIST:
                    this.writeListTag(tag);
                    break;
                case NBT_TAG_COMPOUND:
                    this.writeCompoundContents(tag);
                    break;
                case NBT_TAG_INT_ARRAY:
                    this.writeIntArray(tag.value);
                    break;
                case NBT_TAG_LONG_ARRAY:
                    this.writeLongArray(tag.value);
                    break;
            }
        }
    }
    writeIntArray(value) {
        this.writeInt(value.length);
        this.ensure(value.length * 4);
        for (let i = 0; i < value.length; i++) {
            this.buffer.writeInt32BE(value[i], this.offset);
            this.offset += 4;
        }
    }
    writeLongArray(value) {
        this.writeInt(value.length);
        this.ensure(value.length * 8);
        for (let i = 0; i < value.length; i++) {
            this.buffer.writeBigInt64BE(value[i], this.offset);
            this.offset += 8;
        }
    }
    ensure(bytes) {
        while (this.offset + bytes > this.buffer.length) {
            const newBuffer = Buffer.alloc(this.buffer.length * 2);
            this.buffer.copy(newBuffer);
            this.buffer = newBuffer;
        }
    }
    slice() {
        return this.buffer.slice(0, this.offset);
    }
}
//# sourceMappingURL=writer.js.map