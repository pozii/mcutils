import { LogEvent } from '@mcutils/core';
export declare class LogParser {
    parseFile(filePath: string): Promise<LogEvent[]>;
    parseFileSync(filePath: string): LogEvent[];
    parseLines(content: string): LogEvent[];
    parseLine(line: string): LogEvent | null;
    private parseTime;
    private detectType;
    private createEvent;
    private createDeathEvent;
    private extractPlayer;
    private extractChatPlayer;
    private extractChatContent;
    private detectDeathCause;
}
//# sourceMappingURL=parser.d.ts.map