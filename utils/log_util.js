var log4js = require('log4js');
var log_config = require('../config/log_config');

log4js.configure(log_config);
var logUtil = {};

var resLogger = log4js.getLogger('resLogger');
var serverLogger = log4js.getLogger('serverLogger');

logUtil.info = function (msg) {
    serverLogger.info(msg);
};

logUtil.error = function (msg) {
    serverLogger.error(msg);
}

logUtil.logError = function (ctx, error, resTime) {
    if (ctx && error) {
        resLogger.error(formatError(ctx, error, resTime));
    }
};

logUtil.logResponse = function (ctx, resTime) {
    if (ctx) {
        resLogger.info(formatRes(ctx, resTime));
    }
};

var formatRes = function (ctx, resTime) {
    var logText = new String();
    logText += formatReqLog(ctx.request, resTime);
    logText += ctx.status;

    return logText;
}

var formatError = function (ctx, err, resTime) {
    var logText = new String();
    logText += "\n" + "*************** error log start ***************" + "\n";
    logText += formatReqLog(ctx.request, resTime);
    logText += "err name: " + err.name + "\n";
    logText += "err message: " + err.message + "\n";
    logText += "err stack: " + err.stack + "\n";
    logText += "*************** error log end ***************" + "\n";
    return logText;
};

var formatReqLog = function (req, resTime) {
    var logText = new String();
    var method = req.method;
    logText += method + '  ';
    logText += req.originalUrl + '  ';
    logText += "ip: " + req.ip + "  ";
    logText +=  resTime + "ms" + "  ";
    return logText;
}

module.exports = logUtil;