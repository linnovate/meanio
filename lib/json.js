(function () {
  'use strict';

  /**
   * Moved this code out of module/util.js
   * It's being used by config and module
   * TODO we should find a way to not have
   *  to modify a global for this functionality
   */

  /**
   * Adds a flatten capability to the Global JSON
   * @param data
   * @param options
   * @returns {{}}
   */
  JSON.flatten = function(data, options) {
    var result = {};
    flatten(data, '');

    function flatten(config, root) {
      for (var index in config) {
        if (config[index] && !config[index].value && typeof(config[index]) === 'object') {
          flatten(config[index], layerRoot(root, index));
        } else {
          result[layerRoot(root, index)] = {
            'value': config[index]
          };

          if (options['default']) {
            result[layerRoot(root, index)]['default'] = config[index];
          }
        }
      }
    }

    function layerRoot(root, layer) {
      return (root ? root + '.' : '') + layer;
    }
    return result;
  };

  /**
   * Adds an unflatten capability to the Global JSON
   * @param data
   * @returns {*}
   */
  JSON.unflatten = function(data) {
    if (Object(data) !== data || Array.isArray(data)) {
      return data;
    }

    var regex = /\.?([^.\[\]]+)|\[(\d+)\]/g,
      resultholder = {};
    for (var p in data) {
      var cur = resultholder,
        prop = '',
        m;
      while ((m = regex.exec(p))) {
        cur = cur[prop] || (cur[prop] = (m[2] ? [] : {}));
        prop = m[2] || m[1];
      }
      cur[prop] = data[p];
    }
    return resultholder[''] || resultholder;
  };
})();