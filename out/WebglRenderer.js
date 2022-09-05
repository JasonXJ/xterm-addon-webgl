"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JoinedCellData = exports.WebglRenderer = void 0;
const GlyphRenderer_1 = require("./GlyphRenderer");
const LinkRenderLayer_1 = require("./renderLayer/LinkRenderLayer");
const CursorRenderLayer_1 = require("./renderLayer/CursorRenderLayer");
const CharAtlasCache_1 = require("./atlas/CharAtlasCache");
const RectangleRenderer_1 = require("./RectangleRenderer");
const RenderModel_1 = require("./RenderModel");
const Lifecycle_1 = require("common/Lifecycle");
const Constants_1 = require("common/buffer/Constants");
const DevicePixelObserver_1 = require("browser/renderer/DevicePixelObserver");
const EventEmitter_1 = require("common/EventEmitter");
const CellData_1 = require("common/buffer/CellData");
const Lifecycle_2 = require("browser/Lifecycle");
const AttributeData_1 = require("common/buffer/AttributeData");
const w = {
    fg: 0,
    bg: 0,
    hasFg: false,
    hasBg: false,
    isSelected: false
};
class WebglRenderer extends Lifecycle_1.Disposable {
    constructor(_terminal, _colors, _characterJoinerService, _coreBrowserService, coreService, _decorationService, preserveDrawingBuffer) {
        super();
        this._terminal = _terminal;
        this._colors = _colors;
        this._characterJoinerService = _characterJoinerService;
        this._coreBrowserService = _coreBrowserService;
        this._decorationService = _decorationService;
        this._model = new RenderModel_1.RenderModel();
        this._workCell = new CellData_1.CellData();
        this._workColors = { fg: 0, bg: 0, ext: 0 };
        this._onChangeTextureAtlas = new EventEmitter_1.EventEmitter();
        this._onRequestRedraw = new EventEmitter_1.EventEmitter();
        this._onContextLoss = new EventEmitter_1.EventEmitter();
        this._core = this._terminal._core;
        this._renderLayers = [
            new LinkRenderLayer_1.LinkRenderLayer(this._core.screenElement, 2, this._colors, this._core),
            new CursorRenderLayer_1.CursorRenderLayer(_terminal, this._core.screenElement, 3, this._colors, this._onRequestRedraw, this._coreBrowserService, coreService)
        ];
        this.dimensions = {
            scaledCharWidth: 0,
            scaledCharHeight: 0,
            scaledCellWidth: 0,
            scaledCellHeight: 0,
            scaledCharLeft: 0,
            scaledCharTop: 0,
            scaledCanvasWidth: 0,
            scaledCanvasHeight: 0,
            canvasWidth: 0,
            canvasHeight: 0,
            actualCellWidth: 0,
            actualCellHeight: 0
        };
        this._devicePixelRatio = window.devicePixelRatio;
        this._updateDimensions();
        this._canvas = document.createElement('canvas');
        const contextAttributes = {
            antialias: false,
            depth: false,
            preserveDrawingBuffer
        };
        this._gl = this._canvas.getContext('webgl2', contextAttributes);
        if (!this._gl) {
            throw new Error('WebGL2 not supported ' + this._gl);
        }
        this.register((0, Lifecycle_2.addDisposableDomListener)(this._canvas, 'webglcontextlost', (e) => {
            console.log('webglcontextlost event received');
            e.preventDefault();
            this._contextRestorationTimeout = setTimeout(() => {
                this._contextRestorationTimeout = undefined;
                console.warn('webgl context not restored; firing onContextLoss');
                this._onContextLoss.fire(e);
            }, 3000);
        }));
        this.register((0, Lifecycle_2.addDisposableDomListener)(this._canvas, 'webglcontextrestored', (e) => {
            console.warn('webglcontextrestored event received');
            clearTimeout(this._contextRestorationTimeout);
            this._contextRestorationTimeout = undefined;
            (0, CharAtlasCache_1.removeTerminalFromCache)(this._terminal);
            this._initializeWebGLState();
            this._requestRedrawViewport();
        }));
        this.register((0, DevicePixelObserver_1.observeDevicePixelDimensions)(this._canvas, (w, h) => this._setCanvasDevicePixelDimensions(w, h)));
        this._core.screenElement.appendChild(this._canvas);
        this._initializeWebGLState();
        this._isAttached = document.body.contains(this._core.screenElement);
    }
    get onChangeTextureAtlas() { return this._onChangeTextureAtlas.event; }
    get onRequestRedraw() { return this._onRequestRedraw.event; }
    get onContextLoss() { return this._onContextLoss.event; }
    dispose() {
        var _a;
        for (const l of this._renderLayers) {
            l.dispose();
        }
        (_a = this._canvas.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(this._canvas);
        (0, CharAtlasCache_1.removeTerminalFromCache)(this._terminal);
        super.dispose();
    }
    get textureAtlas() {
        var _a;
        return (_a = this._charAtlas) === null || _a === void 0 ? void 0 : _a.cacheCanvas;
    }
    setColors(colors) {
        this._colors = colors;
        for (const l of this._renderLayers) {
            l.setColors(this._terminal, this._colors);
            l.reset(this._terminal);
        }
        this._rectangleRenderer.setColors();
        this._glyphRenderer.setColors();
        this._refreshCharAtlas();
        this._model.clear();
    }
    onDevicePixelRatioChange() {
        if (this._devicePixelRatio !== window.devicePixelRatio) {
            this._devicePixelRatio = window.devicePixelRatio;
            this.onResize(this._terminal.cols, this._terminal.rows);
        }
    }
    onResize(cols, rows) {
        this._updateDimensions();
        this._model.resize(this._terminal.cols, this._terminal.rows);
        for (const l of this._renderLayers) {
            l.resize(this._terminal, this.dimensions);
        }
        this._canvas.width = this.dimensions.scaledCanvasWidth;
        this._canvas.height = this.dimensions.scaledCanvasHeight;
        this._canvas.style.width = `${this.dimensions.canvasWidth}px`;
        this._canvas.style.height = `${this.dimensions.canvasHeight}px`;
        this._core.screenElement.style.width = `${this.dimensions.canvasWidth}px`;
        this._core.screenElement.style.height = `${this.dimensions.canvasHeight}px`;
        this._rectangleRenderer.setDimensions(this.dimensions);
        this._rectangleRenderer.onResize();
        this._glyphRenderer.setDimensions(this.dimensions);
        this._glyphRenderer.onResize();
        this._refreshCharAtlas();
        this._model.clear();
    }
    onCharSizeChanged() {
        this.onResize(this._terminal.cols, this._terminal.rows);
    }
    onBlur() {
        for (const l of this._renderLayers) {
            l.onBlur(this._terminal);
        }
        this._requestRedrawViewport();
    }
    onFocus() {
        for (const l of this._renderLayers) {
            l.onFocus(this._terminal);
        }
        this._requestRedrawViewport();
    }
    onSelectionChanged(start, end, columnSelectMode) {
        for (const l of this._renderLayers) {
            l.onSelectionChanged(this._terminal, start, end, columnSelectMode);
        }
        this._updateSelectionModel(start, end, columnSelectMode);
        this._requestRedrawViewport();
    }
    onCursorMove() {
        for (const l of this._renderLayers) {
            l.onCursorMove(this._terminal);
        }
    }
    onOptionsChanged() {
        for (const l of this._renderLayers) {
            l.onOptionsChanged(this._terminal);
        }
        this._updateDimensions();
        this._refreshCharAtlas();
    }
    _initializeWebGLState() {
        var _a, _b;
        (_a = this._rectangleRenderer) === null || _a === void 0 ? void 0 : _a.dispose();
        (_b = this._glyphRenderer) === null || _b === void 0 ? void 0 : _b.dispose();
        this._rectangleRenderer = new RectangleRenderer_1.RectangleRenderer(this._terminal, this._colors, this._gl, this.dimensions);
        this._glyphRenderer = new GlyphRenderer_1.GlyphRenderer(this._terminal, this._colors, this._gl, this.dimensions);
        this.onCharSizeChanged();
    }
    _refreshCharAtlas() {
        if (this.dimensions.scaledCharWidth <= 0 && this.dimensions.scaledCharHeight <= 0) {
            this._isAttached = false;
            return;
        }
        const atlas = (0, CharAtlasCache_1.acquireCharAtlas)(this._terminal, this._colors, this.dimensions.scaledCellWidth, this.dimensions.scaledCellHeight, this.dimensions.scaledCharWidth, this.dimensions.scaledCharHeight);
        if (!('getRasterizedGlyph' in atlas)) {
            throw new Error('The webgl renderer only works with the webgl char atlas');
        }
        if (this._charAtlas !== atlas) {
            this._onChangeTextureAtlas.fire(atlas.cacheCanvas);
        }
        this._charAtlas = atlas;
        this._charAtlas.warmUp();
        this._glyphRenderer.setAtlas(this._charAtlas);
    }
    clearCharAtlas() {
        var _a;
        (_a = this._charAtlas) === null || _a === void 0 ? void 0 : _a.clearTexture();
        this._model.clear();
        this._updateModel(0, this._terminal.rows - 1);
        this._requestRedrawViewport();
    }
    clear() {
        this._model.clear();
        this._glyphRenderer.clear(true);
        for (const l of this._renderLayers) {
            l.reset(this._terminal);
        }
    }
    registerCharacterJoiner(handler) {
        return -1;
    }
    deregisterCharacterJoiner(joinerId) {
        return false;
    }
    renderRows(start, end) {
        if (!this._isAttached) {
            if (document.body.contains(this._core.screenElement) && this._core._charSizeService.width && this._core._charSizeService.height) {
                this._updateDimensions();
                this._refreshCharAtlas();
                this._isAttached = true;
            }
            else {
                return;
            }
        }
        for (const l of this._renderLayers) {
            l.onGridChanged(this._terminal, start, end);
        }
        if (this._glyphRenderer.beginFrame()) {
            this._model.clear();
            this._updateSelectionModel(undefined, undefined);
        }
        this._updateModel(start, end);
        this._rectangleRenderer.render();
        this._glyphRenderer.render(this._model);
    }
    _updateModel(start, end) {
        const terminal = this._core;
        let cell = this._workCell;
        let lastBg;
        let y;
        let row;
        let line;
        let joinedRanges;
        let isJoined;
        let lastCharX;
        let range;
        let chars;
        let code;
        let i;
        let x;
        let j;
        for (y = start; y <= end; y++) {
            row = y + terminal.buffer.ydisp;
            line = terminal.buffer.lines.get(row);
            this._model.lineLengths[y] = 0;
            joinedRanges = this._characterJoinerService.getJoinedCharacters(row);
            for (x = 0; x < terminal.cols; x++) {
                lastBg = this._workColors.bg;
                line.loadCell(x, cell);
                if (x === 0) {
                    lastBg = this._workColors.bg;
                }
                isJoined = false;
                lastCharX = x;
                if (joinedRanges.length > 0 && x === joinedRanges[0][0]) {
                    isJoined = true;
                    range = joinedRanges.shift();
                    cell = new JoinedCellData(cell, line.translateToString(true, range[0], range[1]), range[1] - range[0]);
                    lastCharX = range[1] - 1;
                }
                chars = cell.getChars();
                code = cell.getCode();
                i = ((y * terminal.cols) + x) * RenderModel_1.RENDER_MODEL_INDICIES_PER_CELL;
                this._loadColorsForCell(x, row);
                if (code !== Constants_1.NULL_CELL_CODE) {
                    this._model.lineLengths[y] = x + 1;
                }
                if (this._model.cells[i] === code &&
                    this._model.cells[i + RenderModel_1.RENDER_MODEL_BG_OFFSET] === this._workColors.bg &&
                    this._model.cells[i + RenderModel_1.RENDER_MODEL_FG_OFFSET] === this._workColors.fg &&
                    this._model.cells[i + RenderModel_1.RENDER_MODEL_EXT_OFFSET] === this._workColors.ext) {
                    continue;
                }
                if (chars.length > 1) {
                    code |= RenderModel_1.COMBINED_CHAR_BIT_MASK;
                }
                this._model.cells[i] = code;
                this._model.cells[i + RenderModel_1.RENDER_MODEL_BG_OFFSET] = this._workColors.bg;
                this._model.cells[i + RenderModel_1.RENDER_MODEL_FG_OFFSET] = this._workColors.fg;
                this._model.cells[i + RenderModel_1.RENDER_MODEL_EXT_OFFSET] = this._workColors.ext;
                this._glyphRenderer.updateCell(x, y, code, this._workColors.bg, this._workColors.fg, this._workColors.ext, chars, lastBg);
                if (isJoined) {
                    cell = this._workCell;
                    for (x++; x < lastCharX; x++) {
                        j = ((y * terminal.cols) + x) * RenderModel_1.RENDER_MODEL_INDICIES_PER_CELL;
                        this._glyphRenderer.updateCell(x, y, Constants_1.NULL_CELL_CODE, 0, 0, 0, Constants_1.NULL_CELL_CHAR, 0);
                        this._model.cells[j] = Constants_1.NULL_CELL_CODE;
                        this._model.cells[j + RenderModel_1.RENDER_MODEL_BG_OFFSET] = this._workColors.bg;
                        this._model.cells[j + RenderModel_1.RENDER_MODEL_FG_OFFSET] = this._workColors.fg;
                        this._model.cells[j + RenderModel_1.RENDER_MODEL_EXT_OFFSET] = this._workColors.ext;
                    }
                }
            }
        }
        this._rectangleRenderer.updateBackgrounds(this._model);
    }
    _loadColorsForCell(x, y) {
        this._workColors.bg = this._workCell.bg;
        this._workColors.fg = this._workCell.fg;
        this._workColors.ext = this._workCell.bg & 268435456 ? this._workCell.extended.ext : 0;
        w.bg = 0;
        w.fg = 0;
        w.hasBg = false;
        w.hasFg = false;
        w.isSelected = false;
        this._decorationService.forEachDecorationAtCell(x, y, 'bottom', d => {
            if (d.backgroundColorRGB) {
                w.bg = d.backgroundColorRGB.rgba >> 8 & 0xFFFFFF;
                w.hasBg = true;
            }
            if (d.foregroundColorRGB) {
                w.fg = d.foregroundColorRGB.rgba >> 8 & 0xFFFFFF;
                w.hasFg = true;
            }
        });
        w.isSelected = this._isCellSelected(x, y);
        if (w.isSelected) {
            w.bg = (this._coreBrowserService.isFocused ? this._colors.selectionBackgroundOpaque : this._colors.selectionInactiveBackgroundOpaque).rgba >> 8 & 0xFFFFFF;
            w.hasBg = true;
            if (this._colors.selectionForeground) {
                w.fg = this._colors.selectionForeground.rgba >> 8 & 0xFFFFFF;
                w.hasFg = true;
            }
        }
        this._decorationService.forEachDecorationAtCell(x, y, 'top', d => {
            if (d.backgroundColorRGB) {
                w.bg = d.backgroundColorRGB.rgba >> 8 & 0xFFFFFF;
                w.hasBg = true;
            }
            if (d.foregroundColorRGB) {
                w.fg = d.foregroundColorRGB.rgba >> 8 & 0xFFFFFF;
                w.hasFg = true;
            }
        });
        if (w.hasBg) {
            if (w.isSelected) {
                w.bg = (this._workCell.bg & ~16777215 & ~134217728) | w.bg | 50331648;
            }
            else {
                w.bg = (this._workCell.bg & ~16777215) | w.bg | 50331648;
            }
        }
        if (w.hasFg) {
            w.fg = (this._workCell.fg & ~16777215 & ~67108864) | w.fg | 50331648;
        }
        if (this._workColors.fg & 67108864) {
            if (w.hasBg && !w.hasFg) {
                if ((this._workColors.bg & 50331648) === 0) {
                    w.fg = (this._workColors.fg & ~(16777215 | 67108864 | 50331648)) | ((this._colors.background.rgba >> 8 & 0xFFFFFF) & 16777215) | 50331648;
                }
                else {
                    w.fg = (this._workColors.fg & ~(16777215 | 67108864 | 50331648)) | this._workColors.bg & (16777215 | 50331648);
                }
                w.hasFg = true;
            }
            if (!w.hasBg && w.hasFg) {
                if ((this._workColors.fg & 50331648) === 0) {
                    w.bg = (this._workColors.bg & ~(16777215 | 50331648)) | ((this._colors.foreground.rgba >> 8 & 0xFFFFFF) & 16777215) | 50331648;
                }
                else {
                    w.bg = (this._workColors.bg & ~(16777215 | 50331648)) | this._workColors.fg & (16777215 | 50331648);
                }
                w.hasBg = true;
            }
        }
        this._workColors.bg = w.hasBg ? w.bg : this._workColors.bg;
        this._workColors.fg = w.hasFg ? w.fg : this._workColors.fg;
    }
    _isCellSelected(x, y) {
        if (!this._model.selection.hasSelection) {
            return false;
        }
        y -= this._terminal.buffer.active.viewportY;
        if (this._model.selection.columnSelectMode) {
            if (this._model.selection.startCol <= this._model.selection.endCol) {
                return x >= this._model.selection.startCol && y >= this._model.selection.viewportCappedStartRow &&
                    x < this._model.selection.endCol && y <= this._model.selection.viewportCappedEndRow;
            }
            return x < this._model.selection.startCol && y >= this._model.selection.viewportCappedStartRow &&
                x >= this._model.selection.endCol && y <= this._model.selection.viewportCappedEndRow;
        }
        return (y > this._model.selection.viewportStartRow && y < this._model.selection.viewportEndRow) ||
            (this._model.selection.viewportStartRow === this._model.selection.viewportEndRow && y === this._model.selection.viewportStartRow && x >= this._model.selection.startCol && x < this._model.selection.endCol) ||
            (this._model.selection.viewportStartRow < this._model.selection.viewportEndRow && y === this._model.selection.viewportEndRow && x < this._model.selection.endCol) ||
            (this._model.selection.viewportStartRow < this._model.selection.viewportEndRow && y === this._model.selection.viewportStartRow && x >= this._model.selection.startCol);
    }
    _updateSelectionModel(start, end, columnSelectMode = false) {
        const terminal = this._terminal;
        if (!start || !end || (start[0] === end[0] && start[1] === end[1])) {
            this._model.clearSelection();
            return;
        }
        const viewportStartRow = start[1] - terminal.buffer.active.viewportY;
        const viewportEndRow = end[1] - terminal.buffer.active.viewportY;
        const viewportCappedStartRow = Math.max(viewportStartRow, 0);
        const viewportCappedEndRow = Math.min(viewportEndRow, terminal.rows - 1);
        if (viewportCappedStartRow >= terminal.rows || viewportCappedEndRow < 0) {
            this._model.clearSelection();
            return;
        }
        this._model.selection.hasSelection = true;
        this._model.selection.columnSelectMode = columnSelectMode;
        this._model.selection.viewportStartRow = viewportStartRow;
        this._model.selection.viewportEndRow = viewportEndRow;
        this._model.selection.viewportCappedStartRow = viewportCappedStartRow;
        this._model.selection.viewportCappedEndRow = viewportCappedEndRow;
        this._model.selection.startCol = start[0];
        this._model.selection.endCol = end[0];
    }
    _updateDimensions() {
        if (!this._core._charSizeService.width || !this._core._charSizeService.height) {
            return;
        }
        this.dimensions.scaledCharWidth = Math.floor(this._core._charSizeService.width * this._devicePixelRatio);
        this.dimensions.scaledCharHeight = Math.ceil(this._core._charSizeService.height * this._devicePixelRatio);
        this.dimensions.scaledCellHeight = Math.floor(this.dimensions.scaledCharHeight * this._terminal.options.lineHeight);
        this.dimensions.scaledCharTop = this._terminal.options.lineHeight === 1 ? 0 : Math.round((this.dimensions.scaledCellHeight - this.dimensions.scaledCharHeight) / 2);
        this.dimensions.scaledCellWidth = this.dimensions.scaledCharWidth + Math.round(this._terminal.options.letterSpacing);
        this.dimensions.scaledCharLeft = Math.floor(this._terminal.options.letterSpacing / 2);
        this.dimensions.scaledCanvasHeight = this._terminal.rows * this.dimensions.scaledCellHeight;
        this.dimensions.scaledCanvasWidth = this._terminal.cols * this.dimensions.scaledCellWidth;
        this.dimensions.canvasHeight = Math.round(this.dimensions.scaledCanvasHeight / this._devicePixelRatio);
        this.dimensions.canvasWidth = Math.round(this.dimensions.scaledCanvasWidth / this._devicePixelRatio);
        this.dimensions.actualCellHeight = this.dimensions.scaledCellHeight / this._devicePixelRatio;
        this.dimensions.actualCellWidth = this.dimensions.scaledCellWidth / this._devicePixelRatio;
    }
    _setCanvasDevicePixelDimensions(width, height) {
        if (this._canvas.width === width && this._canvas.height === height) {
            return;
        }
        this._canvas.width = width;
        this._canvas.height = height;
        this._requestRedrawViewport();
    }
    _requestRedrawViewport() {
        this._onRequestRedraw.fire({ start: 0, end: this._terminal.rows - 1 });
    }
}
exports.WebglRenderer = WebglRenderer;
class JoinedCellData extends AttributeData_1.AttributeData {
    constructor(firstCell, chars, width) {
        super();
        this.content = 0;
        this.combinedData = '';
        this.fg = firstCell.fg;
        this.bg = firstCell.bg;
        this.combinedData = chars;
        this._width = width;
    }
    isCombined() {
        return 2097152;
    }
    getWidth() {
        return this._width;
    }
    getChars() {
        return this.combinedData;
    }
    getCode() {
        return 0x1FFFFF;
    }
    setFromCharData(value) {
        throw new Error('not implemented');
    }
    getAsCharData() {
        return [this.fg, this.getChars(), this.getWidth(), this.getCode()];
    }
}
exports.JoinedCellData = JoinedCellData;
//# sourceMappingURL=WebglRenderer.js.map