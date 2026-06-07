import { describe, it, expect } from 'vitest'
import { NbtReader, toJsonString } from '../packages/world/src/index.js'
import { NbtWriter } from '../packages/world/src/nbt/writer.js'
import { NbtReader as NbtReader2 } from '../packages/world/src/nbt/reader.js'
import { NBT_TAG_COMPOUND } from '../packages/world/src/nbt/types.js'

describe('NBT Reader', () => {
  it('reads simple NBT data from buffer', () => {
    const writer = new NbtWriter()
    const buffer = writer.writeFile({
      root: {
        type: 10,
        value: new Map([
          ['name', { type: 8, value: 'Hello' }],
          ['value', { type: 3, value: 42 }],
          ['flag', { type: 1, value: 1 }],
        ]),
      },
      compression: 'none',
    }, 'root')
    const reader = new NbtReader(buffer)
    const file = reader.readFile()
    expect(file.root.type).toBe(10)
    const nameEntry = file.root.value.get('name')
    expect(nameEntry?.type).toBe(8)
    if (nameEntry?.type === 8) {
      expect((nameEntry as any).value).toBe('Hello')
    }
    const valueEntry = file.root.value.get('value')
    expect(valueEntry?.type).toBe(3)
    if (valueEntry?.type === 3) {
      expect((valueEntry as any).value).toBe(42)
    }
    const flagEntry = file.root.value.get('flag')
    expect(flagEntry?.type).toBe(1)
    if (flagEntry?.type === 1) {
      expect((flagEntry as any).value).toBe(1)
    }
  })
})

describe('ServerProperties', () => {
  it('parses server.properties content', async () => {
    const { ServerProperties } = await import('../packages/server/src/properties.js')
    const props = ServerProperties.create()
    props.set('max-players', 50)
      .set('difficulty', 'hard')
      .set('online-mode', true)
    expect(props.get('max-players')).toBe('50')
    expect(props.get('difficulty')).toBe('hard')
    expect(props.getBoolean('online-mode')).toBe(true)
  })
})
