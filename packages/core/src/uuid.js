import { createHash } from 'node:crypto';
export function uuidOffline(username) {
    const hash = createHash('md5')
        .update(`OfflinePlayer:${username}`)
        .digest();
    hash[6] = (hash[6] & 0x0f) | 0x30;
    hash[8] = (hash[8] & 0x3f) | 0x80;
    return formatUuid(hash);
}
export function uuidOnline(username, serverId) {
    const hash = createHash('md5')
        .update(serverId)
        .digest();
    hash[6] = (hash[6] & 0x0f) | 0x30;
    hash[8] = (hash[8] & 0x3f) | 0x80;
    return formatUuid(hash);
}
export function parseUuid(uuid) {
    const clean = uuid.replace(/-/g, '');
    if (clean.length !== 32) {
        throw new Error(`Invalid UUID: ${uuid}`);
    }
    return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
}
export function stripUuid(uuid) {
    return uuid.replace(/-/g, '').toLowerCase();
}
export function uuidToBytes(uuid) {
    const clean = stripUuid(uuid);
    return Buffer.from(clean, 'hex');
}
export function bytesToUuid(bytes) {
    if (bytes.length !== 16) {
        throw new Error(`Invalid UUID byte length: ${bytes.length}`);
    }
    return formatUuid(bytes);
}
function formatUuid(hash) {
    const hex = hash.toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export async function resolveUsernameToUuid(username) {
    try {
        const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`);
        if (!response.ok)
            return null;
        const data = await response.json();
        return {
            uuid: parseUuid(data.id),
            username: data.name,
            onlineMode: true,
        };
    }
    catch {
        return null;
    }
}
export async function resolveUuidToUsername(uuid) {
    try {
        const clean = stripUuid(uuid);
        const response = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${clean}`);
        if (!response.ok)
            return null;
        const data = await response.json();
        return data.name;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=uuid.js.map