'use strict';

/**
 * Allows MeanIO to create a unique wrapper for a single EventEmitter per Module.
 * With this, we allows all Modules to use the same EventEmitter, but automatically
 *  namespace their events with the module name.
 */

var EventEmitter2 = require('eventemitter2').EventEmitter2;
var emitter = new EventEmitter2({
  wildcard: true,
  delimiter: '.',
  // set this to `true` if you want to emit the newListener event. The default value is `true`
  newListener: true,
  // the maximum amount of listeners that can be assigned to an event, default 10.
  maxListeners: 20
});

/**
 * @param {string} moduleName - Name of the module, used to namespace events
 * @constructor
 */
function Events(moduleName) {
  this.moduleName = moduleName;
  this._default = {};
}

/**
 * Emits an event for the module
 * Automatically namespaced with the moduleName passed to the constructor
 * @deprecated Use emit with EventEmitter2 standard api
 * @param {*} opts - Any data to be passed with the event
 * @param {string} opts.action - Name of the event that happesn
 */
Events.prototype.publish = function (opts) {
  console.error('publish() has been deprecated. Update to emit(event, data).');

  // Grab event type and other defaults from the package
  for (var index in this._default) {
    if (this._default.hasOwnProperty(index)) {
      opts[index] = opts[index] || this._default[index];
    }
  }
  if (!opts.action) {
    console.error('Error: events require an "action" property');
    return;
  }
  this.emit([this.moduleName, opts.action], opts);
};

/**
 * Calls emit with the module name as the default root namespace
 * @see EventEmitter2.emit
 * @link https://github.com/asyncly/EventEmitter2
 * @param {array|string} event
 * @return {boolean}
 */
Events.prototype.emit = function (event) {
  var args = Array.from(arguments);

  var namespace = [this.moduleName];
  namespace.push(event);

  args.unshift();//remove the event

  args.shift(namespace);
  return emitter.emit.apply(emitter, args);
};

/**
 * Calls emitAsync with the module name as the default root namespace
 * @see EventEmitter2.emitAsync
 * @link https://github.com/asyncly/EventEmitter2
 * @param event
 * @returns {Promise}
 */
Events.prototype.emitAsync = function (event) {
  var args = Array.from(arguments);

  var namespace = [this.moduleName];
  namespace.push(event);

  args.unshift();//remove the event

  args.shift(namespace);
  return emitter.emitAsync.apply(emitter, args);
};

/**
 * @deprecated
 * @param {string|array} name - Event name
 * @param {function} cb
 */
Events.prototype.subscribe = function (name, cb) {
  console.error('subescribe() has been deprecated. Update to on(event, listener)');
  this.on(name, cb);
};

/**
 * Sets defaults that will be included with every event
 * Individual keys are overwritten if passed to emit()
 * @param data
 */
Events.prototype.setDefaults = function (data) {
  for (var index in data) {
    this._default[index] = data[index];
  }
};

/**
 * @deprecated Use setDefaults
 * @param {*} data
 */
Events.prototype.defaultData = function (data) {
  console.error('defaultData() has been deprecated. Update to setDefaults(data)');
  this.setDefaults(data);
};

/**
 * Extending EventEmitter2 API
 */
Events.prototype.addListener = emitter.addListener;
Events.prototype.on = emitter.on;
Events.prototype.onAny = emitter.onAny;
Events.prototype.offAny = emitter.offAny;
Events.prototype.once = emitter.once;
Events.prototype.many = emitter.many;
Events.prototype.removeListener = emitter.removeListener;
Events.prototype.off = emitter.off;
Events.prototype.removeAllListeners = emitter.removeAllListeners;
Events.prototype.setMaxListeners = emitter.setMaxListeners;
Events.prototype.listeners = emitter.listeners;
Events.prototype.listenersAny = emitter.listenersAny;

module.exports = Events;
