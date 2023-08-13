const m3u8extender = require('./../filter/m3u8');

m3u8extender.getM3u8SegmentLists('https://vlive.csdnimg.cn/0ffec320258071eeac4e6633b79f0102/6bf988510a2f50ade4cc22dcd744c42b-S00000001-100000-od-encrypt-stream.m3u8').then(tsUrls => {
    console.log(tsUrls);
}).catch(error => {
    console.error(error);
});