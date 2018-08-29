var path = require('path');
//日志根目录
var baseLogPath = path.resolve(__dirname, '../logs')
//错误日志目录
var errorPath = "/error";
//错误日志文件名
var errorFileName = "error";
//错误日志输出完整路径
var errorLogPath = baseLogPath + errorPath + "/" + errorFileName;

//响应日志目录
var responsePath = "/response";
//响应日志文件名
var responseFileName = "response";
//响应日志输出完整路径
var responseLogPath = baseLogPath + responsePath + "/" + responseFileName;

var serverPath = "/server";
var serverFileName = "server";
var serverLogPath = baseLogPath + serverPath + "/" + serverFileName;

module.exports = {
    "appenders":
        {
            //响应日志
            resLogger : {
                "type": "dateFile",
                "filename": responseLogPath,
                "alwaysIncludePattern":true,
                "pattern": "-yyyy-MM-dd-hh.log",
                "path": responsePath
            },
            serverLogger : {
                "type": "dateFile",
                "filename": serverLogPath,
                "alwaysIncludePattern": true,
                "pattern": "-yyyy-MM-dd-hh.log",
                "path": serverPath
            },
            out : { type: 'console' },
        },
    categories: {
        default: { appenders: [ 'out' ], level: 'info' },
        resLogger: { appenders: [ 'resLogger' ], level: 'info'},
        serverLogger: { appenders: [ 'serverLogger' ], level:'info'}
    }
}