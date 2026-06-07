import * as fsPromises from 'node:fs/promises'
import * as fs from 'node:fs'
import { NbtReader } from './nbt/reader.js'
import { NbtTagCompound, NbtTagList, NbtTag } from './nbt/types.js'
import { Schematic, BlockEntity, SchematicError } from '@mcutils/core'

export async function readSchematic(filePath: string): Promise<Schematic> {
  const reader = await NbtReader.fromFile(filePath)
  const file = reader.readFile()
  const root = file.root
  const format = detectFormat(root)
  switch (format) {
    case 'sponge': return parseSpongeSchematic(root)
    case 'legacy': return parseLegacySchematic(root)
    default: throw new SchematicError('Unknown schematic format')
  }
}

export function readSchematicSync(filePath: string): Schematic {
  const reader = NbtReader.fromFileSync(filePath)
  const file = reader.readFile()
  const root = file.root
  const format = detectFormat(root)
  switch (format) {
    case 'sponge': return parseSpongeSchematic(root)
    case 'legacy': return parseLegacySchematic(root)
    default: throw new SchematicError('Unknown schematic format')
  }
}

type SchematicFormat = 'sponge' | 'legacy'

function detectFormat(root: NbtTagCompound): SchematicFormat | null {
  if (root.value.has('Schematic')) return 'sponge'
  if (root.value.has('Width') && root.value.has('Height') && root.value.has('Length')) return 'legacy'
  return null
}

function tagValue(tag: NbtTag | undefined): any {
  if (!tag) return undefined
  return (tag as any).value
}

function parseSpongeSchematic(root: NbtTagCompound): Schematic {
  const schematic = root.value.get('Schematic')
  if (!schematic || schematic.type !== 10) {
    throw new SchematicError('Invalid Sponge schematic: missing Schematic compound')
  }
  const data = schematic as NbtTagCompound
  const width = Number(tagValue(data.value.get('Width')) ?? 0)
  const height = Number(tagValue(data.value.get('Height')) ?? 0)
  const length = Number(tagValue(data.value.get('Length')) ?? 0)

  const paletteMap: Record<string, number> = {}
  const palette = data.value.get('Palette')
  if (palette && palette.type === 10) {
    const pal = palette as NbtTagCompound
    for (const [key, val] of pal.value) {
      paletteMap[key] = Number(tagValue(val) ?? 0)
    }
  }

  const blockDataTag = data.value.get('BlockData')
  let blocks: number[] = []
  if (blockDataTag && blockDataTag.type === 7) {
    blocks = tagValue(blockDataTag) as number[] ?? []
  } else if (blockDataTag && blockDataTag.type === 11) {
    blocks = tagValue(blockDataTag) as number[] ?? []
  }

  const tileEntities: BlockEntity[] = []
  const entities = data.value.get('BlockEntities') ?? data.value.get('TileEntities')
  if (entities && entities.type === 9) {
    const list = entities as NbtTagList
    for (const entry of list.value) {
      if (entry.type === 10) {
        const comp = entry as NbtTagCompound
        const id = String(tagValue(comp.value.get('Id') ?? comp.value.get('id')) ?? 'unknown')
        const posTag = comp.value.get('Pos') ?? comp.value.get('pos')
        let x = 0, y = 0, z = 0
        if (posTag && posTag.type === 11) {
          const vals = tagValue(posTag) as number[]
          x = vals?.[0] ?? 0
          y = vals?.[1] ?? 0
          z = vals?.[2] ?? 0
        }
        tileEntities.push({ id, position: { x, y, z }, data: {} })
      }
    }
  }

  return {
    width, height, length,
    palette: paletteMap,
    blockData: blocks,
    tileEntities,
    metadata: {},
  }
}

function parseLegacySchematic(root: NbtTagCompound): Schematic {
  const width = Number(tagValue(root.value.get('Width')) ?? 0)
  const height = Number(tagValue(root.value.get('Height')) ?? 0)
  const length = Number(tagValue(root.value.get('Length')) ?? 0)

  const blocksTag = root.value.get('Blocks')
  const addBlocksTag = root.value.get('AddBlocks')

  const palette: Record<string, number> = {}
  const blockData: number[] = []

  if (blocksTag && blocksTag.type === 7) {
    const blockIds = tagValue(blocksTag) as number[] ?? []
    const addData = (addBlocksTag && addBlocksTag.type === 7) ? (tagValue(addBlocksTag) as number[] ?? []) : []

    for (let i = 0; i < blockIds.length; i++) {
      let id = blockIds[i] & 0xFF
      if (addData.length > 0) {
        const nibbleIndex = Math.floor(i / 2)
        const isHigh = i % 2 === 0
        id |= ((addData[nibbleIndex] >> (isHigh ? 4 : 0)) & 0x0F) << 8
      }
      const key = `minecraft:block_${id}`
      if (!(key in palette)) {
        palette[key] = Object.keys(palette).length
      }
      blockData[i] = palette[key]
    }
  }

  return {
    width, height, length,
    palette,
    blockData,
    tileEntities: [],
    metadata: {},
  }
}
