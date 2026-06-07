export class McutilsError extends Error {
    constructor(message) {
        super(message);
        this.name = 'McutilsError';
    }
}
export class PingError extends McutilsError {
    constructor(message) {
        super(`Server ping failed: ${message}`);
        this.name = 'PingError';
    }
}
export class RconError extends McutilsError {
    constructor(message) {
        super(`RCON error: ${message}`);
        this.name = 'RconError';
    }
}
export class RconAuthError extends RconError {
    constructor() {
        super('Authentication failed');
        this.name = 'RconAuthError';
    }
}
export class NbtError extends McutilsError {
    offset;
    constructor(message, offset) {
        super(`NBT error: ${message}${offset !== undefined ? ` at offset ${offset}` : ''}`);
        this.name = 'NbtError';
        this.offset = offset;
    }
}
export class NbtFormatError extends NbtError {
    constructor(message, offset) {
        super(message, offset);
        this.name = 'NbtFormatError';
    }
}
export class RegionError extends McutilsError {
    constructor(message) {
        super(`Region error: ${message}`);
        this.name = 'RegionError';
    }
}
export class SchematicError extends McutilsError {
    constructor(message) {
        super(`Schematic error: ${message}`);
        this.name = 'SchematicError';
    }
}
export class LogParseError extends McutilsError {
    constructor(message) {
        super(`Log parse error: ${message}`);
        this.name = 'LogParseError';
    }
}
export class ServerControlError extends McutilsError {
    constructor(message) {
        super(`Server control error: ${message}`);
        this.name = 'ServerControlError';
    }
}
export class BackupError extends McutilsError {
    constructor(message) {
        super(`Backup error: ${message}`);
        this.name = 'BackupError';
    }
}
//# sourceMappingURL=errors.js.map