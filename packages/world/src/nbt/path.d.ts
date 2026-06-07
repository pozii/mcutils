import { NbtTag, NbtTagCompound } from './types.js';
export declare function getTagAtPath(root: NbtTagCompound, path: string): NbtTag | undefined;
export declare function getValueAtPath(root: NbtTagCompound, path: string): unknown;
export declare function setValueAtPath(root: NbtTagCompound, path: string, value: unknown, create?: boolean): boolean;
export declare function nbtToValue(tag: NbtTag): unknown;
export declare function valueToNbt(value: unknown): NbtTag | null;
//# sourceMappingURL=path.d.ts.map