const binaryen = require("binaryen");
class wmvm {
    constructor(data, type) {
        if (!data || !type) {
            throw new TypeError("Invalid arguents for wmvm constructor");
            return;
        }
        this.isBinary = (type === 'wasm');
        this.data = data;
    }
}
Module.exports = wmvm;