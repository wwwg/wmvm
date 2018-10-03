const Binaryen = require("binaryen"),
    expression = require("./runtime/expressions"),
    getInitialMemory = require('./parse/getInitialMemory'),
    Stack = require('./Stack'),
    ExpressionInterpreter = require('./runtime/interpret'),
    EventEmitter = require('events'),
    getImports = require('./parse/parseImports'),
    getGlobals = require('./parse/parseGlobals'),
    getFnNames = require('./parse/getFnNames'),
    emscriptenRuntime = require('./emscriptenRuntime'),
    MetaFunction = expression.MetaFunction;

class DynamicLinker {
    updateImport(mod, name, value, type) {
        for (let i = 0; i < this.vm.virtualImports.length; ++i) {
            let _import = this.vm.virtualImports[i];
            if (_import.name == name && _import.module == mod) {
                if (_import.isFn) {
                    _import.jsFunc = value;
                } else {
                    _import.value = value;
                    if (type) {
                        _import.type = type;
                    }
                }
            }
        }
        this.vm.dbg(`setImport: failed to update import "${name}" in "${mod}", ignoring`);
    }
    linkImportFunction(moduleName, fnName, fn) {
        let vm = this.vm;
        // Static imports have to be added before the vm starts
        if (!fn instanceof Function) {
            vm.dbg(`addImportFunction: failed to add import "${fnName}" - fn isn't a function`);
            return;
        }
        fn = fn.bind(vm);
        let virtualImport = {
            module: moduleName,
            name: fnName,
            isFn: true,
            jsFunc: fn
        }
        vm.virtualImports.push(virtualImport);
        vm.dbg(`addImportFunction: added import "${fnName}" in import module "${moduleName}"`);
        return;
    }
    linkImportVariable(moduleName, name, value, type = null) {
        let vm = this.vm,
            virtualImport = {
                module: moduleName,
                name: name,
                value: value,
                type: type,
                isFn: false
            };
        vm.virtualImports.push(virtualImport);
        vm.dbg(`addImportVariable: added variable import "${name}" / module "${moduleName}", value: ${value}`);
    }
    dynamicImportLookup(mod, name) {
        let vm = this.vm;
        // Lookup a virtual import
        for (let i = 0; i < vm.virtualImports.length; ++i) {
            let _import = vm.virtualImports[i];
            if (_import.name == name && _import.module == mod) {
                return _import;
            }
        }
        vm.dbg(`lookupVirtualImport: failed lookup import "${name}" in "${mod}"`);
        return null;
    }
    dynamicLookup(symbol) {
        let vm = this.vm;
        // Returns the MetaFunction the symbol points to, and locates imports if they exist
        if (vm.fnMap[symbol]) {
            let fn = vm.fnMap[symbol];
            if (fn.isImport) {
                if (fn.virtualImport) {
                    // function has a virtual import mapped to it, return it
                    return fn;
                } else {
                    let mappedImport = vm.lookupVirtualImport(fn.importModule, fn.name);
                    if (!mappedImport) {
                        vm.dbg(`lookupFunction: CRITICAL: failed to resolve import function "${fn.name}"`);
                        return null;
                    }
                    if (!mappedImport.isFn) {
                        vm.dbg(`lookupFunction: looked up an import function that isn't a function: "${fn.name}"`);
                        return null;
                    }
                    if (!fn.virtualImport) {
                        vm.dbg(`lookupFunction: mapped new import function "${fn.name}" to it's respective import`);
                        fn.virtualImport = mappedImport;
                    }
                    return fn;
                }
            } else {
                vm.dbg(`lookupFunction: successfully resolved local function "${fn.name}"`);
                return fn;
            }
        } else {
            vm.dbg(`lookupFunction: CRITICAL: failed to resolve function from symbol "${symbol}"`);
            return null;
        }
    }
    constructor(vm) {
        this.vm = vm;
    }
    linkVm() {
        let vm = this.vm;
        for (let i = 0; i < vm.parsedImports.length; ++i) {
            let _import = vm.parsedImports[i];
            if (_import.module && _import.module === 'env') {
                // we can assume this an Emscripten module
                vm.dbg(`link: this is (probably) an Emscripten module`);
                vm.isEmcc = true;
                break;
            }
        }
        if (vm.isEmcc) {
            vm.dbg(`link: linking Emscripten runtime`);
            vm.addImports(emscriptenRuntime);
        }
        if (vm.memPtrName) {
            // memptr is an import too
            vm.parsedGlobals.push({
                name: vm.memPtrName,
                isConst: false,
                importName: vm.memPtrName
            });
        }
        vm.dbg(`link: linking functions found in parsedFnNames...`);
        for (let i = 0; i < vm.parsedFnNames.length; ++i) {
            let fnName = vm.parsedFnNames[i];
            if (!vm.fnMap[fnName]) {
                vm.fnMap[fnName] = new MetaFunction(vm, fnName);
                if (vm.fnMap[fnName].exists) {
                    vm.dbg(`link: find function "${fnName}"`);
                } else {
                    vm.dbg(`link: WARN: failed to find function "${fnName}" despite it being in parsedFnNames`);
                }
            } else {
                vm.dbg(`link: skipping function "${fnName}" - already exists`);
            }
        }
        if (vm.fnMap['_main']) {
            vm._main = vm.fnMap._main;
        }
        vm.dbg(`link: Discovered ${Object.keys(vm.fnMap).length} functions required for runtime.`);

        // Setup global map
        // vm is in the linking routine because static imports are sometimes required by globals
        for (let i = 0; i < vm.parsedGlobals.length; ++i) {
            let global = vm.parsedGlobals[i];
            if (global.isConst) {
                vm.dbg(`link: Mapping cost global "${global.name}" with value ${global.value}`);
                vm.globals[global.name] = {
                    type: global.type,
                    value: global.value
                }
            } else {
                // import
                let mappedParsedImport = null;
                for (let i = 0; i < vm.parsedImports.length; ++i) {
                    let parsedImport = vm.parsedImports[i];
                    if (parsedImport.importedAs == '$' + global.importName) {
                        mappedParsedImport = parsedImport;
                    }
                }
                if (!mappedParsedImport) {
                    vm.dbg(`link: WARN: failed to map parsedGlobal "${global.importName}" to it's import`);
                } else {
                    let imodule = mappedParsedImport.module,
                        iname = mappedParsedImport.name,
                        virtualImport = vm.lookupVirtualImport(imodule, iname);
                    if (!virtualImport) {
                        vm.dbg(`link: WARN: link: failed to lookup variable import ${iname} for global ${global.name}, bad things may happen!`);
                    } else {
                        vm.dbg(`link: linked import ${iname} / module ${imodule} to global ${global.name}`);
                        vm.globals[global.name] = {
                            type: virtualImport.type,
                            value: virtualImport.value
                        }
                    }
                }
            }
        }

        vm.dbg(`link: Linking finished`);
    }
}
module.exports = DynamicLinker;