# mcutils

**Full-featured Minecraft toolkit for developers** — Server management, world operations, NBT, RCON, and more.

![License](https://img.shields.io/badge/License-Apache%202.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

---

## Installation

```bash
npm install mcutils
# or
pnpm add mcutils
# or
yarn add mcutils
```

## Usage

### Server Status Ping

```typescript
import { pingServer } from "mcutils";

const status = await pingServer({ host: "mc.hypixel.net" });
console.log(`${status.players.online}/${status.players.max} players online`);
console.log(`MOTD: ${status.description}`);
console.log(`Version: ${status.version.name} (${status.latency}ms)`);
```

### RCON Client

```typescript
import { RconClient } from "mcutils";

const rcon = new RconClient({
  host: "localhost",
  port: 25575,
  password: "secret",
});
await rcon.connect();
const response = await rcon.sendCommand("list");
console.log(response);
await rcon.close();

// One-liner:
import { rconCommand } from "mcutils";
const result = await rconCommand(
  { host: "localhost", port: 25575, password: "secret" },
  "say Hello from mcutils!"
);
```

### Server Properties

```typescript
import { ServerProperties } from "mcutils";

const props = await ServerProperties.load("server.properties");
console.log(props.get("motd"));
props.set("max-players", 100).set("difficulty", "hard");
await props.save();
```

### NBT Files

```typescript
import { NBT } from "mcutils";

// Read NBT
const tag = NBT.fromFile("level.dat");
const file = tag.readFile();
const spawnX = file.root.get("Data.SpawnX"); // path access

// Convert to JSON
import { toJsonString } from "mcutils";
console.log(toJsonString(file.root, { pretty: true }));
```

### Player Lists

```typescript
import { PlayerListManager, OpsManager } from "mcutils";

const whitelist = await PlayerListManager.load("whitelist.json");
whitelist.add("uuid-here", "PlayerName");
await whitelist.save();
console.log(`Whitelisted: ${whitelist.count()} players`);
```

### World Info

```typescript
import { readLevelDat } from "mcutils";

const level = await readLevelDat("./world");
console.log(`Seed: ${level.info.seed}`);
console.log(`Gamemode: ${level.info.gameMode}`);
console.log(`Spawn: ${level.info.spawnPosition.x}, ${level.info.spawnPosition.y}, ${level.info.spawnPosition.z}`);
```

### Log Parsing

```typescript
import { LogParser, LogWatcher } from "mcutils";

const parser = new LogParser();
const events = await parser.parseFile("logs/latest.log");

// Real-time watching
const watcher = new LogWatcher();
watcher.on("join", (e) => console.log(`${e.player} joined!`));
watcher.on("death", (e) => console.log(`Death: ${e.message}`));
await watcher.watch("logs/latest.log");
```

## CLI

```bash
# Server status
mcutils ping mc.hypixel.net

# RCON
mcutils rcon localhost 25575 password "list"

# NBT
mcutils nbt read level.dat
mcutils nbt to-json level.dat

# Properties
mcutils props server.properties
mcutils props server.properties --get max-players
mcutils props server.properties --set motd="My Server"

# World info
mcutils world ./world

# UUID utilities
mcutils uuid Notch
mcutils uuid Notch --online

# Log analysis
mcutils log logs/latest.log

# Schematics
mcutils schematic build.schem

# Help
mcutils help
```

## API Overview

| Category | Module | Exports |
|----------|--------|---------|
| **Core** | `@mcutils/core` | Types, errors, UUID, colors, constants, version mapping |
| **Server** | `@mcutils/server` | `pingServer`, `RconClient`, `rconCommand`, `ServerProperties`, `PlayerListManager`, `OpsManager`, `BanManager` |
| **World** | `@mcutils/world` | `NbtReader`, `NbtWriter`, `toJsonString`, `readLevelDat`, `readSchematic`, `RegionFile`, `readPlayerData` |
| **Log** | `@mcutils/log` | `LogParser`, `LogWatcher` |
| **CLI** | `@mcutils/cli` | `mcutils` CLI tool |

## License

Apache 2.0 — see [LICENSE](LICENSE).
