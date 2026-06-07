import * as fsPromises from 'node:fs/promises';
import { McutilsError } from '@mcutils/core';
export class PlayerListManager {
    entries = [];
    filePath = '';
    modified = false;
    constructor() { }
    static async load(path) {
        const manager = new PlayerListManager();
        manager.filePath = path;
        try {
            const content = await fsPromises.readFile(path, 'utf8');
            manager.entries = JSON.parse(content);
            if (!Array.isArray(manager.entries))
                manager.entries = [];
        }
        catch {
            manager.entries = [];
        }
        return manager;
    }
    static create() {
        return new PlayerListManager();
    }
    getAll() {
        return [...this.entries];
    }
    get(uuid) {
        return this.entries.find(e => e.uuid === uuid);
    }
    getByName(name) {
        return this.entries.find(e => e.name.toLowerCase() === name.toLowerCase());
    }
    has(uuid) {
        return this.entries.some(e => e.uuid === uuid);
    }
    add(uuid, name) {
        if (!this.has(uuid)) {
            this.entries.push({ uuid, name });
            this.modified = true;
        }
        return this;
    }
    remove(uuid) {
        const index = this.entries.findIndex(e => e.uuid === uuid);
        if (index !== -1) {
            this.entries.splice(index, 1);
            this.modified = true;
            return true;
        }
        return false;
    }
    removeByName(name) {
        const index = this.entries.findIndex(e => e.name.toLowerCase() === name.toLowerCase());
        if (index !== -1) {
            this.entries.splice(index, 1);
            this.modified = true;
            return true;
        }
        return false;
    }
    count() {
        return this.entries.length;
    }
    isModified() {
        return this.modified;
    }
    async save(path) {
        const targetPath = path ?? this.filePath;
        if (!targetPath) {
            throw new McutilsError('No file path specified');
        }
        await fsPromises.writeFile(targetPath, JSON.stringify(this.entries, null, 2), 'utf8');
        this.modified = false;
        if (path)
            this.filePath = path;
    }
}
export class OpsManager {
    entries = [];
    static async load(path) {
        const manager = new OpsManager();
        try {
            const content = await fsPromises.readFile(path, 'utf8');
            manager.entries = JSON.parse(content);
            if (!Array.isArray(manager.entries))
                manager.entries = [];
        }
        catch {
            manager.entries = [];
        }
        return manager;
    }
    getAll() { return [...this.entries]; }
    get(uuid) {
        return this.entries.find(e => e.uuid === uuid);
    }
    add(uuid, name, level = 4, bypassesPlayerLimit = false) {
        const existing = this.entries.findIndex(e => e.uuid === uuid);
        if (existing !== -1) {
            this.entries[existing] = { uuid, name, level, bypassesPlayerLimit };
        }
        else {
            this.entries.push({ uuid, name, level, bypassesPlayerLimit });
        }
    }
    remove(uuid) {
        const idx = this.entries.findIndex(e => e.uuid === uuid);
        if (idx !== -1) {
            this.entries.splice(idx, 1);
            return true;
        }
        return false;
    }
    async save(path) {
        await fsPromises.writeFile(path, JSON.stringify(this.entries, null, 2), 'utf8');
    }
}
export class BanManager {
    entries = [];
    static async load(path) {
        const manager = new BanManager();
        try {
            const content = await fsPromises.readFile(path, 'utf8');
            manager.entries = JSON.parse(content);
            if (!Array.isArray(manager.entries))
                manager.entries = [];
        }
        catch {
            manager.entries = [];
        }
        return manager;
    }
    getAll() { return [...this.entries]; }
    isBanned(uuid) {
        const entry = this.entries.find(e => e.uuid === uuid);
        if (!entry)
            return false;
        if (entry.expires) {
            const exp = new Date(entry.expires);
            if (exp < new Date())
                return false;
        }
        return true;
    }
    async save(path) {
        await fsPromises.writeFile(path, JSON.stringify(this.entries, null, 2), 'utf8');
    }
}
//# sourceMappingURL=playerlist.js.map