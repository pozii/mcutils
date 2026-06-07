import { NbtTag } from './types.js';
export type NbtSchemaType = 'byte' | 'short' | 'int' | 'long' | 'float' | 'double' | 'string' | 'byte_array' | 'int_array' | 'long_array' | 'list' | 'compound';
export interface NbtSchemaField {
    name: string;
    type: NbtSchemaType;
    required?: boolean;
    elementType?: NbtSchemaType;
    fields?: NbtSchemaField[];
}
export declare function validateSchema(tag: NbtTag, schema: NbtSchemaField[]): string[];
export declare function inferSchema(tag: NbtTag): NbtSchemaField[];
//# sourceMappingURL=schema.d.ts.map