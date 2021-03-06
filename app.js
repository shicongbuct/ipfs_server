const Koa = require('koa');
const app = new Koa();
const views = require('koa-views');
const json = require('koa-json');
const onerror = require('koa-onerror');
const bodyparser = require('koa-bodyparser');
const cors = require('koa2-cors');
//const logger = require('koa-logger');
const logUtil = require('./utils/log_util');
const index = require('./routes/index');
const checker = require('./routes/checker');

// error handler
onerror(app);

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}));
app.use(json());
// logger
app.use(async (ctx, next) => {
    const start = new Date();
    let ms;
    try {
        await next();
        ms = new Date() - start;
        logUtil.logResponse(ctx, ms);
    } catch (error) {
        ms = new Date() - start;
        logUtil.logError(ctx, error, ms);
    }
});
app.use(require('koa-static')(__dirname + '/public'));

app.use(views(__dirname + '/views', {
  extension: 'pug'
}));

// logger
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// cors
app.use(cors({
	origin: function(ctx) {
		return '*';
	},
	exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
	maxAge: 5,
	credentials: true,
	allowMethods: ['GET', 'POST', 'DELETE'],
	allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// routes
app.use(index.routes(), index.allowedMethods());
app.use(checker.routes(), checker.allowedMethods());

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app;
