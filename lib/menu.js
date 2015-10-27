'use strict';
var _ = require('lodash');

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

//MenuItem class
function MenuItem(args) {
  args = _.assign({
    name: null,
    title: null,
    link: null,
    roles: null,
    options: null
  }, args);
  args.name = args.name || (args.link ? args.link.replace('/', '_') : undefined) || args.title;
  this.name = args.name;
  this.title = args.title;
  this.link = args.link;
  this.roles = args.roles;
  this.options = args.options;
  this.submenus = args.submenus || [];
}

function mapDoStrip(v) {
  return v ? v.strip() : undefined;
}

MenuItem.prototype.strip = function() {
  return {
    name: this.name,
    title: this.title,
    link: this.link,
    roles: this.roles,
    options: this.options,
    submenus: this.submenus.map(mapDoStrip)
  };
};


MenuItem.hasRole = function(role, roles) {
  return (roles.indexOf(role) > -1);
};

MenuItem.prototype.props = function() {
  return {
    name: this.name,
    title: this.title,
    link: this.link,
    roles: this.roles,
    options: this.options
  };
};

MenuItem.prototype.findOrCreate = function(path) {
  if (!path.length) return this;
  var p = path.shift();
  var index = this.list().indexOf(p);
  if (index > -1) return this.submenus[index].findOrCreate(path);
  var n = new MenuItem();
  n.name = p;
  this.submenus.push(n);
  return n.findOrCreate(path);
};

MenuItem.prototype.list = function() {
  return this.submenus.map(extractNames);
};

MenuItem.prototype.get = function(roles, path) {
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

  if (!MenuItem.hasRole('admin', roles)) {
    if (this.roles) {
      if (!_.intersection(this.roles, roles).length) return undefined;
    }
  }
  return new MenuItem({
    roles: this.roles || null,
    link: this.link || null,
    title: this.title || null,
    name: this.name || null,
    options: this.options || null,
    submenus: this.submenus.map(get_get.bind(null, roles)).filter(remove_nulls),
  });
};

MenuItem.prototype.add = function(mi) {
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

var allMenus = new MenuItem(),
  _ = require('lodash');

function Menus() {}

function supportMenus(Meanio) {


  Menus.prototype.add = function(args) {
    if (args.length === 0) return this;
    if (args.length > 1) {
      Array.prototype.forEach.call(args, this.add.bind(this));
      return this;
    }

    args = _.assign({
        path: 'main',
        roles: ['anonymous'],
      },
      args);
    args.path = args.path.replace(/^\//, '');
    var item = allMenus.findOrCreate(args.path.split('/'));
    item.add(new MenuItem(args));
    return this;
  };

  Menus.prototype.get = function(args) {
    args = args || {};
    args.menu = args.menu || 'main';
    args.roles = args.roles || ['anonymous'];
    args.defaultMenu = args.defaultMenu || [];

    var sm = allMenus.get(args.roles, args.menu.split('/'));
    if (!sm) {
      //no menu at all
      return args.defaultMenu;
    }
    var ret = sm.get(args.roles);
    return ret ? args.defaultMenu.concat(ret.submenus.map(mapDoStrip)) : args.defaultMenu;
  };
  Meanio.prototype.Menus = Menus;

}

module.exports = supportMenus;
