const process = require('child_process');
const request = require('request');

const reportServerUrl = '39.106.106.129:3000/checker/repo';

process.exec('ipfs repo stat',function (error, stdout, stderr) {
    if (error !== null) console.log('exec error: ' + error);
    let resObj = {};

    let repoSizeRes = stdout.match(/RepoSize:\s+(\d+)/g);
    let StorageMaxRes = stdout.match(/StorageMax:\s+(\d+)/g);
    let NumObjectsRes = stdout.match(/NumObjects:\s+(\d+)/g);

    resObj.StorageMax = parserFormat(StorageMaxRes, 'StorageMax');
    resObj.repoSize = parserFormat(repoSizeRes, 'RepoSize');
    resObj.NumObjects = parserFormat(NumObjectsRes, 'NumObjects');
    console.log(resObj);
    sendToServer(resObj);
});

function sendToServer(resObj) {
    var options = {
        method: "POST",
        uri: reportServerUrl,
        json: true,
        body: resObj
    }
    request(options, function(err, res, body) {
        console.log(body);
    })
}

function parserFormat(resArr, checkString) {
    if (resArr[0]) {
        let arr = resArr[0].split(':');
        if (arr[0] === checkString) {
            return parseInt(arr[1].trim());
        }
    }
    return 0;
}