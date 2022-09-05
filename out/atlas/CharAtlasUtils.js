"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.is256Color = exports.configEquals = exports.generateConfig = void 0;
const NULL_COLOR = {
    css: '',
    rgba: 0
};
function generateConfig(scaledCellWidth, scaledCellHeight, scaledCharWidth, scaledCharHeight, terminal, colors) {
    const clonedColors = {
        foreground: colors.foreground,
        background: colors.background,
        cursor: NULL_COLOR,
        cursorAccent: NULL_COLOR,
        selectionForeground: NULL_COLOR,
        selectionBackgroundTransparent: NULL_COLOR,
        selectionBackgroundOpaque: NULL_COLOR,
        selectionInactiveBackgroundTransparent: NULL_COLOR,
        selectionInactiveBackgroundOpaque: NULL_COLOR,
        ansi: colors.ansi.slice(),
        contrastCache: colors.contrastCache
    };
    return {
        customGlyphs: terminal.options.customGlyphs,
        devicePixelRatio: window.devicePixelRatio,
        letterSpacing: terminal.options.letterSpacing,
        lineHeight: terminal.options.lineHeight,
        scaledCellWidth,
        scaledCellHeight,
        scaledCharWidth,
        scaledCharHeight,
        fontFamily: terminal.options.fontFamily,
        fontSize: terminal.options.fontSize,
        fontWeight: terminal.options.fontWeight,
        fontWeightBold: terminal.options.fontWeightBold,
        allowTransparency: terminal.options.allowTransparency,
        drawBoldTextInBrightColors: terminal.options.drawBoldTextInBrightColors,
        minimumContrastRatio: terminal.options.minimumContrastRatio,
        colors: clonedColors
    };
}
exports.generateConfig = generateConfig;
function configEquals(a, b) {
    for (let i = 0; i < a.colors.ansi.length; i++) {
        if (a.colors.ansi[i].rgba !== b.colors.ansi[i].rgba) {
            return false;
        }
    }
    return a.devicePixelRatio === b.devicePixelRatio &&
        a.customGlyphs === b.customGlyphs &&
        a.lineHeight === b.lineHeight &&
        a.letterSpacing === b.letterSpacing &&
        a.fontFamily === b.fontFamily &&
        a.fontSize === b.fontSize &&
        a.fontWeight === b.fontWeight &&
        a.fontWeightBold === b.fontWeightBold &&
        a.allowTransparency === b.allowTransparency &&
        a.scaledCharWidth === b.scaledCharWidth &&
        a.scaledCharHeight === b.scaledCharHeight &&
        a.drawBoldTextInBrightColors === b.drawBoldTextInBrightColors &&
        a.minimumContrastRatio === b.minimumContrastRatio &&
        a.colors.foreground === b.colors.foreground &&
        a.colors.background === b.colors.background;
}
exports.configEquals = configEquals;
function is256Color(colorCode) {
    return (colorCode & 50331648) === 16777216 || (colorCode & 50331648) === 33554432;
}
exports.is256Color = is256Color;
//# sourceMappingURL=CharAtlasUtils.js.map