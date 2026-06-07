export interface ServerInfo {
  description: string
  descriptionHtml: string
  favicon?: string
  latency: number
  players: {
    online: number
    max: number
    sample?: PlayerSample[]
  }
  version: {
    name: string
    protocol: number
  }
  modInfo?: {
    type: string
    modList: { modid: string; version: string }[]
  }
  enforcesSecureChat?: boolean
  previewsChat?: boolean
}

export interface PlayerSample {
  name: string
  id: string
}

export interface Player {
  uuid: string
  name: string
  position?: Position
  rotation?: Rotation
  dimension?: string
  gameMode?: GameMode
  health?: number
  food?: number
  xp?: XpInfo
  inventory?: ItemStack[]
  enderChest?: ItemStack[]
  advancements?: Record<string, AdvancementStatus>
  stats?: PlayerStats
}

export interface Position {
  x: number
  y: number
  z: number
}

export interface Rotation {
  yaw: number
  pitch: number
}

export interface XpInfo {
  level: number
  progress: number
  totalXp: number
}

export interface ItemStack {
  id: string
  count: number
  damage?: number
  components?: Record<string, unknown>
  tag?: Record<string, unknown>
}

export interface AdvancementStatus {
  done: boolean
  criteria?: Record<string, number>
}

export interface PlayerStats {
  totalPlayTime?: number
  lastPlayed?: number
  firstPlayed?: number
  deaths?: number
  mobKills?: number
  playerKills?: number
  itemsEnchanted?: number
  damageDealt?: number
  damageTaken?: number
  jumps?: number
}

export type GameMode = 'survival' | 'creative' | 'adventure' | 'spectator'
export type Difficulty = 'peaceful' | 'easy' | 'normal' | 'hard'
export type Dimension = 'overworld' | 'nether' | 'end'

export interface WorldInfo {
  seed: number
  levelName: string
  gameMode: GameMode
  difficulty: Difficulty
  spawnPosition: Position
  time: number
  dayTime: number
  raining: boolean
  thunder: boolean
  version: number
  players: number
  data: Record<string, unknown>
}

export interface ChunkInfo {
  x: number
  z: number
  status: string
  sections: ChunkSection[]
  blockEntities: BlockEntity[]
  entities: Entity[]
  heightmaps: Record<string, number[]>
  biomes?: number[]
}

export interface ChunkSection {
  y: number
  blockCount: number
  palette: BlockState[]
  blockData?: number[]
}

export interface BlockState {
  name: string
  properties?: Record<string, string>
}

export interface BlockEntity {
  id: string
  position: Position
  data: Record<string, unknown>
}

export interface Entity {
  id: string
  uuid: string
  position: Position
  rotation: Rotation
  data: Record<string, unknown>
}

export interface Schematic {
  width: number
  height: number
  length: number
  palette: Record<string, number>
  blockData: number[]
  tileEntities: BlockEntity[]
  metadata: Record<string, unknown>
  offset?: Position
}

export interface LogEvent {
  timestamp: Date
  type: LogEventType
  message: string
  raw: string
}

export type LogEventType =
  | 'join'
  | 'leave'
  | 'death'
  | 'achievement'
  | 'advancement'
  | 'chat'
  | 'command'
  | 'tps'
  | 'error'
  | 'warn'
  | 'info'
  | 'kick'
  | 'ban'
  | 'unknown'

export interface JoinEvent extends LogEvent {
  type: 'join'
  player: string
  uuid?: string
}

export interface LeaveEvent extends LogEvent {
  type: 'leave'
  player: string
  uuid?: string
}

export interface DeathEvent extends LogEvent {
  type: 'death'
  player: string
  message: string
  killer?: string
  cause?: string
}

export interface ChatEvent extends LogEvent {
  type: 'chat'
  player: string
  content: string
}

export interface AdvancementEvent extends LogEvent {
  type: 'advancement'
  player: string
  advancement: string
  title: string
}

export interface TpsEvent extends LogEvent {
  type: 'tps'
  tps: number
  mspt: number
}

export interface RconConnectionOptions {
  host: string
  port: number
  password: string
  timeout?: number
}

export interface RconPacket {
  id: number
  type: number
  body: string
}

export interface ServerPropertiesData {
  [key: string]: string | number | boolean | undefined
  'accepts-transfers'?: boolean
  'allow-flight'?: boolean
  'allow-nether'?: boolean
  'broadcast-console-to-ops'?: boolean
  'broadcast-rcon-to-ops'?: boolean
  'bug-report-url'?: string
  'debug'?: boolean
  'difficulty'?: string
  'enable-command-block'?: boolean
  'enable-jmx-monitoring'?: boolean
  'enable-query'?: boolean
  'enable-rcon'?: boolean
  'enable-status'?: boolean
  'enforce-secure-profile'?: boolean
  'enforce-whitelist'?: boolean
  'entity-broadcast-range-percentage'?: number
  'force-gamemode'?: boolean
  'function-permission-level'?: number
  'gamemode'?: string
  'generate-structures'?: boolean
  'generator-settings'?: string
  'hardcore'?: boolean
  'hide-online-players'?: boolean
  'initial-disabled-packs'?: string
  'initial-enabled-packs'?: string
  'level-name'?: string
  'level-seed'?: string
  'level-type'?: string
  'max-chained-neighbor-updates'?: number
  'max-players'?: number
  'max-tick-time'?: number
  'max-world-size'?: number
  'motd'?: string
  'network-compression-threshold'?: number
  'online-mode'?: boolean
  'op-permission-level'?: number
  'player-idle-timeout'?: number
  'prevent-proxy-connections'?: boolean
  'pvp'?: boolean
  'query.port'?: number
  'rate-limit'?: number
  'rcon.password'?: string
  'rcon.port'?: number
  'region-file-compression'?: string
  'require-resource-pack'?: boolean
  'resource-pack'?: string
  'resource-pack-id'?: string
  'resource-pack-prompt'?: string
  'resource-pack-sha1'?: string
  'server-ip'?: string
  'server-port'?: number
  'simulation-distance'?: number
  'spawn-animals'?: boolean
  'spawn-monsters'?: boolean
  'spawn-npcs'?: boolean
  'spawn-protection'?: number
  'sync-chunk-writes'?: boolean
  'text-filtering-config'?: string
  'use-native-transport'?: boolean
  'view-distance'?: number
  'white-list'?: boolean
}

export interface BackupOptions {
  worldDir: string
  output: string
  compress?: 'zip' | 'tar' | 'tar.gz' | 'none'
  exclude?: string[]
  timestamp?: boolean
}

export type BackupFormat = 'zip' | 'tar' | 'tar.gz'
