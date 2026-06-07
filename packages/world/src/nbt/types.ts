export const NBT_TAG_END = 0
export const NBT_TAG_BYTE = 1
export const NBT_TAG_SHORT = 2
export const NBT_TAG_INT = 3
export const NBT_TAG_LONG = 4
export const NBT_TAG_FLOAT = 5
export const NBT_TAG_DOUBLE = 6
export const NBT_TAG_BYTE_ARRAY = 7
export const NBT_TAG_STRING = 8
export const NBT_TAG_LIST = 9
export const NBT_TAG_COMPOUND = 10
export const NBT_TAG_INT_ARRAY = 11
export const NBT_TAG_LONG_ARRAY = 12

export type NbtTag =
  | NbtTagEnd
  | NbtTagByte
  | NbtTagShort
  | NbtTagInt
  | NbtTagLong
  | NbtTagFloat
  | NbtTagDouble
  | NbtTagByteArray
  | NbtTagString
  | NbtTagList
  | NbtTagCompound
  | NbtTagIntArray
  | NbtTagLongArray

export interface NbtTagEnd {
  type: typeof NBT_TAG_END
}

export interface NbtTagByte {
  type: typeof NBT_TAG_BYTE
  value: number
}

export interface NbtTagShort {
  type: typeof NBT_TAG_SHORT
  value: number
}

export interface NbtTagInt {
  type: typeof NBT_TAG_INT
  value: number
}

export interface NbtTagLong {
  type: typeof NBT_TAG_LONG
  value: bigint
}

export interface NbtTagFloat {
  type: typeof NBT_TAG_FLOAT
  value: number
}

export interface NbtTagDouble {
  type: typeof NBT_TAG_DOUBLE
  value: number
}

export interface NbtTagByteArray {
  type: typeof NBT_TAG_BYTE_ARRAY
  value: number[]
}

export interface NbtTagString {
  type: typeof NBT_TAG_STRING
  value: string
}

export interface NbtTagList {
  type: typeof NBT_TAG_LIST
  elementType: number
  value: NbtTag[]
}

export interface NbtTagCompound {
  type: typeof NBT_TAG_COMPOUND
  value: Map<string, NbtTag>
}

export interface NbtTagIntArray {
  type: typeof NBT_TAG_INT_ARRAY
  value: number[]
}

export interface NbtTagLongArray {
  type: typeof NBT_TAG_LONG_ARRAY
  value: bigint[]
}

export interface NbtFile {
  root: NbtTagCompound
  compression: NbtCompression
}

export type NbtCompression = 'none' | 'gzip' | 'zlib'

export interface NbtPathOptions {
  create?: boolean
  createType?: number
}
