export async function cli(args: string[]): Promise<void> {
  const command = args[0]?.toLowerCase()

  switch (command) {
    case 'ping':
    case 'status': {
      const { pingServer } = await import('@mcutils/server')
      const host = args[1]
      const port = parseInt(args[2] ?? '25565', 10)
      if (!host) { console.error('Usage: mcutils ping <host> [port]'); process.exit(1) }
      try {
        const info = await pingServer({ host, port })
        console.log(`Server: ${info.description}`)
        console.log(`Players: ${info.players.online}/${info.players.max}`)
        console.log(`Version: ${info.version.name} (protocol ${info.version.protocol})`)
        console.log(`Latency: ${info.latency}ms`)
        if (info.players.sample?.length) {
          console.log(`Online: ${info.players.sample.map(p => p.name).join(', ')}`)
        }
      } catch (e: any) {
        console.error(`Error: ${e.message}`)
        process.exit(1)
      }
      break
    }

    case 'rcon': {
      const { RconClient } = await import('@mcutils/server')
      const host = args[1]
      const port = parseInt(args[2] ?? '25575', 10)
      const password = args[3]
      const command = args.slice(4).join(' ')
      if (!host || !password || !command) {
        console.error('Usage: mcutils rcon <host> <port> <password> <command>')
        process.exit(1)
      }
      const client = new RconClient({ host, port, password })
      try {
        await client.connect()
        const result = await client.sendCommand(command)
        console.log(result)
      } catch (e: any) {
        console.error(`Error: ${e.message}`)
        process.exit(1)
      } finally {
        client.close()
      }
      break
    }

    case 'nbt': {
      const sub = args[1]?.toLowerCase()
      const { NbtReader, toJsonString } = await import('@mcutils/world')
      if ((sub === 'read' || sub === 'to-json') && args[2]) {
        try {
          const reader = await NbtReader.fromFile(args[2])
          const file = reader.readFile()
          const json = toJsonString(file.root, { pretty: true, simplify: true })
          console.log(json)
        } catch (e: any) {
          console.error(`Error: ${e.message}`)
          process.exit(1)
        }
      } else {
        console.error('Usage: mcutils nbt read <file>')
        console.error('       mcutils nbt to-json <file>')
        process.exit(1)
      }
      break
    }

    case 'props':
    case 'properties': {
      const { ServerProperties } = await import('@mcutils/server')
      const sub = args[1]?.toLowerCase()
      const file = args[2]
      if (!file) {
        console.error('Usage: mcutils props <file> [--get key] [--set key=value]')
        process.exit(1)
      }
      try {
        const props = await ServerProperties.load(file)
        if (sub === '--get' || sub === 'get') {
          const val = props.get(args[3])
          console.log(val ?? '(not set)')
        } else if (sub === '--set' || sub === 'set') {
          const eq = args[3]?.indexOf('=')
          if (eq === -1 || eq === undefined) {
            console.error('Usage: --set key=value')
            process.exit(1)
          }
          props.set(args[3].slice(0, eq), args[3].slice(eq + 1))
          await props.save()
          console.log('Saved.')
        } else {
          const data = props.toObject()
          for (const [k, v] of Object.entries(data)) {
            console.log(`${k}=${v}`)
          }
        }
      } catch (e: any) {
        console.error(`Error: ${e.message}`)
        process.exit(1)
      }
      break
    }

    case 'playerlist':
    case 'whitelist': {
      const { PlayerListManager } = await import('@mcutils/server')
      const file = args[1]
      if (!file) { console.error('Usage: mcutils playerlist <file>'); process.exit(1) }
      try {
        const list = await PlayerListManager.load(file)
        const entries = list.getAll()
        console.log(`Total: ${entries.length}`)
        for (const e of entries) {
          console.log(`  ${e.name} (${e.uuid})`)
        }
      } catch (e: any) {
        console.error(`Error: ${e.message}`)
        process.exit(1)
      }
      break
    }

    case 'world':
    case 'level': {
      const { readLevelDat } = await import('@mcutils/world')
      const dir = args[1]
      if (!dir) { console.error('Usage: mcutils world <world-dir>'); process.exit(1) }
      try {
        const level = await readLevelDat(dir)
        const info = level.info
        console.log(`World: ${info.levelName}`)
        console.log(`Seed: ${info.seed}`)
        console.log(`Gamemode: ${info.gameMode}`)
        console.log(`Difficulty: ${info.difficulty}`)
        console.log(`Spawn: ${info.spawnPosition.x}, ${info.spawnPosition.y}, ${info.spawnPosition.z}`)
        console.log(`Time: ${info.time}`)
        console.log(`Raining: ${info.raining}`)
      } catch (e: any) {
        console.error(`Error: ${e.message}`)
        process.exit(1)
      }
      break
    }

    case 'uuid': {
      const { uuidOffline, parseUuid, resolveUsernameToUuid } = await import('@mcutils/core')
      const username = args[1]
      if (!username) { console.error('Usage: mcutils uuid <username> [--online]'); process.exit(1) }
      if (args.includes('--online')) {
        const result = await resolveUsernameToUuid(username)
        if (result) {
          console.log(`UUID: ${result.uuid}`)
          console.log(`Username: ${result.username}`)
        } else {
          console.error('Could not resolve UUID')
          process.exit(1)
        }
      } else {
        console.log(`Offline UUID: ${uuidOffline(username)}`)
      }
      break
    }

    case 'schematic': {
      const { readSchematic } = await import('@mcutils/world')
      const file = args[1]
      if (!file) { console.error('Usage: mcutils schematic <file>'); process.exit(1) }
      try {
        const schem = await readSchematic(file)
        console.log(`Dimensions: ${schem.width} x ${schem.height} x ${schem.length}`)
        console.log(`Palette size: ${Object.keys(schem.palette).length}`)
        console.log(`Block count: ${schem.blockData.length}`)
        console.log(`Tile entities: ${schem.tileEntities.length}`)
      } catch (e: any) {
        console.error(`Error: ${e.message}`)
        process.exit(1)
      }
      break
    }

    case 'log': {
      const { LogParser } = await import('@mcutils/log')
      const file = args[1]
      if (!file) { console.error('Usage: mcutils log <file>'); process.exit(1) }
      try {
        const parser = new LogParser()
        const events = await parser.parseFile(file)
        const types = new Map<string, number>()
        for (const e of events) {
          types.set(e.type, (types.get(e.type) ?? 0) + 1)
        }
        console.log(`Total events: ${events.length}`)
        console.log('Breakdown:')
        for (const [type, count] of types) {
          console.log(`  ${type}: ${count}`)
        }
      } catch (e: any) {
        console.error(`Error: ${e.message}`)
        process.exit(1)
      }
      break
    }

    case 'version':
    case '--version':
    case '-v': {
      const pkg = await import('../package.json', { with: { type: 'json' } })
      console.log(`mcutils v${pkg.default.version}`)
      break
    }

    case 'help':
    case '--help':
    case '-h':
    default:
      showHelp()
      break
  }
}

function showHelp(): void {
  console.log(`
mcutils — Minecraft Developer Toolkit v0.1.0

Usage:
  mcutils ping <host> [port]          Ping a Minecraft server
  mcutils rcon <host> <port> <pass> <cmd>  Execute RCON command
  mcutils nbt read <file>             Read NBT file
  mcutils nbt to-json <file>          Convert NBT to JSON
  mcutils props <file>                View server.properties
  mcutils props <file> --get <key>    Get property value
  mcutils props <file> --set <k=v>    Set property value
  mcutils playerlist <file>           View whitelist/ops/bans
  mcutils world <dir>                 View world info
  mcutils uuid <username>             Generate offline UUID
  mcutils uuid <username> --online    Resolve online UUID
  mcutils schematic <file>            View schematic info
  mcutils log <file>                  Analyze server log
  mcutils version                     Show version
  mcutils help                        Show this help
  `.trim())
}

cli(process.argv.slice(2)).catch(console.error)
