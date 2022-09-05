"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTerminalFromCache = exports.acquireCharAtlas = void 0;
const CharAtlasUtils_1 = require("./CharAtlasUtils");
const WebglCharAtlas_1 = require("./WebglCharAtlas");
const charAtlasCache = [];
function acquireCharAtlas(terminal, colors, scaledCellWidth, scaledCellHeight, scaledCharWidth, scaledCharHeight) {
    const newConfig = (0, CharAtlasUtils_1.generateConfig)(scaledCellWidth, scaledCellHeight, scaledCharWidth, scaledCharHeight, terminal, colors);
    for (let i = 0; i < charAtlasCache.length; i++) {
        const entry = charAtlasCache[i];
        const ownedByIndex = entry.ownedBy.indexOf(terminal);
        if (ownedByIndex >= 0) {
            if ((0, CharAtlasUtils_1.configEquals)(entry.config, newConfig)) {
                return entry.atlas;
            }
            if (entry.ownedBy.length === 1) {
                entry.atlas.dispose();
                charAtlasCache.splice(i, 1);
            }
            else {
                entry.ownedBy.splice(ownedByIndex, 1);
            }
            break;
        }
    }
    for (let i = 0; i < charAtlasCache.length; i++) {
        const entry = charAtlasCache[i];
        if ((0, CharAtlasUtils_1.configEquals)(entry.config, newConfig)) {
            entry.ownedBy.push(terminal);
            return entry.atlas;
        }
    }
    const core = terminal._core;
    const newEntry = {
        atlas: new WebglCharAtlas_1.WebglCharAtlas(document, newConfig, core.unicodeService),
        config: newConfig,
        ownedBy: [terminal]
    };
    charAtlasCache.push(newEntry);
    return newEntry.atlas;
}
exports.acquireCharAtlas = acquireCharAtlas;
function removeTerminalFromCache(terminal) {
    for (let i = 0; i < charAtlasCache.length; i++) {
        const index = charAtlasCache[i].ownedBy.indexOf(terminal);
        if (index !== -1) {
            if (charAtlasCache[i].ownedBy.length === 1) {
                charAtlasCache[i].atlas.dispose();
                charAtlasCache.splice(i, 1);
            }
            else {
                charAtlasCache[i].ownedBy.splice(index, 1);
            }
            break;
        }
    }
}
exports.removeTerminalFromCache = removeTerminalFromCache;
//# sourceMappingURL=CharAtlasCache.js.map