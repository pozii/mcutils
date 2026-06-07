import * as fs from 'node:fs'
import * as fsPromises from 'node:fs/promises'
import { McutilsError } from '@mcutils/core'
import { ServerPropertiesData } from '@mcutils/core'

export class ServerProperties {
  private data: Map<string, string> = new Map()
  private comments: string[] = []
  private filePath: string = ''
  private modified = false

  private constructor() {}

  static async load(path: string): Promise<ServerProperties> {
    const props = new ServerProperties()
    props.filePath = path
    const content = await fsPromises.readFile(path, 'utf8')
    props.parse(content)
    return props
  }

  static loadSync(path: string): ServerProperties {
    const props = new ServerProperties()
    props.filePath = path
    const content = fs.readFileSync(path, 'utf8')
    props.parse(content)
    return props
  }

  static create(): ServerProperties {
    return new ServerProperties()
  }

  get(key: string): string | undefined {
    return this.data.get(key)
  }

  getNumber(key: string): number | undefined {
    const val = this.data.get(key)
    if (val === undefined) return undefined
    const num = Number(val)
    return isNaN(num) ? undefined : num
  }

  getBoolean(key: string): boolean | undefined {
    const val = this.data.get(key)
    if (val === undefined) return undefined
    return val.toLowerCase() === 'true'
  }

  set(key: string, value: string | number | boolean): this {
    this.data.set(key, String(value))
    this.modified = true
    return this
  }

  delete(key: string): boolean {
    const result = this.data.delete(key)
    if (result) this.modified = true
    return result
  }

  has(key: string): boolean {
    return this.data.has(key)
  }

  keys(): string[] {
    return [...this.data.keys()]
  }

  toObject(): Record<string, string> {
    const obj: Record<string, string> = {}
    for (const [key, value] of this.data) {
      obj[key] = value
    }
    return obj
  }

  toData(): ServerPropertiesData {
    const obj: Record<string, string | number | boolean | undefined> = {}
    for (const [key, value] of this.data) {
      const lower = value.toLowerCase()
      if (lower === 'true' || lower === 'false') {
        obj[key] = lower === 'true'
      } else if (/^-?\d+$/.test(value)) {
        obj[key] = parseInt(value, 10)
      } else if (/^-?\d+\.\d+$/.test(value)) {
        obj[key] = parseFloat(value)
      } else {
        obj[key] = value
      }
    }
    return obj as ServerPropertiesData
  }

  getFilePath(): string {
    return this.filePath
  }

  isModified(): boolean {
    return this.modified
  }

  async save(path?: string): Promise<void> {
    const targetPath = path ?? this.filePath
    if (!targetPath) {
      throw new McutilsError('No file path specified for server.properties')
    }
    await fsPromises.writeFile(targetPath, this.serialize(), 'utf8')
    this.modified = false
    if (path) this.filePath = path
  }

  saveSync(path?: string): void {
    const targetPath = path ?? this.filePath
    if (!targetPath) {
      throw new McutilsError('No file path specified for server.properties')
    }
    fs.writeFileSync(targetPath, this.serialize(), 'utf8')
    this.modified = false
    if (path) this.filePath = path
  }

  toString(): string {
    return this.serialize()
  }

  private parse(content: string): void {
    this.comments = []
    this.data.clear()
    const lines = content.split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed === '') {
        this.comments.push('')
        continue
      }
      if (trimmed.startsWith('#') || trimmed.startsWith('!')) {
        this.comments.push(line)
        continue
      }
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) continue
      const key = trimmed.slice(0, eqIndex).trim()
      const value = trimmed.slice(eqIndex + 1).trim()
      this.data.set(key, value)
    }
  }

  private serialize(): string {
    const lines: string[] = []
    for (const comment of this.comments) {
      lines.push(comment)
    }
    for (const [key, value] of this.data) {
      lines.push(`${key}=${value}`)
    }
    return lines.join('\n') + '\n'
  }
}
