export declare class McutilsError extends Error {
    constructor(message: string);
}
export declare class PingError extends McutilsError {
    constructor(message: string);
}
export declare class RconError extends McutilsError {
    constructor(message: string);
}
export declare class RconAuthError extends RconError {
    constructor();
}
export declare class NbtError extends McutilsError {
    offset?: number;
    constructor(message: string, offset?: number);
}
export declare class NbtFormatError extends NbtError {
    constructor(message: string, offset?: number);
}
export declare class RegionError extends McutilsError {
    constructor(message: string);
}
export declare class SchematicError extends McutilsError {
    constructor(message: string);
}
export declare class LogParseError extends McutilsError {
    constructor(message: string);
}
export declare class ServerControlError extends McutilsError {
    constructor(message: string);
}
export declare class BackupError extends McutilsError {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map