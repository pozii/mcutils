import { describe, it, expect } from 'vitest'
import { LogParser } from '../packages/log/src/index.js'

describe('LogParser', () => {
  const parser = new LogParser()

  it('parses join event', () => {
    const line = '[12:00:00] [Server thread/INFO]: Steve joined the game'
    const event = parser.parseLine(line)
    expect(event?.type).toBe('join')
    if (event?.type === 'join') {
      expect(event.player).toBe('Steve')
    }
  })

  it('parses leave event', () => {
    const line = '[12:00:00] [Server thread/INFO]: Alex left the game'
    const event = parser.parseLine(line)
    expect(event?.type).toBe('leave')
    if (event?.type === 'leave') {
      expect(event.player).toBe('Alex')
    }
  })

  it('parses chat event', () => {
    const line = '[12:00:00] [Server thread/INFO]: <Steve> Hello everyone!'
    const event = parser.parseLine(line)
    expect(event?.type).toBe('chat')
    if (event?.type === 'chat') {
      expect(event.content).toBe('Hello everyone!')
    }
  })

  it('parses death event', () => {
    const line = '[12:00:00] [Server thread/INFO]: Steve was slain by Zombie'
    const event = parser.parseLine(line)
    expect(event?.type).toBe('death')
  })

  it('returns unknown for unrecognized lines', () => {
    const line = '[12:00:00] [Server thread/INFO]: Done (1.234s)! For help, type "help"'
    const event = parser.parseLine(line)
    expect(event?.type).toBe('info')
  })
})
