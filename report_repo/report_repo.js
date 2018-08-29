const process = require('child_process');
const request = require('request');
const reportServerUrl = 'http://39.106.106.129:3000/checker/repo';

function report() {
    process.exec('uci get sn.@sn[0].sn', function (err, stdout, stderr) {
        var resObj = {};
        if (stderr) {
            console.log('cannot get boxSN');
        } else if (stdout) {
            resObj.boxSN = stdout;
        }
        process.exec('ipfs repo stat',function (error, stdout, stderr) {
            if (error !== null) console.log('exec error: ' + error);
            var repoSizeRes = stdout.match(/RepoSize:\s+(\d+)/g);
            var StorageMaxRes = stdout.match(/StorageMax:\s+(\d+)/g);
            var NumObjectsRes = stdout.match(/NumObjects:\s+(\d+)/g);

            resObj.storageMax = parserFormat(StorageMaxRes, 'StorageMax');
            resObj.repoSize = parserFormat(repoSizeRes, 'RepoSize');
            resObj.numObjects = parserFormat(NumObjectsRes, 'NumObjects');
            process.exec('ipfs stats bw', function(error, stdout, stderr) {
                if (/this command must be run in online mode/.test(error)) {
                    resObj.isDaemon = false;
                    sendToServer(resObj);
                    return false;
                } else if (/Error/.test(error)) {
                    resObj.isDaemon = false;
                    resObj.error = 'unKnown Error';
                    sendToServer(resObj);
                    return false
                }
                var RateInRes = stdout.match(/RateIn:\s+(.*)/g);
                var RateOutRes = stdout.match(/RateOut:\s+(.*)/g);
                resObj.rateIn = parserFormat(RateInRes, 'RateIn');
                resObj.rateOut = parserFormat(RateOutRes, 'RateOut');
                resObj.isDaemon = true;
                console.log(resObj);
                sendToServer(resObj);
            });
        });
    });
}
setInterval(report, 2000);
function sendToServer(resObj) {
    var options = {
        method: "POST",
        uri: reportServerUrl,
        json: true,
        body: resObj
    }
    request(options, function(err, res, body) {
        console.log('RES: ' + body);
    })
}

function parserFormat(resArr, checkString, returnType) {
    if (!resArr || resArr.length === 0) return false;
    if (resArr[0]) {
        var arr = resArr[0].split(':');
        if (arr[0] === checkString ) {
            return arr[1].trim();
        }
    }
    return 0;
}