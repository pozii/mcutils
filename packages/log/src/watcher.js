import { EventEmitter } from 'node:events';
import * as fs from 'node:fs';
import * as readline from 'node:readline';
import { LogParser } from './parser.js';
export class LogWatcher extends EventEmitter {
    rl = null;
    parser = new LogParser();
    watching = false;
    filePath = '';
    async watch(filePath, options = {}) {
        if (this.watching)
            throw new Error('Already watching a file');
        this.watching = true;
        this.filePath = filePath;
        const stream = fs.createReadStream(filePath, {
            flags: 'r',
            encoding: 'utf8',
            start: options.tail ? undefined : 0,
        });
        this.rl = readline.createInterface({ input: stream });
        this.rl.on('line', (line) => {
            if (!line.trim())
                return;
            const event = this.parser.parseLine(line);
            if (event) {
                this.emit('event', event);
                this.emit(event.type, event);
            }
        });
        this.rl.on('close', () => {
            if (this.watching) {
                setTimeout(() => this.watch(filePath, { tail: true }), 100);
            }
        });
        this.rl.on('error', (err) => {
            this.emit('error', err);
        });
    }
    stop() {
        this.watching = false;
        if (this.rl) {
            this.rl.close();
            this.rl = null;
        }
    }
}
//# sourceMappingURL=watcher.js.map