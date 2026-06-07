import * as zlib from 'node:zlib'
import {
  NBT_TAG_END, NBT_TAG_BYTE, NBT_TAG_SHORT, NBT_TAG_INT, NBT_TAG_LONG,
  NBT_TAG_FLOAT, NBT_TAG_DOUBLE, NBT_TAG_BYTE_ARRAY, NBT_TAG_STRING,
  NBT_TAG_LIST, NBT_TAG_COMPOUND, NBT_TAG_INT_ARRAY, NBT_TAG_LONG_ARRAY,
  NbtTag, NbtTagByte, NbtTagShort, NbtTagInt, NbtTagLong,
  NbtTagFloat, NbtTagDouble, NbtTagByteArray, NbtTagString,
  NbtTagList, NbtTagCompound, NbtTagIntArray, NbtTagLongArray,
  NbtFile, NbtCompression,
} from './types.js'
import { NbtError } from '@mcutils/core'

export class NbtWriter {
  private buffer: Buffer
  private offset = 0

  constructor(private capacity = 8192) {
    this.buffer = Buffer.alloc(capacity)
  }

  writeFile(file: NbtFile, rootName = ''): Buffer {
    this.offset = 0
    this.writeCompoundTag(file.root, rootName)
    const raw = this.slice()
    switch (file.compression) {
      case 'gzip': return zlib.gzipSync(raw)
      case 'zlib': return zlib.deflateSync(raw)
      default: return raw
    }
  }

  writeCompoundTag(compound: NbtTagCompound, name: string): void {
    this.writeByte(NBT_TAG_COMPOUND)
    this.writeString(name)
    for (const [key, tag] of compound.value) {
      this.writeTag(tag, key)
    }
    this.writeByte(NBT_TAG_END)
  }

  private writeTag(tag: NbtTag, name: string): void {
    this.writeByte(tag.type)
    this.writeString(name)
    switch (tag.type) {
      case NBT_TAG_BYTE: this.writeByte((tag as NbtTagByte).value); break
      case NBT_TAG_SHORT: this.writeShort((tag as NbtTagShort).value); break
      case NBT_TAG_INT: this.writeInt((tag as NbtTagInt).value); break
      case NBT_TAG_LONG: this.writeLong((tag as NbtTagLong).value); break
      case NBT_TAG_FLOAT: this.writeFloat((tag as NbtTagFloat).value); break
      case NBT_TAG_DOUBLE: this.writeDouble((tag as NbtTagDouble).value); break
      case NBT_TAG_BYTE_ARRAY: this.writeByteArray((tag as NbtTagByteArray).value); break
      case NBT_TAG_STRING: this.writeString((tag as NbtTagString).value); break
      case NBT_TAG_LIST: this.writeListTag(tag as NbtTagList); break
      case NBT_TAG_COMPOUND: this.writeCompoundContents(tag as NbtTagCompound); break
      case NBT_TAG_INT_ARRAY: this.writeIntArray((tag as NbtTagIntArray).value); break
      case NBT_TAG_LONG_ARRAY: this.writeLongArray((tag as NbtTagLongArray).value); break
    }
  }

  private writeCompoundContents(compound: NbtTagCompound): void {
    for (const [key, tag] of compound.value) {
      this.writeTag(tag, key)
    }
    this.writeByte(NBT_TAG_END)
  }

  private writeByte(value: number): void {
    this.ensure(1)
    this.buffer[this.offset++] = value & 0xFF
  }

  private writeShort(value: number): void {
    this.ensure(2)
    this.buffer.writeInt16BE(value, this.offset)
    this.offset += 2
  }

  private writeInt(value: number): void {
    this.ensure(4)
    this.buffer.writeInt32BE(value, this.offset)
    this.offset += 4
  }

  private writeLong(value: bigint): void {
    this.ensure(8)
    this.buffer.writeBigInt64BE(value, this.offset)
    this.offset += 8
  }

  private writeFloat(value: number): void {
    this.ensure(4)
    this.buffer.writeFloatBE(value, this.offset)
    this.offset += 4
  }

  private writeDouble(value: number): void {
    this.ensure(8)
    this.buffer.writeDoubleBE(value, this.offset)
    this.offset += 8
  }

  private writeByteArray(value: number[]): void {
    this.writeInt(value.length)
    this.ensure(value.length)
    for (let i = 0; i < value.length; i++) {
      this.buffer[this.offset++] = value[i] & 0xFF
    }
  }

  private writeString(value: string): void {
    const encoded = Buffer.from(value, 'utf8')
    this.writeShort(encoded.length)
    this.ensure(encoded.length)
    encoded.copy(this.buffer, this.offset)
    this.offset += encoded.length
  }

  private writeListTag(list: NbtTagList): void {
    this.writeByte(list.elementType)
    this.writeInt(list.value.length)
    for (const tag of list.value) {
      switch (list.elementType) {
        case NBT_TAG_BYTE: this.writeByte((tag as NbtTagByte).value); break
        case NBT_TAG_SHORT: this.writeShort((tag as NbtTagShort).value); break
        case NBT_TAG_INT: this.writeInt((tag as NbtTagInt).value); break
        case NBT_TAG_LONG: this.writeLong((tag as NbtTagLong).value); break
        case NBT_TAG_FLOAT: this.writeFloat((tag as NbtTagFloat).value); break
        case NBT_TAG_DOUBLE: this.writeDouble((tag as NbtTagDouble).value); break
        case NBT_TAG_BYTE_ARRAY: this.writeByteArray((tag as NbtTagByteArray).value); break
        case NBT_TAG_STRING: this.writeString((tag as NbtTagString).value); break
        case NBT_TAG_LIST: this.writeListTag(tag as NbtTagList); break
        case NBT_TAG_COMPOUND: this.writeCompoundContents(tag as NbtTagCompound); break
        case NBT_TAG_INT_ARRAY: this.writeIntArray((tag as NbtTagIntArray).value); break
        case NBT_TAG_LONG_ARRAY: this.writeLongArray((tag as NbtTagLongArray).value); break
      }
    }
  }

  private writeIntArray(value: number[]): void {
    this.writeInt(value.length)
    this.ensure(value.length * 4)
    for (let i = 0; i < value.length; i++) {
      this.buffer.writeInt32BE(value[i], this.offset)
      this.offset += 4
    }
  }

  private writeLongArray(value: bigint[]): void {
    this.writeInt(value.length)
    this.ensure(value.length * 8)
    for (let i = 0; i < value.length; i++) {
      this.buffer.writeBigInt64BE(value[i], this.offset)
      this.offset += 8
    }
  }

  private ensure(bytes: number): void {
    while (this.offset + bytes > this.buffer.length) {
      const newBuffer = Buffer.alloc(this.buffer.length * 2)
      this.buffer.copy(newBuffer)
      this.buffer = newBuffer
    }
  }

  private slice(): Buffer {
    return this.buffer.slice(0, this.offset)
  }
}
