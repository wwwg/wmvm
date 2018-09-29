var WasmParser = require('wasmparser');
let readu8 = u8 => {
    return String.fromCharCode.apply(null, u8);
}
module.exports = binary => {
    let res = [];
    let reader = new WasmParser.BinaryReader();
    reader.setData(binary.buffer, 0, binary.length);
    while (reader.read()) {
        let state = reader.state;
        let pos = reader.position;
        let info = reader.result;
        if (state == WasmParser.BinaryReaderState.IMPORT_SECTION_ENTRY) {
            let iobj = {
                module: readu8(info.module),
                name: readu8(info.field),
                isFunction: !!(info.funcTypeIndex)
            };
            res.push(iobj);
        }
    }
    return res;
}
  