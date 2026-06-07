export const BLOCKS: Record<string, { id: number; name: string; meta?: number }> = {
  'minecraft:air': { id: 0, name: 'Air' },
  'minecraft:stone': { id: 1, name: 'Stone' },
  'minecraft:grass_block': { id: 2, name: 'Grass Block' },
  'minecraft:dirt': { id: 3, name: 'Dirt' },
  'minecraft:cobblestone': { id: 4, name: 'Cobblestone' },
  'minecraft:oak_planks': { id: 5, name: 'Oak Planks' },
  'minecraft:spruce_planks': { id: 5, name: 'Spruce Planks', meta: 1 },
}

export const ITEMS: Record<string, { id: number; name: string; stackSize?: number }> = {
  'minecraft:stone': { id: 1, name: 'Stone' },
  'minecraft:dirt': { id: 3, name: 'Dirt' },
  'minecraft:cobblestone': { id: 4, name: 'Cobblestone' },
  'minecraft:oak_planks': { id: 5, name: 'Oak Planks' },
  'minecraft:diamond': { id: 264, name: 'Diamond' },
  'minecraft:diamond_pickaxe': { id: 278, name: 'Diamond Pickaxe', stackSize: 1 },
  'minecraft:diamond_sword': { id: 276, name: 'Diamond Sword', stackSize: 1 },
}

export const BIOMES: Record<string, { id: number; name: string; color: string; temperature: number }> = {
  'minecraft:plains': { id: 1, name: 'Plains', color: '#8DB360', temperature: 0.8 },
  'minecraft:desert': { id: 2, name: 'Desert', color: '#FA9418', temperature: 2.0 },
  'minecraft:forest': { id: 4, name: 'Forest', color: '#056621', temperature: 0.7 },
  'minecraft:taiga': { id: 5, name: 'Taiga', color: '#0B6659', temperature: 0.25 },
  'minecraft:swamp': { id: 6, name: 'Swamp', color: '#07F9B2', temperature: 0.8 },
  'minecraft:ocean': { id: 44, name: 'Ocean', color: '#000070', temperature: 0.5 },
  'minecraft:river': { id: 7, name: 'River', color: '#0000FF', temperature: 0.5 },
  'minecraft:nether_wastes': { id: 8, name: 'Nether Wastes', color: '#FF0000', temperature: 2.0 },
  'minecraft:the_end': { id: 9, name: 'The End', color: '#8080FF', temperature: 0.5 },
  'minecraft:mountains': { id: 3, name: 'Mountains', color: '#606060', temperature: 0.2 },
  'minecraft:snowy_tundra': { id: 12, name: 'Snowy Tundra', color: '#FFFFFF', temperature: 0.0 },
  'minecraft:mushroom_fields': { id: 14, name: 'Mushroom Fields', color: '#FF00FF', temperature: 0.9 },
  'minecraft:jungle': { id: 21, name: 'Jungle', color: '#537B09', temperature: 0.95 },
  'minecraft:savanna': { id: 35, name: 'Savanna', color: '#BDB25F', temperature: 1.2 },
  'minecraft:badlands': { id: 37, name: 'Badlands', color: '#D94515', temperature: 2.0 },
}

export const ENCHANTMENTS: Record<string, { id: number; name: string; maxLevel: number }> = {
  'minecraft:sharpness': { id: 16, name: 'Sharpness', maxLevel: 5 },
  'minecraft:protection': { id: 0, name: 'Protection', maxLevel: 4 },
  'minecraft:fortune': { id: 35, name: 'Fortune', maxLevel: 3 },
  'minecraft:efficiency': { id: 32, name: 'Efficiency', maxLevel: 5 },
  'minecraft:unbreaking': { id: 34, name: 'Unbreaking', maxLevel: 3 },
  'minecraft:mending': { id: 70, name: 'Mending', maxLevel: 1 },
  'minecraft:silk_touch': { id: 33, name: 'Silk Touch', maxLevel: 1 },
}

export const ENTITIES: Record<string, { id: number; name: string; meta?: number }> = {
  'minecraft:creeper': { id: 50, name: 'Creeper' },
  'minecraft:zombie': { id: 51, name: 'Zombie' },
  'minecraft:skeleton': { id: 52, name: 'Skeleton' },
  'minecraft:spider': { id: 53, name: 'Spider' },
  'minecraft:enderman': { id: 58, name: 'Enderman' },
  'minecraft:player': { id: 89, name: 'Player' },
}

export function blockName(id: string): string | undefined {
  return BLOCKS[id]?.name
}

export function itemName(id: string): string | undefined {
  return ITEMS[id]?.name
}

export function biomeName(id: string): string | undefined {
  return BIOMES[id]?.name
}

export function biomeColor(id: string): string | undefined {
  return BIOMES[id]?.color
}

