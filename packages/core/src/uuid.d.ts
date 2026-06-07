export interface UuidInfo {
    uuid: string;
    username: string;
    onlineMode: boolean;
}
export declare function uuidOffline(username: string): string;
export declare function uuidOnline(username: string, serverId: string): string;
export declare function parseUuid(uuid: string): string;
export declare function stripUuid(uuid: string): string;
export declare function uuidToBytes(uuid: string): Buffer;
export declare function bytesToUuid(bytes: Buffer): string;
export declare function resolveUsernameToUuid(username: string): Promise<UuidInfo | null>;
export declare function resolveUuidToUsername(uuid: string): Promise<string | null>;
//# sourceMappingURL=uuid.d.ts.map