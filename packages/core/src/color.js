export const MINECRAFT_COLORS = {
    '0': { code: '0', name: 'black', rgb: [0, 0, 0], hex: '#000000' },
    '1': { code: '1', name: 'dark_blue', rgb: [0, 0, 170], hex: '#0000AA' },
    '2': { code: '2', name: 'dark_green', rgb: [0, 170, 0], hex: '#00AA00' },
    '3': { code: '3', name: 'dark_aqua', rgb: [0, 170, 170], hex: '#00AAAA' },
    '4': { code: '4', name: 'dark_red', rgb: [170, 0, 0], hex: '#AA0000' },
    '5': { code: '5', name: 'dark_purple', rgb: [170, 0, 170], hex: '#AA00AA' },
    '6': { code: '6', name: 'gold', rgb: [255, 170, 0], hex: '#FFAA00' },
    '7': { code: '7', name: 'gray', rgb: [170, 170, 170], hex: '#AAAAAA' },
    '8': { code: '8', name: 'dark_gray', rgb: [85, 85, 85], hex: '#555555' },
    '9': { code: '9', name: 'blue', rgb: [85, 85, 255], hex: '#5555FF' },
    'a': { code: 'a', name: 'green', rgb: [85, 255, 85], hex: '#55FF55' },
    'b': { code: 'b', name: 'aqua', rgb: [85, 255, 255], hex: '#55FFFF' },
    'c': { code: 'c', name: 'red', rgb: [255, 85, 85], hex: '#FF5555' },
    'd': { code: 'd', name: 'light_purple', rgb: [255, 85, 255], hex: '#FF55FF' },
    'e': { code: 'e', name: 'yellow', rgb: [255, 255, 85], hex: '#FFFF55' },
    'f': { code: 'f', name: 'white', rgb: [255, 255, 255], hex: '#FFFFFF' },
};
export const MINECRAFT_FORMATS = {
    'k': { code: 'k', name: 'obfuscated' },
    'l': { code: 'l', name: 'bold' },
    'm': { code: 'm', name: 'strikethrough' },
    'n': { code: 'n', name: 'underline' },
    'o': { code: 'o', name: 'italic' },
    'r': { code: 'r', name: 'reset' },
};
export function stripColorCodes(text) {
    return text.replace(/[\u00A7][0-9a-fk-or]/g, '');
}
export function motdToHtml(text) {
    let html = '';
    const segments = text.split(/([\u00A7][0-9a-fk-or])/g);
    let bold = false;
    let italic = false;
    let underline = false;
    let strikethrough = false;
    let obfuscated = false;
    let color = '#FFFFFF';
    for (const seg of segments) {
        if (!seg)
            continue;
        const match = seg.match(/^[\u00A7]([0-9a-fk-or])$/);
        if (match) {
            const code = match[1];
            if (code === 'r') {
                bold = italic = underline = strikethrough = obfuscated = false;
                color = '#FFFFFF';
            }
            else if (code === 'l')
                bold = true;
            else if (code === 'o')
                italic = true;
            else if (code === 'n')
                underline = true;
            else if (code === 'm')
                strikethrough = true;
            else if (code === 'k')
                obfuscated = true;
            else if (MINECRAFT_COLORS[code])
                color = MINECRAFT_COLORS[code].hex;
            continue;
        }
        if (!seg)
            continue;
        let styled = seg.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        if (obfuscated) {
            styled = '<span class="mc-obfuscated">' + styled + '</span>';
        }
        else {
            let style = 'color: ' + color;
            if (bold)
                style += '; font-weight: bold';
            if (italic)
                style += '; font-style: italic';
            if (underline)
                style += '; text-decoration: underline';
            if (strikethrough)
                style += '; text-decoration: line-through';
            styled = '<span style="' + style + '">' + styled + '</span>';
        }
        html += styled;
    }
    return html;
}
export function getColorName(code) {
    return MINECRAFT_COLORS[code]?.name;
}
export function getColorRgb(code) {
    return MINECRAFT_COLORS[code]?.rgb;
}
export function colorCodeToHex(code) {
    return MINECRAFT_COLORS[code]?.hex;
}
export function isValidColorCode(code) {
    return /^[0-9a-f]$/.test(code) && code in MINECRAFT_COLORS;
}
//# sourceMappingURL=color.js.map