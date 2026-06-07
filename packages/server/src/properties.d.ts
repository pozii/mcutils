import { ServerPropertiesData } from '@mcutils/core';
export declare class ServerProperties {
    private data;
    private comments;
    private filePath;
    private modified;
    private constructor();
    static load(path: string): Promise<ServerProperties>;
    static loadSync(path: string): ServerProperties;
    static create(): ServerProperties;
    get(key: string): string | undefined;
    getNumber(key: string): number | undefined;
    getBoolean(key: string): boolean | undefined;
    set(key: string, value: string | number | boolean): this;
    delete(key: string): boolean;
    has(key: string): boolean;
    keys(): string[];
    toObject(): Record<string, string>;
    toData(): ServerPropertiesData;
    getFilePath(): string;
    isModified(): boolean;
    save(path?: string): Promise<void>;
    saveSync(path?: string): void;
    toString(): string;
    private parse;
    private serialize;
}
//# sourceMappingURL=properties.d.ts.map