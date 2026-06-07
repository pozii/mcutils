export interface PlayerListEntry {
    uuid: string;
    name: string;
    created?: string;
    expires?: string;
    reason?: string;
    source?: string;
}
export interface OpEntry {
    uuid: string;
    name: string;
    level: number;
    bypassesPlayerLimit: boolean;
}
export interface BanEntry {
    uuid: string;
    name: string;
    created: string;
    source: string;
    expires: string | null;
    reason: string;
}
export interface IpBanEntry {
    ip: string;
    created: string;
    source: string;
    expires: string | null;
    reason: string;
}
export declare class PlayerListManager {
    private entries;
    private filePath;
    private modified;
    private constructor();
    static load(path: string): Promise<PlayerListManager>;
    static create(): PlayerListManager;
    getAll(): PlayerListEntry[];
    get(uuid: string): PlayerListEntry | undefined;
    getByName(name: string): PlayerListEntry | undefined;
    has(uuid: string): boolean;
    add(uuid: string, name: string): this;
    remove(uuid: string): boolean;
    removeByName(name: string): boolean;
    count(): number;
    isModified(): boolean;
    save(path?: string): Promise<void>;
}
export declare class OpsManager {
    private entries;
    static load(path: string): Promise<OpsManager>;
    getAll(): OpEntry[];
    get(uuid: string): OpEntry | undefined;
    add(uuid: string, name: string, level?: number, bypassesPlayerLimit?: boolean): void;
    remove(uuid: string): boolean;
    save(path: string): Promise<void>;
}
export declare class BanManager {
    private entries;
    static load(path: string): Promise<BanManager>;
    getAll(): BanEntry[];
    isBanned(uuid: string): boolean;
    save(path: string): Promise<void>;
}
//# sourceMappingURL=playerlist.d.ts.map