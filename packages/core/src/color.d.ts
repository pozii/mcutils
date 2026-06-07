export interface McColor {
    code: string;
    name: string;
    rgb: [number, number, number];
    hex: string;
}
export declare const MINECRAFT_COLORS: Record<string, McColor>;
export declare const MINECRAFT_FORMATS: Record<string, {
    code: string;
    name: string;
}>;
export declare function stripColorCodes(text: string): string;
export declare function motdToHtml(text: string): string;
export declare function getColorName(code: string): string | undefined;
export declare function getColorRgb(code: string): [number, number, number] | undefined;
export declare function colorCodeToHex(code: string): string | undefined;
export declare function isValidColorCode(code: string): boolean;
//# sourceMappingURL=color.d.ts.map