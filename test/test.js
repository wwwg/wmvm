let wmvm = require('../src/wmvm.js');
const fs = require('fs');
let inData = fs.readFileSync('test/emcc.wasm');
let vm = new wmvm(inData);