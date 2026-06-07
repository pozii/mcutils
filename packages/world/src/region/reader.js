import * as fsPromises from 'node:fs/promises';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import { NbtReader } from '../nbt/reader.js';
const SECTOR_SIZE = 4096;
function tv(tag) {
    if (!tag)
        return undefined;
    return tag.value;
}
export class RegionFile {
    locations = [];
    timestamps = [];
    filePath;
    fd;
    constructor(filePath) {
        this.filePath = filePath;
    }
    static async open(filePath) {
        const region = new RegionFile(filePath);
        await region.load();
        return region;
    }
    static openSync(filePath) {
        const region = new RegionFile(filePath);
        region.loadSync();
        return region;
    }
    async load() {
        this.fd = await fsPromises.open(this.filePath, 'r');
        const header = Buffer.alloc(SECTOR_SIZE);
        await this.fd.read(header, 0, SECTOR_SIZE, 0);
        this.parseHeader(header);
    }
    loadSync() {
        const data = fs.readFileSync(this.filePath);
        this.parseHeader(data);
    }
    parseHeader(data) {
        this.locations = [];
        this.timestamps = [];
        for (let i = 0; i < 1024; i++) {
            const offset = data.readUInt32BE(i * 4);
            this.locations.push({
                offset: (offset >>> 8) * SECTOR_SIZE,
                size: offset & 0xFF,
            });
        }
        for (let i = 0; i < 1024; i++) {
            this.timestamps.push({
                timestamp: data.readUInt32BE(SECTOR_SIZE + i * 4),
            });
        }
    }
    async readChunk(chunkX, chunkZ) {
        const idx = (chunkX & 31) + (chunkZ & 31) * 32;
        const loc = this.locations[idx];
        if (loc.offset === 0 || loc.size === 0)
            return null;
        if (this.fd) {
            const buffer = Buffer.alloc(loc.size * SECTOR_SIZE);
            await this.fd.read(buffer, 0, buffer.length, loc.offset);
            return this.parseChunkBuffer(buffer);
        }
        const data = fs.readFileSync(this.filePath);
        return this.parseChunkData(data, loc);
    }
    readChunkSync(chunkX, chunkZ) {
        const idx = (chunkX & 31) + (chunkZ & 31) * 32;
        const loc = this.locations[idx];
        if (loc.offset === 0 || loc.size === 0)
            return null;
        const data = fs.readFileSync(this.filePath);
        return this.parseChunkData(data, loc);
    }
    parseChunkData(data, loc) {
        const buf = data.subarray(loc.offset, loc.offset + loc.size * SECTOR_SIZE);
        return this.parseChunkBuffer(buf);
    }
    parseChunkBuffer(buffer) {
        if (buffer.length < 5)
            return null;
        const length = buffer.readUInt32BE(0);
        const compression = buffer.readUInt8(4);
        if (length < 1)
            return null;
        let chunkData;
        try {
            const compressed = buffer.subarray(5, 5 + length - 1);
            if (compression === 1)
                chunkData = zlib.gunzipSync(compressed);
            else if (compression === 2)
                chunkData = zlib.inflateSync(compressed);
            else if (compression === 3)
                chunkData = compressed;
            else
                return null;
        }
        catch {
            return null;
        }
        const reader = new NbtReader(chunkData);
        const file = reader.readFile();
        return this.parseChunkNbt(file.root);
    }
    parseChunkNbt(root) {
        const level = root.value.get('Level');
        const lc = (level && level.type === 10) ? level : root;
        const x = Number(tv(lc.value.get('xPos')) ?? tv(lc.value.get('x')) ?? 0);
        const z = Number(tv(lc.value.get('zPos')) ?? tv(lc.value.get('z')) ?? 0);
        const st = tv(lc.value.get('Status'));
        const status = st !== undefined ? String(st) : 'unknown';
        const sections = [];
        const stag = lc.value.get('sections') ?? lc.value.get('Sections');
        if (stag && stag.type === 9) {
            for (const t of stag.value) {
                if (t.type === 10) {
                    const s = this.parseSection(t);
                    if (s)
                        sections.push(s);
                }
            }
        }
        const blockEntities = [];
        const etag = lc.value.get('block_entities') ?? lc.value.get('TileEntities') ?? lc.value.get('BlockEntities');
        if (etag && etag.type === 9) {
            for (const t of etag.value) {
                if (t.type === 10)
                    blockEntities.push(this.parseBlockEntity(t));
            }
        }
        const entities = [];
        const ent = lc.value.get('Entities') ?? lc.value.get('entities');
        if (ent && ent.type === 9) {
            for (const t of ent.value) {
                if (t.type === 10)
                    entities.push(this.parseEntity(t));
            }
        }
        const heightmaps = {};
        const hm = lc.value.get('Heightmaps') ?? lc.value.get('heightmaps');
        if (hm && hm.type === 10) {
            for (const [k, v] of hm.value) {
                if (v.type === 11 || v.type === 7)
                    heightmaps[k] = v.value;
            }
        }
        return { x, z, status, sections, blockEntities, entities, heightmaps };
    }
    parseSection(tag) {
        const y = Number(tv(tag.value.get('Y')) ?? tv(tag.value.get('y')) ?? 0);
        const blockCount = Number(tv(tag.value.get('block_count')) ?? tv(tag.value.get('BlockCount')) ?? 0);
        const palette = [];
        const bst = tag.value.get('block_states') ?? tag.value.get('BlockStates');
        const pt = bst && bst.type === 10
            ? bst.value.get('palette') ?? bst.value.get('Palette')
            : tag.value.get('palette') ?? tag.value.get('Palette');
        if (pt && pt.type === 9) {
            for (const e of pt.value) {
                if (e.type === 10) {
                    const c = e;
                    const name = String(tv(c.value.get('Name')) ?? tv(c.value.get('name')) ?? '');
                    const props = {};
                    const pr = c.value.get('Properties') ?? c.value.get('properties');
                    if (pr && pr.type === 10) {
                        for (const [pk, pv] of pr.value)
                            props[pk] = String(tv(pv) ?? '');
                    }
                    palette.push({ name, properties: props });
                }
            }
        }
        let blockData;
        if (bst && bst.type === 10) {
            const d = bst.value.get('data') ?? bst.value.get('Data');
            if (d && (d.type === 11 || d.type === 7))
                blockData = d.value;
        }
        return { y, blockCount, palette, blockData };
    }
    parseBlockEntity(tag) {
        return {
            id: String(tv(tag.value.get('Id')) ?? tv(tag.value.get('id')) ?? ''),
            position: this.parsePosition(tag),
            data: {},
        };
    }
    parseEntity(tag) {
        return {
            id: String(tv(tag.value.get('Id')) ?? tv(tag.value.get('id')) ?? ''),
            uuid: String(tv(tag.value.get('UUID')) ?? tv(tag.value.get('uuid')) ?? ''),
            position: this.parsePosition(tag),
            rotation: this.parseRotation(tag),
            data: {},
        };
    }
    parsePosition(tag) {
        let x = 0, y = 0, z = 0;
        const p = tag.value.get('Pos') ?? tag.value.get('pos');
        if (p && p.type === 9) {
            const l = p;
            x = Number(tv(l.value[0]) ?? 0);
            y = Number(tv(l.value[1]) ?? 0);
            z = Number(tv(l.value[2]) ?? 0);
        }
        const xt = tag.value.get('x') ?? tag.value.get('X');
        const yt = tag.value.get('y') ?? tag.value.get('Y');
        const zt = tag.value.get('z') ?? tag.value.get('Z');
        if (xt)
            x = Number(tv(xt) ?? x);
        if (yt)
            y = Number(tv(yt) ?? y);
        if (zt)
            z = Number(tv(zt) ?? z);
        return { x, y, z };
    }
    parseRotation(tag) {
        const r = tag.value.get('Rotation') ?? tag.value.get('rotation');
        if (r && r.type === 9) {
            const l = r;
            return { yaw: Number(tv(l.value[0]) ?? 0), pitch: Number(tv(l.value[1]) ?? 0) };
        }
        return { yaw: 0, pitch: 0 };
    }
    getLocation(chunkX, chunkZ) {
        return this.locations[(chunkX & 31) + (chunkZ & 31) * 32];
    }
    getTimestamp(chunkX, chunkZ) {
        return this.timestamps[(chunkX & 31) + (chunkZ & 31) * 32].timestamp;
    }
    async close() {
        if (this.fd) {
            await this.fd.close();
            this.fd = undefined;
        }
    }
}
export async function listRegionFiles(worldDir, dimension = 'overworld') {
    const rd = dimension === 'nether' ? path.join(worldDir, 'DIM-1', 'region')
        : dimension === 'end' ? path.join(worldDir, 'DIM1', 'region')
            : path.join(worldDir, 'region');
    try {
        return (await fsPromises.readdir(rd)).filter(f => f.endsWith('.mca') || f.endsWith('.mcr'))
            .map(f => path.join(rd, f)).sort();
    }
    catch {
        return [];
    }
}
export function listRegionFilesSync(worldDir, dimension = 'overworld') {
    const rd = dimension === 'nether' ? path.join(worldDir, 'DIM-1', 'region')
        : dimension === 'end' ? path.join(worldDir, 'DIM1', 'region')
            : path.join(worldDir, 'region');
    try {
        return fs.readdirSync(rd).filter(f => f.endsWith('.mca') || f.endsWith('.mcr'))
            .map(f => path.join(rd, f)).sort();
    }
    catch {
        return [];
    }
}
export function parseRegionFileName(fileName) {
    const m = fileName.match(/^r\.(-?\d+)\.(-?\d+)\.(mca|mcr)$/);
    return m ? { x: parseInt(m[1], 10), z: parseInt(m[2], 10) } : null;
}
//# sourceMappingURL=reader.js.map