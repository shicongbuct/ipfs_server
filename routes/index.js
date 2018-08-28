const router = require('koa-router')();
const multer = require('koa-multer');
const fs = require('fs');
const path = require('path');
const TABLE_DEFINE = require("../model/table");
const StorageRenter = TABLE_DEFINE.StorageRenter;
const ipfsAPI = require('ipfs-api');
var ipfs = ipfsAPI('/ip4/127.0.0.1/tcp/5002');

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
    let file = fs.readFileSync(filePath);
	ipfs_hash = await ipfs.add(file);
	var renter = {
		account: ctx.query.account,
	    fileName: ctx.req.file.filename,
	    ipfsHash: ipfs_hash[0].hash,
		status: 'active',
	    fileSize: ctx.req.file.size
	};
	let result = await StorageRenter.create(renter);
	// 删除目录中的文件
    console.log(result);
    fs.unlinkSync(filePath);
	ctx.body = 'ok'
});

router.get('/file_list', async (ctx, next) => {
	resJson = {data: []};
    if (!ctx.query.account) ctx.body = "account is undefined";
    let recordList = await StorageRenter.findAll({"where": {"account" : ctx.query.account}});
    if (!recordList.length) ctx.body = '';
    for (let record of recordList) {
    	tmp_obj = {};
        data = record.dataValues;
        if (data.status === 'delete') continue;
        tmp_obj.fileName = data.fileName;
        tmp_obj.fileSize = data.fileSize;
        resJson.data.push(tmp_obj);
	}
    ctx.response.type = 'json';
    ctx.body = resJson;
});

router.get('/delete_file', async (ctx, next) => {
    if (!ctx.query.account) ctx.body = "account is undefined";
    let file = await StorageRenter.findOne({
        where: {
            status: 'active',
            account: ctx.query.account,
            fileName: ctx.query.fileName
        }
    });
    let ipfsHash = '/' + file.dataValues.ipfsHash;
    let updateResult = await StorageRenter.update({
		status: 'delete'
	}, {
        where: {
            status: 'active',
			account: ctx.query.account,
			fileName: ctx.query.fileName
        }
    });
    await ipfs.pin.rm(ipfsHash);
    ctx.body = 'ok';
});

router.get('/download_file', async (ctx, next) => {
    if (!ctx.query.account) ctx.body = "account is undefined";
    resJson = {};
    let file = await StorageRenter.findOne({
        where: {
            status: 'active',
            account: ctx.query.account,
            fileName: ctx.query.fileName
        }
    });
    if (!file) ctx.body = 'not have file';
    let ipfsHash = file.dataValues.ipfsHash;
    let data = await ipfs.files.get(ipfsHash);
    console.log(data);
    console.log(data[0].content);
    fs.writeFileSync('./public/download_tmp/' + file.fileName, data[0].content);
    ctx.response.type = 'json';
    resJson.url = '/download_tmp/' + file.fileName;
    resJson.fileName = file.fileName;
    ctx.body = resJson;
});

router.get('/', async (ctx, next) => {
	await ctx.render('index', {
	    title: 'ipfs api 调用demo'
	})
});

module.exports = router;
