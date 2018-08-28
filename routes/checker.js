const router = require('koa-router')()

router.prefix('/checker');

router.get('/', function (ctx, next) {
  ctx.body = 'this is a users response!'
});

router.post('/repo', function (ctx, next) {
  let body = ctx.request.body;
  console.log(body);
  ctx.body = 'this is a repo stat response, success';
});

module.exports = router;
