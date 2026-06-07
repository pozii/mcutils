import { Socket } from 'node:net';
import { RconError, RconAuthError } from '@mcutils/core';
const RCON_TYPE_AUTH = 3;
const RCON_TYPE_COMMAND = 2;
const RCON_TYPE_RESPONSE = 0;
const RCON_TYPE_AUTH_RESPONSE = 2;
export class RconClient {
    options;
    socket = null;
    authenticated = false;
    requestId = 0;
    pending = new Map();
    buffer = Buffer.alloc(0);
    timeout;
    constructor(options) {
        this.options = options;
        this.timeout = options.timeout ?? 10000;
    }
    async connect() {
        if (this.socket) {
            throw new RconError('Already connected');
        }
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.close();
                reject(new RconError('Connection timed out'));
            }, this.timeout);
            this.socket = new Socket();
            this.socket.setTimeout(this.timeout);
            this.socket.on('connect', async () => {
                clearTimeout(timer);
                try {
                    await this.authenticate();
                    resolve();
                }
                catch (e) {
                    reject(e);
                }
            });
            this.socket.on('data', (data) => {
                this.handleData(data);
            });
            this.socket.on('error', (err) => {
                clearTimeout(timer);
                reject(new RconError(err.message));
            });
            this.socket.on('timeout', () => {
                clearTimeout(timer);
                this.close();
                reject(new RconError('Socket timed out'));
            });
            this.socket.on('close', () => {
                this.authenticated = false;
                this.socket = null;
                for (const [, pending] of this.pending) {
                    pending.reject(new RconError('Connection closed'));
                }
                this.pending.clear();
            });
            this.socket.connect(this.options.port, this.options.host);
        });
    }
    async sendCommand(command) {
        if (!this.socket || !this.authenticated) {
            throw new RconError('Not connected or authenticated');
        }
        return this.sendPacket(RCON_TYPE_COMMAND, command);
    }
    async exec(command) {
        return this.sendCommand(command);
    }
    async run(commands) {
        const results = [];
        for (const cmd of commands) {
            results.push(await this.sendCommand(cmd));
        }
        return results;
    }
    close() {
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
        }
        this.authenticated = false;
        this.pending.clear();
    }
    get isAuthenticated() {
        return this.authenticated;
    }
    get isConnected() {
        return this.socket !== null && this.socket.readyState === 'open';
    }
    async authenticate() {
        const id = ++this.requestId;
        const packet = this.createPacket(id, RCON_TYPE_AUTH, this.options.password);
        this.socket.write(packet);
        return new Promise((resolve, reject) => {
            const authTimer = setTimeout(() => {
                this.pending.delete(id);
                reject(new RconError('Authentication timed out'));
            }, this.timeout);
            this.pending.set(id, {
                resolve: () => {
                    clearTimeout(authTimer);
                    this.authenticated = true;
                    resolve();
                },
                reject: (err) => {
                    clearTimeout(authTimer);
                    reject(err);
                },
            });
        });
    }
    async sendPacket(type, body) {
        const id = ++this.requestId;
        const packet = this.createPacket(id, type, body);
        this.socket.write(packet);
        return new Promise((resolve, reject) => {
            const cmdTimer = setTimeout(() => {
                this.pending.delete(id);
                reject(new RconError(`Command timed out: ${body}`));
            }, this.timeout);
            this.pending.set(id, {
                resolve: (response) => {
                    clearTimeout(cmdTimer);
                    resolve(response);
                },
                reject: (err) => {
                    clearTimeout(cmdTimer);
                    reject(err);
                },
            });
        });
    }
    createPacket(id, type, body) {
        const bodyBuffer = Buffer.from(body, 'utf8');
        const length = 4 + 4 + bodyBuffer.length + 2;
        const packet = Buffer.alloc(4 + length);
        packet.writeInt32LE(length, 0);
        packet.writeInt32LE(id, 4);
        packet.writeInt32LE(type, 8);
        bodyBuffer.copy(packet, 12);
        packet.writeInt16LE(0, 12 + bodyBuffer.length);
        return packet;
    }
    handleData(data) {
        this.buffer = Buffer.concat([this.buffer, data]);
        while (this.buffer.length >= 12) {
            const length = this.buffer.readInt32LE(0);
            if (length < 0 || length > 65535) {
                this.buffer = Buffer.alloc(0);
                return;
            }
            if (this.buffer.length < 4 + length)
                break;
            const id = this.buffer.readInt32LE(4);
            const type = this.buffer.readInt32LE(8);
            const body = this.buffer.toString('utf8', 12, 4 + length - 2);
            this.buffer = this.buffer.slice(4 + length);
            if (id === -1) {
                const pending = this.pending.get(this.requestId);
                if (pending) {
                    this.pending.delete(this.requestId);
                    pending.reject(new RconAuthError());
                }
                return;
            }
            const pending = this.pending.get(id);
            if (pending) {
                this.pending.delete(id);
                if (type === RCON_TYPE_AUTH_RESPONSE) {
                    pending.resolve(body);
                }
                else {
                    pending.resolve(body);
                }
            }
        }
    }
}
export async function rconCommand(options, command) {
    const client = new RconClient(options);
    await client.connect();
    try {
        return await client.sendCommand(command);
    }
    finally {
        client.close();
    }
}
export async function rconCommands(options, commands) {
    const client = new RconClient(options);
    await client.connect();
    try {
        return await client.run(commands);
    }
    finally {
        client.close();
    }
}
//# sourceMappingURL=rcon.js.map