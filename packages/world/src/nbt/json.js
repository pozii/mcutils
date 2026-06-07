import { NBT_TAG_END, NBT_TAG_BYTE, NBT_TAG_SHORT, NBT_TAG_INT, NBT_TAG_LONG, NBT_TAG_FLOAT, NBT_TAG_DOUBLE, NBT_TAG_BYTE_ARRAY, NBT_TAG_STRING, NBT_TAG_LIST, NBT_TAG_COMPOUND, NBT_TAG_INT_ARRAY, NBT_TAG_LONG_ARRAY, } from './types.js';
const TAG_NAMES = {
    [NBT_TAG_END]: 'end',
    [NBT_TAG_BYTE]: 'byte',
    [NBT_TAG_SHORT]: 'short',
    [NBT_TAG_INT]: 'int',
    [NBT_TAG_LONG]: 'long',
    [NBT_TAG_FLOAT]: 'float',
    [NBT_TAG_DOUBLE]: 'double',
    [NBT_TAG_BYTE_ARRAY]: 'byteArray',
    [NBT_TAG_STRING]: 'string',
    [NBT_TAG_LIST]: 'list',
    [NBT_TAG_COMPOUND]: 'compound',
    [NBT_TAG_INT_ARRAY]: 'intArray',
    [NBT_TAG_LONG_ARRAY]: 'longArray',
};
export function toJson(tag, options = {}) {
    const { simplify = true } = options;
    if (simplify) {
        return toSimplifiedJson(tag, options);
    }
    return toVerboseJson(tag, options);
}
function toSimplifiedJson(tag, options) {
    const maxLen = options.maxArrayLength ?? 256;
    switch (tag.type) {
        case NBT_TAG_END: return null;
        case NBT_TAG_BYTE: return tag.value;
        case NBT_TAG_SHORT: return tag.value;
        case NBT_TAG_INT: return tag.value;
        case NBT_TAG_LONG: return Number(tag.value);
        case NBT_TAG_FLOAT: return tag.value;
        case NBT_TAG_DOUBLE: return tag.value;
        case NBT_TAG_BYTE_ARRAY: {
            const arr = tag.value;
            if (arr.length > maxLen)
                return `[${arr.length} bytes]`;
            return arr;
        }
        case NBT_TAG_STRING: return tag.value;
        case NBT_TAG_LIST: {
            const list = tag;
            return list.value.map(t => toSimplifiedJson(t, options));
        }
        case NBT_TAG_COMPOUND: {
            const compound = tag;
            const obj = {};
            for (const [key, val] of compound.value) {
                obj[key] = toSimplifiedJson(val, options);
            }
            return obj;
        }
        case NBT_TAG_INT_ARRAY: {
            const arr = tag.value;
            if (arr.length > maxLen)
                return `[${arr.length} ints]`;
            return arr;
        }
        case NBT_TAG_LONG_ARRAY: {
            const arr = tag.value;
            if (arr.length > maxLen)
                return `[${arr.length} longs]`;
            return arr.map(Number);
        }
        default: return null;
    }
}
function toVerboseJson(tag, options) {
    const maxLen = options.maxArrayLength ?? 256;
    switch (tag.type) {
        case NBT_TAG_END: return { type: 'end' };
        case NBT_TAG_BYTE: return { type: 'byte', value: tag.value };
        case NBT_TAG_SHORT: return { type: 'short', value: tag.value };
        case NBT_TAG_INT: return { type: 'int', value: tag.value };
        case NBT_TAG_LONG: return { type: 'long', value: Number(tag.value) };
        case NBT_TAG_FLOAT: return { type: 'float', value: tag.value };
        case NBT_TAG_DOUBLE: return { type: 'double', value: tag.value };
        case NBT_TAG_BYTE_ARRAY: {
            const arr = tag.value;
            return { type: 'byteArray', value: arr.length > maxLen ? `[${arr.length} bytes]` : arr };
        }
        case NBT_TAG_STRING: return { type: 'string', value: tag.value };
        case NBT_TAG_LIST: {
            const list = tag;
            return { type: 'list', elementType: TAG_NAMES[list.elementType] || `unknown_${list.elementType}`, value: list.value.map(t => toVerboseJson(t, options)) };
        }
        case NBT_TAG_COMPOUND: {
            const compound = tag;
            const obj = {};
            for (const [key, val] of compound.value) {
                obj[key] = toVerboseJson(val, options);
            }
            return { type: 'compound', value: obj };
        }
        case NBT_TAG_INT_ARRAY: {
            const arr = tag.value;
            return { type: 'intArray', value: arr.length > maxLen ? `[${arr.length} ints]` : arr };
        }
        case NBT_TAG_LONG_ARRAY: {
            const arr = tag.value;
            return { type: 'longArray', value: arr.length > maxLen ? `[${arr.length} longs]` : arr.map(Number) };
        }
        default: return null;
    }
}
export function toJsonString(tag, options = {}) {
    const data = toJson(tag, options);
    return JSON.stringify(data, null, options.pretty ? 2 : undefined);
}
export function fromJson(json) {
    const map = new Map();
    for (const [key, val] of Object.entries(json)) {
        const tag = jsonValueToNbt(val);
        if (tag)
            map.set(key, tag);
    }
    return { type: NBT_TAG_COMPOUND, value: map };
}
function jsonValueToNbt(val) {
    if (val === null || val === undefined)
        return null;
    if (typeof val === 'boolean')
        return { type: NBT_TAG_BYTE, value: val ? 1 : 0 };
    if (typeof val === 'number') {
        if (Number.isInteger(val) && val >= -128 && val <= 127)
            return { type: NBT_TAG_BYTE, value: val };
        if (Number.isInteger(val) && val >= -32768 && val <= 32767)
            return { type: NBT_TAG_SHORT, value: val };
        if (Number.isInteger(val))
            return { type: NBT_TAG_INT, value: val };
        return { type: NBT_TAG_DOUBLE, value: val };
    }
    if (typeof val === 'string')
        return { type: NBT_TAG_STRING, value: val };
    if (Array.isArray(val)) {
        if (val.length === 0)
            return { type: NBT_TAG_LIST, elementType: NBT_TAG_END, value: [] };
        const elements = val.map(v => jsonValueToNbt(v)).filter(Boolean);
        const elementType = elements.length > 0 ? elements[0].type : NBT_TAG_END;
        return { type: NBT_TAG_LIST, elementType, value: elements };
    }
    if (typeof val === 'object') {
        const obj = val;
        if (obj.type === 'compound' && obj.value) {
            return fromJson(obj.value);
        }
        const map = new Map();
        for (const [key, value] of Object.entries(obj)) {
            const tag = jsonValueToNbt(value);
            if (tag)
                map.set(key, tag);
        }
        return { type: NBT_TAG_COMPOUND, value: map };
    }
    return null;
}
//# sourceMappingURL=json.js.map