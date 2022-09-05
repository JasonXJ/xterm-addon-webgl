"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RectangleRenderer = void 0;
const WebglUtils_1 = require("./WebglUtils");
const RenderModel_1 = require("./RenderModel");
const Lifecycle_1 = require("common/Lifecycle");
const Constants_1 = require("browser/renderer/Constants");
const vertexShaderSource = `#version 300 es
layout (location = ${0}) in vec2 a_position;
layout (location = ${1}) in vec2 a_size;
layout (location = ${2}) in vec4 a_color;
layout (location = ${3}) in vec2 a_unitquad;

uniform mat4 u_projection;

out vec4 v_color;

void main() {
  vec2 zeroToOne = a_position + (a_unitquad * a_size);
  gl_Position = u_projection * vec4(zeroToOne, 0.0, 1.0);
  v_color = a_color;
}`;
const fragmentShaderSource = `#version 300 es
precision lowp float;

in vec4 v_color;

out vec4 outColor;

void main() {
  outColor = v_color;
}`;
const INDICES_PER_RECTANGLE = 8;
const BYTES_PER_RECTANGLE = INDICES_PER_RECTANGLE * Float32Array.BYTES_PER_ELEMENT;
const INITIAL_BUFFER_RECTANGLE_CAPACITY = 20 * INDICES_PER_RECTANGLE;
const w = {
    rgba: 0,
    isDefault: false,
    x1: 0,
    y1: 0,
    r: 0,
    g: 0,
    b: 0,
    a: 0
};
class RectangleRenderer extends Lifecycle_1.Disposable {
    constructor(_terminal, _colors, _gl, _dimensions) {
        super();
        this._terminal = _terminal;
        this._colors = _colors;
        this._gl = _gl;
        this._dimensions = _dimensions;
        this._vertices = {
            count: 0,
            attributes: new Float32Array(INITIAL_BUFFER_RECTANGLE_CAPACITY)
        };
        const gl = this._gl;
        this._program = (0, WebglUtils_1.throwIfFalsy)((0, WebglUtils_1.createProgram)(gl, vertexShaderSource, fragmentShaderSource));
        this.register((0, Lifecycle_1.toDisposable)(() => gl.deleteProgram(this._program)));
        this._projectionLocation = (0, WebglUtils_1.throwIfFalsy)(gl.getUniformLocation(this._program, 'u_projection'));
        this._vertexArrayObject = gl.createVertexArray();
        gl.bindVertexArray(this._vertexArrayObject);
        const unitQuadVertices = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
        const unitQuadVerticesBuffer = gl.createBuffer();
        this.register((0, Lifecycle_1.toDisposable)(() => gl.deleteBuffer(unitQuadVerticesBuffer)));
        gl.bindBuffer(gl.ARRAY_BUFFER, unitQuadVerticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, unitQuadVertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 2, this._gl.FLOAT, false, 0, 0);
        const unitQuadElementIndices = new Uint8Array([0, 1, 3, 0, 2, 3]);
        const elementIndicesBuffer = gl.createBuffer();
        this.register((0, Lifecycle_1.toDisposable)(() => gl.deleteBuffer(elementIndicesBuffer)));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementIndicesBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, unitQuadElementIndices, gl.STATIC_DRAW);
        this._attributesBuffer = (0, WebglUtils_1.throwIfFalsy)(gl.createBuffer());
        this.register((0, Lifecycle_1.toDisposable)(() => gl.deleteBuffer(this._attributesBuffer)));
        gl.bindBuffer(gl.ARRAY_BUFFER, this._attributesBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, BYTES_PER_RECTANGLE, 0);
        gl.vertexAttribDivisor(0, 1);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, BYTES_PER_RECTANGLE, 2 * Float32Array.BYTES_PER_ELEMENT);
        gl.vertexAttribDivisor(1, 1);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, BYTES_PER_RECTANGLE, 4 * Float32Array.BYTES_PER_ELEMENT);
        gl.vertexAttribDivisor(2, 1);
        this._updateCachedColors();
    }
    render() {
        const gl = this._gl;
        gl.useProgram(this._program);
        gl.bindVertexArray(this._vertexArrayObject);
        gl.uniformMatrix4fv(this._projectionLocation, false, WebglUtils_1.PROJECTION_MATRIX);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._attributesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._vertices.attributes, gl.DYNAMIC_DRAW);
        gl.drawElementsInstanced(this._gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0, this._vertices.count);
    }
    onResize() {
        this._updateViewportRectangle();
    }
    setColors() {
        this._updateCachedColors();
        this._updateViewportRectangle();
    }
    setDimensions(dimensions) {
        this._dimensions = dimensions;
    }
    _updateCachedColors() {
        this._bgFloat = this._colorToFloat32Array(this._colors.background);
    }
    _updateViewportRectangle() {
        this._addRectangleFloat(this._vertices.attributes, 0, 0, 0, this._terminal.cols * this._dimensions.scaledCellWidth, this._terminal.rows * this._dimensions.scaledCellHeight, this._bgFloat);
    }
    updateBackgrounds(model) {
        const terminal = this._terminal;
        const vertices = this._vertices;
        let rectangleCount = 1;
        let y;
        let x;
        let currentStartX;
        let currentBg;
        let currentFg;
        let currentInverse;
        let modelIndex;
        let bg;
        let fg;
        let inverse;
        let offset;
        for (y = 0; y < terminal.rows; y++) {
            currentStartX = -1;
            currentBg = 0;
            currentFg = 0;
            currentInverse = false;
            for (x = 0; x < terminal.cols; x++) {
                modelIndex = ((y * terminal.cols) + x) * RenderModel_1.RENDER_MODEL_INDICIES_PER_CELL;
                bg = model.cells[modelIndex + RenderModel_1.RENDER_MODEL_BG_OFFSET];
                fg = model.cells[modelIndex + RenderModel_1.RENDER_MODEL_FG_OFFSET];
                inverse = !!(fg & 67108864);
                if (bg !== currentBg || (fg !== currentFg && (currentInverse || inverse))) {
                    if (currentBg !== 0 || (currentInverse && currentFg !== 0)) {
                        offset = rectangleCount++ * INDICES_PER_RECTANGLE;
                        this._updateRectangle(vertices, offset, currentFg, currentBg, currentStartX, x, y);
                    }
                    currentStartX = x;
                    currentBg = bg;
                    currentFg = fg;
                    currentInverse = inverse;
                }
            }
            if (currentBg !== 0 || (currentInverse && currentFg !== 0)) {
                offset = rectangleCount++ * INDICES_PER_RECTANGLE;
                this._updateRectangle(vertices, offset, currentFg, currentBg, currentStartX, terminal.cols, y);
            }
        }
        vertices.count = rectangleCount;
    }
    _updateRectangle(vertices, offset, fg, bg, startX, endX, y) {
        w.isDefault = false;
        if (fg & 67108864) {
            switch (fg & 50331648) {
                case 16777216:
                case 33554432:
                    w.rgba = this._colors.ansi[fg & 255].rgba;
                    break;
                case 50331648:
                    w.rgba = (fg & 16777215) << 8;
                    break;
                case 0:
                default:
                    w.rgba = this._colors.foreground.rgba;
            }
        }
        else {
            switch (bg & 50331648) {
                case 16777216:
                case 33554432:
                    w.rgba = this._colors.ansi[bg & 255].rgba;
                    break;
                case 50331648:
                    w.rgba = (bg & 16777215) << 8;
                    break;
                case 0:
                default:
                    w.rgba = this._colors.background.rgba;
                    w.isDefault = true;
            }
        }
        if (vertices.attributes.length < offset + 4) {
            vertices.attributes = (0, WebglUtils_1.expandFloat32Array)(vertices.attributes, this._terminal.rows * this._terminal.cols * INDICES_PER_RECTANGLE);
        }
        w.x1 = startX * this._dimensions.scaledCellWidth;
        w.y1 = y * this._dimensions.scaledCellHeight;
        w.r = ((w.rgba >> 24) & 0xFF) / 255;
        w.g = ((w.rgba >> 16) & 0xFF) / 255;
        w.b = ((w.rgba >> 8) & 0xFF) / 255;
        w.a = (!w.isDefault && bg & 134217728) ? Constants_1.DIM_OPACITY : 1;
        this._addRectangle(vertices.attributes, offset, w.x1, w.y1, (endX - startX) * this._dimensions.scaledCellWidth, this._dimensions.scaledCellHeight, w.r, w.g, w.b, w.a);
    }
    _addRectangle(array, offset, x1, y1, width, height, r, g, b, a) {
        array[offset] = x1 / this._dimensions.scaledCanvasWidth;
        array[offset + 1] = y1 / this._dimensions.scaledCanvasHeight;
        array[offset + 2] = width / this._dimensions.scaledCanvasWidth;
        array[offset + 3] = height / this._dimensions.scaledCanvasHeight;
        array[offset + 4] = r;
        array[offset + 5] = g;
        array[offset + 6] = b;
        array[offset + 7] = a;
    }
    _addRectangleFloat(array, offset, x1, y1, width, height, color) {
        array[offset] = x1 / this._dimensions.scaledCanvasWidth;
        array[offset + 1] = y1 / this._dimensions.scaledCanvasHeight;
        array[offset + 2] = width / this._dimensions.scaledCanvasWidth;
        array[offset + 3] = height / this._dimensions.scaledCanvasHeight;
        array[offset + 4] = color[0];
        array[offset + 5] = color[1];
        array[offset + 6] = color[2];
        array[offset + 7] = color[3];
    }
    _colorToFloat32Array(color) {
        return new Float32Array([
            ((color.rgba >> 24) & 0xFF) / 255,
            ((color.rgba >> 16) & 0xFF) / 255,
            ((color.rgba >> 8) & 0xFF) / 255,
            ((color.rgba) & 0xFF) / 255
        ]);
    }
}
exports.RectangleRenderer = RectangleRenderer;
//# sourceMappingURL=RectangleRenderer.js.map