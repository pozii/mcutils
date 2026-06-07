import { describe, it, expect } from 'vitest'
import { ServerController } from '../packages/server/src/control.js'
import { WorldBackup } from '../packages/server/src/backup.js'
import { queryServer } from '../packages/server/src/query.js'
import { ServerProperties } from '../packages/server/src/properties.js'
import { validateSchema, inferSchema } from '../packages/world/src/nbt/schema.js'
import { NbtWriter } from '../packages/world/src/nbt/writer.js'
import { NbtReader } from '../packages/world/src/nbt/reader.js'
import { blockName, itemName, biomeName } from '../packages/core/src/mcdata.js'

describe('Server Control', () => {
  it('throws when trying to stop a non-running server', async () => {
    const ctrl = new ServerController({ jarPath: 'server.jar', serverDir: '/tmp' })
    await expect(ctrl.stop()).resolves.toBeUndefined()
  })
})

describe('ServerProperties', () => {
  it('supports chaining set operations', async () => {
    const props = ServerProperties.create()
    props.set('a', 1).set('b', true).set('c', 'test')
    expect(props.get('a')).toBe('1')
    expect(props.getBoolean('b')).toBe(true)
    expect(props.get('c')).toBe('test')
  })

  it('handles typed getters', () => {
    const props = ServerProperties.create()
    props.set('port', '25565').set('online', 'true').set('count', '42')
    expect(props.getNumber('port')).toBe(25565)
    expect(props.getBoolean('online')).toBe(true)
    expect(props.getNumber('count')).toBe(42)
  })

  it('produces typed data object', () => {
    const props = ServerProperties.create()
    props.set('max-players', 50).set('online-mode', false).set('motd', 'Hello')
    const data = props.toData()
    expect(data['max-players']).toBe(50)
    expect(data['online-mode']).toBe(false)
    expect(data['motd']).toBe('Hello')
  })
})

describe('NBT Schema', () => {
  it('validates a correct schema', () => {
    const tag = { type: 10, value: new Map([
      ['name', { type: 8, value: 'test' }],
      ['value', { type: 3, value: 42 }],
    ])}
    const schema = [
      { name: 'name', type: 'string' as const, required: true },
      { name: 'value', type: 'int' as const, required: true },
    ]
    const errors = validateSchema(tag as any, schema)
    expect(errors).toHaveLength(0)
  })

  it('reports missing required fields', () => {
    const tag = { type: 10, value: new Map() }
    const schema = [{ name: 'name', type: 'string' as const, required: true }]
    const errors = validateSchema(tag as any, schema)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('name')
  })

  it('infers schema from compound', () => {
    const tag = { type: 10, value: new Map([
      ['name', { type: 8, value: 'test' }],
      ['count', { type: 3, value: 5 }],
    ])}
    const schema = inferSchema(tag as any)
    expect(schema).toHaveLength(2)
    expect(schema[0].name).toBe('name')
    expect(schema[0].type).toBe('string')
  })
})

describe('Minecraft Data', () => {
  it('resolves block names', () => {
    expect(blockName('minecraft:stone')).toBe('Stone')
    expect(blockName('invalid')).toBeUndefined()
  })

  it('resolves item names', () => {
    expect(itemName('minecraft:diamond')).toBe('Diamond')
  })

  it('resolves biome names', () => {
    expect(biomeName('minecraft:plains')).toBe('Plains')
  })
})

describe('Server Query', () => {
  it('rejects on invalid host', async () => {
    await expect(queryServer('0.0.0.0', 1, 1000)).rejects.toThrow()
  })
})
