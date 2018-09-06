const router = require('koa-router')();
const multer = require('koa-multer');
const fs = require('fs');
const path = require('path');
const TABLE_DEFINE = require("../model/table");
const StorageRenter = TABLE_DEFINE.StorageRenter;
const ipfsAPI = require('ipfs-api');
const config = require('../config/index');
var ipfs = ipfsAPI({host: config.ipfsHost, port: '5001', protocol: 'http'})
const logger = require("../utils/log_util");
const sleep = require("../utils/sleep");

const tmpFileSaveTime = 2 * 60 * 60 * 1000; // 2 hours
haveOrMakeDir("./uploads");
haveOrMakeDir("./public/download_tmp");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
      var md5 = ""
      if (!req.body || !req.body.md5) {
          md5 = "";
          return false;
      } else {
          md5 = req.body.md5;
      }
      if (!req.body.chunks) {
          haveOrMakeDir("./uploads/merge");
          cb(null, "./uploads/merge")
      } else {
          cb(null, tmpDir(md5));
      }
  },
  filename: function (req, file, cb) {
      var filename = ""
      if (!req.body || !req.body.chunk) {
          filename = file.originalname;
      } else {
          filename = req.body.chunk;
      }
      cb(null, filename);
  }
});

var upload = multer({ storage: storage });

router.post('/chunk_upload', upload.single('file'), async (ctx, next) => {
    if (!ctx.req.body || !ctx.req.body.md5) {
        ctx.body = "md5 not exist";
        return;
    }
    ctx.body = "ok";
});

router.get('/merge', async (ctx, next) => {
    if (!ctx.query.md5 || !ctx.query.filename || !ctx.query.account) {
        ctx.body = 'md5 or filename or account not exist';
        return
    }
    let md5 = ctx.query.md5;
    let filename = ctx.query.filename;
    let targetUrl = "";
    haveOrMakeDir("./uploads/merge");
    if (ctx.query.isSingleChunk === "single") {
        targetUrl = path.resolve("./uploads/merge/" + filename);
    } else {
        let dirPath = tmpDir(md5);
        let chunkList = fs.readdirSync(dirPath);
        let urlList = getChunkUrlList(dirPath, chunkList.length);
        targetUrl = path.resolve('./uploads/merge/' + filename);
        let targetStream = fs.createWriteStream(targetUrl, {flags: "w+"});
        await readStream(urlList, targetStream, dirPath);
    }

    try {
        await saveToIpfs(targetUrl, ctx.query.account, filename, ctx.query.size, md5);
        logger.info(`success save file ${filename} for user ${ctx.query.account}`);
        ctx.body = 'merge ok'
    } catch (error) {
        logger.error(`Error: upload file failed with error: ${error}`);
        if (fs.existsSync(targetUrl)) fs.unlinkSync(targetUrl);
        ctx.body = 'failed';
    }
});

async function readStream (urlList, targetStream, tmpDir) {
    return new Promise((resolve, reject) => {
        function writeRecursive () {
            let path = urlList.shift();
            let originStream = fs.createReadStream(path);
            originStream.pipe(targetStream, {end: false});
            originStream.on("end", function () {
                // 删除文件
                fs.unlinkSync(path);
                if (urlList.length > 0) {
                    writeRecursive(urlList);
                } else {
                    fs.rmdirSync(tmpDir);
                    resolve();
                }
            });
        }
        writeRecursive()
    });
}

async function saveToIpfs (targetUrl, account, filename, size, md5) {
    let file = fs.readFileSync(targetUrl);
    let ipfs_hash = await ipfs.add(file);
    var renter = {
        account: account,
        fileName: filename,
        ipfsHash: ipfs_hash[0].hash,
        status: 'active',
        fileSize: size,
        md5: md5
    };
    await StorageRenter.create(renter);
    fs.unlinkSync(targetUrl);
}

function haveOrMakeDir(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
    return path;
}

function getChunkUrlList(dir, maxIndex) {
    let urlList = [];
    for (let i = 0; i < maxIndex; i++) {
        urlList.push(dir + "/" + i);
    }
    return urlList
}

function tmpDir(name) {
    let path = "./uploads/" + name;
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
    return path;
}

router.post('/upload', upload.single('upload_file'), async (ctx, next) => {
	if (!ctx.query.account) ctx.body = "account is undefined";
    let filePath = path.resolve('./uploads/' + ctx.req.file.filename);
    logger.info(`user: ${ctx.query.account} upload file: ${ctx.req.file.filename}`);

    // check if the file already have.
    exist = await StorageRenter.findOne({
        where: {
            status: 'active',
            account: ctx.query.account,
            fileName: ctx.req.file.filename
        }
    });
    console.log(exist);
    if (exist) {
        ctx.body = "already exist";
        return;
    }
    try {
        let file = fs.readFileSync(filePath);
        let ipfs_hash = await ipfs.add(file);
        var renter = {
            account: ctx.query.account,
            fileName: ctx.req.file.filename,
            ipfsHash: ipfs_hash[0].hash,
            status: 'active',
            fileSize: ctx.req.file.size
        };
        await StorageRenter.create(renter);
        fs.unlinkSync(filePath);
        logger.info(`success save file ${ctx.req.file.filename} for user ${ctx.query.account}`);
        ctx.body = 'ok'
    } catch (error) {
        logger.error(`Error: upload file failed with error: ${error}`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        ctx.body = 'failed';
    }
});

router.get('/file_list', async (ctx, next) => {
    if (!ctx.query.account) ctx.body = "account is undefined";
    logger.info(`user ${ctx.query.account} request get file list`);
    let resJson = await getFileList(ctx.query.account);
    if (!resJson) ctx.body = '';
    ctx.response.type = 'json';
    ctx.body = resJson;
});

router.get('/delete_file', async (ctx, next) => {
    if (!ctx.query.account) ctx.body = "account is undefined";
    logger.info(`user: ${ctx.query.account} request to delete file: ${ctx.query.fileName}`);
    try {
        let file = await StorageRenter.findOne({
            where: {
                status: 'active',
                account: ctx.query.account,
                fileName: ctx.query.fileName
            }
        });
        let ipfsHash = file.dataValues.ipfsHash;
        try {
            await ipfs.pin.rm(ipfsHash);
        } catch(error) {
            logger.error("pin rm failed with error" + error);
        }
        await StorageRenter.update({
            status: 'delete'
        }, {
            where: {
                status: 'active',
                account: ctx.query.account,
                fileName: ctx.query.fileName
            }
        });
        logger.info(`success delete file ${ctx.query.fileName} for user: ${ctx.query.account}`);
        ctx.body = 'ok';
    } catch(error) {
        logger.error(`Error: failed to dalete file with error: ${error}`);
        ctx.body = 'failed';
    }
});

router.get('/download_file', async (ctx, next) => {
    if (!ctx.query.account) ctx.body = "account is undefined";
    logger.info(`user: ${ctx.query.account} request to download file ${ctx.query.fileName}`);
    resJson = {};
    let file = await StorageRenter.findOne({
        where: {
            status: 'active',
            account: ctx.query.account,
            fileName: ctx.query.fileName
        }
    });
    if (!file) ctx.body = 'not have file';
    try {
        let ipfsHash = file.dataValues.ipfsHash;
        let data = await ipfs.files.get(ipfsHash);
        let accountFileDir = './public/download_tmp/' + ctx.query.account;
        haveOrMakeDir(accountFileDir);
        fs.writeFileSync(accountFileDir + '/' + file.fileName, data[0].content);
        setTimeout(removeTmpFileInTime, tmpFileSaveTime,accountFileDir, file.fileName);
        ctx.response.type = 'json';
        resJson.url = '/download_tmp/' + ctx.query.account + '/' + file.fileName;
        resJson.fileName = file.fileName;
        ctx.body = resJson;
    } catch(error) {
        logger.error(`failed to download file: ${ctx.query.fileName} with error: ${error}`);
        ctx.body = "failed to generate download url";
    }
});

router.get('/', async (ctx, next) => {
	await ctx.render('index', {
	    title: 'ipfs api 调用demo'
	})
});

function removeTmpFileInTime(accountFileDir, filename) {
    haveOrMakeDir(accountFileDir);
    try {
        let filePath = accountFileDir + '/' + filename;
        fs.unlinkSync(filePath);
        logger.info("success remove file" + filename);
    } catch (error) {
        logger.info("remove tmp file with error:" + error);
    }
}

async function getFileList(account) {
    let resJson = {data: []};
    let recordList = await StorageRenter.findAll({"where": {"account" : account}});
    if (!recordList.length) return "";
    for (let record of recordList) {
        let tmp_obj = {};
        data = record.dataValues;
        if (data.status === 'delete') continue;
        tmp_obj.fileName = data.fileName;
        tmp_obj.fileSize = data.fileSize;
        resJson.data.push(tmp_obj);
    }
    return resJson;
}

module.exports = router;
