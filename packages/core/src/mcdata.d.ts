export declare const BLOCKS: Record<string, {
    id: number;
    name: string;
    meta?: number;
}>;
export declare const ITEMS: Record<string, {
    id: number;
    name: string;
    stackSize?: number;
}>;
export declare const BIOMES: Record<string, {
    id: number;
    name: string;
    color: string;
    temperature: number;
}>;
export declare const ENCHANTMENTS: Record<string, {
    id: number;
    name: string;
    maxLevel: number;
}>;
export declare const ENTITIES: Record<string, {
    id: number;
    name: string;
    meta?: number;
}>;
export declare function blockName(id: string): string | undefined;
export declare function itemName(id: string): string | undefined;
export declare function biomeName(id: string): string | undefined;
export declare function biomeColor(id: string): string | undefined;
//# sourceMappingURL=mcdata.d.ts.map