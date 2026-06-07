import * as fsPromises from 'node:fs/promises';
import * as fs from 'node:fs';
const LOG_LINE_REGEX = /^\[(\d{2}:\d{2}:\d{2})\]\s*\[([^\]]+)\/([^\]]+)\]:\s*(.*)$/;
const DEATH_PATTERN = /(slew|was slain|was shot|was blown up|was killed|hit the ground|drowned|burned|fell|died|was pricked|walked into|crammed|experienced|withered|was toasted|was poked|was obliterated|was impaled|was stung|was frozen|was lava|was crushed|was struck|was trampled|was skewered)/i;
const PATTERNS = {
    join: /joined the game/,
    leave: /left the game/,
    death: DEATH_PATTERN,
    achievement: /has (made the advancement|completed the challenge|reached goal)/i,
    chat: /<.+>\s/,
    kick: /was kicked/,
    ban: /was banned/,
    tps: /(TPS|mspt|Memory)/i,
};
export class LogParser {
    async parseFile(filePath) {
        const content = await fsPromises.readFile(filePath, 'utf8');
        return this.parseLines(content);
    }
    parseFileSync(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        return this.parseLines(content);
    }
    parseLines(content) {
        const lines = content.split(/\r?\n/);
        const events = [];
        for (const line of lines) {
            if (!line.trim())
                continue;
            const event = this.parseLine(line);
            if (event)
                events.push(event);
        }
        return events;
    }
    parseLine(line) {
        const match = line.match(LOG_LINE_REGEX);
        if (!match) {
            return { timestamp: new Date(), type: 'unknown', message: line, raw: line };
        }
        const [, timeStr, thread, level, message] = match;
        const timestamp = this.parseTime(timeStr);
        const type = this.detectType(message, level);
        return this.createEvent(type, timestamp, message, line);
    }
    parseTime(timeStr) {
        const [h, m, s] = timeStr.split(':').map(Number);
        const now = new Date();
        now.setHours(h ?? 0, m ?? 0, s ?? 0, 0);
        return now;
    }
    detectType(message, level) {
        if (level === 'ERROR')
            return 'error';
        if (level === 'WARN')
            return 'warn';
        for (const [type, pattern] of Object.entries(PATTERNS)) {
            if (pattern.test(message))
                return type;
        }
        return 'info';
    }
    createEvent(type, timestamp, message, raw) {
        const base = { timestamp, message, raw };
        switch (type) {
            case 'join': return { ...base, type, player: this.extractPlayer(message) ?? 'unknown' };
            case 'leave': return { ...base, type, player: this.extractPlayer(message) ?? 'unknown' };
            case 'death': return this.createDeathEvent(timestamp, message, raw);
            case 'chat': {
                const player = this.extractChatPlayer(raw) ?? 'unknown';
                const content = this.extractChatContent(message) ?? message;
                return { ...base, type, player, content };
            }
            case 'advancement': {
                const player = this.extractPlayer(message) ?? 'unknown';
                return { ...base, type, player, advancement: message, title: message };
            }
            default: return { ...base, type };
        }
    }
    createDeathEvent(timestamp, message, raw) {
        const player = message.split(' ')[0];
        return { timestamp, type: 'death', message, raw, player: player ?? 'unknown', cause: this.detectDeathCause(message) };
    }
    extractPlayer(message) {
        const match = message.match(/^(\w+)\s/);
        return match?.[1];
    }
    extractChatPlayer(raw) {
        const match = raw.match(/<(\w+)>/);
        return match?.[1];
    }
    extractChatContent(message) {
        const match = message.match(/^<\w+>\s+(.*)$/);
        return match?.[1];
    }
    detectDeathCause(message) {
        if (/slew/.test(message))
            return 'player';
        if (/was slain/.test(message))
            return 'player';
        if (/was shot/.test(message))
            return 'projectile';
        if (/blew up/.test(message))
            return 'explosion';
        if (/drowned/.test(message))
            return 'drowning';
        if (/burned|toast/.test(message))
            return 'fire';
        if (/fell|hit the ground/.test(message))
            return 'fall';
        if (/was killed/.test(message))
            return 'unknown';
        if (/magic/.test(message))
            return 'magic';
        if (/starve|hunger/.test(message))
            return 'starvation';
        return undefined;
    }
}
//# sourceMappingURL=parser.js.map