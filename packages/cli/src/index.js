function jsonOut(data, jsonFlag) {
    if (jsonFlag) {
        console.log(JSON.stringify(data, null, 2));
        return;
    }
}
function label(k, v) { return `${k}: ${v}`; }
export async function cli(args) {
    const command = args[0]?.toLowerCase();
    const jsonFlag = args.includes('--json');
    switch (command) {
        case 'ping':
        case 'status': {
            const { pingServer } = await import('@mcutils/server');
            const host = args[1];
            const port = parseInt(args[2] ?? '25565', 10);
            if (!host) {
                console.error('Usage: mcutils ping <host> [port] [--json]');
                process.exit(1);
            }
            try {
                const info = await pingServer({ host, port });
                if (jsonFlag) {
                    console.log(JSON.stringify(info, null, 2));
                    return;
                }
                console.log(`  Server:    ${info.description}`);
                console.log(`  Players:   ${info.players.online}/${info.players.max}`);
                console.log(`  Version:   ${info.version.name} (protocol ${info.version.protocol})`);
                console.log(`  Latency:   ${info.latency}ms`);
                if (info.players.sample?.length) {
                    console.log(`  Online:    ${info.players.sample.map(p => p.name).join(', ')}`);
                }
            }
            catch (e) {
                console.error(`Error: ${e.message}`);
                process.exit(1);
            }
            break;
        }
        case 'rcon': {
            const { RconClient } = await import('@mcutils/server');
            const host = args[1];
            const port = parseInt(args[2] ?? '25575', 10);
            const password = args[3];
            const command = args.filter(a => !a.startsWith('--')).slice(4).join(' ');
            if (!host || !password || !command) {
                console.error('Usage: mcutils rcon <host> <port> <password> <command> [--json]');
                process.exit(1);
            }
            const client = new RconClient({ host, port, password });
            try {
                await client.connect();
                const result = await client.sendCommand(command);
                if (jsonFlag) {
                    console.log(JSON.stringify({ command, response: result }));
                    return;
                }
                console.log(result);
            }
            catch (e) {
                console.error(`Error: ${e.message}`);
                process.exit(1);
            }
            finally {
                client.close();
            }
            break;
        }
        case 'query': {
            const { queryServer } = await import('@mcutils/server');
            const host = args[1];
            const port = parseInt(args[2] ?? '25565', 10);
            const full = args.includes('--full');
            if (!host) {
                console.error('Usage: mcutils query <host> [port] [--full] [--json]');
                process.exit(1);
            }
            try {
                const result = await queryServer(host, port, 5000, full);
                if (jsonFlag) {
                    console.log(JSON.stringify(result, null, 2));
                    return;
                }
                console.log(`  MOTD:      ${result.motd}`);
                console.log(`  Version:   ${result.version}`);
                console.log(`  Map:       ${result.map}`);
                console.log(`  Players:   ${result.numPlayers}/${result.maxPlayers}`);
                if (full && result.players.length) {
                    console.log(`  Player:    ${result.players.join(', ')}`);
                }
            }
            catch (e) {
                console.error(`Error: ${e.message}`);
                process.exit(1);
            }
            break;
        }
        case 'server': {
            const sub = args[1]?.toLowerCase();
            const dir = args[2];
            if (sub === 'start' && dir) {
                const { ServerController } = await import('@mcutils/server');
                try {
                    const jarPath = args.find(a => a.startsWith('--jar='))?.split('=')[1] ?? await ServerController.findServerJar(dir) ?? 'server.jar';
                    const ram = args.find(a => a.startsWith('--ram='))?.split('=')[1] ?? '2G';
                    const ctrl = new ServerController({ jarPath, serverDir: dir, maxRam: ram });
                    ctrl.on('output', (line) => process.stdout.write(line));
                    ctrl.on('ready', () => console.log('\n[Server ready]'));
                    await ctrl.start();
                    process.stdin.on('data', (d) => ctrl.sendCommand(d.toString().trim()));
                }
                catch (e) {
                    console.error(`Error: ${e.message}`);
                    process.exit(1);
                }
            }
            else {
                console.error('Usage: mcutils server start <dir> [--jar=file.jar] [--ram=2G]');
                process.exit(1);
            }
            break;
        }
        case 'backup': {
            const { WorldBackup } = await import('@mcutils/server');
            const sub = args[1]?.toLowerCase();
            if (sub === 'create') {
                const worldDir = args[2];
                const output = args.find(a => a.startsWith('--out='))?.split('=')[1] ?? `backup-${Date.now()}.zip`;
                if (!worldDir) {
                    console.error('Usage: mcutils backup create <world-dir> [--out=file.zip]');
                    process.exit(1);
                }
                try {
                    const result = await WorldBackup.create({ worldDir, output });
                    console.log(`Backup saved: ${result}`);
                }
                catch (e) {
                    console.error(`Error: ${e.message}`);
                    process.exit(1);
                }
            }
            else if (sub === 'list') {
                const dir = args[2];
                if (!dir) {
                    console.error('Usage: mcutils backup list <dir>');
                    process.exit(1);
                }
                const backups = await WorldBackup.listBackups(dir);
                for (const b of backups) {
                    const size = (b.size / 1024 / 1024).toFixed(2);
                    console.log(`  ${b.file} (${size} MB) - ${b.date.toISOString()}`);
                }
            }
            else {
                console.error('Usage: mcutils backup create|list ...');
                process.exit(1);
            }
            break;
        }
        case 'nbt': {
            const sub = args[1]?.toLowerCase();
            const { NbtReader, toJsonString } = await import('@mcutils/world');
            if ((sub === 'read' || sub === 'to-json') && args[2]) {
                try {
                    const reader = await NbtReader.fromFile(args[2]);
                    const file = reader.readFile();
                    const json = toJsonString(file.root, { pretty: true, simplify: true });
                    if (jsonFlag) {
                        console.log(json);
                        return;
                    }
                    console.log(json);
                }
                catch (e) {
                    console.error(`Error: ${e.message}`);
                    process.exit(1);
                }
            }
            else {
                console.error('Usage: mcutils nbt read <file> [--json]');
                console.error('       mcutils nbt to-json <file>');
                process.exit(1);
            }
            break;
        }
        case 'props':
        case 'properties': {
            const { ServerProperties } = await import('@mcutils/server');
            const file = args[1];
            if (!file) {
                console.error('Usage: mcutils props <file> [--get key] [--set key=value] [--json]');
                process.exit(1);
            }
            try {
                const props = await ServerProperties.load(file);
                if (args.includes('--get')) {
                    const key = args[args.indexOf('--get') + 1];
                    const val = props.get(key);
                    if (jsonFlag) {
                        console.log(JSON.stringify({ [key]: val }));
                        return;
                    }
                    console.log(`${key}=${val ?? '(not set)'}`);
                }
                else if (args.includes('--set')) {
                    const kv = args[args.indexOf('--set') + 1];
                    const eq = kv?.indexOf('=');
                    if (eq === -1 || eq === undefined) {
                        console.error('Usage: --set key=value');
                        process.exit(1);
                    }
                    props.set(kv.slice(0, eq), kv.slice(eq + 1));
                    await props.save();
                    console.log('Saved.');
                }
                else {
                    if (jsonFlag) {
                        console.log(JSON.stringify(props.toObject(), null, 2));
                        return;
                    }
                    const data = props.toObject();
                    for (const [k, v] of Object.entries(data))
                        console.log(`${k}=${v}`);
                }
            }
            catch (e) {
                console.error(`Error: ${e.message}`);
                process.exit(1);
            }
            break;
        }
        case 'playerlist':
        case 'whitelist': {
            const { PlayerListManager } = await import('@mcutils/server');
            const file = args[1];
            if (!file) {
                console.error('Usage: mcutils playerlist <file> [--json]');
                process.exit(1);
            }
            try {
                const list = await PlayerListManager.load(file);
                const entries = list.getAll();
                if (jsonFlag) {
                    console.log(JSON.stringify(entries, null, 2));
                    return;
                }
                console.log(`Total: ${entries.length}`);
                for (const e of entries)
                    console.log(`  ${e.name} (${e.uuid})`);
            }
            catch (e) {
                console.error(`Error: ${e.message}`);
                process.exit(1);
            }
            break;
        }
        case 'world':
        case 'level': {
            const { readLevelDat } = await import('@mcutils/world');
            const dir = args[1];
            if (!dir) {
                console.error('Usage: mcutils world <world-dir> [--json]');
                process.exit(1);
            }
            try {
                const level = await readLevelDat(dir);
                if (jsonFlag) {
                    console.log(JSON.stringify(level.info, null, 2));
                    return;
                }
                const i = level.info;
                console.log(`  World:     ${i.levelName}`);
                console.log(`  Seed:      ${i.seed}`);
                console.log(`  Gamemode:  ${i.gameMode}`);
                console.log(`  Difficulty: ${i.difficulty}`);
                console.log(`  Spawn:     ${i.spawnPosition.x}, ${i.spawnPosition.y}, ${i.spawnPosition.z}`);
                console.log(`  Time:      ${i.time}`);
                console.log(`  Raining:   ${i.raining}`);
            }
            catch (e) {
                console.error(`Error: ${e.message}`);
                process.exit(1);
            }
            break;
        }
        case 'uuid': {
            const { uuidOffline, resolveUsernameToUuid } = await import('@mcutils/core');
            const username = args[1];
            if (!username) {
                console.error('Usage: mcutils uuid <username> [--online] [--json]');
                process.exit(1);
            }
            if (args.includes('--online')) {
                const result = await resolveUsernameToUuid(username);
                if (result) {
                    if (jsonFlag) {
                        console.log(JSON.stringify(result));
                        return;
                    }
                    console.log(`  UUID:     ${result.uuid}`);
                    console.log(`  Username: ${result.username}`);
                }
                else {
                    console.error('Could not resolve UUID');
                    process.exit(1);
                }
            }
            else {
                const u = uuidOffline(username);
                if (jsonFlag) {
                    console.log(JSON.stringify({ uuid: u, username, onlineMode: false }));
                    return;
                }
                console.log(`  Offline UUID: ${u}`);
            }
            break;
        }
        case 'schematic': {
            const { readSchematic } = await import('@mcutils/world');
            const file = args[1];
            if (!file) {
                console.error('Usage: mcutils schematic <file> [--json]');
                process.exit(1);
            }
            try {
                const schem = await readSchematic(file);
                if (jsonFlag) {
                    console.log(JSON.stringify(schem, null, 2));
                    return;
                }
                console.log(`  Dimensions: ${schem.width} x ${schem.height} x ${schem.length}`);
                console.log(`  Palette:   ${Object.keys(schem.palette).length}`);
                console.log(`  Blocks:    ${schem.blockData.length}`);
                console.log(`  Tile Ent:  ${schem.tileEntities.length}`);
            }
            catch (e) {
                console.error(`Error: ${e.message}`);
                process.exit(1);
            }
            break;
        }
        case 'log': {
            const { LogParser } = await import('@mcutils/log');
            const file = args[1];
            if (!file) {
                console.error('Usage: mcutils log <file> [--json]');
                process.exit(1);
            }
            try {
                const parser = new LogParser();
                const events = await parser.parseFile(file);
                const counts = {};
                for (const e of events)
                    counts[e.type] = (counts[e.type] ?? 0) + 1;
                if (jsonFlag) {
                    console.log(JSON.stringify({ total: events.length, counts, events }, null, 2));
                    return;
                }
                console.log(`Total events: ${events.length}`);
                console.log('Breakdown:');
                for (const [type, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
                    console.log(`  ${type}: ${count}`);
                }
            }
            catch (e) {
                console.error(`Error: ${e.message}`);
                process.exit(1);
            }
            break;
        }
        case 'version':
        case '--version':
        case '-v': {
            const pkg = await import('../package.json', { with: { type: 'json' } });
            console.log(`mcutils v${pkg.default.version}`);
            break;
        }
        case 'help':
        case '--help':
        case '-h':
        default:
            showHelp();
            break;
    }
}
function showHelp() {
    console.log(`mcutils — Minecraft Developer Toolkit

Usage:
  SERVER
    ping <host> [port]             Ping a Minecraft server
    rcon <host> <port> <pass> <cmd> Execute RCON command
    query <host> [port]            GS4 Query protocol
    server start <dir>             Start a Minecraft server

  WORLD
    nbt read <file>                Read NBT file
    nbt to-json <file>             Convert NBT to JSON
    world <dir>                    View world info
    schematic <file>               View schematic info

  MANAGEMENT
    props <file>                   View server.properties
    props <file> --get <key>       Get property value
    props <file> --set <k=v>       Set property value
    playerlist <file>              View whitelist/ops/bans
    backup create <dir>            Create world backup
    backup list <dir>              List backups

  UTILITIES
    uuid <username>                Generate offline UUID
    uuid <username> --online       Resolve online UUID
    log <file>                     Analyze server log
    version                        Show version
    help                           Show this help

  FLAGS
    --json                         Output as JSON
`);
}
cli(process.argv.slice(2)).catch(console.error);
//# sourceMappingURL=index.js.map