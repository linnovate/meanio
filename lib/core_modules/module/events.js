'use strict';

/**
 * Allows all Modules to use the same EventEmitter, but automatically
 *  namespace their events with the module name.
 */

var delimiter = '.';
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var emitter = new EventEmitter2({
  wildcard: true,
  delimiter: delimiter,
  // set this to `true` if you want to emit the newListener event. The default value is `true`
  newListener: true,
  // the maximum amount of listeners that can be assigned to an event, default 10.
  maxListeners: 20
});

/**
 * @classdesc Allows MeanIO to use a single common EventEmitter with namespacing per Module.
 * @param {string} name - Name of the module, used to namespace events
 * @class
 */
function Events(name) {
  this.name = name;
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

  if (!opts.action) {
    console.error('Error: events require an "action" property');
    return;
  }
  this.emit([this.name, opts.action], opts);
};

/**
 * Calls emit with the module name as the default root namespace
 * @see EventEmitter2.emit
 * @link https://github.com/asyncly/EventEmitter2
 * @param {array|string} event
 * @return {boolean}
 */
Events.prototype.emit = function (event) {
  var args = prepArgs(arguments, this.name, event, this._default);
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
  var args = prepArgs(arguments, this.name, event, this._default);
  return emitter.emitAsync.apply(emitter, args);
};

/**
 * @deprecated
 * @param {string|array} name - Event name
 * @param {function} cb
 */
Events.prototype.subscribe = function (name, cb) {
  console.error('subscribe() has been deprecated. Update to on(event, listener)');
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
Events.prototype.addListener = emitter.addListener.bind(emitter);
Events.prototype.on = emitter.on.bind(emitter);
Events.prototype.onAny = emitter.onAny.bind(emitter);
Events.prototype.offAny = emitter.offAny.bind(emitter);
Events.prototype.once = emitter.once.bind(emitter);
Events.prototype.many = emitter.many.bind(emitter);
Events.prototype.removeListener = emitter.removeListener.bind(emitter);
Events.prototype.off = emitter.off.bind(emitter);
Events.prototype.removeAllListeners = emitter.removeAllListeners.bind(emitter);
Events.prototype.setMaxListeners = emitter.setMaxListeners.bind(emitter);
Events.prototype.listeners = emitter.listeners.bind(emitter);
Events.prototype.listenersAny = emitter.listenersAny.bind(emitter);

module.exports = Events;

/**
 * Helps in preparing our arguments for passing to emit and emitAsync
 * @param args
 * @param name
 * @param defaults
 * @returns {*}
 */
function prepArgs(args, name, event, defaults) {
  args = Array.from(args);

  var namespace = [name];
  if (!Array.isArray(event)) {
    event = event.split(delimiter);
  }

  namespace = namespace.concat(event);

  args.shift();//remove the event

  args.unshift(namespace);
  if (defaults) {
    args.push(defaults);
  }
  return args;
}
