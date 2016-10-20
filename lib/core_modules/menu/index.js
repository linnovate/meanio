'use strict';

var _ = require('lodash'),
  MenuItem = require('./MenuItem.js'),
  allMenus = new MenuItem();

function Menus() {}

Menus.prototype.add = add;
Menus.prototype.get = get;

module.exports = Menus;

function add(options) {
  if (arguments.length === 0) return this;
  if (options instanceof Array) {
    options.forEach(Menus.prototype.add.bind(this));
    return this;
  }
  if (arguments.length > 1) {
    Array.prototype.forEach.call(arguments, this.add.bind(this));
    return this;
  }

  //fixes scaffolding: menu=path
  if (options.menu !== undefined) {
    options.path = options.menu;
  }

  options = _.assign({
      path: 'main',
      roles: ['anonymous']
    },
    options);
  options.path = options.path.replace(/^\//, '');
  var item = allMenus.findOrCreate(options.path.split('/'));
  item.add(new MenuItem(options));
  return this;
}

function get(options) {
  options = options || {};
  options.menu = options.menu || 'main';
  options.roles = options.roles || ['anonymous'];
  options.defaultMenu = options.defaultMenu || [];

  var sm = allMenus.get(options.roles, options.menu.split('/'));
  if (!sm) {
    //no menu at all
    return options.defaultMenu;
  }
  var ret = sm.get(options.roles);
  return ret ? options.defaultMenu.concat(ret.submenus.map(mapDoStrip)) : options.defaultMenu;
}

function mapDoStrip(v) {
  return v ? v.strip() : undefined;
}
