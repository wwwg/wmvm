const Binaryen = require('binaryen');
module.exports = class MetaBlock {
    constructor(blkInfo) {
        if (!blkInfo.children) {
            console.log('constructed invalid metablock!');
            return;
        }
        this.info = blkInfo;
        this.name = blkInfo.name;
        this.body = [];
        for (let i = 0; i < blkInfo.children.length; ++i) {
            this.body.push(Binaryen.getExpressionInfo(blkInfo.children[i]));
        }
    }
}