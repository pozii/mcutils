import * as fsPromises from 'node:fs/promises'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as zlib from 'node:zlib'
import { NbtReader } from '../nbt/reader.js'
import { NbtTagCompound, NbtTagList, NbtTag } from '../nbt/types.js'
import { ChunkInfo, ChunkSection, BlockState, BlockEntity, Entity, Position } from '@mcutils/core'

const SECTOR_SIZE = 4096

export interface RegionLocation {
  offset: number
  size: number
}

export interface RegionTimestamp {
  timestamp: number
}

function tv(tag: NbtTag | undefined): any {
  if (!tag) return undefined
  return (tag as any).value
}

export class RegionFile {
  private locations: RegionLocation[] = []
  private timestamps: RegionTimestamp[] = []
  private filePath: string
  private fd?: fsPromises.FileHandle

  constructor(filePath: string) {
    this.filePath = filePath
  }

  static async open(filePath: string): Promise<RegionFile> {
    const region = new RegionFile(filePath)
    await region.load()
    return region
  }

  static openSync(filePath: string): RegionFile {
    const region = new RegionFile(filePath)
    region.loadSync()
    return region
  }

  private async load(): Promise<void> {
    this.fd = await fsPromises.open(this.filePath, 'r')
    const header = Buffer.alloc(SECTOR_SIZE)
    await this.fd.read(header, 0, SECTOR_SIZE, 0)
    this.parseHeader(header)
  }

  private loadSync(): void {
    const data = fs.readFileSync(this.filePath)
    this.parseHeader(data)
  }

  private parseHeader(data: Buffer): void {
    this.locations = []
    this.timestamps = []
    for (let i = 0; i < 1024; i++) {
      const offset = data.readUInt32BE(i * 4)
      this.locations.push({
        offset: (offset >>> 8) * SECTOR_SIZE,
        size: offset & 0xFF,
      })
    }
    for (let i = 0; i < 1024; i++) {
      this.timestamps.push({
        timestamp: data.readUInt32BE(SECTOR_SIZE + i * 4),
      })
    }
  }

  async readChunk(chunkX: number, chunkZ: number): Promise<ChunkInfo | null> {
    const idx = (chunkX & 31) + (chunkZ & 31) * 32
    const loc = this.locations[idx]
    if (loc.offset === 0 || loc.size === 0) return null
    if (this.fd) {
      const buffer = Buffer.alloc(loc.size * SECTOR_SIZE)
      await this.fd.read(buffer, 0, buffer.length, loc.offset)
      return this.parseChunkBuffer(buffer)
    }
    const data = fs.readFileSync(this.filePath)
    return this.parseChunkData(data, loc)
  }

  readChunkSync(chunkX: number, chunkZ: number): ChunkInfo | null {
    const idx = (chunkX & 31) + (chunkZ & 31) * 32
    const loc = this.locations[idx]
    if (loc.offset === 0 || loc.size === 0) return null
    const data = fs.readFileSync(this.filePath)
    return this.parseChunkData(data, loc)
  }

  private parseChunkData(data: Buffer, loc: RegionLocation): ChunkInfo | null {
    const buf = data.subarray(loc.offset, loc.offset + loc.size * SECTOR_SIZE)
    return this.parseChunkBuffer(buf)
  }

  private parseChunkBuffer(buffer: Buffer): ChunkInfo | null {
    if (buffer.length < 5) return null
    const length = buffer.readUInt32BE(0)
    const compression = buffer.readUInt8(4)
    if (length < 1) return null
    let chunkData: Buffer
    try {
      const compressed = buffer.subarray(5, 5 + length - 1)
      if (compression === 1) chunkData = zlib.gunzipSync(compressed)
      else if (compression === 2) chunkData = zlib.inflateSync(compressed)
      else if (compression === 3) chunkData = compressed
      else return null
    } catch { return null }
    const reader = new NbtReader(chunkData)
    const file = reader.readFile()
    return this.parseChunkNbt(file.root)
  }

  private parseChunkNbt(root: NbtTagCompound): ChunkInfo {
    const level = root.value.get('Level')
    const lc = (level && level.type === 10) ? level as NbtTagCompound : root
    const x = Number(tv(lc.value.get('xPos')) ?? tv(lc.value.get('x')) ?? 0)
    const z = Number(tv(lc.value.get('zPos')) ?? tv(lc.value.get('z')) ?? 0)
    const st = tv(lc.value.get('Status'))
    const status = st !== undefined ? String(st) : 'unknown'

    const sections: ChunkSection[] = []
    const stag = lc.value.get('sections') ?? lc.value.get('Sections')
    if (stag && stag.type === 9) {
      for (const t of (stag as NbtTagList).value) {
        if (t.type === 10) {
          const s = this.parseSection(t as NbtTagCompound)
          if (s) sections.push(s)
        }
      }
    }

    const blockEntities: BlockEntity[] = []
    const etag = lc.value.get('block_entities') ?? lc.value.get('TileEntities') ?? lc.value.get('BlockEntities')
    if (etag && etag.type === 9) {
      for (const t of (etag as NbtTagList).value) {
        if (t.type === 10) blockEntities.push(this.parseBlockEntity(t as NbtTagCompound))
      }
    }

    const entities: Entity[] = []
    const ent = lc.value.get('Entities') ?? lc.value.get('entities')
    if (ent && ent.type === 9) {
      for (const t of (ent as NbtTagList).value) {
        if (t.type === 10) entities.push(this.parseEntity(t as NbtTagCompound))
      }
    }

    const heightmaps: Record<string, number[]> = {}
    const hm = lc.value.get('Heightmaps') ?? lc.value.get('heightmaps')
    if (hm && hm.type === 10) {
      for (const [k, v] of (hm as NbtTagCompound).value) {
        if (v.type === 11 || v.type === 7) heightmaps[k] = (v as any).value
      }
    }

    return { x, z, status, sections, blockEntities, entities, heightmaps }
  }

  private parseSection(tag: NbtTagCompound): ChunkSection | null {
    const y = Number(tv(tag.value.get('Y')) ?? tv(tag.value.get('y')) ?? 0)
    const blockCount = Number(tv(tag.value.get('block_count')) ?? tv(tag.value.get('BlockCount')) ?? 0)
    const palette: BlockState[] = []
    const bst = tag.value.get('block_states') ?? tag.value.get('BlockStates')
    const pt = bst && bst.type === 10
      ? (bst as NbtTagCompound).value.get('palette') ?? (bst as NbtTagCompound).value.get('Palette')
      : tag.value.get('palette') ?? tag.value.get('Palette')
    if (pt && pt.type === 9) {
      for (const e of (pt as NbtTagList).value) {
        if (e.type === 10) {
          const c = e as NbtTagCompound
          const name = String(tv(c.value.get('Name')) ?? tv(c.value.get('name')) ?? '')
          const props: Record<string, string> = {}
          const pr = c.value.get('Properties') ?? c.value.get('properties')
          if (pr && pr.type === 10) {
            for (const [pk, pv] of (pr as NbtTagCompound).value) props[pk] = String(tv(pv) ?? '')
          }
          palette.push({ name, properties: props })
        }
      }
    }
    let blockData: number[] | undefined
    if (bst && bst.type === 10) {
      const d = (bst as NbtTagCompound).value.get('data') ?? (bst as NbtTagCompound).value.get('Data')
      if (d && (d.type === 11 || d.type === 7)) blockData = (d as any).value
    }
    return { y, blockCount, palette, blockData }
  }

  private parseBlockEntity(tag: NbtTagCompound): BlockEntity {
    return {
      id: String(tv(tag.value.get('Id')) ?? tv(tag.value.get('id')) ?? ''),
      position: this.parsePosition(tag),
      data: {},
    }
  }

  private parseEntity(tag: NbtTagCompound): Entity {
    return {
      id: String(tv(tag.value.get('Id')) ?? tv(tag.value.get('id')) ?? ''),
      uuid: String(tv(tag.value.get('UUID')) ?? tv(tag.value.get('uuid')) ?? ''),
      position: this.parsePosition(tag),
      rotation: this.parseRotation(tag),
      data: {},
    }
  }

  private parsePosition(tag: NbtTagCompound): Position {
    let x = 0, y = 0, z = 0
    const p = tag.value.get('Pos') ?? tag.value.get('pos')
    if (p && p.type === 9) {
      const l = p as NbtTagList
      x = Number(tv(l.value[0]) ?? 0)
      y = Number(tv(l.value[1]) ?? 0)
      z = Number(tv(l.value[2]) ?? 0)
    }
    const xt = tag.value.get('x') ?? tag.value.get('X')
    const yt = tag.value.get('y') ?? tag.value.get('Y')
    const zt = tag.value.get('z') ?? tag.value.get('Z')
    if (xt) x = Number(tv(xt) ?? x)
    if (yt) y = Number(tv(yt) ?? y)
    if (zt) z = Number(tv(zt) ?? z)
    return { x, y, z }
  }

  private parseRotation(tag: NbtTagCompound): { yaw: number; pitch: number } {
    const r = tag.value.get('Rotation') ?? tag.value.get('rotation')
    if (r && r.type === 9) {
      const l = r as NbtTagList
      return { yaw: Number(tv(l.value[0]) ?? 0), pitch: Number(tv(l.value[1]) ?? 0) }
    }
    return { yaw: 0, pitch: 0 }
  }

  getLocation(chunkX: number, chunkZ: number): RegionLocation {
    return this.locations[(chunkX & 31) + (chunkZ & 31) * 32]
  }

  getTimestamp(chunkX: number, chunkZ: number): number {
    return this.timestamps[(chunkX & 31) + (chunkZ & 31) * 32].timestamp
  }

  async close(): Promise<void> {
    if (this.fd) { await this.fd.close(); this.fd = undefined }
  }
}

export async function listRegionFiles(worldDir: string, dimension = 'overworld'): Promise<string[]> {
  const rd = dimension === 'nether' ? path.join(worldDir, 'DIM-1', 'region')
    : dimension === 'end' ? path.join(worldDir, 'DIM1', 'region')
    : path.join(worldDir, 'region')
  try {
    return (await fsPromises.readdir(rd)).filter(f => f.endsWith('.mca') || f.endsWith('.mcr'))
      .map(f => path.join(rd, f)).sort()
  } catch { return [] }
}

export function listRegionFilesSync(worldDir: string, dimension = 'overworld'): string[] {
  const rd = dimension === 'nether' ? path.join(worldDir, 'DIM-1', 'region')
    : dimension === 'end' ? path.join(worldDir, 'DIM1', 'region')
    : path.join(worldDir, 'region')
  try {
    return fs.readdirSync(rd).filter(f => f.endsWith('.mca') || f.endsWith('.mcr'))
      .map(f => path.join(rd, f)).sort()
  } catch { return [] }
}

export function parseRegionFileName(fileName: string): { x: number; z: number } | null {
  const m = fileName.match(/^r\.(-?\d+)\.(-?\d+)\.(mca|mcr)$/)
  return m ? { x: parseInt(m[1], 10), z: parseInt(m[2], 10) } : null
}
