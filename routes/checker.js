const router = require('koa-router')()

router.prefix('/checker');

router.get('/', function (ctx, next) {
  ctx.body = 'this is a users response!'
});

router.get('/repo', function (ctx, next) {
  ctx.body = 'this is a repo stat response, success';
});

module.exports = router;
