var utils = require('../utils');
var Helper = require('../helper/index');
function Velocity(asts, config) {
  this.asts = asts;
  this.config = utils.mixin(
    {
      // 自动输出为经过html encode输出
      escape: true,
      // 不需要转义的白名单
      unescape: {},
      valueMapper(value) {
        return value;
      },
    },
    config,
  );
  this._state = { stop: false, break: false, return: false };
  this.init();
}

Velocity.Helper = Helper;
Velocity.prototype = {
  constructor: Velocity,
};

require('./blocks')(Velocity, utils);
require('./literal')(Velocity, utils);
require('./references')(Velocity, utils);
require('./set')(Velocity, utils);
require('./expression')(Velocity, utils);
require('./compile')(Velocity, utils);
module.exports = Velocity;
