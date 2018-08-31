const router = require('koa-router')();
const TABLE_DEFINE = require("../model/table");
const StorageFarmer = TABLE_DEFINE.StorageFarmer;

router.prefix('/checker');

router.get('/', function (ctx, next) {
  ctx.body = 'this is a users response!'
});

router.post('/repo', async function (ctx, next) {
  let body = ctx.request.body;
  console.log(body);
   if (!body.boxSN) {
      console.log('Error, not have SN code');
      ctx.body = 'not have SN code';
   }
  let saveRes = await StorageFarmer.create({
      boxSN: body.boxSN,
      saveSize: body.repoSize,
      storageMax: body.storageMax,
      numObjects: body.numObjects,
      rateIn: body.rateIn,
      rateOut: body.rateOut,
      isDaemon: body.isDaemon
  });
   console.log(saveRes);
  ctx.body = 'this is a repo stat response, success';
});

module.exports = router;
