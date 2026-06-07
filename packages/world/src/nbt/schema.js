export function validateSchema(tag, schema) {
    const errors = [];
    if (tag.type !== 10) {
        errors.push('Root must be a compound tag');
        return errors;
    }
    validateCompound(tag, schema, errors, '');
    return errors;
}
function validateCompound(compound, fields, errors, path) {
    for (const field of fields) {
        const tag = compound.value.get(field.name);
        if (!tag) {
            if (field.required)
                errors.push(`${path}${field.name}: required but missing`);
            continue;
        }
        const tagType = typeName(tag.type);
        if (tagType !== field.type) {
            errors.push(`${path}${field.name}: expected ${field.type}, got ${tagType}`);
            continue;
        }
        if (field.type === 'list' && field.elementType && tag.type === 9) {
            const list = tag;
            if (list.elementType !== typeToId(field.elementType)) {
                errors.push(`${path}${field.name}: expected list<${field.elementType}>`);
            }
        }
        if (field.type === 'compound' && field.fields && tag.type === 10) {
            validateCompound(tag, field.fields, errors, `${path}${field.name}.`);
        }
    }
}
const TAG_NAMES = {
    1: 'byte', 2: 'short', 3: 'int', 4: 'long',
    5: 'float', 6: 'double', 7: 'byte_array', 8: 'string',
    9: 'list', 10: 'compound', 11: 'int_array', 12: 'long_array',
};
function typeName(type) {
    return TAG_NAMES[type] ?? 'unknown';
}
function typeToId(type) {
    const map = {
        byte: 1, short: 2, int: 3, long: 4, float: 5, double: 6,
        byte_array: 7, string: 8, list: 9, compound: 10, int_array: 11, long_array: 12,
    };
    return map[type] ?? 0;
}
export function inferSchema(tag) {
    if (tag.type !== 10)
        return [];
    const compound = tag;
    const fields = [];
    for (const [name, value] of compound.value) {
        const t = typeName(value.type);
        const field = { name, type: t };
        if (t === 'list' && value.type === 9) {
            field.elementType = typeName(value.elementType);
        }
        if (t === 'compound' && value.type === 10) {
            field.fields = inferSchema(value);
        }
        fields.push(field);
    }
    return fields;
}
//# sourceMappingURL=schema.js.map