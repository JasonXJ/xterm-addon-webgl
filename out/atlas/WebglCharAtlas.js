"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebglCharAtlas = void 0;
const Constants_1 = require("browser/renderer/Constants");
const Constants_2 = require("common/buffer/Constants");
const WebglUtils_1 = require("../WebglUtils");
const AttributeData_1 = require("common/buffer/AttributeData");
const Color_1 = require("common/Color");
const CustomGlyphs_1 = require("browser/renderer/CustomGlyphs");
const RendererUtils_1 = require("browser/renderer/RendererUtils");
const MultiKeyMap_1 = require("common/MultiKeyMap");
const TEXTURE_WIDTH = 1024;
const TEXTURE_HEIGHT = 1024;
const TEXTURE_CAPACITY = Math.floor(TEXTURE_HEIGHT * 0.8);
const TRANSPARENT_COLOR = {
    css: 'rgba(0, 0, 0, 0)',
    rgba: 0
};
const NULL_RASTERIZED_GLYPH = {
    offset: { x: 0, y: 0 },
    texturePosition: { x: 0, y: 0 },
    texturePositionClipSpace: { x: 0, y: 0 },
    size: { x: 0, y: 0 },
    sizeClipSpace: { x: 0, y: 0 }
};
const TMP_CANVAS_GLYPH_PADDING = 2;
const w = {
    glyph: undefined
};
class WebglCharAtlas {
    constructor(document, _config, _unicodeService) {
        this._config = _config;
        this._unicodeService = _unicodeService;
        this._didWarmUp = false;
        this._cacheMap = new MultiKeyMap_1.FourKeyMap();
        this._cacheMapCombined = new MultiKeyMap_1.FourKeyMap();
        this._currentRow = {
            x: 0,
            y: 0,
            height: 0
        };
        this._fixedRows = [];
        this.hasCanvasChanged = false;
        this._workBoundingBox = { top: 0, left: 0, bottom: 0, right: 0 };
        this._workAttributeData = new AttributeData_1.AttributeData();
        this.cacheCanvas = document.createElement('canvas');
        this.cacheCanvas.width = TEXTURE_WIDTH;
        this.cacheCanvas.height = TEXTURE_HEIGHT;
        this._cacheCtx = (0, WebglUtils_1.throwIfFalsy)(this.cacheCanvas.getContext('2d', { alpha: true }));
        this._tmpCanvas = document.createElement('canvas');
        this._tmpCanvas.width = this._config.scaledCellWidth * 4 + TMP_CANVAS_GLYPH_PADDING * 2;
        this._tmpCanvas.height = this._config.scaledCellHeight + TMP_CANVAS_GLYPH_PADDING * 2;
        this._tmpCtx = (0, WebglUtils_1.throwIfFalsy)(this._tmpCanvas.getContext('2d', { alpha: this._config.allowTransparency }));
    }
    dispose() {
        if (this.cacheCanvas.parentElement) {
            this.cacheCanvas.parentElement.removeChild(this.cacheCanvas);
        }
    }
    warmUp() {
        if (!this._didWarmUp) {
            this._doWarmUp();
            this._didWarmUp = true;
        }
    }
    _doWarmUp() {
        for (let i = 33; i < 126; i++) {
            const rasterizedGlyph = this._drawToCache(i, Constants_2.DEFAULT_COLOR, Constants_2.DEFAULT_COLOR, Constants_2.DEFAULT_EXT);
            this._cacheMap.set(i, Constants_2.DEFAULT_COLOR, Constants_2.DEFAULT_COLOR, Constants_2.DEFAULT_EXT, rasterizedGlyph);
        }
    }
    beginFrame() {
        if (this._currentRow.y > TEXTURE_CAPACITY) {
            this.clearTexture();
            this.warmUp();
            return true;
        }
        return false;
    }
    clearTexture() {
        if (this._currentRow.x === 0 && this._currentRow.y === 0) {
            return;
        }
        this._cacheCtx.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
        this._cacheMap.clear();
        this._cacheMapCombined.clear();
        this._currentRow.x = 0;
        this._currentRow.y = 0;
        this._currentRow.height = 0;
        this._fixedRows.length = 0;
        this._didWarmUp = false;
    }
    getRasterizedGlyphCombinedChar(chars, bg, fg, ext) {
        return this._getFromCacheMap(this._cacheMapCombined, chars, bg, fg, ext);
    }
    getRasterizedGlyph(code, bg, fg, ext) {
        return this._getFromCacheMap(this._cacheMap, code, bg, fg, ext);
    }
    _getFromCacheMap(cacheMap, key, bg, fg, ext) {
        w.glyph = cacheMap.get(key, bg, fg, ext);
        if (!w.glyph) {
            w.glyph = this._drawToCache(key, bg, fg, ext);
            cacheMap.set(key, bg, fg, ext, w.glyph);
        }
        return w.glyph;
    }
    _getColorFromAnsiIndex(idx) {
        if (idx >= this._config.colors.ansi.length) {
            throw new Error('No color found for idx ' + idx);
        }
        return this._config.colors.ansi[idx];
    }
    _getBackgroundColor(bgColorMode, bgColor, inverse, dim) {
        if (this._config.allowTransparency) {
            return TRANSPARENT_COLOR;
        }
        let result;
        switch (bgColorMode) {
            case 16777216:
            case 33554432:
                result = this._getColorFromAnsiIndex(bgColor);
                break;
            case 50331648:
                const arr = AttributeData_1.AttributeData.toColorRGB(bgColor);
                result = Color_1.rgba.toColor(arr[0], arr[1], arr[2]);
                break;
            case 0:
            default:
                if (inverse) {
                    result = this._config.colors.foreground;
                }
                else {
                    result = this._config.colors.background;
                }
                break;
        }
        if (dim) {
            result = Color_1.color.blend(this._config.colors.background, Color_1.color.multiplyOpacity(result, Constants_1.DIM_OPACITY));
        }
        return result;
    }
    _getForegroundColor(bg, bgColorMode, bgColor, fg, fgColorMode, fgColor, inverse, dim, bold, excludeFromContrastRatioDemands) {
        const minimumContrastColor = this._getMinimumContrastColor(bg, bgColorMode, bgColor, fg, fgColorMode, fgColor, false, bold, excludeFromContrastRatioDemands);
        if (minimumContrastColor) {
            return minimumContrastColor;
        }
        let result;
        switch (fgColorMode) {
            case 16777216:
            case 33554432:
                if (this._config.drawBoldTextInBrightColors && bold && fgColor < 8) {
                    fgColor += 8;
                }
                result = this._getColorFromAnsiIndex(fgColor);
                break;
            case 50331648:
                const arr = AttributeData_1.AttributeData.toColorRGB(fgColor);
                result = Color_1.rgba.toColor(arr[0], arr[1], arr[2]);
                break;
            case 0:
            default:
                if (inverse) {
                    result = this._config.colors.background;
                }
                else {
                    result = this._config.colors.foreground;
                }
        }
        if (this._config.allowTransparency) {
            result = Color_1.color.opaque(result);
        }
        if (dim) {
            result = Color_1.color.multiplyOpacity(result, Constants_1.DIM_OPACITY);
        }
        return result;
    }
    _resolveBackgroundRgba(bgColorMode, bgColor, inverse) {
        switch (bgColorMode) {
            case 16777216:
            case 33554432:
                return this._getColorFromAnsiIndex(bgColor).rgba;
            case 50331648:
                return bgColor << 8;
            case 0:
            default:
                if (inverse) {
                    return this._config.colors.foreground.rgba;
                }
                return this._config.colors.background.rgba;
        }
    }
    _resolveForegroundRgba(fgColorMode, fgColor, inverse, bold) {
        switch (fgColorMode) {
            case 16777216:
            case 33554432:
                if (this._config.drawBoldTextInBrightColors && bold && fgColor < 8) {
                    fgColor += 8;
                }
                return this._getColorFromAnsiIndex(fgColor).rgba;
            case 50331648:
                return fgColor << 8;
            case 0:
            default:
                if (inverse) {
                    return this._config.colors.background.rgba;
                }
                return this._config.colors.foreground.rgba;
        }
    }
    _getMinimumContrastColor(bg, bgColorMode, bgColor, fg, fgColorMode, fgColor, inverse, bold, excludeFromContrastRatioDemands) {
        if (this._config.minimumContrastRatio === 1 || excludeFromContrastRatioDemands) {
            return undefined;
        }
        const adjustedColor = this._config.colors.contrastCache.getColor(bg, fg);
        if (adjustedColor !== undefined) {
            return adjustedColor || undefined;
        }
        const bgRgba = this._resolveBackgroundRgba(bgColorMode, bgColor, inverse);
        const fgRgba = this._resolveForegroundRgba(fgColorMode, fgColor, inverse, bold);
        const result = Color_1.rgba.ensureContrastRatio(bgRgba, fgRgba, this._config.minimumContrastRatio);
        if (!result) {
            this._config.colors.contrastCache.setColor(bg, fg, null);
            return undefined;
        }
        const color = Color_1.rgba.toColor((result >> 24) & 0xFF, (result >> 16) & 0xFF, (result >> 8) & 0xFF);
        this._config.colors.contrastCache.setColor(bg, fg, color);
        return color;
    }
    _drawToCache(codeOrChars, bg, fg, ext) {
        const chars = typeof codeOrChars === 'number' ? String.fromCharCode(codeOrChars) : codeOrChars;
        this.hasCanvasChanged = true;
        const allowedWidth = this._config.scaledCellWidth * Math.max(chars.length, 2) + TMP_CANVAS_GLYPH_PADDING * 2;
        if (this._tmpCanvas.width < allowedWidth) {
            this._tmpCanvas.width = allowedWidth;
        }
        const allowedHeight = this._config.scaledCellHeight + TMP_CANVAS_GLYPH_PADDING * 4;
        if (this._tmpCanvas.height < allowedHeight) {
            this._tmpCanvas.height = allowedHeight;
        }
        this._tmpCtx.save();
        this._workAttributeData.fg = fg;
        this._workAttributeData.bg = bg;
        this._workAttributeData.extended.ext = ext;
        const invisible = !!this._workAttributeData.isInvisible();
        if (invisible) {
            return NULL_RASTERIZED_GLYPH;
        }
        const bold = !!this._workAttributeData.isBold();
        const inverse = !!this._workAttributeData.isInverse();
        const dim = !!this._workAttributeData.isDim();
        const italic = !!this._workAttributeData.isItalic();
        const underline = !!this._workAttributeData.isUnderline();
        const strikethrough = !!this._workAttributeData.isStrikethrough();
        let fgColor = this._workAttributeData.getFgColor();
        let fgColorMode = this._workAttributeData.getFgColorMode();
        let bgColor = this._workAttributeData.getBgColor();
        let bgColorMode = this._workAttributeData.getBgColorMode();
        if (inverse) {
            const temp = fgColor;
            fgColor = bgColor;
            bgColor = temp;
            const temp2 = fgColorMode;
            fgColorMode = bgColorMode;
            bgColorMode = temp2;
        }
        const backgroundColor = this._getBackgroundColor(bgColorMode, bgColor, inverse, dim);
        this._tmpCtx.globalCompositeOperation = 'copy';
        this._tmpCtx.fillStyle = backgroundColor.css;
        this._tmpCtx.fillRect(0, 0, this._tmpCanvas.width, this._tmpCanvas.height);
        this._tmpCtx.globalCompositeOperation = 'source-over';
        const fontWeight = bold ? this._config.fontWeightBold : this._config.fontWeight;
        const fontStyle = italic ? 'italic' : '';
        this._tmpCtx.font =
            `${fontStyle} ${fontWeight} ${this._config.fontSize * this._config.devicePixelRatio}px ${this._config.fontFamily}`;
        this._tmpCtx.textBaseline = Constants_1.TEXT_BASELINE;
        const powerlineGlyph = chars.length === 1 && (0, RendererUtils_1.isPowerlineGlyph)(chars.charCodeAt(0));
        const restrictedPowerlineGlyph = chars.length === 1 && (0, RendererUtils_1.isRestrictedPowerlineGlyph)(chars.charCodeAt(0));
        const foregroundColor = this._getForegroundColor(bg, bgColorMode, bgColor, fg, fgColorMode, fgColor, inverse, dim, bold, (0, RendererUtils_1.excludeFromContrastRatioDemands)(chars.charCodeAt(0)));
        this._tmpCtx.fillStyle = foregroundColor.css;
        const padding = restrictedPowerlineGlyph ? 0 : TMP_CANVAS_GLYPH_PADDING * 2;
        let customGlyph = false;
        if (this._config.customGlyphs !== false) {
            customGlyph = (0, CustomGlyphs_1.tryDrawCustomChar)(this._tmpCtx, chars, padding, padding, this._config.scaledCellWidth, this._config.scaledCellHeight, this._config.fontSize);
        }
        let enableClearThresholdCheck = !powerlineGlyph;
        let chWidth;
        if (typeof codeOrChars === 'number') {
            chWidth = this._unicodeService.wcwidth(codeOrChars);
        }
        else {
            chWidth = this._unicodeService.getStringCellWidth(codeOrChars);
        }
        if (underline) {
            this._tmpCtx.save();
            const lineWidth = Math.max(1, Math.floor(this._config.fontSize * window.devicePixelRatio / 15));
            const yOffset = lineWidth % 2 === 1 ? 0.5 : 0;
            this._tmpCtx.lineWidth = lineWidth;
            if (this._workAttributeData.isUnderlineColorDefault()) {
                this._tmpCtx.strokeStyle = this._tmpCtx.fillStyle;
            }
            else if (this._workAttributeData.isUnderlineColorRGB()) {
                enableClearThresholdCheck = false;
                this._tmpCtx.strokeStyle = `rgb(${AttributeData_1.AttributeData.toColorRGB(this._workAttributeData.getUnderlineColor()).join(',')})`;
            }
            else {
                enableClearThresholdCheck = false;
                let fg = this._workAttributeData.getUnderlineColor();
                if (this._config.drawBoldTextInBrightColors && this._workAttributeData.isBold() && fg < 8) {
                    fg += 8;
                }
                this._tmpCtx.strokeStyle = this._getColorFromAnsiIndex(fg).css;
            }
            this._tmpCtx.beginPath();
            const xLeft = padding;
            const yTop = Math.ceil(padding + this._config.scaledCharHeight) - yOffset;
            const yMid = padding + this._config.scaledCharHeight + lineWidth - yOffset;
            const yBot = Math.ceil(padding + this._config.scaledCharHeight + lineWidth * 2) - yOffset;
            for (let i = 0; i < chWidth; i++) {
                this._tmpCtx.save();
                const xChLeft = xLeft + i * this._config.scaledCellWidth;
                const xChRight = xLeft + (i + 1) * this._config.scaledCellWidth;
                const xChMid = xChLeft + this._config.scaledCellWidth / 2;
                switch (this._workAttributeData.extended.underlineStyle) {
                    case 2:
                        this._tmpCtx.moveTo(xChLeft, yTop);
                        this._tmpCtx.lineTo(xChRight, yTop);
                        this._tmpCtx.moveTo(xChLeft, yBot);
                        this._tmpCtx.lineTo(xChRight, yBot);
                        break;
                    case 3:
                        const yCurlyBot = lineWidth <= 1 ? yBot : Math.ceil(padding + this._config.scaledCharHeight - lineWidth / 2) - yOffset;
                        const yCurlyTop = lineWidth <= 1 ? yTop : Math.ceil(padding + this._config.scaledCharHeight + lineWidth / 2) - yOffset;
                        const clipRegion = new Path2D();
                        clipRegion.rect(xChLeft, yTop, this._config.scaledCellWidth, yBot - yTop);
                        this._tmpCtx.clip(clipRegion);
                        this._tmpCtx.moveTo(xChLeft - this._config.scaledCellWidth / 2, yMid);
                        this._tmpCtx.bezierCurveTo(xChLeft - this._config.scaledCellWidth / 2, yCurlyTop, xChLeft, yCurlyTop, xChLeft, yMid);
                        this._tmpCtx.bezierCurveTo(xChLeft, yCurlyBot, xChMid, yCurlyBot, xChMid, yMid);
                        this._tmpCtx.bezierCurveTo(xChMid, yCurlyTop, xChRight, yCurlyTop, xChRight, yMid);
                        this._tmpCtx.bezierCurveTo(xChRight, yCurlyBot, xChRight + this._config.scaledCellWidth / 2, yCurlyBot, xChRight + this._config.scaledCellWidth / 2, yMid);
                        break;
                    case 4:
                        this._tmpCtx.setLineDash([window.devicePixelRatio * 2, window.devicePixelRatio]);
                        this._tmpCtx.moveTo(xChLeft, yTop);
                        this._tmpCtx.lineTo(xChRight, yTop);
                        break;
                    case 5:
                        this._tmpCtx.setLineDash([window.devicePixelRatio * 4, window.devicePixelRatio * 3]);
                        this._tmpCtx.moveTo(xChLeft, yTop);
                        this._tmpCtx.lineTo(xChRight, yTop);
                        break;
                    case 1:
                    default:
                        this._tmpCtx.moveTo(xChLeft, yTop);
                        this._tmpCtx.lineTo(xChRight, yTop);
                        break;
                }
                this._tmpCtx.stroke();
                this._tmpCtx.restore();
            }
            this._tmpCtx.restore();
            if (!customGlyph && this._config.fontSize >= 12) {
                if (!this._config.allowTransparency && chars !== ' ') {
                    this._tmpCtx.save();
                    this._tmpCtx.textBaseline = 'alphabetic';
                    const metrics = this._tmpCtx.measureText(chars);
                    this._tmpCtx.restore();
                    if ('actualBoundingBoxDescent' in metrics && metrics.actualBoundingBoxDescent > 0) {
                        this._tmpCtx.save();
                        const clipRegion = new Path2D();
                        clipRegion.rect(xLeft, yTop - Math.ceil(lineWidth / 2), this._config.scaledCellWidth, yBot - yTop + Math.ceil(lineWidth / 2));
                        this._tmpCtx.clip(clipRegion);
                        this._tmpCtx.lineWidth = window.devicePixelRatio * 3;
                        this._tmpCtx.strokeStyle = backgroundColor.css;
                        this._tmpCtx.strokeText(chars, padding, padding + this._config.scaledCharHeight);
                        this._tmpCtx.restore();
                    }
                }
            }
        }
        if (!customGlyph) {
            this._tmpCtx.fillText(chars, padding, padding + this._config.scaledCharHeight);
        }
        if (chars === '_' && !this._config.allowTransparency) {
            let isBeyondCellBounds = clearColor(this._tmpCtx.getImageData(padding, padding, this._config.scaledCellWidth, this._config.scaledCellHeight), backgroundColor, foregroundColor, enableClearThresholdCheck);
            if (isBeyondCellBounds) {
                for (let offset = 1; offset <= 5; offset++) {
                    this._tmpCtx.save();
                    this._tmpCtx.fillStyle = backgroundColor.css;
                    this._tmpCtx.fillRect(0, 0, this._tmpCanvas.width, this._tmpCanvas.height);
                    this._tmpCtx.restore();
                    this._tmpCtx.fillText(chars, padding, padding + this._config.scaledCharHeight - offset);
                    isBeyondCellBounds = clearColor(this._tmpCtx.getImageData(padding, padding, this._config.scaledCellWidth, this._config.scaledCellHeight), backgroundColor, foregroundColor, enableClearThresholdCheck);
                    if (!isBeyondCellBounds) {
                        break;
                    }
                }
            }
        }
        if (strikethrough) {
            const lineWidth = Math.max(1, Math.floor(this._config.fontSize * window.devicePixelRatio / 10));
            const yOffset = this._tmpCtx.lineWidth % 2 === 1 ? 0.5 : 0;
            this._tmpCtx.lineWidth = lineWidth;
            this._tmpCtx.strokeStyle = this._tmpCtx.fillStyle;
            this._tmpCtx.beginPath();
            this._tmpCtx.moveTo(padding, padding + Math.floor(this._config.scaledCharHeight / 2) - yOffset);
            this._tmpCtx.lineTo(padding + this._config.scaledCharWidth * chWidth, padding + Math.floor(this._config.scaledCharHeight / 2) - yOffset);
            this._tmpCtx.stroke();
        }
        this._tmpCtx.restore();
        const imageData = this._tmpCtx.getImageData(0, 0, this._tmpCanvas.width, this._tmpCanvas.height);
        let isEmpty;
        if (!this._config.allowTransparency) {
            isEmpty = clearColor(imageData, backgroundColor, foregroundColor, enableClearThresholdCheck);
        }
        else {
            isEmpty = checkCompletelyTransparent(imageData);
        }
        if (isEmpty) {
            return NULL_RASTERIZED_GLYPH;
        }
        const rasterizedGlyph = this._findGlyphBoundingBox(imageData, this._workBoundingBox, allowedWidth, restrictedPowerlineGlyph, customGlyph, padding);
        const clippedImageData = this._clipImageData(imageData, this._workBoundingBox);
        let activeRow;
        while (true) {
            activeRow = this._currentRow;
            for (const row of this._fixedRows) {
                if ((activeRow === this._currentRow || row.height < activeRow.height) && rasterizedGlyph.size.y <= row.height) {
                    activeRow = row;
                }
            }
            if (activeRow.height > rasterizedGlyph.size.y * 2) {
                if (this._currentRow.height > 0) {
                    this._fixedRows.push(this._currentRow);
                }
                activeRow = {
                    x: 0,
                    y: this._currentRow.y + this._currentRow.height,
                    height: rasterizedGlyph.size.y
                };
                this._fixedRows.push(activeRow);
                this._currentRow = {
                    x: 0,
                    y: activeRow.y + activeRow.height,
                    height: 0
                };
            }
            if (activeRow.x + rasterizedGlyph.size.x <= TEXTURE_WIDTH) {
                break;
            }
            if (activeRow === this._currentRow) {
                activeRow.x = 0;
                activeRow.y += activeRow.height;
                activeRow.height = 0;
            }
            else {
                this._fixedRows.splice(this._fixedRows.indexOf(activeRow), 1);
            }
        }
        rasterizedGlyph.texturePosition.x = activeRow.x;
        rasterizedGlyph.texturePosition.y = activeRow.y;
        rasterizedGlyph.texturePositionClipSpace.x = activeRow.x / TEXTURE_WIDTH;
        rasterizedGlyph.texturePositionClipSpace.y = activeRow.y / TEXTURE_HEIGHT;
        activeRow.height = Math.max(activeRow.height, rasterizedGlyph.size.y);
        activeRow.x += rasterizedGlyph.size.x;
        this._cacheCtx.putImageData(clippedImageData, rasterizedGlyph.texturePosition.x, rasterizedGlyph.texturePosition.y);
        return rasterizedGlyph;
    }
    _findGlyphBoundingBox(imageData, boundingBox, allowedWidth, restrictedGlyph, customGlyph, padding) {
        boundingBox.top = 0;
        const height = restrictedGlyph ? this._config.scaledCellHeight : this._tmpCanvas.height;
        const width = restrictedGlyph ? this._config.scaledCellWidth : allowedWidth;
        let found = false;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const alphaOffset = y * this._tmpCanvas.width * 4 + x * 4 + 3;
                if (imageData.data[alphaOffset] !== 0) {
                    boundingBox.top = y;
                    found = true;
                    break;
                }
            }
            if (found) {
                break;
            }
        }
        boundingBox.left = 0;
        found = false;
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const alphaOffset = y * this._tmpCanvas.width * 4 + x * 4 + 3;
                if (imageData.data[alphaOffset] !== 0) {
                    boundingBox.left = x;
                    found = true;
                    break;
                }
            }
            if (found) {
                break;
            }
        }
        boundingBox.right = width;
        found = false;
        for (let x = width - 1; x >= 0; x--) {
            for (let y = 0; y < height; y++) {
                const alphaOffset = y * this._tmpCanvas.width * 4 + x * 4 + 3;
                if (imageData.data[alphaOffset] !== 0) {
                    boundingBox.right = x;
                    found = true;
                    break;
                }
            }
            if (found) {
                break;
            }
        }
        boundingBox.bottom = height;
        found = false;
        for (let y = height - 1; y >= 0; y--) {
            for (let x = 0; x < width; x++) {
                const alphaOffset = y * this._tmpCanvas.width * 4 + x * 4 + 3;
                if (imageData.data[alphaOffset] !== 0) {
                    boundingBox.bottom = y;
                    found = true;
                    break;
                }
            }
            if (found) {
                break;
            }
        }
        return {
            texturePosition: { x: 0, y: 0 },
            texturePositionClipSpace: { x: 0, y: 0 },
            size: {
                x: boundingBox.right - boundingBox.left + 1,
                y: boundingBox.bottom - boundingBox.top + 1
            },
            sizeClipSpace: {
                x: (boundingBox.right - boundingBox.left + 1) / TEXTURE_WIDTH,
                y: (boundingBox.bottom - boundingBox.top + 1) / TEXTURE_HEIGHT
            },
            offset: {
                x: -boundingBox.left + padding + ((restrictedGlyph || customGlyph) ? Math.floor((this._config.scaledCellWidth - this._config.scaledCharWidth) / 2) : 0),
                y: -boundingBox.top + padding + ((restrictedGlyph || customGlyph) ? this._config.lineHeight === 1 ? 0 : Math.round((this._config.scaledCellHeight - this._config.scaledCharHeight) / 2) : 0)
            }
        };
    }
    _clipImageData(imageData, boundingBox) {
        const width = boundingBox.right - boundingBox.left + 1;
        const height = boundingBox.bottom - boundingBox.top + 1;
        const clippedData = new Uint8ClampedArray(width * height * 4);
        for (let y = boundingBox.top; y <= boundingBox.bottom; y++) {
            for (let x = boundingBox.left; x <= boundingBox.right; x++) {
                const oldOffset = y * this._tmpCanvas.width * 4 + x * 4;
                const newOffset = (y - boundingBox.top) * width * 4 + (x - boundingBox.left) * 4;
                clippedData[newOffset] = imageData.data[oldOffset];
                clippedData[newOffset + 1] = imageData.data[oldOffset + 1];
                clippedData[newOffset + 2] = imageData.data[oldOffset + 2];
                clippedData[newOffset + 3] = imageData.data[oldOffset + 3];
            }
        }
        return new ImageData(clippedData, width, height);
    }
}
exports.WebglCharAtlas = WebglCharAtlas;
function clearColor(imageData, bg, fg, enableThresholdCheck) {
    const r = bg.rgba >>> 24;
    const g = bg.rgba >>> 16 & 0xFF;
    const b = bg.rgba >>> 8 & 0xFF;
    const fgR = fg.rgba >>> 24;
    const fgG = fg.rgba >>> 16 & 0xFF;
    const fgB = fg.rgba >>> 8 & 0xFF;
    const threshold = Math.floor((Math.abs(r - fgR) + Math.abs(g - fgG) + Math.abs(b - fgB)) / 12);
    let isEmpty = true;
    for (let offset = 0; offset < imageData.data.length; offset += 4) {
        if (imageData.data[offset] === r &&
            imageData.data[offset + 1] === g &&
            imageData.data[offset + 2] === b) {
            imageData.data[offset + 3] = 0;
        }
        else {
            if (enableThresholdCheck &&
                (Math.abs(imageData.data[offset] - r) +
                    Math.abs(imageData.data[offset + 1] - g) +
                    Math.abs(imageData.data[offset + 2] - b)) < threshold) {
                imageData.data[offset + 3] = 0;
            }
            else {
                isEmpty = false;
            }
        }
    }
    return isEmpty;
}
function checkCompletelyTransparent(imageData) {
    for (let offset = 0; offset < imageData.data.length; offset += 4) {
        if (imageData.data[offset + 3] > 0) {
            return false;
        }
    }
    return true;
}
//# sourceMappingURL=WebglCharAtlas.js.map