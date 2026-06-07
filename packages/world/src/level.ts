import * as fsPromises from 'node:fs/promises'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { NbtReader } from './nbt/reader.js'
import { getValueAtPath } from './nbt/path.js'
import { NbtTagCompound } from './nbt/types.js'
import { WorldInfo, Position, McutilsError } from '@mcutils/core'

export interface LevelData {
  data: NbtTagCompound
  info: WorldInfo
  raw: Record<string, unknown>
}

export async function readLevelDat(worldDir: string): Promise<LevelData> {
  const filePath = path.join(worldDir, 'level.dat')
  const reader = await NbtReader.fromFile(filePath)
  const file = reader.readFile()
  const root = file.root
  const data = root.value.get('Data')
  if (!data || data.type !== 10) {
    throw new McutilsError('Invalid level.dat: missing Data compound')
  }
  const dataCompound = data as NbtTagCompound
  return {
    data: dataCompound,
    info: extractWorldInfo(dataCompound),
    raw: extractRaw(dataCompound),
  }
}

export function readLevelDatSync(worldDir: string): LevelData {
  const filePath = path.join(worldDir, 'level.dat')
  const reader = NbtReader.fromFileSync(filePath)
  const file = reader.readFile()
  const root = file.root
  const data = root.value.get('Data')
  if (!data || data.type !== 10) {
    throw new McutilsError('Invalid level.dat: missing Data compound')
  }
  const dataCompound = data as NbtTagCompound
  return {
    data: dataCompound,
    info: extractWorldInfo(dataCompound),
    raw: extractRaw(dataCompound),
  }
}

function extractWorldInfo(data: NbtTagCompound): WorldInfo {
  return {
    seed: Number(getValueAtPath(data, 'WorldGenSettings.seed') ?? getValueAtPath(data, 'RandomSeed') ?? 0),
    levelName: String(getValueAtPath(data, 'LevelName') ?? 'world'),
    gameMode: numberToGameMode(Number(getValueAtPath(data, 'GameType') ?? 0)),
    difficulty: numberToDifficulty(Number(getValueAtPath(data, 'Difficulty') ?? 0)),
    spawnPosition: {
      x: Number(getValueAtPath(data, 'SpawnX') ?? 0),
      y: Number(getValueAtPath(data, 'SpawnY') ?? 64),
      z: Number(getValueAtPath(data, 'SpawnZ') ?? 0),
    },
    time: Number(getValueAtPath(data, 'Time') ?? 0),
    dayTime: Number(getValueAtPath(data, 'DayTime') ?? 0),
    raining: Boolean(getValueAtPath(data, 'raining') ?? false),
    thunder: Boolean(getValueAtPath(data, 'thundering') ?? false),
    version: Number(getValueAtPath(data, 'version') ?? 0),
    players: Number(getValueAtPath(data, 'Player') ? 1 : 0),
    data: extractRaw(data),
  }
}

function numberToGameMode(n: number): 'survival' | 'creative' | 'adventure' | 'spectator' {
  switch (n) {
    case 0: return 'survival'
    case 1: return 'creative'
    case 2: return 'adventure'
    case 3: return 'spectator'
    default: return 'survival'
  }
}

function numberToDifficulty(n: number): 'peaceful' | 'easy' | 'normal' | 'hard' {
  switch (n) {
    case 0: return 'peaceful'
    case 1: return 'easy'
    case 2: return 'normal'
    case 3: return 'hard'
    default: return 'normal'
  }
}

function extractRaw(data: NbtTagCompound): Record<string, unknown> {
  const { toJson } = require('./nbt/json.js')
  return toJson(data, { simplify: true }) as Record<string, unknown>
}

export async function listWorlds(serverDir: string): Promise<string[]> {
  const entries = await fsPromises.readdir(serverDir, { withFileTypes: true })
  const worlds: string[] = []
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const levelPath = path.join(serverDir, entry.name, 'level.dat')
      try {
        await fsPromises.access(levelPath)
        worlds.push(entry.name)
      } catch {
        // not a world directory
      }
    }
  }
  return worlds
}

export function listWorldsSync(serverDir: string): string[] {
  const entries = fs.readdirSync(serverDir, { withFileTypes: true })
  const worlds: string[] = []
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const levelPath = path.join(serverDir, entry.name, 'level.dat')
      try {
        fs.accessSync(levelPath)
        worlds.push(entry.name)
      } catch {
        // not a world directory
      }
    }
  }
  return worlds
}
