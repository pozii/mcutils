import * as fsPromises from 'node:fs/promises'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { NbtReader } from './nbt/reader.js'
import { NbtTagCompound, NbtTagList } from './nbt/types.js'
import { getValueAtPath } from './nbt/path.js'
import { Player, ItemStack, PlayerStats } from '@mcutils/core'

export async function readPlayerData(worldDir: string, uuid: string): Promise<Player | null> {
  const filePath = path.join(worldDir, 'playerdata', `${uuid}.dat`)
  try {
    const reader = await NbtReader.fromFile(filePath)
    const file = reader.readFile()
    return parsePlayerNbt(file.root)
  } catch {
    return null
  }
}

export function readPlayerDataSync(worldDir: string, uuid: string): Player | null {
  const filePath = path.join(worldDir, 'playerdata', `${uuid}.dat`)
  try {
    const reader = NbtReader.fromFileSync(filePath)
    const file = reader.readFile()
    return parsePlayerNbt(file.root)
  } catch {
    return null
  }
}

function parsePlayerNbt(root: NbtTagCompound): Player {
  const uuid = String(getValueAtPath(root, 'UUID') ?? '')
  const name = String(getValueAtPath(root, 'bukkit.lastKnownName') ?? '')
  const posVal = getValueAtPath(root, 'Pos') as number[] | undefined
  const rotVal = getValueAtPath(root, 'Rotation') as number[] | undefined
  return {
    uuid,
    name,
    position: {
      x: posVal?.[0] ?? 0,
      y: posVal?.[1] ?? 0,
      z: posVal?.[2] ?? 0,
    },
    rotation: {
      yaw: rotVal?.[0] ?? 0,
      pitch: rotVal?.[1] ?? 0,
    },
    dimension: String(getValueAtPath(root, 'Dimension') ?? 'minecraft:overworld'),
    gameMode: numberToGameMode(Number(getValueAtPath(root, 'playerGameType') ?? 0)),
    health: Number(getValueAtPath(root, 'Health') ?? 20),
    food: Number(getValueAtPath(root, 'foodLevel') ?? 20),
    xp: {
      level: Number(getValueAtPath(root, 'XpLevel') ?? 0),
      progress: Number(getValueAtPath(root, 'XpP') ?? 0),
      totalXp: Number(getValueAtPath(root, 'XpTotal') ?? 0),
    },
    inventory: parseInventory(root, 'Inventory'),
    enderChest: parseInventory(root, 'EnderItems'),
    stats: parseStats(root),
  }
}

function parseInventory(root: NbtTagCompound, tagName: string): ItemStack[] | undefined {
  const items = getValueAtPath(root, tagName) as any[] | undefined
  if (!Array.isArray(items)) return undefined
  return items.map((item: any) => ({
    id: String(item?.id ?? 'minecraft:air'),
    count: Number(item?.Count ?? 1),
    damage: item?.Damage ? Number(item.Damage) : undefined,
    components: item?.tag ?? undefined,
  }))
}

function parseStats(root: NbtTagCompound): PlayerStats | undefined {
  return {
    totalPlayTime: Number(getValueAtPath(root, 'Statistic.TotalPlayTime') ?? getValueAtPath(root, 'Stats.TimePlayed') ?? undefined) || undefined,
    lastPlayed: Number(getValueAtPath(root, 'LastPlayed') ?? undefined) || undefined,
    firstPlayed: Number(getValueAtPath(root, 'FirstPlayed') ?? undefined) || undefined,
    deaths: Number(getValueAtPath(root, 'Statistic.Deaths') ?? undefined) || undefined,
    mobKills: Number(getValueAtPath(root, 'Statistic.MobKills') ?? undefined) || undefined,
    playerKills: Number(getValueAtPath(root, 'Statistic.PlayerKills') ?? undefined) || undefined,
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

export async function listPlayerDataFiles(worldDir: string): Promise<string[]> {
  const playerDataDir = path.join(worldDir, 'playerdata')
  try {
    return (await fsPromises.readdir(playerDataDir))
      .filter(f => f.endsWith('.dat'))
      .map(f => path.join(playerDataDir, f))
  } catch {
    return []
  }
}

export function listPlayerDataFilesSync(worldDir: string): string[] {
  const playerDataDir = path.join(worldDir, 'playerdata')
  try {
    return fs.readdirSync(playerDataDir)
      .filter(f => f.endsWith('.dat'))
      .map(f => path.join(playerDataDir, f))
  } catch {
    return []
  }
}
