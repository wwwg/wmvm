const Binaryen = require("binaryen"),
    expression = require("./runtime/expressions"),
    getInitialMemory = require('./parse/getInitialMemory'),
    Stack = require('./Stack');
    ExpressionInterpreter = require('./runtime/interpret'),
    getImports = require('./parse/parseImports'),
    getGlobals = require('./parse/parseGlobals'),
    MetaFunction = expression.MetaFunction;

const INITIAL_MEMORY_SIZE = 10000;
class wmvm {
    dbg(...args) {
        /*
        let arg1 = args[0];
        // Filter everything but critical information and warnings
        if (arg1.includes('WARN') || arg1.includes('CRITICAL')) {
            console.log.apply(console, args);
        }
        */
       console.log.apply(console, args);
    }
    lookupFunction(symbol) {
        // Returns the MetaFunction the symbol points to, and locates imports if they exist
        if (this.fnMap[symbol]) {
            let fn = this.fnMap[symbol];
            if (fn.isImport) {
                if (fn.virtualImport) {
                    // function has a virtual import mapped to it, return it
                    return fn;
                } else {
                    let mappedImport = this.lookupVirtualImport(fn.importModule, fn.name);
                    if (!mappedImport) {
                        this.dbg(`lookupFunction: CRITICAL: failed to resolve import function "${fn.name}"`);
                        return null;
                    }
                    if (!mappedImport.isFn) {
                        this.dbg(`lookupFunction: looked up an import function that isn't a function: "${fn.name}"`);
                        return null;
                    }
                    if (!fn.virtualImport) {
                        this.dbg(`lookupFunction: mapped new import function "${fn.name}" to it's respective import`);
                        fn.virtualImport = mappedImport;
                    }
                    return fn;
                }
            } else {
                this.dbg(`lookupFunction: successfully resolved local function "${fn.name}"`);
                return fn;
            }
        } else {
            this.dbg(`lookupFunction: CRITICAL: failed to resolve function "${fn.name}"`);
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
    addImportFunction(moduleName, fnName, fn) {
        // Static imports have to be added before the vm starts
        if (!fn instanceof Function) {
            this.dbg(`addImportFunction: failed to add import "${fnName}" - fn isn't a function`);
            return this;
        }
        fn = fn.bind(this);
        let virtualImport = {
            module: moduleName,
            name: fnName,
            isFn: true,
            jsFunc: fn
        }
        this.virtualImports.push(virtualImport);
        this.dbg(`addImportFunction: added import "${fnName}" in import module "${moduleName}"`);
        return this;
    }
    addImportVariable(moduleName, name, value, type = null) {
        let virtualImport = {
            module: moduleName,
            name: name,
            value: value,
            type: type,
            isFn: false
        }
        this.virtualImports.push(virtualImport);
        this.dbg(`addImportVariable: added variable import "${name}" / module "${moduleName}", value: ${value}`);
        return this;
    }
    addImport(moduleName, name, value, type = null) {
        if (value instanceof Function) {
            this.addImportFunction(moduleName, name, value);
        } else {
            this.addImportVariable(moduleName, name, value, type);
        }
        return this;
    }
    addImports(importArray) {
        for (let i = 0; i < importArray.length; ++i) {
            let importObj = importArray[i];
            if (importObj.module && importObj.name) {
                if (importObj.type) {
                    this.addImport(importObj.module, importObj.name, importObj.value, importObj.type);
                } else {
                    this.addImport(importObj.module, importObj.name, importObj.value);
                }
            } else {
                console.log('wmvm: WARN: ignoring bad import object');
                continue;
            }
        }
        return this;
    }
    setImport(mod, name, value, type = null) {
        for (let i = 0; i < this.virtualImports.length; ++i) {
            let _import = this.virtualImports[i];
            if (_import.name == name && _import.module == mod) {
                if (_import.isFn) {
                    _import.jsFunc = value;
                } else {
                    _import.value = value;
                    if (type) {
                        _import.type = type;
                    }
                }
                return this;
            }
        }
        this.dbg(`setImport: failed to update import "${name}" in "${mod}", ignoring`);
        return this;
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
        this.dbg('construct: Parsing input data..');
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
        this.parsedImports = getImports(this.wast);
        this.parsedGlobals = getGlobals(this.wast);

        // start doing vm things once input parsing is taken care of
        this.module.dbg = this.dbg.bind(this);
        // A map of all currently parsed functions
        this.fnMap = {};
        // A map of all globals
        this.globals = {};
        // Map of all loops - used for asynchronous breaking
        this.loopMap = {};
        // A table of virtual imports for the binary to call
        this.virtualImports = [];
        // Memory
        this.mem = new Uint8Array(INITIAL_MEMORY_SIZE);
        this.memory = this.mem; // alias
        this.memPtrName = null;
        // Find initial memory
        let initialMemoryData = getInitialMemory(this.wast);
        if (!initialMemoryData.mem || !initialMemoryData.ptr) {
            this.dbg('construct: Failed to find initial memory in module, ignoring');
        } else {
            this.memPtrName = initialMemoryData.ptr;
            for (let i = 0; i < initialMemoryData.mem.length; ++i) {
                let byte = initialMemoryData.mem.charCodeAt(i);
                this.mem[i] = byte;
            }
            this.dbg('construct: Sucessfully set initial memory with pointer name "' + this.memPtrName + '"');
            this.globals[this.memPtrName] = {
                type: 1,
                value: 0
            }
        }
        // stack
        this.stack = new Stack(this);
        
        this.dbg('construct: Input parsed successfully');
    }
    // Primary API methods
    link(overrideMain) {
        // @@!@$(&^!@$&) IM PUTTING A BUNCH OF RANDOM CHARACTERS HERE SO I DON'T FORGET THIS COMMENT $&@@#&$(%^@(&@#))

        // TODO : Parse names of all functions via @webassemblyjs/wast-parser before linking, and add each of them to the function map
        
        // *)&Q)*#%@#%! IM PUTTING A BUNCH OF RANDOM CHARACTERS HERE SO I DON'T FORGET THIS COMMENT @$*%)@$*^^&@#%@
        this.dbg(`link: Checking if module is emscripten-compiled...`);
        try {
            this.module.getFunction('runPostSets');
            this.isEmcc = true;
        } catch (e) {
            this.isEmcc = false;
        }
        this.dbg(`link: isEmcc=${this.isEmcc}`);
        if (this.isEmcc) {
            // Call MetaFunction constructors on default emcc functions, and link them
            this.dbg(`link: mapping emscripten functions..`);
            this._stackAlloc = new MetaFunction(this, 'stackAlloc');
            if (this._stackAlloc.exists) {
                this.fnMap['stackAlloc'] = this._stackAlloc;
            }
            this._stackSave = new MetaFunction(this, 'stackSave');
            if (this._stackSave.exists) {
                this.fnMap['stackSave'] = this._stackSave;
            }
            this._establishStackSpace = new MetaFunction(this, 'establishStackSpace');
            if (this._establishStackSpace.exists) {
                this.fnMap['establishStackSpace'] = this._establishStackSpace;
            }
            this._setThrew = new MetaFunction(this, 'setThrew');
            if (this._setThrew.exists) {
                this.fnMap['setThrew'] = this._setThrew;
            }
            this.dbg(`link: emscripten functions mapped!`);
        }
        if (!overrideMain) {
                this.dbg('link: Trying to find _main()...');
                this._main = new MetaFunction(this, '_main');
                if (!this._main.exists) {
                    this.dbg('link: FATAL: failed to find _main(), aborting');
                    return;
                }
            } else {
                this.dbg(`link: Trying to find "${overrideMain}"...`);
                this._main = new MetaFunction(this, overrideMain);
                if (!this._main.exists) {
                    this.dbg(`link: FATAL: failed to find override main "${overrideMain}", aborting`);
                    return;
                }
            }

            this.fnMap._main = this._main;
            this.dbg(`link: Discovered ${Object.keys(this.fnMap).length} functions required for runtime.`);

            // Setup global map
            // This is in the linking routine because static imports are sometimes required by globals
            for (let i = 0; i < this.parsedGlobals.length; ++i) {
                let global = this.parsedGlobals[i];
                if (global.isConst) {
                    this.dbg(`link: Mapping cost global "${global.name}" with value ${global.value}`);
                    this.globals[global.name] = {
                        type: global.type,
                        value: global.value
                    }
                } else {
                    // static import
                    let mappedParsedImport = null;
                    for (let i = 0; i < this.parsedImports.length; ++i) {
                        let parsedImport = this.parsedImports[i];
                        if (parsedImport.importedAs == '$' + global.importName) {
                            mappedParsedImport = parsedImport;
                            break;
                        }
                    }
                   if (!mappedParsedImport) {
                       this.dbg(`link: WARN: failed to map parsedGlobal "${global.importName}" to it's import`);
                   } else {
                        let imodule = mappedParsedImport.module,
                            iname = mappedParsedImport.name,
                            virtualImport = this.lookupVirtualImport(imodule, iname);
                        if (!virtualImport) {
                            this.dbg(`link: WARN: link: failed to lookup variable import ${iname} for global ${global.name}, setting to NULL`);
                            this.globals[global.name] = {
                                type: 1,
                                value: 0x0
                            }
                        } else {
                            this.dbg(`link: linked import ${iname} / module ${imodule} to global ${global.name}`);
                            this.globals[global.name] = {
                                type: virtualImport.type,
                                value: virtualImport.value
                            }
                        }
                   }
                }
            }

            this.dbg(`link: Linking finished`);
            return this;
    }
    runMain() {
        this.interpreter = new ExpressionInterpreter(this);
        if (this.isEmcc) {
            // This module is an emscripten module - the stack needs to be initialized before _main() is called
            this.remoteCall('establishStackSpace', [0, 100000]);
        }
        this.interpreter.call(this._main);
    }
    remoteCall(fnName, args) {
        // call a wasm function from javascript, regardless of whether or not it's an export
        if (!this.interpreter) {
            // runMain() wasn't called - thats okay
            this.interpreter = new ExpressionInterpreter(this);
        }
        if (this.fnMap[fnName]) {
            let fn = this.fnMap[fnName],
                result = this.interpreter.call(fn, args);
            if (result && result.value) {
                return result.value;
            }
        } else {
            this.dbg(`wmvm/remoteCall: "${fnName}" doesn't exist - ignoring`);
        }
    }
    // helper functions for managing memory (very useful for imports)
    memoryAccessString(ptr) {
        // Gets a string from virtual memory and returns as a js string
        let i = ptr,
            out = '';
        while (this.mem[i] != 0) {
            out += String.fromCharCode(this.mem[i]);
            ++i;
        }
        return out;
    }
    memoryAccessStringRaw(ptr) {
        // Gets a string from virtual memory and returns as a js byte array
        let i = ptr,
            out = [];
        while (this.mem[i] != 0) {
            out.push(this.mem[i]);
            ++i;
        }
        return out;
    }
    memoryAccessInt8(ptr, signed) {
        let view = new DataView(this.mem.buffer, ptr);
        if (signed) {
            return view.getInt8(0);
        } else {
            return view.getUint8(0);
        }
    }
    memoryAccessInt32(ptr, signed) {
        let view = new DataView(this.mem.buffer, ptr);
        if (signed) {
            return view.getInt32(0);
        } else {
            return view.getUint32(0);
        }
    }
    memoryAccessFloat32(ptr) {
        let view = new DataView(this.mem.buffer, ptr);
        return view.getFloat32(0);
    }
}
module.exports = wmvm;