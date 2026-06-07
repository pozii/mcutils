import { createSocket } from 'node:dgram';
import { Socket } from 'node:net';
import { SERVER_PORT_DEFAULT, PingError } from '@mcutils/core';
export async function pingServer(options) {
    const { host, port = SERVER_PORT_DEFAULT, timeout = 5000, protocol = 766 } = options;
    const startTime = Date.now();
    const resolved = await resolveSrv(host);
    const targetHost = resolved?.host ?? host;
    const targetPort = resolved?.port ?? port;
    const socket = createSocket('udp4');
    socket.unref();
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.close();
            reject(new PingError(`Connection timed out after ${timeout}ms`));
        }, timeout);
        socket.once('error', (err) => {
            clearTimeout(timer);
            socket.close();
            reject(new PingError(err.message));
        });
        const connectAndPing = async () => {
            try {
                const tcpSocket = new Socket();
                tcpSocket.setTimeout(timeout);
                tcpSocket.once('connect', async () => {
                    try {
                        const handshakePacket = createHandshakePacket(targetHost, targetPort, protocol);
                        tcpSocket.write(handshakePacket);
                        const requestPacket = createPingRequest();
                        tcpSocket.write(requestPacket);
                        let responseData = Buffer.alloc(0);
                        tcpSocket.on('data', (data) => {
                            responseData = Buffer.concat([responseData, data]);
                        });
                        tcpSocket.once('close', () => {
                            clearTimeout(timer);
                            try {
                                const result = parsePingResponse(responseData, startTime);
                                resolve(result);
                            }
                            catch (e) {
                                reject(e instanceof PingError ? e : new PingError(String(e)));
                            }
                        });
                    }
                    catch (e) {
                        clearTimeout(timer);
                        reject(new PingError(String(e)));
                    }
                });
                tcpSocket.once('error', (err) => {
                    clearTimeout(timer);
                    reject(new PingError(err.message));
                });
                tcpSocket.once('timeout', () => {
                    clearTimeout(timer);
                    tcpSocket.destroy();
                    reject(new PingError('TCP connection timed out'));
                });
                tcpSocket.connect(targetPort, targetHost);
            }
            catch (e) {
                clearTimeout(timer);
                reject(new PingError(String(e)));
            }
        };
        connectAndPing();
    });
}
async function resolveSrv(host) {
    if (host.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/))
        return null;
    if (host.includes(':'))
        return null;
    try {
        const dns = await import('node:dns');
        const records = await dns.promises.resolveSrv(`_minecraft._tcp.${host}`);
        if (records.length > 0) {
            return { host: records[0].name, port: records[0].port };
        }
    }
    catch {
        // no SRV record
    }
    return null;
}
function createHandshakePacket(host, port, protocol) {
    const hostBytes = Buffer.from(host, 'utf8');
    const packet = Buffer.alloc(1 + varIntSize(protocol) + hostBytes.length + 2 + 1);
    let offset = 0;
    packet[offset++] = 0x00;
    offset = writeVarInt(packet, offset, protocol);
    packet[offset++] = hostBytes.length;
    hostBytes.copy(packet, offset);
    offset += hostBytes.length;
    packet[offset++] = (port >> 8) & 0xFF;
    packet[offset++] = port & 0xFF;
    packet[offset++] = 1;
    return prependPacketLength(packet);
}
function createPingRequest() {
    return prependPacketLength(Buffer.from([0x00]));
}
function varIntSize(value) {
    let size = 0;
    do {
        size++;
        value >>>= 7;
    } while (value !== 0);
    return size;
}
function writeVarInt(buffer, offset, value) {
    do {
        let byte = value & 0x7F;
        value >>>= 7;
        if (value !== 0)
            byte |= 0x80;
        buffer[offset++] = byte;
    } while (value !== 0);
    return offset;
}
function readVarInt(buffer, offset) {
    let value = 0;
    let size = 0;
    while (true) {
        const byte = buffer[offset + size];
        value |= (byte & 0x7F) << (size * 7);
        size++;
        if (size > 5)
            throw new PingError('VarInt too big');
        if (!(byte & 0x80))
            break;
    }
    return { value, size };
}
function prependPacketLength(buffer) {
    const length = buffer.length;
    const lengthSize = varIntSize(length);
    const result = Buffer.alloc(lengthSize + length);
    writeVarInt(result, 0, length);
    buffer.copy(result, lengthSize);
    return result;
}
function parsePingResponse(data, startTime) {
    if (data.length === 0)
        throw new PingError('Empty response from server');
    let offset = 0;
    const { value: _packetLen, size: lenSize } = readVarInt(data, offset);
    offset += lenSize;
    if (offset >= data.length)
        throw new PingError('Invalid packet: missing packet ID');
    const packetId = data[offset++];
    if (packetId !== 0x00)
        throw new PingError(`Unexpected packet ID: ${packetId}`);
    const { value: jsonLen, size: jsonSize } = readVarInt(data, offset);
    offset += jsonSize;
    const jsonStr = data.toString('utf8', offset, offset + jsonLen);
    const parsed = JSON.parse(jsonStr);
    const latency = Date.now() - startTime;
    return {
        description: stripJsonDescription(parsed.description ?? ''),
        descriptionHtml: jsonDescriptionToHtml(parsed.description ?? ''),
        favicon: parsed.favicon,
        latency,
        players: {
            online: parsed.players?.online ?? 0,
            max: parsed.players?.max ?? 0,
            sample: parsed.players?.sample?.map((p) => ({
                name: p.name,
                id: p.id,
            })) ?? [],
        },
        version: {
            name: parsed.version?.name ?? 'Unknown',
            protocol: parsed.version?.protocol ?? -1,
        },
        modInfo: parsed.modinfo
            ? { type: parsed.modinfo.type, modList: parsed.modinfo.modList ?? [] }
            : undefined,
        enforcesSecureChat: parsed.enforcesSecureChat,
        previewsChat: parsed.previewsChat,
    };
}
function stripJsonDescription(desc) {
    if (typeof desc === 'string')
        return desc;
    if (Array.isArray(desc)) {
        return desc.map((c) => {
            if (typeof c === 'string')
                return c;
            if (c && typeof c === 'object' && 'text' in c)
                return String(c.text ?? '');
            return '';
        }).join('');
    }
    if (desc && typeof desc === 'object') {
        const d = desc;
        if (typeof d.text === 'string') {
            let text = d.text;
            if (Array.isArray(d.extra)) {
                text += d.extra.map((e) => {
                    if (typeof e === 'string')
                        return e;
                    if (e && typeof e === 'object' && 'text' in e)
                        return String(e.text ?? '');
                    return '';
                }).join('');
            }
            return text;
        }
    }
    return String(desc);
}
function jsonDescriptionToHtml(desc) {
    if (typeof desc === 'string')
        return desc.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (Array.isArray(desc)) {
        return desc.map((c) => {
            if (typeof c === 'string')
                return c.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            if (c && typeof c === 'object')
                return renderJsonComponent(c);
            return '';
        }).join('');
    }
    if (desc && typeof desc === 'object') {
        return renderJsonComponent(desc);
    }
    return String(desc);
}
function renderJsonComponent(comp) {
    let text = String(comp.text ?? '');
    text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let styles = [];
    if (comp.color)
        styles.push(`color: ${comp.color}`);
    if (comp.bold)
        styles.push('font-weight: bold');
    if (comp.italic)
        styles.push('font-style: italic');
    if (comp.underlined)
        styles.push('text-decoration: underline');
    if (comp.strikethrough)
        styles.push('text-decoration: line-through');
    if (styles.length > 0) {
        text = `<span style="${styles.join('; ')}">${text}</span>`;
    }
    if (Array.isArray(comp.extra)) {
        text += comp.extra.map((e) => {
            if (typeof e === 'string')
                return e.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            if (e && typeof e === 'object')
                return renderJsonComponent(e);
            return '';
        }).join('');
    }
    return text;
}
//# sourceMappingURL=ping.js.map