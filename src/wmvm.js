const Binaryen = require("binaryen");
class wmvm {
    constructor(data, type) {
        if (!data) {
            throw new TypeError("Invalid arguents for wmvm constructor");
            return;
        }
        this.data = data;
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
        } else {
            if (data instanceof Buffer) {
                let u8 = new Uint8Array(data);
                this.module = Binaryen.readBinary(u8);
            } else {
                this.module = Binaryen.readBinary(this.data);
            }
        }
        this._main = null;
        try {
            this._main = this.module.getFunction('_main');
        } catch (e) {
            console.log('failed to find main');
        }
    }
}
module.exports = wmvm;