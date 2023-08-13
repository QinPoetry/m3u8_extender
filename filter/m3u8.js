const m3u8Parser = require('m3u8-parser');
const axios = require('axios');
const path = require('path');
const url = require('url');
const fs = require('fs');
const mockLocalFileFlag = false;

function joinUrl(baseUrl, relativeUrl) {
    if (mockLocalFileFlag) {
        if (path.isAbsolute(relativeUrl)) {
            return relativeUrl;
        } else {
            return path.resolve(path.resolve(path.dirname(baseUrl)), relativeUrl);
        }
    } else {
        var parseRelativeUrl = new URL(relativeUrl, baseUrl);
        if (parseRelativeUrl.protocol != null && parseRelativeUrl.host != null) {
            return parseRelativeUrl.href;
        } else {
            var parseBaseUrl = new URL(baseUrl);
            return url.resolve(parseBaseUrl.href, parseRelativeUrl.href);
        }
    }
}

function getM3u8Content(url) {
    if (mockLocalFileFlag) {
        return new Promise(function (resolve, reject) {
            fs.readFile(url, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data.toString());
                }
            });
        });
    } else {
        return new Promise(function (resolve, reject) {
            axios.get(url).then(response => {
                resolve(response.data);
            }).catch(error => {
                reject(error);
            });
        });
    }
}

function getM3u8SegmentLists(url) {
    return new Promise(function (resolve, reject) {
        getM3u8Content(url).then(data => {
            var parser = new m3u8Parser.Parser();
            parser.push(data);
            parser.end();

            const parsedData = parser.manifest;
            const tsUrls = [];
            var waitingM3u8Number = 0;

            if (parsedData.playlists) {
                parsedData.playlists.forEach(playlist => {
                    if (playlist.uri) {
                        var m3u8url = joinUrl(url, playlist.uri);
                        tsUrls.push(m3u8url);
                        waitingM3u8Number += 1;
                        getM3u8SegmentLists(m3u8url).then(urls => {
                            urls.forEach(item => {
                                tsUrls.push(joinUrl(m3u8url, item));
                            });
                            waitingM3u8Number -= 1;
                            if (waitingM3u8Number == 0) {
                                resolve(tsUrls);
                            }
                        }).catch(error => {
                            reject(error);
                        });
                    }
                });
            }

            if (parsedData.segments) {
                parsedData.segments.forEach(segment => {
                    if (segment.uri) {
                        tsUrls.push(joinUrl(url, segment.uri));
                    }
                });
            }

            if (waitingM3u8Number == 0) {
                resolve(tsUrls);
            }
        }).catch(error => {
            reject(error);
        });
    });
}

module.exports = {
    getM3u8SegmentLists
}