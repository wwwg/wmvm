let wmvm = require('../src/wmvm.js');
const fs = require('fs');
let inData = fs.readFileSync('test/emcc.wasm', 'binary');
let vm = new wmvm(inData);