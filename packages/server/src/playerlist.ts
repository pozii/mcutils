import * as fsPromises from 'node:fs/promises'
import { McutilsError } from '@mcutils/core'

export interface PlayerListEntry {
  uuid: string
  name: string
  created?: string
  expires?: string
  reason?: string
  source?: string
}

export interface OpEntry {
  uuid: string
  name: string
  level: number
  bypassesPlayerLimit: boolean
}

export interface BanEntry {
  uuid: string
  name: string
  created: string
  source: string
  expires: string | null
  reason: string
}

export interface IpBanEntry {
  ip: string
  created: string
  source: string
  expires: string | null
  reason: string
}

export class PlayerListManager {
  private entries: PlayerListEntry[] = []
  private filePath: string = ''
  private modified = false

  private constructor() {}

  static async load(path: string): Promise<PlayerListManager> {
    const manager = new PlayerListManager()
    manager.filePath = path
    try {
      const content = await fsPromises.readFile(path, 'utf8')
      manager.entries = JSON.parse(content)
      if (!Array.isArray(manager.entries)) manager.entries = []
    } catch {
      manager.entries = []
    }
    return manager
  }

  static create(): PlayerListManager {
    return new PlayerListManager()
  }

  getAll(): PlayerListEntry[] {
    return [...this.entries]
  }

  get(uuid: string): PlayerListEntry | undefined {
    return this.entries.find(e => e.uuid === uuid)
  }

  getByName(name: string): PlayerListEntry | undefined {
    return this.entries.find(e => e.name.toLowerCase() === name.toLowerCase())
  }

  has(uuid: string): boolean {
    return this.entries.some(e => e.uuid === uuid)
  }

  add(uuid: string, name: string): this {
    if (!this.has(uuid)) {
      this.entries.push({ uuid, name })
      this.modified = true
    }
    return this
  }

  remove(uuid: string): boolean {
    const index = this.entries.findIndex(e => e.uuid === uuid)
    if (index !== -1) {
      this.entries.splice(index, 1)
      this.modified = true
      return true
    }
    return false
  }

  removeByName(name: string): boolean {
    const index = this.entries.findIndex(e => e.name.toLowerCase() === name.toLowerCase())
    if (index !== -1) {
      this.entries.splice(index, 1)
      this.modified = true
      return true
    }
    return false
  }

  count(): number {
    return this.entries.length
  }

  isModified(): boolean {
    return this.modified
  }

  async save(path?: string): Promise<void> {
    const targetPath = path ?? this.filePath
    if (!targetPath) {
      throw new McutilsError('No file path specified')
    }
    await fsPromises.writeFile(targetPath, JSON.stringify(this.entries, null, 2), 'utf8')
    this.modified = false
    if (path) this.filePath = path
  }
}

export class OpsManager {
  private entries: OpEntry[] = []

  static async load(path: string): Promise<OpsManager> {
    const manager = new OpsManager()
    try {
      const content = await fsPromises.readFile(path, 'utf8')
      manager.entries = JSON.parse(content)
      if (!Array.isArray(manager.entries)) manager.entries = []
    } catch {
      manager.entries = []
    }
    return manager
  }

  getAll(): OpEntry[] { return [...this.entries] }

  get(uuid: string): OpEntry | undefined {
    return this.entries.find(e => e.uuid === uuid)
  }

  add(uuid: string, name: string, level = 4, bypassesPlayerLimit = false): void {
    const existing = this.entries.findIndex(e => e.uuid === uuid)
    if (existing !== -1) {
      this.entries[existing] = { uuid, name, level, bypassesPlayerLimit }
    } else {
      this.entries.push({ uuid, name, level, bypassesPlayerLimit })
    }
  }

  remove(uuid: string): boolean {
    const idx = this.entries.findIndex(e => e.uuid === uuid)
    if (idx !== -1) { this.entries.splice(idx, 1); return true }
    return false
  }

  async save(path: string): Promise<void> {
    await fsPromises.writeFile(path, JSON.stringify(this.entries, null, 2), 'utf8')
  }
}

export class BanManager {
  private entries: BanEntry[] = []

  static async load(path: string): Promise<BanManager> {
    const manager = new BanManager()
    try {
      const content = await fsPromises.readFile(path, 'utf8')
      manager.entries = JSON.parse(content)
      if (!Array.isArray(manager.entries)) manager.entries = []
    } catch {
      manager.entries = []
    }
    return manager
  }

  getAll(): BanEntry[] { return [...this.entries] }

  isBanned(uuid: string): boolean {
    const entry = this.entries.find(e => e.uuid === uuid)
    if (!entry) return false
    if (entry.expires) {
      const exp = new Date(entry.expires)
      if (exp < new Date()) return false
    }
    return true
  }

  async save(path: string): Promise<void> {
    await fsPromises.writeFile(path, JSON.stringify(this.entries, null, 2), 'utf8')
  }
}
