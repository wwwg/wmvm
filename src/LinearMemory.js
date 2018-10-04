// hexdump isn't mandatory, but try to require() it
let hexdump;
try {
    hexdump = require('hexdump-nodejs');
} catch(e) {
    hexdump = null;
}
class LinearMemory extends Uint8Array {
    constructor(vm, offset) {
        super(LinearMemory.INITIAL_MEMORY_SIZE);
        if (offset === null || typeof offset === 'undefined') {
            vm.dbg('LinearMemory/construct: WARN: linear memory offset doesn\'t exist, aborting');
            return;
        }
        this.vm = vm;
        this.initString = vm.initialMemoryData.mem;
        for (let i = 0; i < this.initString.length; ++i) {
            let byte = this.initString.charCodeAt(i);
            this[offset + i] = byte;
        }
        vm.dbg('LinearMemory/construct: Sucessfully set initial memory');
    }
    // utility functions
    accessString(ptr) {
        // Gets a string from virtual memory and returns as a js string
        let i = ptr,
            out = '';
        while (this[i] != 0) {
            out += String.fromCharCode(this[i]);
            ++i;
        }
        return out;
    }
    accessStringRaw(ptr) {
        // Gets a string from virtual memory and returns as a js byte array
        let i = ptr,
            out = [];
        while (this[i] != 0) {
            out.push(this[i]);
            ++i;
        }
        return out;
    }
    accessInt8(ptr, signed = true) {
        let view = new DataView(this.mem.buffer, ptr);
        if (signed) {
            return view.getInt8(0, true);
        } else {
            return view.getUint8(0, true);
        }
    }
    accessByte(ptr) {
        return this.accessInt8(ptr, false);
    }
    accessInt32(ptr, signed = true) {
        let view = new DataView(this.buffer, ptr);
        if (signed) {
            return view.getInt32(0, true);
        } else {
            return view.getUint32(0, true);
        }
    }
    accessFloat32(ptr) {
        let view = new DataView(this.buffer, ptr);
        return view.getFloat32(0, true);
    }
    accessFloat64(ptr) {
        let view = new DataView(this.buffer, ptr);
        return view.getFloat64(0, true);
    }
    dump(ptr, totalBytes) {
        if (!hexdump) {
            this.vm.dbg(`LinearMemory/dump: hexdump not found, not dumping memory`);
            return;
        }
        // dump the section to an array
        let arr = [];
        for (let i = ptr; i < (totalBytes + ptr); ++i) {
            let byte = this[i];
            arr.push(byte);
        }
        let buf = Buffer.from(arr);
        return hexdump(buf);
    }
}
// 4 pages of memory by default
LinearMemory.INITIAL_MEMORY_SIZE = 64000 * 4;
module.exports = LinearMemory;