export class McutilsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'McutilsError'
  }
}

export class PingError extends McutilsError {
  constructor(message: string) {
    super(`Server ping failed: ${message}`)
    this.name = 'PingError'
  }
}

export class RconError extends McutilsError {
  constructor(message: string) {
    super(`RCON error: ${message}`)
    this.name = 'RconError'
  }
}

export class RconAuthError extends RconError {
  constructor() {
    super('Authentication failed')
    this.name = 'RconAuthError'
  }
}

export class NbtError extends McutilsError {
  public offset?: number
  constructor(message: string, offset?: number) {
    super(`NBT error: ${message}${offset !== undefined ? ` at offset ${offset}` : ''}`)
    this.name = 'NbtError'
    this.offset = offset
  }
}

export class NbtFormatError extends NbtError {
  constructor(message: string, offset?: number) {
    super(message, offset)
    this.name = 'NbtFormatError'
  }
}

export class RegionError extends McutilsError {
  constructor(message: string) {
    super(`Region error: ${message}`)
    this.name = 'RegionError'
  }
}

export class SchematicError extends McutilsError {
  constructor(message: string) {
    super(`Schematic error: ${message}`)
    this.name = 'SchematicError'
  }
}

export class LogParseError extends McutilsError {
  constructor(message: string) {
    super(`Log parse error: ${message}`)
    this.name = 'LogParseError'
  }
}

export class ServerControlError extends McutilsError {
  constructor(message: string) {
    super(`Server control error: ${message}`)
    this.name = 'ServerControlError'
  }
}

export class BackupError extends McutilsError {
  constructor(message: string) {
    super(`Backup error: ${message}`)
    this.name = 'BackupError'
  }
}
