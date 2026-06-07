import { NbtTag, NbtTagCompound } from './types.js';
export interface NbtJsonOptions {
    pretty?: boolean;
    simplify?: boolean;
    maxArrayLength?: number;
}
export declare function toJson(tag: NbtTag, options?: NbtJsonOptions): unknown;
export declare function toJsonString(tag: NbtTag, options?: NbtJsonOptions): string;
export declare function fromJson(json: Record<string, unknown>): NbtTagCompound | null;
//# sourceMappingURL=json.d.ts.map