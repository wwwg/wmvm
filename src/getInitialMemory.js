// Locates the initial memory of the wasm application
module.exports = (wast) => {
    // find memory
    let mem;
    let findMem = new RegExp(/\(data \(get_global .*\) "?.*/gim);
    let found = findMem.exec(wast);
    if (!found || !found[0])
        mem = null;
    else {
        mem = found[0].replace(/\(data \(get_global .*\) "/gim, '');
        mem = mem.replace('")', '');
        mem = mem.replace(/\\00/g, '\\u0000');
        mem = JSON.parse('"' + mem + '"');
    }
    // find ptr name
    let ptr;
    let findPtr = new RegExp(/\(data \(get_global \$(.*)\)/gim);
    found = findPtr.exec(wast);
    if (!found || !found[1]) {
        ptr = null;
    } else {
        ptr = found[1];
        ptr = ptr.replace(/\).*/gim, '');
    }
    return {
        mem: mem,
        ptr: ptr
    };
}