import * as fsPromises from 'node:fs/promises';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { McutilsError } from '@mcutils/core';
import { createWriteStream } from 'node:fs';
export class WorldBackup {
    static async create(options) {
        const { worldDir, output, timestamp = true } = options;
        if (!fs.existsSync(worldDir)) {
            throw new McutilsError(`World directory not found: ${worldDir}`);
        }
        const worldName = path.basename(worldDir);
        const ts = timestamp ? `_${Date.now()}` : '';
        const outputPath = output || `${worldName}${ts}.zip`;
        try {
            const archiver = require('archiver');
            return new Promise((resolve, reject) => {
                const output_stream = createWriteStream(outputPath);
                const archive = archiver('zip', { zlib: { level: 9 } });
                output_stream.on('close', () => resolve(outputPath));
                archive.on('error', (e) => reject(new McutilsError(e.message)));
                archive.pipe(output_stream);
                archive.directory(worldDir, worldName);
                archive.finalize();
            });
        }
        catch {
            const tar = require('tar');
            const ext = '.tar.gz';
            const tarPath = outputPath.replace(/\.zip$/, ext);
            await tar.c({ file: tarPath, gzip: true, cwd: path.dirname(worldDir) }, [worldName]);
            return tarPath;
        }
    }
    static async restore(backupFile, outputDir) {
        if (!fs.existsSync(backupFile)) {
            throw new McutilsError(`Backup file not found: ${backupFile}`);
        }
        if (backupFile.endsWith('.zip')) {
            try {
                const extractZip = require('extract-zip');
                await extractZip(backupFile, { dir: outputDir });
            }
            catch {
                const AdmZip = require('adm-zip');
                const zip = new AdmZip(backupFile);
                zip.extractAllTo(outputDir, true);
            }
        }
        else {
            const tar = require('tar');
            await tar.x({ file: backupFile, cwd: outputDir });
        }
    }
    static async listBackups(backupDir) {
        const files = await fsPromises.readdir(backupDir);
        const results = [];
        for (const f of files) {
            if (f.endsWith('.zip') || f.endsWith('.tar.gz') || f.endsWith('.tar')) {
                const stat = await fsPromises.stat(path.join(backupDir, f));
                results.push({ file: f, size: stat.size, date: stat.mtime });
            }
        }
        return results.sort((a, b) => b.date.getTime() - a.date.getTime());
    }
}
//# sourceMappingURL=backup.js.map