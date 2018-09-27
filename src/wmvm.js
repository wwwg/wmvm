const Binaryen = require("binaryen"),
    expression = require("./runtime/expressions"),
    MetaFunction = expression.MetaFunction,
    parse = expression.parse;
class wmvm {
    dbg(...args) {
        console.log.apply(console, args);
    }
    constructor(data, type) {
        if (!data) {
            throw new TypeError("Invalid arguents for wmvm constructor");
            return;
        }
        this.data = data;
        // A map of all currently parsed functions
        this.fnMap = {};
        if (type) {
            this.isBinary = (type === 'wasm');
        } else {
            if (typeof data === 'string') {
                this.isBinary = false;
            } else if (data instanceof Buffer || data instanceof Uint8Array) {
                this.isBinary = true;
            } else {
                throw new TypeError("I don't know how to interpret the input data");
            }
        }
        // Generate a binaryen module
        if (!this.isBinary) {
            this.module = Binaryen.parseText(this.data);
            this.binary = this.module.emitBinary();
        } else {
            if (data instanceof Buffer) {
                let u8 = new Uint8Array(data);
                this.module = Binaryen.readBinary(u8);
                this.binary = u8;
            } else {
                this.module = Binaryen.readBinary(this.data);
                this.binary = data;
            }
        }
        this.module.dbg = this.dbg.bind(this);
        this.module._fnMap = this.fnMap;
        this._main = new MetaFunction(this.module, '_main');
        this.fnMap._main = this._main;
        this.dbg(`Expression parsing finished.`);
        this.dbg(`Discovered ${Object.keys(this.fnMap).length} functions required for runtime.`);
    }
}
module.exports = wmvm;