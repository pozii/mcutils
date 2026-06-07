export interface BackupOptions {
    worldDir: string;
    output: string;
    compress?: 'zip' | 'tar.gz' | 'none';
    exclude?: string[];
    timestamp?: boolean;
}
export declare class WorldBackup {
    static create(options: BackupOptions): Promise<string>;
    static restore(backupFile: string, outputDir: string): Promise<void>;
    static listBackups(backupDir: string): Promise<{
        file: string;
        size: number;
        date: Date;
    }[]>;
}
//# sourceMappingURL=backup.d.ts.map