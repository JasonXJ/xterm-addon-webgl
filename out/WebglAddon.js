"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebglAddon = void 0;
const WebglRenderer_1 = require("./WebglRenderer");
const EventEmitter_1 = require("common/EventEmitter");
const Platform_1 = require("common/Platform");
class WebglAddon {
    constructor(_preserveDrawingBuffer) {
        this._preserveDrawingBuffer = _preserveDrawingBuffer;
        this._onChangeTextureAtlas = new EventEmitter_1.EventEmitter();
        this._onContextLoss = new EventEmitter_1.EventEmitter();
    }
    get onChangeTextureAtlas() { return this._onChangeTextureAtlas.event; }
    get onContextLoss() { return this._onContextLoss.event; }
    activate(terminal) {
        if (!terminal.element) {
            throw new Error('Cannot activate WebglAddon before Terminal.open');
        }
        if (Platform_1.isSafari) {
            throw new Error('Webgl is not currently supported on Safari');
        }
        this._terminal = terminal;
        const renderService = terminal._core._renderService;
        const characterJoinerService = terminal._core._characterJoinerService;
        const coreBrowserService = terminal._core._coreBrowserService;
        const coreService = terminal._core.coreService;
        const decorationService = terminal._core._decorationService;
        const colors = terminal._core._colorManager.colors;
        this._renderer = new WebglRenderer_1.WebglRenderer(terminal, colors, characterJoinerService, coreBrowserService, coreService, decorationService, this._preserveDrawingBuffer);
        (0, EventEmitter_1.forwardEvent)(this._renderer.onContextLoss, this._onContextLoss);
        (0, EventEmitter_1.forwardEvent)(this._renderer.onChangeTextureAtlas, this._onChangeTextureAtlas);
        renderService.setRenderer(this._renderer);
    }
    dispose() {
        var _a;
        if (!this._terminal) {
            throw new Error('Cannot dispose WebglAddon because it is activated');
        }
        const renderService = this._terminal._core._renderService;
        renderService.setRenderer(this._terminal._core._createRenderer());
        renderService.onResize(this._terminal.cols, this._terminal.rows);
        (_a = this._renderer) === null || _a === void 0 ? void 0 : _a.dispose();
        this._renderer = undefined;
    }
    get textureAtlas() {
        var _a;
        return (_a = this._renderer) === null || _a === void 0 ? void 0 : _a.textureAtlas;
    }
    clearTextureAtlas() {
        var _a;
        (_a = this._renderer) === null || _a === void 0 ? void 0 : _a.clearCharAtlas();
    }
}
exports.WebglAddon = WebglAddon;
//# sourceMappingURL=WebglAddon.js.map