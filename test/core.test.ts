import { describe, it, expect } from 'vitest'
import { uuidOffline, parseUuid, stripUuid } from '../packages/core/src/uuid.js'
import { stripColorCodes, motdToHtml } from '../packages/core/src/color.js'
import { protocolToVersion } from '../packages/core/src/constants.js'

describe('UUID', () => {
  it('generates offline UUID', () => {
    const uuid = uuidOffline('Notch')
    expect(uuid).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('parses UUID with dashes', () => {
    const uuid = parseUuid('550e8400e29b41d4a716446655440000')
    expect(uuid).toBe('550e8400-e29b-41d4-a716-446655440000')
  })

  it('strips UUID dashes', () => {
    const result = stripUuid('550e8400-e29b-41d4-a716-446655440000')
    expect(result).toBe('550e8400e29b41d4a716446655440000')
  })
})

describe('Color', () => {
  it('strips color codes', () => {
    expect(stripColorCodes('§aHello §bWorld')).toBe('Hello World')
  })

  it('converts MOTD to HTML', () => {
    const html = motdToHtml('§aHello §lWorld')
    expect(html).toContain('Hello')
  })
})

describe('Constants', () => {
  it('maps protocol to version', () => {
    expect(protocolToVersion(766)).toBe('1.21.4')
    expect(protocolToVersion(999)).toContain('Unknown')
  })
})
