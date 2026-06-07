import { ChildProcess, spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as fsPromises from 'node:fs/promises'
import * as path from 'node:path'
import { EventEmitter } from 'node:events'
import { McutilsError, ServerControlError } from '@mcutils/core'

export interface ServerControlOptions {
  jarPath: string
  serverDir: string
  javaPath?: string
  minRam?: string
  maxRam?: string
  javaArgs?: string[]
  autoRestart?: boolean
}

export class ServerController extends EventEmitter {
  private process: ChildProcess | null = null
  private options: ServerControlOptions
  private running = false
  private restartCount = 0
  private buffer = ""

  constructor(options: ServerControlOptions) {
    super()
    this.options = {
      javaPath: 'java',
      minRam: '1G',
      maxRam: '2G',
      javaArgs: [],
      autoRestart: false,
      ...options,
    }
  }

  async start(): Promise<void> {
    if (this.running) throw new ServerControlError('Server is already running')
    this.ensureEula()

    const args = [
      `-Xms${this.options.minRam}`,
      `-Xmx${this.options.maxRam}`,
      ...this.options.javaArgs!,
      '-jar', this.options.jarPath,
      'nogui',
    ]

    this.process = spawn(this.options.javaPath!, args, {
      cwd: this.options.serverDir,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    this.running = true
    this.emit('start')

    this.process.stdout?.on('data', (data: Buffer) => {
      const text = data.toString('utf8')
      this.buffer += text
      this.emit('output', text)
      for (const line of text.split('\n')) {
        if (line.includes('Done') || line.includes('For help')) {
          this.emit('ready')
        }
      }
    })

    this.process.stderr?.on('data', (data: Buffer) => {
      this.emit('error', data.toString('utf8'))
    })

    this.process.on('exit', (code) => {
      this.running = false
      this.emit('stop', code)
      if (this.options.autoRestart && code !== 0) {
        this.restartCount++
        this.emit('restarting', this.restartCount)
        this.start()
      }
    })
  }

  async stop(timeout = 30000): Promise<void> {
    if (!this.running || !this.process) return
    this.sendCommand('stop')
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.process?.kill('SIGKILL')
        this.running = false
        resolve()
      }, timeout)
      this.process!.on('exit', () => {
        clearTimeout(timer)
        this.running = false
        resolve()
      })
    })
  }

  async restart(timeout?: number): Promise<void> {
    this.options.autoRestart = true
    await this.stop(timeout)
  }

  sendCommand(command: string): void {
    if (!this.running || !this.process?.stdin) {
      throw new ServerControlError('Server is not running')
    }
    this.process.stdin.write(command + '\n')
  }

  get isRunning(): boolean { return this.running }
  get log(): string { return this.buffer }

  private async ensureEula(): Promise<void> {
    const eulaPath = path.join(this.options.serverDir, 'eula.txt')
    try {
      const content = await fsPromises.readFile(eulaPath, 'utf8')
      if (content.includes('eula=true')) return
    } catch {}
    await fsPromises.writeFile(eulaPath, 'eula=true\n', 'utf8')
  }

  static async findServerJar(dir: string): Promise<string | null> {
    const files = await fsPromises.readdir(dir)
    const jar = files.find(f => f.endsWith('.jar') && (f.includes('server') || f.includes('paper') || f.includes('spigot') || f.includes('fabric') || f.includes('forge')))
    return jar ? path.join(dir, jar) : null
  }
}

export async function startServer(options: ServerControlOptions): Promise<ServerController> {
  const ctrl = new ServerController(options)
  await ctrl.start()
  return ctrl
}
