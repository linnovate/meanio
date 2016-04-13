'use strict';

var config = require('config'),
  Container = require('lazy-dependable').Container,
  inherits = require('util').inherits,
  Q = require('q');


require('./json.js');

function Meanio() {
  Container.call(this);
  if (this.active) return;
  Meanio.Singleton = this;
  this.version = require('../package').version;
  this.instanceWaitersQ = [];
  var defer;
  while(Meanio.instanceWaiters.length){
    defer = Q.defer();
    Meanio.instanceWaiters.shift()(this,defer);
    this.instanceWaitersQ.push(defer.promise);
  }
}

inherits(Meanio, Container);

Meanio.prototype.status = function() {
  return {
    active: this.active,
    name: this.name
  };
};

Meanio.getConfig = Meanio.loadConfig = function(){
  return config;
};

Meanio.prototype.getConfig = Meanio.prototype.loadConfig = function(){
  return config;
};

Meanio.instanceWaiters = [];
Meanio.onInstance = function(func){
  Meanio.instanceWaiters.push(func);
};

(require('./menu'))(Meanio);
(require('./core_modules/module'))(Meanio);
(require('./core_modules/db'))(Meanio);
(require('./core_modules/server'))(Meanio);

var mean = new Meanio();

/*global exports:true*/
module.exports = exports = mean;
/*global exports:false*/



