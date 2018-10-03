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
    constructor(vm) {
        this.vm = vm;
    }
    vmLink() {
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