"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlyphRenderer = void 0;
const WebglUtils_1 = require("./WebglUtils");
const TypedArrayUtils_1 = require("common/TypedArrayUtils");
const Constants_1 = require("common/buffer/Constants");
const Lifecycle_1 = require("common/Lifecycle");
const vertexShaderSource = `#version 300 es
layout (location = ${0}) in vec2 a_unitquad;
layout (location = ${1}) in vec2 a_cellpos;
layout (location = ${2}) in vec2 a_offset;
layout (location = ${3}) in vec2 a_size;
layout (location = ${4}) in vec2 a_texcoord;
layout (location = ${5}) in vec2 a_texsize;

uniform mat4 u_projection;
uniform vec2 u_resolution;

out vec2 v_texcoord;

void main() {
  vec2 zeroToOne = (a_offset / u_resolution) + a_cellpos + (a_unitquad * a_size);
  gl_Position = u_projection * vec4(zeroToOne, 0.0, 1.0);
  v_texcoord = a_texcoord + a_unitquad * a_texsize;
}`;
const fragmentShaderSource = `#version 300 es
precision lowp float;

in vec2 v_texcoord;

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
  outColor = texture(u_texture, v_texcoord);
}`;
const INDICES_PER_CELL = 10;
const BYTES_PER_CELL = INDICES_PER_CELL * Float32Array.BYTES_PER_ELEMENT;
const CELL_POSITION_INDICES = 2;
const w = {
    i: 0,
    glyph: undefined,
    leftCellPadding: 0,
    clippedPixels: 0
};
class GlyphRenderer extends Lifecycle_1.Disposable {
    constructor(_terminal, _colors, _gl, _dimensions) {
        super();
        this._terminal = _terminal;
        this._colors = _colors;
        this._gl = _gl;
        this._dimensions = _dimensions;
        this._activeBuffer = 0;
        this._vertices = {
            count: 0,
            attributes: new Float32Array(0),
            attributesBuffers: [
                new Float32Array(0),
                new Float32Array(0)
            ]
        };
        const gl = this._gl;
        this._program = (0, WebglUtils_1.throwIfFalsy)((0, WebglUtils_1.createProgram)(gl, vertexShaderSource, fragmentShaderSource));
        this.register((0, Lifecycle_1.toDisposable)(() => gl.deleteProgram(this._program)));
        this._projectionLocation = (0, WebglUtils_1.throwIfFalsy)(gl.getUniformLocation(this._program, 'u_projection'));
        this._resolutionLocation = (0, WebglUtils_1.throwIfFalsy)(gl.getUniformLocation(this._program, 'u_resolution'));
        this._textureLocation = (0, WebglUtils_1.throwIfFalsy)(gl.getUniformLocation(this._program, 'u_texture'));
        this._vertexArrayObject = gl.createVertexArray();
        gl.bindVertexArray(this._vertexArrayObject);
        const unitQuadVertices = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
        const unitQuadVerticesBuffer = gl.createBuffer();
        this.register((0, Lifecycle_1.toDisposable)(() => gl.deleteBuffer(unitQuadVerticesBuffer)));
        gl.bindBuffer(gl.ARRAY_BUFFER, unitQuadVerticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, unitQuadVertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, this._gl.FLOAT, false, 0, 0);
        const unitQuadElementIndices = new Uint8Array([0, 1, 3, 0, 2, 3]);
        const elementIndicesBuffer = gl.createBuffer();
        this.register((0, Lifecycle_1.toDisposable)(() => gl.deleteBuffer(elementIndicesBuffer)));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementIndicesBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, unitQuadElementIndices, gl.STATIC_DRAW);
        this._attributesBuffer = (0, WebglUtils_1.throwIfFalsy)(gl.createBuffer());
        this.register((0, Lifecycle_1.toDisposable)(() => gl.deleteBuffer(this._attributesBuffer)));
        gl.bindBuffer(gl.ARRAY_BUFFER, this._attributesBuffer);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, BYTES_PER_CELL, 0);
        gl.vertexAttribDivisor(2, 1);
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, BYTES_PER_CELL, 2 * Float32Array.BYTES_PER_ELEMENT);
        gl.vertexAttribDivisor(3, 1);
        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 2, gl.FLOAT, false, BYTES_PER_CELL, 4 * Float32Array.BYTES_PER_ELEMENT);
        gl.vertexAttribDivisor(4, 1);
        gl.enableVertexAttribArray(5);
        gl.vertexAttribPointer(5, 2, gl.FLOAT, false, BYTES_PER_CELL, 6 * Float32Array.BYTES_PER_ELEMENT);
        gl.vertexAttribDivisor(5, 1);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, BYTES_PER_CELL, 8 * Float32Array.BYTES_PER_ELEMENT);
        gl.vertexAttribDivisor(1, 1);
        this._atlasTexture = (0, WebglUtils_1.throwIfFalsy)(gl.createTexture());
        this.register((0, Lifecycle_1.toDisposable)(() => gl.deleteTexture(this._atlasTexture)));
        gl.bindTexture(gl.TEXTURE_2D, this._atlasTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this.onResize();
    }
    beginFrame() {
        return this._atlas ? this._atlas.beginFrame() : true;
    }
    updateCell(x, y, code, bg, fg, ext, chars, lastBg) {
        this._updateCell(this._vertices.attributes, x, y, code, bg, fg, ext, chars, lastBg);
    }
    _updateCell(array, x, y, code, bg, fg, ext, chars, lastBg) {
        w.i = (y * this._terminal.cols + x) * INDICES_PER_CELL;
        if (code === Constants_1.NULL_CELL_CODE || code === undefined) {
            (0, TypedArrayUtils_1.fill)(array, 0, w.i, w.i + INDICES_PER_CELL - 1 - CELL_POSITION_INDICES);
            return;
        }
        if (!this._atlas) {
            return;
        }
        if (chars && chars.length > 1) {
            w.glyph = this._atlas.getRasterizedGlyphCombinedChar(chars, bg, fg, ext);
        }
        else {
            w.glyph = this._atlas.getRasterizedGlyph(code, bg, fg, ext);
        }
        w.leftCellPadding = Math.floor((this._dimensions.scaledCellWidth - this._dimensions.scaledCharWidth) / 2);
        if (bg !== lastBg && w.glyph.offset.x > w.leftCellPadding) {
            w.clippedPixels = w.glyph.offset.x - w.leftCellPadding;
            array[w.i] = -(w.glyph.offset.x - w.clippedPixels) + this._dimensions.scaledCharLeft;
            array[w.i + 1] = -w.glyph.offset.y + this._dimensions.scaledCharTop;
            array[w.i + 2] = (w.glyph.size.x - w.clippedPixels) / this._dimensions.scaledCanvasWidth;
            array[w.i + 3] = w.glyph.size.y / this._dimensions.scaledCanvasHeight;
            array[w.i + 4] = w.glyph.texturePositionClipSpace.x + w.clippedPixels / this._atlas.cacheCanvas.width;
            array[w.i + 5] = w.glyph.texturePositionClipSpace.y;
            array[w.i + 6] = w.glyph.sizeClipSpace.x - w.clippedPixels / this._atlas.cacheCanvas.width;
            array[w.i + 7] = w.glyph.sizeClipSpace.y;
        }
        else {
            array[w.i] = -w.glyph.offset.x + this._dimensions.scaledCharLeft;
            array[w.i + 1] = -w.glyph.offset.y + this._dimensions.scaledCharTop;
            array[w.i + 2] = w.glyph.size.x / this._dimensions.scaledCanvasWidth;
            array[w.i + 3] = w.glyph.size.y / this._dimensions.scaledCanvasHeight;
            array[w.i + 4] = w.glyph.texturePositionClipSpace.x;
            array[w.i + 5] = w.glyph.texturePositionClipSpace.y;
            array[w.i + 6] = w.glyph.sizeClipSpace.x;
            array[w.i + 7] = w.glyph.sizeClipSpace.y;
        }
    }
    clear(force) {
        const terminal = this._terminal;
        const newCount = terminal.cols * terminal.rows * INDICES_PER_CELL;
        if (!force && this._vertices.count === newCount) {
            return;
        }
        this._vertices.count = newCount;
        this._vertices.attributes = new Float32Array(newCount);
        for (let i = 0; i < this._vertices.attributesBuffers.length; i++) {
            this._vertices.attributesBuffers[i] = new Float32Array(newCount);
        }
        let i = 0;
        for (let y = 0; y < terminal.rows; y++) {
            for (let x = 0; x < terminal.cols; x++) {
                this._vertices.attributes[i + 8] = x / terminal.cols;
                this._vertices.attributes[i + 9] = y / terminal.rows;
                i += INDICES_PER_CELL;
            }
        }
    }
    onResize() {
        const gl = this._gl;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        this.clear();
    }
    setColors() {
    }
    render(renderModel) {
        if (!this._atlas) {
            return;
        }
        const gl = this._gl;
        gl.useProgram(this._program);
        gl.bindVertexArray(this._vertexArrayObject);
        this._activeBuffer = (this._activeBuffer + 1) % 2;
        const activeBuffer = this._vertices.attributesBuffers[this._activeBuffer];
        let bufferLength = 0;
        for (let y = 0; y < renderModel.lineLengths.length; y++) {
            const si = y * this._terminal.cols * INDICES_PER_CELL;
            const sub = this._vertices.attributes.subarray(si, si + renderModel.lineLengths[y] * INDICES_PER_CELL);
            activeBuffer.set(sub, bufferLength);
            bufferLength += sub.length;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this._attributesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, activeBuffer.subarray(0, bufferLength), gl.STREAM_DRAW);
        if (this._atlas.hasCanvasChanged) {
            this._atlas.hasCanvasChanged = false;
            gl.uniform1i(this._textureLocation, 0);
            gl.activeTexture(gl.TEXTURE0 + 0);
            gl.bindTexture(gl.TEXTURE_2D, this._atlasTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._atlas.cacheCanvas);
            gl.generateMipmap(gl.TEXTURE_2D);
        }
        gl.uniformMatrix4fv(this._projectionLocation, false, WebglUtils_1.PROJECTION_MATRIX);
        gl.uniform2f(this._resolutionLocation, gl.canvas.width, gl.canvas.height);
        gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0, bufferLength / INDICES_PER_CELL);
    }
    setAtlas(atlas) {
        const gl = this._gl;
        this._atlas = atlas;
        gl.bindTexture(gl.TEXTURE_2D, this._atlasTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas.cacheCanvas);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
    setDimensions(dimensions) {
        this._dimensions = dimensions;
    }
}
exports.GlyphRenderer = GlyphRenderer;
//# sourceMappingURL=GlyphRenderer.js.map