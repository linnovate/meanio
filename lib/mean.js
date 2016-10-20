'use strict';

var config = require('config'),
  Container = require('lazy-dependable').Container,
  inherits = require('util').inherits,
  q = require('q');

function Meanio() {
  Container.call(this);
  if (this.active) return;
  Meanio.Singleton = this;
  this.version = require('../package').version;
  this.instanceWaitersQ = [];
  var defer;
  while (Meanio.instanceWaiters.length) {
    defer = q.defer();
    Meanio.instanceWaiters.shift()(this, defer);
    this.instanceWaitersQ.push(defer.promise);
  }
}

inherits(Meanio, Container);

Meanio.prototype.status = function () {
  return {
    active: this.active,
    name: this.name
  };
};

Meanio.prototype.getConfig = function _getConfig() {
  return config;
};

Meanio.instanceWaiters = [];
Meanio.onInstance = function (func) {
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
