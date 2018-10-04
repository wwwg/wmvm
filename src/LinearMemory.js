// hexdump isn't mandatory, but try to require() it
let hexdump;
try {
    hexdump = require('hexdump-nodejs');
} catch(e) {
    hexdump = null;
}
class LinearMemory extends Uint8Array {
    constructor(vm, initializer) {
        super(LinearMemory.INITIAL_MEMORY_SIZE);
        this.vm = vm;
        this.init = initializer;
        if (!initializer.mem || !initializer.ptr) {
            vm.dbg('LinearMemory/construct: Failed to find initial memory in module, ignoring');
        } else {
            vm.memPtrName = initializer.ptr;
            for (let i = 0; i < initializer.mem.length; ++i) {
                let byte = initializer.mem.charCodeAt(i);
                this[i + LinearMemory.INITIAL_MEMORY_OFFSET] = byte;
            }
            vm.dbg('LinearMemory/construct: Sucessfully set initial memory with pointer name "' + this.memPtrName + '"');
        }
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
        // Write memory to a node Buffer
        let buf = new Buffer(totalBytes);
        for (let i = ptr; i < (ptr + totalBytes); ++i) {
            buf[i - ptr] = this[i];
        }
        // Print it
        console.log(`dumpMemory: 0x${ptr.toString(16)} to 0x${((ptr + totalBytes).toString(16))} (${totalBytes} bytes):`);
        let rawHex = buf.toString('hex'),
            outHex = 'HEX: < ',
            byteIndex = 0;
        for (let i = 0; i < rawHex.length; ++i) {
            ++byteIndex;
            let c = rawHex[i];
            outHex += c;
            if (byteIndex == 2) {
                // Append space every 2 characters
                outHex += ' ';
                byteIndex = 0;
            }
        }
        outHex += '>';
        console.log(outHex);
        let outAscii = 'TXT: < ';
        for (let i = ptr; i < (ptr + totalBytes); ++i) {
            let byte = this[i],
                c = String.fromCharCode(byte);
            if (byte === 0x0) {
                outAscii += `\\0 `;
            } else if (byte === 0xa) {
                outAscii += `\\n `;
            } else {
                outAscii += c;
                outAscii += '  ';
            }
        }
        outAscii += '>';
        console.log(outAscii);
    }
}
// 4 pages of memory by default
LinearMemory.INITIAL_MEMORY_SIZE = 64000 * 4;
LinearMemory.INITIAL_MEMORY_OFFSET = 1024;
module.exports = LinearMemory;