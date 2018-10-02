const wmvm = require('../src/wmvm.js'),
    fs = require('fs');

let vm = new wmvm(fs.readFileSync('test/emcc.wasm'));
vm.enableDebug()
    .link();
vm.dumpMemory(0x0, 30);
vm.run();