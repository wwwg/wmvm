const Binaryen = require("binaryen"),
    expression = require("./runtime/expressions"),
    getInitialMemory = require('./getInitialMemory'),
    MetaFunction = expression.MetaFunction;
const INITIAL_MEMORY_SIZE = 10000;
class wmvm {
    dbg(...args) {
        console.log.apply(console, args);
    }
    lookupFunction(symbol) {
        // Returns the MetaFunction the symbol points to, and locates imports if they exist
        if (this.fnMap[symbol]) {
            let fn = this.fnMap[symbol];
            if (fn.isImport) {
                // todo
            } else {
                this.dbg(`lookupFunction: successfully resolved local function "${fn.name}"`);
                return fn;
            }
        } else {
            this.dbg(`lookupFunction: failed to resolve function "${fn.name}"`);
            return null;
        }
    }
    lookupVirtualImport(mod, name) {
        for (let i = 0; i < this.virtualImports.length; ++i) {
            let _import = this.virtualImports[i];
            if (_import.name == name && _import.module == mod) {
                return _import;
            }
        }
        this.dbg(`lookupVirtualImport: failed lookup import "${name}" in "${mod}"`);
        return null;
    }
    addStaticImport(moduleName, fnName, fn) {
        // Static imports have to be added before the vm starts
        if (!fn instanceof Function) {
            this.dbg(`failed to add import "${fnName}" - fn isn't a function`);
            return;
        }
        let virtualImport = {
            module: moduleName,
            name: fnName,
            jsFunc: fn
        }
        this.virtualImports.push(virtualImport);
        this.dbg(`added import "${fnName}" in import module "${moduleName}"`);
    }
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
        this.dbg('Parsing input data..');
        if (!this.isBinary) {
            this.module = Binaryen.parseText(this.data);
            this.wast = this.data;
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
            this.wast = this.module.emitText();
        }
        // start doing vm things once input parsing is taken care of
        this.module.dbg = this.dbg.bind(this);
        // A map of all currently parsed functions
        this.fnMap = {};
        // A table of virtual imports for the binary to call
        this.virtualImports = [];
        // Memory
        this.mem = new Uint8Array(INITIAL_MEMORY_SIZE);
        // Find initial memory
        let initialMemory = getInitialMemory(this.wast);
        if (!initialMemory) {
            this.dbg('Failed to find initial memory in module, ignoring');
        } else {
            for (let i = 0; i < initialMemory.length; ++i) {
                let byte = initialMemory.charCodeAt(i);
                initialMemory[i] = byte;
            }
            this.dbg('Sucessfully set initial memory');
        }
        
        this.dbg('Input parsed successfully');
    }
    discover(overrideMain) {
        if (!overrideMain) {
                this.dbg('Trying to find _main()...');
                this._main = new MetaFunction(this, '_main');
                if (!this._main.exists) {
                    this.dbg('FATAL: failed to find _main(), aborting');
                    return;
                }
            } else {
                this.dbg(`Trying to find "${overrideMain}"...`);
                this._main = new MetaFunction(this, overrideMain);
                if (!this._main.exists) {
                    this.dbg(`FATAL: failed to find override main "${overrideMain}", aborting`);
                    return;
                }
            }
            
            this.fnMap._main = this._main;
            this.dbg(`Expression parsing finished.`);
            this.dbg(`Discovered ${Object.keys(this.fnMap).length} functions required for runtime.`);
    }
    run() {
        //
    }
}
module.exports = wmvm;