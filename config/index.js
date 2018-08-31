var development_env = require('./development');
var docker = require('./docker.config');

module.exports = {
    development: development_env,
    docker: docker
}[process.env.NODE_ENV || 'development'];