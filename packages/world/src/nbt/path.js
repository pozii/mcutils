import { NBT_TAG_COMPOUND, NBT_TAG_LIST, } from './types.js';
export function getTagAtPath(root, path) {
    const parts = path.split('.');
    let current = root;
    for (const part of parts) {
        if (current.type === NBT_TAG_COMPOUND) {
            const compound = current;
            current = compound.value.get(part);
            if (!current)
                return undefined;
        }
        else if (current.type === NBT_TAG_LIST) {
            const list = current;
            const index = parseInt(part, 10);
            if (isNaN(index) || index < 0 || index >= list.value.length)
                return undefined;
            current = list.value[index];
        }
        else {
            return undefined;
        }
    }
    return current;
}
export function getValueAtPath(root, path) {
    const tag = getTagAtPath(root, path);
    if (!tag)
        return undefined;
    return nbtToValue(tag);
}
export function setValueAtPath(root, path, value, create = false) {
    const parts = path.split('.');
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (current.type === NBT_TAG_COMPOUND) {
            const compound = current;
            let next = compound.value.get(part);
            if (!next) {
                if (!create)
                    return false;
                next = { type: NBT_TAG_COMPOUND, value: new Map() };
                compound.value.set(part, next);
            }
            current = next;
        }
        else {
            return false;
        }
    }
    if (current.type !== NBT_TAG_COMPOUND)
        return false;
    const compound = current;
    const lastPart = parts[parts.length - 1];
    const tag = valueToNbt(value);
    if (tag) {
        compound.value.set(lastPart, tag);
        return true;
    }
    return false;
}
export function nbtToValue(tag) {
    switch (tag.type) {
        case 0: return null;
        case 1: return tag.value;
        case 2: return tag.value;
        case 3: return tag.value;
        case 4: return Number(tag.value);
        case 5: return tag.value;
        case 6: return tag.value;
        case 7: return tag.value;
        case 8: return tag.value;
        case 9: {
            const list = tag;
            return list.value.map(nbtToValue);
        }
        case 10: {
            const compound = tag;
            const obj = {};
            for (const [key, val] of compound.value) {
                obj[key] = nbtToValue(val);
            }
            return obj;
        }
        case 11: return tag.value;
        case 12: return tag.value.map(Number);
        default: return null;
    }
}
export function valueToNbt(value) {
    if (value === null || value === undefined)
        return null;
    if (typeof value === 'boolean')
        return { type: 1, value: value ? 1 : 0 };
    if (typeof value === 'number') {
        if (Number.isInteger(value) && value >= -128 && value <= 127)
            return { type: 1, value };
        if (Number.isInteger(value) && value >= -32768 && value <= 32767)
            return { type: 2, value };
        if (Number.isInteger(value))
            return { type: 3, value };
        return { type: 5, value };
    }
    if (typeof value === 'string')
        return { type: 8, value };
    if (typeof value === 'bigint')
        return { type: 4, value };
    if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === 'number') {
            if (value.every(v => Number.isInteger(v)))
                return { type: 11, value };
        }
        if (value.length > 0 && typeof value[0] === 'bigint') {
            return { type: 12, value };
        }
        if (value.length > 0 && typeof value[0] === 'object') {
            const elements = value.map(v => valueToNbt(v)).filter(Boolean);
            const elementType = elements.length > 0 ? elements[0].type : 1;
            return { type: 9, elementType, value: elements };
        }
        return { type: 9, elementType: 1, value: [] };
    }
    if (typeof value === 'object') {
        const map = new Map();
        for (const [key, val] of Object.entries(value)) {
            const tag = valueToNbt(val);
            if (tag)
                map.set(key, tag);
        }
        return { type: 10, value: map };
    }
    return null;
}
//# sourceMappingURL=path.js.map