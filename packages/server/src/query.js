import { createSocket } from 'node:dgram';
import { PingError } from '@mcutils/core';
import { SERVER_PORT_DEFAULT } from '@mcutils/core';
const QUERY_MAGIC = Buffer.from('FE FD', 'hex');
const QUERY_TYPE_HANDSHAKE = 9;
const QUERY_TYPE_STAT = 0;
export async function queryServer(host, port = SERVER_PORT_DEFAULT, timeout = 5000, full = false) {
    const socket = createSocket('udp4');
    socket.unref();
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.close();
            reject(new PingError(`Query timed out after ${timeout}ms`));
        }, timeout);
        socket.once('error', (err) => {
            clearTimeout(timer);
            socket.close();
            reject(new PingError(err.message));
        });
        const token = generateChallengeToken();
        const handshake = Buffer.alloc(7 + token.length);
        handshake[0] = 0xFE;
        handshake[1] = 0xFD;
        handshake[2] = QUERY_TYPE_HANDSHAKE;
        handshake.writeInt32BE(1, 3);
        handshake.set(token, 7);
        socket.send(handshake, port, host, (err) => {
            if (err) {
                clearTimeout(timer);
                socket.close();
                reject(new PingError(err.message));
                return;
            }
        });
        const responseBuf = Buffer.alloc(0);
        socket.on('message', (msg) => {
            try {
                clearTimeout(timer);
                if (msg.length >= 5 && msg[2] === QUERY_TYPE_HANDSHAKE) {
                    const challengeToken = msg.readInt32BE(5).toString();
                    const request = createStatRequest(parseInt(challengeToken), full);
                    socket.send(request, port, host, (err2) => {
                        if (err2) {
                            socket.close();
                            reject(new PingError(err2.message));
                        }
                    });
                    const newTimer = setTimeout(() => {
                        socket.close();
                        reject(new PingError('Query stat response timed out'));
                    }, timeout);
                    socket.once('message', (statMsg) => {
                        clearTimeout(newTimer);
                        socket.close();
                        try {
                            const result = parseStatResponse(statMsg, full);
                            resolve(result);
                        }
                        catch (e) {
                            reject(e instanceof PingError ? e : new PingError(String(e)));
                        }
                    });
                    socket.once('error', (err3) => {
                        clearTimeout(newTimer);
                        socket.close();
                        reject(new PingError(err3.message));
                    });
                }
            }
            catch (e) {
                socket.close();
                reject(new PingError(String(e)));
            }
        });
    });
}
function generateChallengeToken() {
    const buf = Buffer.alloc(4);
    buf.writeInt32BE(Math.floor(Math.random() * 0x7FFFFFFF), 0);
    return buf;
}
function createStatRequest(challengeToken, full) {
    const buf = Buffer.alloc(11);
    buf[0] = 0xFE;
    buf[1] = 0xFD;
    buf[2] = QUERY_TYPE_STAT;
    buf.writeInt32BE(1, 3);
    buf.writeInt32BE(challengeToken, 7);
    buf[11] = full ? 0x00 : undefined;
    return full ? Buffer.concat([buf, Buffer.alloc(1)]) : buf;
}
function parseStatResponse(msg, full) {
    let offset = 5;
    const result = {
        motd: '', gameType: '', gameId: '', version: '', plugins: '',
        map: '', numPlayers: 0, maxPlayers: 0, hostPort: 0, hostIp: '',
        players: [], raw: {},
    };
    if (!full) {
        const pairs = readKvPairs(msg, offset);
        result.motd = pairs['hostname'] ?? '';
        result.gameType = pairs['gametype'] ?? '';
        result.gameId = pairs['game_id'] ?? '';
        result.version = pairs['version'] ?? '';
        result.plugins = pairs['plugins'] ?? '';
        result.map = pairs['map'] ?? '';
        result.numPlayers = parseInt(pairs['numplayers'] ?? '0');
        result.maxPlayers = parseInt(pairs['maxplayers'] ?? '0');
        result.hostPort = parseInt(pairs['hostport'] ?? '0');
        result.hostIp = pairs['hostip'] ?? '';
        result.raw = pairs;
    }
    else {
        const kvEnd = msg.indexOf(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), offset);
        if (kvEnd === -1)
            throw new PingError('Invalid full stat response');
        const kvData = msg.subarray(offset, kvEnd);
        const pairs = readKvPairsRaw(kvData);
        result.motd = pairs['hostname'] ?? '';
        result.gameType = pairs['gametype'] ?? '';
        result.gameId = pairs['game_id'] ?? '';
        result.version = pairs['version'] ?? '';
        result.plugins = pairs['plugins'] ?? '';
        result.map = pairs['map'] ?? '';
        result.numPlayers = parseInt(pairs['numplayers'] ?? '0');
        result.maxPlayers = parseInt(pairs['maxplayers'] ?? '0');
        result.hostPort = parseInt(pairs['hostport'] ?? '0');
        result.hostIp = pairs['hostip'] ?? '';
        result.raw = pairs;
        const playerStart = kvEnd + 10;
        if (playerStart < msg.length) {
            const playerData = msg.subarray(playerStart);
            const playerStr = playerData.toString('utf8');
            const players = playerStr.split('\0').filter(Boolean).filter(p => p.length > 0);
            result.players = players;
        }
    }
    return result;
}
function readKvPairs(msg, start) {
    const pairs = {};
    const str = msg.toString('utf8', start);
    const entries = str.split('\0');
    for (let i = 0; i < entries.length - 1; i += 2) {
        if (entries[i] && entries[i + 1] !== undefined) {
            pairs[entries[i]] = entries[i + 1];
        }
    }
    return pairs;
}
function readKvPairsRaw(data) {
    const pairs = {};
    const str = data.toString('utf8');
    const entries = str.split('\0');
    for (let i = 0; i < entries.length - 1; i += 2) {
        if (entries[i] && entries[i + 1] !== undefined) {
            pairs[entries[i]] = entries[i + 1];
        }
    }
    return pairs;
}
//# sourceMappingURL=query.js.map