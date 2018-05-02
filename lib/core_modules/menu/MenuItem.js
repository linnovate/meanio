'use strict';

var _ = require('lodash');

//MenuItem class
function MenuItem(options) {
  options = _.assign({
    name: null,
    title: null,
    link: null,
    roles: null
  }, options);
  options.name = options.name || (options.link ? options.link.replace('/', '_') : undefined) || options.title;
  this.name = options.name;
  this.title = options.title;
  this.link = options.link;
  this.roles = options.roles;
  this.icon = options.icon;
  this.weight = options.weight;
  this.submenus = options.submenus || [];
}

MenuItem.prototype.strip = function () {
  return {
    name: this.name,
    title: this.title,
    link: this.link,
    roles: this.roles,
    icon: this.icon,
    weight: this.weight,
    submenus: this.submenus.map(mapDoStrip)
  };
};


MenuItem.hasRole = function (role, roles) {
  return (roles.indexOf(role) > -1);
};

MenuItem.prototype.props = function () {
  return {
    name: this.name,
    title: this.title,
    link: this.link,
    icon: this.icon,
    weight: this.weight,
    roles: this.roles
  };
};

MenuItem.prototype.findOrCreate = function (path) {
  if (!path.length) return this;
  var p = path.shift();
  var index = this.list().indexOf(p);
  if (index > -1) return this.submenus[index].findOrCreate(path);
  var n = new MenuItem();
  n.name = p;
  this.submenus.push(n);
  return n.findOrCreate(path);
};

MenuItem.prototype.list = function () {
  return this.submenus.map(extractNames);
};

MenuItem.prototype.get = function (roles, path) {
  roles = roles ? roles.slice() : [];
  if (roles.indexOf('anonymous') < 0 && roles.indexOf('authenticated') < 0) {
    roles.push('authenticated');
  }
  if (roles.indexOf('all') < 0) roles.push('all');

  var list = this.list();
  if (path) {
    if (!path.length) return this;
    var n = path.shift();
    var index = list.indexOf(n);
    return this.submenus[index] ? this.submenus[index].get(roles, path) : undefined;
  }

  if (this.roles) {
    if (!_.intersection(this.roles, roles).length) return undefined;
  }

  return new MenuItem({
    roles: this.roles || null,
    link: this.link || null,
    title: this.title || null,
    name: this.name || null,
    icon: this.icon || null,
    weight: this.weight || null,
    submenus: this.submenus.map(get_get.bind(null, roles)).filter(remove_nulls),
  });
};

MenuItem.prototype.add = function (mi) {
  var index = this.list().indexOf(mi.name);
  var itm;
  if (index > -1) {
    var ts = mi.props();
    itm = this.submenus[index];
    for (var i in ts) itm[i] = ts[i];
  } else {
    itm = mi;
    this.submenus.push(itm);
  }
  return itm;
};

//helper functions
function extractNames(v) {
  return v.name;
}

function get_get(roles, v) {
  return v.get(roles);
}

function remove_nulls(v) {
  return v;
}

function mapDoStrip(v) {
  return v ? v.strip() : undefined;
}

module.exports = MenuItem;
