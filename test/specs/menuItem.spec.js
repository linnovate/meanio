'use strict';

var chai = require('chai'),
  expect = chai.expect;

var MenuItem = require('../../lib/core_modules/menu/MenuItem.js');

describe('MenuItem', function () {
  it('should have functions', function () {
    expect(MenuItem.hasRole).to.exist;

    expect(MenuItem.prototype.strip).to.exist;
    expect(MenuItem.prototype.props).to.exist;
    expect(MenuItem.prototype.findOrCreate).to.exist;
    expect(MenuItem.prototype.list).to.exist;
    expect(MenuItem.prototype.get).to.exist;
    expect(MenuItem.prototype.add).to.exist;
  });
});
