module.exports = (wast) => {
    let findMem = new RegExp(/(?<=\(data \(get_global \$memoryBase\) ")(.*?)(?=\"\))/gim);
}