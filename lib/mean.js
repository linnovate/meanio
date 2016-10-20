'use strict';

var config = require('config'),
  Container = require('lazy-dependable').Container,
  inherits = require('util').inherits,
  q = require('q');


require('./json.js');

function Meanio() {
  Container.call(this);
  if (this.active) return;
  Meanio.Singleton = this;
  this.version = require('../package').version;
  this.instanceWaitersq = [];
  var defer;
  while(Meanio.instanceWaiters.length){
    defer = q.defer();
    Meanio.instanceWaiters.shift()(this,defer);
    this.instanceWaitersq.push(defer.promise);
  }
}

inherits(Meanio, Container);

Meanio.prototype.status = function() {
  return {
    active: this.active,
    name: this.name
  };
};

Meanio.getConfig = Meanio.prototype.getConfig = function _getConfig() {
  return config;
};

/**
 * @deprecated Opted to change the name to `getConfig` to reduce confusion, the config is not loaded upon this call
 */
Meanio.loadConfig = Meanio.prototype.loadConfig = function(){
  console.error('Meanio.loadConfig() has been deprecated. Update to Meanio.getConfig().');
  return Meanio.getConfig();
};

Meanio.instanceWaiters = [];
Meanio.onInstance = function(func){
  Meanio.instanceWaiters.push(func);
};

Meanio.prototype.Menus = require('./core_modules/menu');
(require('./core_modules/module'))(Meanio);
(require('./core_modules/db'))(Meanio);
(require('./core_modules/server'))(Meanio);

var mean = new Meanio();

/*global exports:true*/
module.exports = exports = mean;
/*global exports:false*/



