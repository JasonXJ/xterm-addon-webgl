"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const TestUtils_1 = require("../../../out-test/api/TestUtils");
const APP = 'http://127.0.0.1:3001/test';
let browser;
let page;
const width = 800;
const height = 600;
describe('WebGL Renderer Integration Tests', () => __awaiter(void 0, void 0, void 0, function* () {
    const browserType = (0, TestUtils_1.getBrowserType)();
    const isHeadless = process.argv.includes('--headless');
    const areTestsEnabled = browserType.name() === 'chromium' || (browserType.name() === 'firefox' && !isHeadless);
    const itWebgl = areTestsEnabled ? it : it.skip;
    itWebgl('dispose removes renderer canvases', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield setupBrowser();
            chai_1.assert.equal(yield page.evaluate(`document.querySelectorAll('.xterm canvas').length`), 3);
            yield page.evaluate(`addon.dispose()`);
            chai_1.assert.equal(yield page.evaluate(`document.querySelectorAll('.xterm canvas').length`), 0);
            yield browser.close();
        });
    });
    describe('colors', () => {
        if (areTestsEnabled) {
            before(() => __awaiter(void 0, void 0, void 0, function* () { return setupBrowser(); }));
            after(() => __awaiter(void 0, void 0, void 0, function* () { return browser.close(); }));
            beforeEach(() => __awaiter(void 0, void 0, void 0, function* () { return page.evaluate(`window.term.reset()`); }));
        }
        itWebgl('foreground 0-15', () => __awaiter(void 0, void 0, void 0, function* () {
            const theme = {
                black: '#010203',
                red: '#040506',
                green: '#070809',
                yellow: '#0a0b0c',
                blue: '#0d0e0f',
                magenta: '#101112',
                cyan: '#131415',
                white: '#161718'
            };
            yield page.evaluate(`window.term.options.theme = ${JSON.stringify(theme)};`);
            yield (0, TestUtils_1.writeSync)(page, `\\x1b[30m█\\x1b[31m█\\x1b[32m█\\x1b[33m█\\x1b[34m█\\x1b[35m█\\x1b[36m█\\x1b[37m█`);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [1, 2, 3, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 1), [4, 5, 6, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 1), [7, 8, 9, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(4, 1), [10, 11, 12, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(5, 1), [13, 14, 15, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(6, 1), [16, 17, 18, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(7, 1), [19, 20, 21, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(8, 1), [22, 23, 24, 255]);
        }));
        itWebgl('foreground 0-7 drawBoldTextInBrightColors', () => __awaiter(void 0, void 0, void 0, function* () {
            const theme = {
                brightBlack: '#010203',
                brightRed: '#040506',
                brightGreen: '#070809',
                brightYellow: '#0a0b0c',
                brightBlue: '#0d0e0f',
                brightMagenta: '#101112',
                brightCyan: '#131415',
                brightWhite: '#161718'
            };
            yield page.evaluate(`
        window.term.options.theme = ${JSON.stringify(theme)};
        window.term.options.drawBoldTextInBrightColors = true;
      `);
            yield (0, TestUtils_1.writeSync)(page, `\\x1b[1;30m█\\x1b[1;31m█\\x1b[1;32m█\\x1b[1;33m█\\x1b[1;34m█\\x1b[1;35m█\\x1b[1;36m█\\x1b[1;37m█`);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [1, 2, 3, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 1), [4, 5, 6, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 1), [7, 8, 9, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(4, 1), [10, 11, 12, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(5, 1), [13, 14, 15, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(6, 1), [16, 17, 18, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(7, 1), [19, 20, 21, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(8, 1), [22, 23, 24, 255]);
        }));
        itWebgl('background 0-15', () => __awaiter(void 0, void 0, void 0, function* () {
            const theme = {
                black: '#010203',
                red: '#040506',
                green: '#070809',
                yellow: '#0a0b0c',
                blue: '#0d0e0f',
                magenta: '#101112',
                cyan: '#131415',
                white: '#161718'
            };
            yield page.evaluate(`window.term.options.theme = ${JSON.stringify(theme)};`);
            yield (0, TestUtils_1.writeSync)(page, `\\x1b[40m \\x1b[41m \\x1b[42m \\x1b[43m \\x1b[44m \\x1b[45m \\x1b[46m \\x1b[47m `);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [1, 2, 3, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 1), [4, 5, 6, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 1), [7, 8, 9, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(4, 1), [10, 11, 12, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(5, 1), [13, 14, 15, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(6, 1), [16, 17, 18, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(7, 1), [19, 20, 21, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(8, 1), [22, 23, 24, 255]);
        }));
        itWebgl('foreground 0-15 inverse', () => __awaiter(void 0, void 0, void 0, function* () {
            const theme = {
                black: '#010203',
                red: '#040506',
                green: '#070809',
                yellow: '#0a0b0c',
                blue: '#0d0e0f',
                magenta: '#101112',
                cyan: '#131415',
                white: '#161718'
            };
            yield page.evaluate(`window.term.options.theme = ${JSON.stringify(theme)};`);
            yield (0, TestUtils_1.writeSync)(page, `\\x1b[7;30m \\x1b[7;31m \\x1b[7;32m \\x1b[7;33m \\x1b[7;34m \\x1b[7;35m \\x1b[7;36m \\x1b[7;37m `);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [1, 2, 3, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 1), [4, 5, 6, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 1), [7, 8, 9, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(4, 1), [10, 11, 12, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(5, 1), [13, 14, 15, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(6, 1), [16, 17, 18, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(7, 1), [19, 20, 21, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(8, 1), [22, 23, 24, 255]);
        }));
        itWebgl('background 0-15 inverse', () => __awaiter(void 0, void 0, void 0, function* () {
            const theme = {
                black: '#010203',
                red: '#040506',
                green: '#070809',
                yellow: '#0a0b0c',
                blue: '#0d0e0f',
                magenta: '#101112',
                cyan: '#131415',
                white: '#161718'
            };
            yield page.evaluate(`window.term.options.theme = ${JSON.stringify(theme)};`);
            yield (0, TestUtils_1.writeSync)(page, `\\x1b[7;40m█\\x1b[7;41m█\\x1b[7;42m█\\x1b[7;43m█\\x1b[7;44m█\\x1b[7;45m█\\x1b[7;46m█\\x1b[7;47m█`);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [1, 2, 3, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 1), [4, 5, 6, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 1), [7, 8, 9, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(4, 1), [10, 11, 12, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(5, 1), [13, 14, 15, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(6, 1), [16, 17, 18, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(7, 1), [19, 20, 21, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(8, 1), [22, 23, 24, 255]);
        }));
        itWebgl('foreground 0-15 inivisible', () => __awaiter(void 0, void 0, void 0, function* () {
            const theme = {
                black: '#010203',
                red: '#040506',
                green: '#070809',
                yellow: '#0a0b0c',
                blue: '#0d0e0f',
                magenta: '#101112',
                cyan: '#131415',
                white: '#161718'
            };
            yield page.evaluate(`window.term.options.theme = ${JSON.stringify(theme)};`);
            yield (0, TestUtils_1.writeSync)(page, `\\x1b[8;30m \\x1b[8;31m \\x1b[8;32m \\x1b[8;33m \\x1b[8;34m \\x1b[8;35m \\x1b[8;36m \\x1b[8;37m `);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [0, 0, 0, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 1), [0, 0, 0, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 1), [0, 0, 0, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(4, 1), [0, 0, 0, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(5, 1), [0, 0, 0, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(6, 1), [0, 0, 0, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(7, 1), [0, 0, 0, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(8, 1), [0, 0, 0, 255]);
        }));
        itWebgl('background 0-15 inivisible', () => __awaiter(void 0, void 0, void 0, function* () {
            const theme = {
                black: '#010203',
                red: '#040506',
                green: '#070809',
                yellow: '#0a0b0c',
                blue: '#0d0e0f',
                magenta: '#101112',
                cyan: '#131415',
                white: '#161718'
            };
            yield page.evaluate(`window.term.options.theme = ${JSON.stringify(theme)};`);
            yield (0, TestUtils_1.writeSync)(page, `\\x1b[8;40m█\\x1b[8;41m█\\x1b[8;42m█\\x1b[8;43m█\\x1b[8;44m█\\x1b[8;45m█\\x1b[8;46m█\\x1b[8;47m█`);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [1, 2, 3, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 1), [4, 5, 6, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 1), [7, 8, 9, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(4, 1), [10, 11, 12, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(5, 1), [13, 14, 15, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(6, 1), [16, 17, 18, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(7, 1), [19, 20, 21, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(8, 1), [22, 23, 24, 255]);
        }));
        itWebgl('foreground 0-15 bright', () => __awaiter(void 0, void 0, void 0, function* () {
            const theme = {
                brightBlack: '#010203',
                brightRed: '#040506',
                brightGreen: '#070809',
                brightYellow: '#0a0b0c',
                brightBlue: '#0d0e0f',
                brightMagenta: '#101112',
                brightCyan: '#131415',
                brightWhite: '#161718'
            };
            yield page.evaluate(`window.term.options.theme = ${JSON.stringify(theme)};`);
            yield (0, TestUtils_1.writeSync)(page, `\\x1b[90m█\\x1b[91m█\\x1b[92m█\\x1b[93m█\\x1b[94m█\\x1b[95m█\\x1b[96m█\\x1b[97m█`);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [1, 2, 3, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 1), [4, 5, 6, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 1), [7, 8, 9, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(4, 1), [10, 11, 12, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(5, 1), [13, 14, 15, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(6, 1), [16, 17, 18, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(7, 1), [19, 20, 21, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(8, 1), [22, 23, 24, 255]);
        }));
        itWebgl('background 0-15 bright', () => __awaiter(void 0, void 0, void 0, function* () {
            const theme = {
                brightBlack: '#010203',
                brightRed: '#040506',
                brightGreen: '#070809',
                brightYellow: '#0a0b0c',
                brightBlue: '#0d0e0f',
                brightMagenta: '#101112',
                brightCyan: '#131415',
                brightWhite: '#161718'
            };
            yield page.evaluate(`window.term.options.theme = ${JSON.stringify(theme)};`);
            yield (0, TestUtils_1.writeSync)(page, `\\x1b[100m \\x1b[101m \\x1b[102m \\x1b[103m \\x1b[104m \\x1b[105m \\x1b[106m \\x1b[107m `);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [1, 2, 3, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 1), [4, 5, 6, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 1), [7, 8, 9, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(4, 1), [10, 11, 12, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(5, 1), [13, 14, 15, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(6, 1), [16, 17, 18, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(7, 1), [19, 20, 21, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(8, 1), [22, 23, 24, 255]);
        }));
        itWebgl('foreground 16-255', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 240 / 16; y++) {
                for (let x = 0; x < 16; x++) {
                    data += `\\x1b[38;5;${16 + y * 16 + x}m█\\x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 240 / 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const cssColor = COLORS_16_TO_255[y * 16 + x];
                    const r = parseInt(cssColor.slice(1, 3), 16);
                    const g = parseInt(cssColor.slice(3, 5), 16);
                    const b = parseInt(cssColor.slice(5, 7), 16);
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [r, g, b, 255]);
                }
            }
        }));
        itWebgl('background 16-255', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 240 / 16; y++) {
                for (let x = 0; x < 16; x++) {
                    data += `\\x1b[48;5;${16 + y * 16 + x}m \x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 240 / 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const cssColor = COLORS_16_TO_255[y * 16 + x];
                    const r = parseInt(cssColor.slice(1, 3), 16);
                    const g = parseInt(cssColor.slice(3, 5), 16);
                    const b = parseInt(cssColor.slice(5, 7), 16);
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [r, g, b, 255]);
                }
            }
        }));
        itWebgl('foreground 16-255 inverse', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 240 / 16; y++) {
                for (let x = 0; x < 16; x++) {
                    data += `\\x1b[7;38;5;${16 + y * 16 + x}m \x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 240 / 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const cssColor = COLORS_16_TO_255[y * 16 + x];
                    const r = parseInt(cssColor.slice(1, 3), 16);
                    const g = parseInt(cssColor.slice(3, 5), 16);
                    const b = parseInt(cssColor.slice(5, 7), 16);
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [r, g, b, 255]);
                }
            }
        }));
        itWebgl('background 16-255 inverse', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 240 / 16; y++) {
                for (let x = 0; x < 16; x++) {
                    data += `\\x1b[7;48;5;${16 + y * 16 + x}m█\\x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 240 / 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const cssColor = COLORS_16_TO_255[y * 16 + x];
                    const r = parseInt(cssColor.slice(1, 3), 16);
                    const g = parseInt(cssColor.slice(3, 5), 16);
                    const b = parseInt(cssColor.slice(5, 7), 16);
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [r, g, b, 255]);
                }
            }
        }));
        itWebgl('foreground 16-255 invisible', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 240 / 16; y++) {
                for (let x = 0; x < 16; x++) {
                    data += `\\x1b[8;38;5;${16 + y * 16 + x}m \x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 240 / 16; y++) {
                for (let x = 0; x < 16; x++) {
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [0, 0, 0, 255]);
                }
            }
        }));
        itWebgl('background 16-255 invisible', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 240 / 16; y++) {
                for (let x = 0; x < 16; x++) {
                    data += `\\x1b[8;48;5;${16 + y * 16 + x}m█\\x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 240 / 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const cssColor = COLORS_16_TO_255[y * 16 + x];
                    const r = parseInt(cssColor.slice(1, 3), 16);
                    const g = parseInt(cssColor.slice(3, 5), 16);
                    const b = parseInt(cssColor.slice(5, 7), 16);
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [r, g, b, 255]);
                }
            }
        }));
        itWebgl('foreground true color red', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    data += `\\x1b[38;2;${i};0;0m█\\x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [i, 0, 0, 255]);
                }
            }
        }));
        itWebgl('background true color red', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    data += `\\x1b[48;2;${i};0;0m \x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [i, 0, 0, 255]);
                }
            }
        }));
        itWebgl('foreground true color green', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    data += `\\x1b[38;2;0;${i};0m█\\x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [0, i, 0, 255]);
                }
            }
        }));
        itWebgl('background true color green', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    data += `\\x1b[48;2;0;${i};0m \x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [0, i, 0, 255]);
                }
            }
        }));
        itWebgl('foreground true color blue', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    data += `\\x1b[38;2;0;0;${i}m█\\x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [0, 0, i, 255]);
                }
            }
        }));
        itWebgl('background true color blue', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    data += `\\x1b[48;2;0;0;${i}m \x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [0, 0, i, 255]);
                }
            }
        }));
        itWebgl('foreground true color grey', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    data += `\\x1b[38;2;${i};${i};${i}m█\\x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [i, i, i, 255]);
                }
            }
        }));
        itWebgl('background true color grey', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    data += `\\x1b[48;2;${i};${i};${i}m \x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [i, i, i, 255]);
                }
            }
        }));
        itWebgl('foreground true color red inverse', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let data = '';
                for (let y = 0; y < 16; y++) {
                    for (let x = 0; x < 16; x++) {
                        const i = y * 16 + x;
                        data += `\x1b[7;38;2;${i};0;0m \x1b[0m`;
                    }
                    data += '\\r\\n';
                }
                yield (0, TestUtils_1.writeSync)(page, data);
                for (let y = 0; y < 16; y++) {
                    for (let x = 0; x < 16; x++) {
                        const i = y * 16 + x;
                        yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [i, 0, 0, 255]);
                    }
                }
            });
        });
        itWebgl('background true color red inverse', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let data = '';
                for (let y = 0; y < 16; y++) {
                    for (let x = 0; x < 16; x++) {
                        const i = y * 16 + x;
                        data += `\\x1b[7;48;2;${i};0;0m█\\x1b[0m`;
                    }
                    data += '\\r\\n';
                }
                yield (0, TestUtils_1.writeSync)(page, data);
                for (let y = 0; y < 16; y++) {
                    for (let x = 0; x < 16; x++) {
                        const i = y * 16 + x;
                        yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [i, 0, 0, 255]);
                    }
                }
            });
        });
        itWebgl('foreground true color green inverse', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    data += `\\x1b[7;38;2;0;${i};0m \x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [0, i, 0, 255]);
                }
            }
        }));
        itWebgl('background true color green inverse', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    data += `\\x1b[7;48;2;0;${i};0m█\\x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [0, i, 0, 255]);
                }
            }
        }));
        itWebgl('foreground true color blue inverse', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    data += `\\x1b[7;38;2;0;0;${i}m \x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [0, 0, i, 255]);
                }
            }
        }));
        itWebgl('background true color blue inverse', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    data += `\\x1b[7;48;2;0;0;${i}m█\\x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [0, 0, i, 255]);
                }
            }
        }));
        itWebgl('foreground true color grey inverse', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    data += `\\x1b[7;38;2;${i};${i};${i}m \x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [i, i, i, 255]);
                }
            }
        }));
        itWebgl('background true color grey inverse', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    data += `\\x1b[7;48;2;${i};${i};${i}m█\\x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [i, i, i, 255]);
                }
            }
        }));
        itWebgl('foreground true color grey invisible', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    data += `\\x1b[8;38;2;${i};${i};${i}m \x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [0, 0, 0, 255]);
                }
            }
        }));
        itWebgl('background true color grey invisible', () => __awaiter(void 0, void 0, void 0, function* () {
            let data = '';
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    data += `\\x1b[8;48;2;${i};${i};${i}m█\\x1b[0m`;
                }
                data += '\\r\\n';
            }
            yield (0, TestUtils_1.writeSync)(page, data);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const i = y * 16 + x;
                    yield (0, TestUtils_1.pollFor)(page, () => getCellColor(x + 1, y + 1), [i, i, i, 255]);
                }
            }
        }));
    });
    describe('minimumContrastRatio', () => __awaiter(void 0, void 0, void 0, function* () {
        if (areTestsEnabled) {
            before(() => __awaiter(void 0, void 0, void 0, function* () { return setupBrowser(); }));
            after(() => __awaiter(void 0, void 0, void 0, function* () { return browser.close(); }));
            beforeEach(() => __awaiter(void 0, void 0, void 0, function* () { return page.evaluate(`window.term.reset()`); }));
        }
        itWebgl('should adjust 0-15 colors on black background', () => __awaiter(void 0, void 0, void 0, function* () {
            const theme = {
                black: '#2e3436',
                red: '#cc0000',
                green: '#4e9a06',
                yellow: '#c4a000',
                blue: '#3465a4',
                magenta: '#75507b',
                cyan: '#06989a',
                white: '#d3d7cf',
                brightBlack: '#555753',
                brightRed: '#ef2929',
                brightGreen: '#8ae234',
                brightYellow: '#fce94f',
                brightBlue: '#729fcf',
                brightMagenta: '#ad7fa8',
                brightCyan: '#34e2e2',
                brightWhite: '#eeeeec'
            };
            yield page.evaluate(`
        window.term.options.theme = ${JSON.stringify(theme)};
        window.term.options.minimumContrastRatio = 1;
      `);
            yield (0, TestUtils_1.writeSync)(page, `\\x1b[30m■\\x1b[31m■\\x1b[32m■\\x1b[33m■\\x1b[34m■\\x1b[35m■\\x1b[36m■\\x1b[37m■\\r\\n` +
                `\\x1b[90m■\\x1b[91m■\\x1b[92m■\\x1b[93m■\\x1b[94m■\\x1b[95m■\\x1b[96m■\\x1b[97m■`);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [0x2e, 0x34, 0x36, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 1), [0xcc, 0x00, 0x00, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 1), [0x4e, 0x9a, 0x06, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(4, 1), [0xc4, 0xa0, 0x00, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(5, 1), [0x34, 0x65, 0xa4, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(6, 1), [0x75, 0x50, 0x7b, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(7, 1), [0x06, 0x98, 0x9a, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(8, 1), [0xd3, 0xd7, 0xcf, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 2), [0x55, 0x57, 0x53, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 2), [0xef, 0x29, 0x29, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 2), [0x8a, 0xe2, 0x34, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(4, 2), [0xfc, 0xe9, 0x4f, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(5, 2), [0x72, 0x9f, 0xcf, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(6, 2), [0xad, 0x7f, 0xa8, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(7, 2), [0x34, 0xe2, 0xe2, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(8, 2), [0xee, 0xee, 0xec, 255]);
            yield page.evaluate(`window.term.options.minimumContrastRatio = 10;`);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [176, 180, 180, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 1), [238, 158, 158, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 1), [152, 198, 110, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(4, 1), [208, 179, 49, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(5, 1), [161, 183, 215, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(6, 1), [191, 174, 194, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(7, 1), [110, 197, 198, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(8, 1), [211, 215, 207, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 2), [183, 185, 183, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 2), [249, 156, 156, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 2), [138, 226, 52, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(4, 2), [252, 233, 79, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(5, 2), [154, 186, 221, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(6, 2), [203, 173, 199, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(7, 2), [0x34, 0xe2, 0xe2, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(8, 2), [0xee, 0xee, 0xec, 255]);
        }));
        itWebgl('should adjust 0-15 colors on white background', () => __awaiter(void 0, void 0, void 0, function* () {
            const theme = {
                background: '#ffffff',
                black: '#2e3436',
                red: '#cc0000',
                green: '#4e9a06',
                yellow: '#c4a000',
                blue: '#3465a4',
                magenta: '#75507b',
                cyan: '#06989a',
                white: '#d3d7cf',
                brightBlack: '#555753',
                brightRed: '#ef2929',
                brightGreen: '#8ae234',
                brightYellow: '#fce94f',
                brightBlue: '#729fcf',
                brightMagenta: '#ad7fa8',
                brightCyan: '#34e2e2',
                brightWhite: '#eeeeec'
            };
            yield page.evaluate(`
        window.term.options.theme = ${JSON.stringify(theme)};
        window.term.options.minimumContrastRatio = 1;
      `);
            yield (0, TestUtils_1.writeSync)(page, `\\x1b[30m■\\x1b[31m■\\x1b[32m■\\x1b[33m■\\x1b[34m■\\x1b[35m■\\x1b[36m■\\x1b[37m■\\r\\n` +
                `\\x1b[90m■\\x1b[91m■\\x1b[92m■\\x1b[93m■\\x1b[94m■\\x1b[95m■\\x1b[96m■\\x1b[97m■`);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [0x2e, 0x34, 0x36, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 1), [0xcc, 0x00, 0x00, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 1), [0x4e, 0x9a, 0x06, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(4, 1), [0xc4, 0xa0, 0x00, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(5, 1), [0x34, 0x65, 0xa4, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(6, 1), [0x75, 0x50, 0x7b, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(7, 1), [0x06, 0x98, 0x9a, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(8, 1), [0xd3, 0xd7, 0xcf, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 2), [0x55, 0x57, 0x53, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 2), [0xef, 0x29, 0x29, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 2), [0x8a, 0xe2, 0x34, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(4, 2), [0xfc, 0xe9, 0x4f, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(5, 2), [0x72, 0x9f, 0xcf, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(6, 2), [0xad, 0x7f, 0xa8, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(7, 2), [0x34, 0xe2, 0xe2, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(8, 2), [0xee, 0xee, 0xec, 255]);
            yield page.evaluate(`window.term.options.minimumContrastRatio = 10;`);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [46, 52, 54, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 1), [132, 0, 0, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 1), [36, 72, 0, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(4, 1), [72, 59, 0, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(5, 1), [32, 64, 106, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(6, 1), [75, 51, 80, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(7, 1), [0, 71, 72, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(8, 1), [64, 64, 63, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 2), [61, 63, 59, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 2), [125, 19, 19, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 2), [40, 67, 13, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(4, 2), [67, 63, 19, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(5, 2), [45, 65, 87, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(6, 2), [81, 57, 78, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(7, 2), [13, 67, 67, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(8, 2), [64, 64, 64, 255]);
        }));
    }));
    describe('selectionBackground', () => __awaiter(void 0, void 0, void 0, function* () {
        if (areTestsEnabled) {
            before(() => __awaiter(void 0, void 0, void 0, function* () { return setupBrowser(); }));
            after(() => __awaiter(void 0, void 0, void 0, function* () { return browser.close(); }));
            beforeEach(() => __awaiter(void 0, void 0, void 0, function* () { return page.evaluate(`window.term.reset()`); }));
        }
        itWebgl('should resolve the inverse foreground color based on the original background color, not the selection', () => __awaiter(void 0, void 0, void 0, function* () {
            const theme = {
                foreground: '#FF0000',
                background: '#00FF00',
                selectionBackground: '#0000FF'
            };
            yield page.evaluate(`window.term.options.theme = ${JSON.stringify(theme)};`);
            yield (0, TestUtils_1.writeSync)(page, ` █\\x1b[7m█\\x1b[0m`);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [0, 255, 0, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 1), [255, 0, 0, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 1), [0, 255, 0, 255]);
            yield page.evaluate(`window.term.selectAll()`);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [0, 0, 255, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 1), [255, 0, 0, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(3, 1), [0, 255, 0, 255]);
        }));
    }));
    describe('allowTransparency', () => __awaiter(void 0, void 0, void 0, function* () {
        if (areTestsEnabled) {
            before(() => __awaiter(void 0, void 0, void 0, function* () { return setupBrowser({ allowTransparency: true }); }));
            after(() => __awaiter(void 0, void 0, void 0, function* () { return browser.close(); }));
            beforeEach(() => __awaiter(void 0, void 0, void 0, function* () { return page.evaluate(`window.term.reset()`); }));
        }
        itWebgl('transparent background inverse', () => __awaiter(void 0, void 0, void 0, function* () {
            const theme = {
                background: '#ff000080'
            };
            yield page.evaluate(`window.term.options.theme = ${JSON.stringify(theme)};`);
            const data = `\\x1b[7m█\\x1b[0m`;
            yield (0, TestUtils_1.writeSync)(page, data);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [255, 0, 0, 255]);
        }));
    }));
    describe('selectionForeground', () => {
        if (areTestsEnabled) {
            before(() => __awaiter(void 0, void 0, void 0, function* () { return setupBrowser(); }));
            after(() => __awaiter(void 0, void 0, void 0, function* () { return browser.close(); }));
            beforeEach(() => __awaiter(void 0, void 0, void 0, function* () { return page.evaluate(`window.term.reset()`); }));
        }
        itWebgl('transparent background inverse', () => __awaiter(void 0, void 0, void 0, function* () {
            const theme = {
                selectionForeground: '#ff0000'
            };
            yield page.evaluate(`window.term.options.theme = ${JSON.stringify(theme)};`);
            const data = `\\x1b[7m█\\x1b[0m`;
            yield (0, TestUtils_1.writeSync)(page, data);
            yield page.evaluate(`window.term.selectAll()`);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [255, 0, 0, 255]);
        }));
    });
    describe('decoration color overrides', () => __awaiter(void 0, void 0, void 0, function* () {
        if (areTestsEnabled) {
            before(() => __awaiter(void 0, void 0, void 0, function* () { return setupBrowser(); }));
            after(() => __awaiter(void 0, void 0, void 0, function* () { return browser.close(); }));
            beforeEach(() => __awaiter(void 0, void 0, void 0, function* () { return page.evaluate(`window.term.reset()`); }));
        }
        itWebgl('foregroundColor', () => __awaiter(void 0, void 0, void 0, function* () {
            yield page.evaluate(`
        const marker = window.term.registerMarker(-window.term.buffer.active.cursorY);
        window.term.registerDecoration({
          marker,
          foregroundColor: '#ff0000',
          backgroundColor: '#0000ff'
        });
      `);
            const data = `█`;
            yield (0, TestUtils_1.writeSync)(page, data);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [255, 0, 0, 255]);
        }));
        itWebgl('foregroundColor should ignore inverse', () => __awaiter(void 0, void 0, void 0, function* () {
            yield page.evaluate(`
        const marker = window.term.registerMarker(-window.term.buffer.active.cursorY);
        window.term.registerDecoration({
          marker,
          foregroundColor: '#ff0000',
          backgroundColor: '#0000ff'
        });
      `);
            const data = `\\x1b[7m█\\x1b[0m`;
            yield (0, TestUtils_1.writeSync)(page, data);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [255, 0, 0, 255]);
        }));
        itWebgl('foregroundColor should ignore inverse (only fg on decoration)', () => __awaiter(void 0, void 0, void 0, function* () {
            yield page.evaluate(`
        const marker = window.term.registerMarker(-window.term.buffer.active.cursorY);
        window.term.registerDecoration({
          marker,
          width: 2,
          foregroundColor: '#ff0000'
        });
      `);
            const data = `\\x1b[7m█ \\x1b[0m`;
            yield (0, TestUtils_1.writeSync)(page, data);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [255, 0, 0, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 1), [255, 255, 255, 255]);
        }));
        itWebgl('backgroundColor', () => __awaiter(void 0, void 0, void 0, function* () {
            yield page.evaluate(`
        const marker = window.term.registerMarker(-window.term.buffer.active.cursorY);
        window.term.registerDecoration({
          marker,
          foregroundColor: '#ff0000',
          backgroundColor: '#0000ff'
        });
      `);
            const data = ` `;
            yield (0, TestUtils_1.writeSync)(page, data);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [0, 0, 255, 255]);
        }));
        itWebgl('backgroundColor should ignore inverse', () => __awaiter(void 0, void 0, void 0, function* () {
            yield page.evaluate(`
        const marker = window.term.registerMarker(-window.term.buffer.active.cursorY);
        window.term.registerDecoration({
          marker,
          foregroundColor: '#ff0000',
          backgroundColor: '#0000ff'
        });
      `);
            const data = `\\x1b[7m \\x1b[0m`;
            yield (0, TestUtils_1.writeSync)(page, data);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [0, 0, 255, 255]);
        }));
        itWebgl('backgroundColor should ignore inverse (only bg on decoration)', () => __awaiter(void 0, void 0, void 0, function* () {
            const data = `\\x1b[7m█ \\x1b[0m`;
            yield (0, TestUtils_1.writeSync)(page, data);
            yield page.evaluate(`
        const marker = window.term.registerMarker(-window.term.buffer.active.cursorY);
        window.term.registerDecoration({
          marker,
          width: 2,
          backgroundColor: '#0000ff'
        });
      `);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(1, 1), [0, 0, 0, 255]);
            yield (0, TestUtils_1.pollFor)(page, () => getCellColor(2, 1), [0, 0, 255, 255]);
        }));
    }));
}));
function getCellColor(col, row) {
    return __awaiter(this, void 0, void 0, function* () {
        yield page.evaluate(`
    window.gl = window.term._core._renderService._renderer._gl;
    window.result = new Uint8Array(4);
    window.d = window.term._core._renderService.dimensions;
    window.gl.readPixels(
      Math.floor((${col - 0.5}) * window.d.scaledCellWidth),
      Math.floor(window.gl.drawingBufferHeight - 1 - (${row - 0.5}) * window.d.scaledCellHeight),
      1, 1, window.gl.RGBA, window.gl.UNSIGNED_BYTE, window.result
    );
  `);
        return yield page.evaluate(`Array.from(window.result)`);
    });
}
function getCellPixels(col, row) {
    return __awaiter(this, void 0, void 0, function* () {
        yield page.evaluate(`
    window.gl = window.term._core._renderService._renderer._gl;
    window.result = new Uint8Array(window.d.scaledCellWidth * window.d.scaledCellHeight * 4);
    window.d = window.term._core._renderService.dimensions;
    window.gl.readPixels(
      Math.floor(${col - 1} * window.d.scaledCellWidth),
      Math.floor(window.gl.drawingBufferHeight - ${row} * window.d.scaledCellHeight),
      window.d.scaledCellWidth, window.d.scaledCellHeight, window.gl.RGBA, window.gl.UNSIGNED_BYTE, window.result
    );
  `);
        return yield page.evaluate(`Array.from(window.result)`);
    });
}
function setupBrowser(options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        browser = yield (0, TestUtils_1.launchBrowser)();
        page = yield (yield browser.newContext()).newPage();
        yield page.setViewportSize({ width, height });
        yield page.goto(APP);
        yield (0, TestUtils_1.openTerminal)(page, options);
        yield page.evaluate(`
    window.addon = new WebglAddon(true);
    window.term.loadAddon(window.addon);
  `);
    });
}
const COLORS_16_TO_255 = [
    '#000000', '#00005f', '#000087', '#0000af', '#0000d7', '#0000ff', '#005f00', '#005f5f', '#005f87', '#005faf', '#005fd7', '#005fff', '#008700', '#00875f', '#008787', '#0087af',
    '#0087d7', '#0087ff', '#00af00', '#00af5f', '#00af87', '#00afaf', '#00afd7', '#00afff', '#00d700', '#00d75f', '#00d787', '#00d7af', '#00d7d7', '#00d7ff', '#00ff00', '#00ff5f',
    '#00ff87', '#00ffaf', '#00ffd7', '#00ffff', '#5f0000', '#5f005f', '#5f0087', '#5f00af', '#5f00d7', '#5f00ff', '#5f5f00', '#5f5f5f', '#5f5f87', '#5f5faf', '#5f5fd7', '#5f5fff',
    '#5f8700', '#5f875f', '#5f8787', '#5f87af', '#5f87d7', '#5f87ff', '#5faf00', '#5faf5f', '#5faf87', '#5fafaf', '#5fafd7', '#5fafff', '#5fd700', '#5fd75f', '#5fd787', '#5fd7af',
    '#5fd7d7', '#5fd7ff', '#5fff00', '#5fff5f', '#5fff87', '#5fffaf', '#5fffd7', '#5fffff', '#870000', '#87005f', '#870087', '#8700af', '#8700d7', '#8700ff', '#875f00', '#875f5f',
    '#875f87', '#875faf', '#875fd7', '#875fff', '#878700', '#87875f', '#878787', '#8787af', '#8787d7', '#8787ff', '#87af00', '#87af5f', '#87af87', '#87afaf', '#87afd7', '#87afff',
    '#87d700', '#87d75f', '#87d787', '#87d7af', '#87d7d7', '#87d7ff', '#87ff00', '#87ff5f', '#87ff87', '#87ffaf', '#87ffd7', '#87ffff', '#af0000', '#af005f', '#af0087', '#af00af',
    '#af00d7', '#af00ff', '#af5f00', '#af5f5f', '#af5f87', '#af5faf', '#af5fd7', '#af5fff', '#af8700', '#af875f', '#af8787', '#af87af', '#af87d7', '#af87ff', '#afaf00', '#afaf5f',
    '#afaf87', '#afafaf', '#afafd7', '#afafff', '#afd700', '#afd75f', '#afd787', '#afd7af', '#afd7d7', '#afd7ff', '#afff00', '#afff5f', '#afff87', '#afffaf', '#afffd7', '#afffff',
    '#d70000', '#d7005f', '#d70087', '#d700af', '#d700d7', '#d700ff', '#d75f00', '#d75f5f', '#d75f87', '#d75faf', '#d75fd7', '#d75fff', '#d78700', '#d7875f', '#d78787', '#d787af',
    '#d787d7', '#d787ff', '#d7af00', '#d7af5f', '#d7af87', '#d7afaf', '#d7afd7', '#d7afff', '#d7d700', '#d7d75f', '#d7d787', '#d7d7af', '#d7d7d7', '#d7d7ff', '#d7ff00', '#d7ff5f',
    '#d7ff87', '#d7ffaf', '#d7ffd7', '#d7ffff', '#ff0000', '#ff005f', '#ff0087', '#ff00af', '#ff00d7', '#ff00ff', '#ff5f00', '#ff5f5f', '#ff5f87', '#ff5faf', '#ff5fd7', '#ff5fff',
    '#ff8700', '#ff875f', '#ff8787', '#ff87af', '#ff87d7', '#ff87ff', '#ffaf00', '#ffaf5f', '#ffaf87', '#ffafaf', '#ffafd7', '#ffafff', '#ffd700', '#ffd75f', '#ffd787', '#ffd7af',
    '#ffd7d7', '#ffd7ff', '#ffff00', '#ffff5f', '#ffff87', '#ffffaf', '#ffffd7', '#ffffff', '#080808', '#121212', '#1c1c1c', '#262626', '#303030', '#3a3a3a', '#444444', '#4e4e4e',
    '#585858', '#626262', '#6c6c6c', '#767676', '#808080', '#8a8a8a', '#949494', '#9e9e9e', '#a8a8a8', '#b2b2b2', '#bcbcbc', '#c6c6c6', '#d0d0d0', '#dadada', '#e4e4e4', '#eeeeee'
];
//# sourceMappingURL=WebglRenderer.api.js.map