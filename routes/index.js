const router = require('koa-router')();
const multer = require('koa-multer');
const fs = require('fs');
const path = require('path');
const TABLE_DEFINE = require("../model/table");
const StorageRenter = TABLE_DEFINE.StorageRenter;
const ipfsAPI = require('ipfs-api');
var ipfs = ipfsAPI('/ip4/127.0.0.1/tcp/5002');
const logger = require("../utils/log_util");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});

var upload = multer({ storage: storage });

router.post('/upload', upload.single('upload_file'), async (ctx, next) => {
	if (!ctx.query.account) ctx.body = "account is undefined";
    let filePath = path.resolve('./uploads/' + ctx.req.file.filename);
    logger.info(`user: ${ctx.query.account} upload file: ${ctx.req.file.filename}`);
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
        fs.writeFileSync('./public/download_tmp/' + file.fileName, data[0].content);
        ctx.response.type = 'json';
        resJson.url = '/download_tmp/' + file.fileName;
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

async function getFileList(account) {
    let resJson = {data: []};
    let recordList = await StorageRenter.findAll({"where": {"account" : account}});
    if (!recordList.length) ctx.body = '';
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
