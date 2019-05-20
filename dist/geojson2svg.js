!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.geojson2svg=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/kevin/Development/MapCreator/geojson2svg/node_modules/multigeojson/index.js":[function(require,module,exports){
//index.js 
(function() { 
	var singles = ['Point', 'LineString', 'Polygon'];
	var multies = ['MultiPoint', 'MultiLineString', 'MultiPolygon'];
	function explode(g) {
	  if( multies.indexOf(g.type) > -1) {
	    return g.coordinates.map(function(part) {
	      var single = {};
	      single.type = g.type.replace('Multi','');
	      single.coordinates = part;
        if(g.crs) single.crs = g.crs;
	      return single;
	    });  
	  } else {
	    return false;
	  }
	}
	function implode(gs) {
	  var sameType = gs.every(function(g) { 
	    return singles.indexOf(g.type) > -1;
	  })
    var crs = gs[0].crs || 0;
    var sameCrs = gs.every(function(g) {
      var gcrs = g.crs || 0;
      return gcrs == crs;
    });
	  if(sameType && sameCrs) {
	    var multi = {};
	    multi.type = 'Multi' + gs[0].type;
	    multi.coordinates = [];
      if(crs != 0) multi.crs = crs;
	    gs.forEach(function(g) {
	      multi.coordinates.push(g.coordinates);
	    });
	    return multi;
	  } else {
	    return false;
	  }
	};
	var multigeojson = {
	  explode: explode,
	  implode: implode
	};
	if(typeof module !== 'undefined' && module.exports) {
	  module.exports = multigeojson;
	} else if(window) {
	  window.multigeojson = multigeojson;
	}
})();

},{}],"/Users/kevin/Development/MapCreator/geojson2svg/src/converter.js":[function(require,module,exports){
//converter.js
var multi = require('multigeojson');

function getCoordString (coords, res, origin, opt) {
  //origin - svg image origin
  var coordStr = coords.map(function (coord) {
    if (opt.project) {
      coord = opt.project(coord);
    }

    var x = (coord[0] - origin.x) / res;
    var y = (opt.yDirection || 1) * (origin.y - coord[1]) / res;

    return x + ',' + y;
  });

  return coordStr.join(' ');
}

function addAttributes (ele, attributes) {
  var part = ele.split('/>')[0];

  for (var key in attributes) {
    if (attributes.hasOwnProperty(key)) {
      part += ' ' + key + '="' + attributes[key] + '"';
    }
  }

  return part + ' />';
}

function point (geom, res, origin, opt) {
  var r = opt && opt.r ? opt.r : 1;
  var pointAsCircle = opt && opt.hasOwnProperty('pointAsCircle') ? opt.pointAsCircle : false;
  var coords = getCoordString([geom.coordinates], res, origin, opt);

  if (pointAsCircle) {
    return [coords];
  } else {
    return [
      'M' + coords
      + ' m' + -r + ',0' + ' a' + r + ',' + r + ' 0 1,1 ' + 2 * r + ',' + 0
      + ' a' + r + ',' + r + ' 0 1,1 ' + -2 * r + ',' + 0
    ];
  }
}

function multiPoint (geom, res, origin, opt) {
  var explode = opt && opt.hasOwnProperty('explode') ? opt.explode : false;
  var paths = multi.explode(geom).map(function (single) {
    return point(single, res, origin, opt)[0];
  });

  if (!explode) return [paths.join(' ')];

  return paths;
}

function lineString (geom, res, origin, opt) {
  var coords = getCoordString(geom.coordinates, res, origin, opt);
  var path = 'M' + coords;

  return [path];
}

function multiLineString (geom, res, origin, opt) {
  var explode = opt && opt.hasOwnProperty('explode') ? opt.explode : false;
  var paths = multi.explode(geom).map(function (single) {
    return lineString(single, res, origin, opt)[0];
  });

  if (!explode) return [paths.join(' ')];

  return paths;
}

function polygon (geom, res, origin, opt) {
  var mainStr, holes, holeStr;

  mainStr = getCoordString(geom.coordinates[0], res, origin, opt);

  if (geom.coordinates.length > 1) {
    holes = geom.coordinates.slice(1, geom.coordinates.length);
  }

  var path = 'M' + mainStr;

  if (holes) {
    for (var i = 0; i < holes.length; i++) {
      path += ' M' + getCoordString(holes[i], res, origin, opt);
    }
  }

  path += 'Z';

  return [path];
}

function multiPolygon (geom, res, origin, opt) {
  var explode = opt.hasOwnProperty('explode') ? opt.explode : false;
  var paths = multi.explode(geom).map(function (single) {
    return polygon(single, res, origin, opt)[0];
  });

  if (!explode) return [paths.join(' ').replace(/Z/g, '') + 'Z'];

  return paths;
}

module.exports = {
  Point: point,
  MultiPoint: multiPoint,
  LineString: lineString,
  MultiLineString: multiLineString,
  Polygon: polygon,
  MultiPolygon: multiPolygon
};

},{"multigeojson":"/Users/kevin/Development/MapCreator/geojson2svg/node_modules/multigeojson/index.js"}],"/Users/kevin/Development/MapCreator/geojson2svg/src/extend.js":[function(require,module,exports){
// extend.js
// extend b to a with shallow copy
module.exports = function (a, b) {
  var c = {};

  Object.keys(a).forEach(function (key) {
    c[key] = a[key]
  });

  Object.keys(b).forEach(function (key) {
    c[key] = b[key]
  });

  return c;
};

},{}],"/Users/kevin/Development/MapCreator/geojson2svg/src/instance.js":[function(require,module,exports){
var extend = require('./extend.js');
var converter = require('./converter.js');

//g2svg as geojson2svg (shorthand)
var g2svg = function (options) {
  this.options = options || {};
  this.viewportSize = this.options.viewportSize || { width: 256, height: 256 };
  this.mapExtent = this.options.mapExtent || {
    left: -20037508.342789244,
    right: 20037508.342789244,
    bottom: -20037508.342789244,
    top: 20037508.342789244
  };

  this.res = this.calResolution(this.mapExtent, this.viewportSize, this.options.fitTo);
};

g2svg.prototype.calResolution = function (extent, size, fitTo) {
  var xres = (extent.right - extent.left) / size.width;
  var yres = (extent.top - extent.bottom) / size.height;

  if (fitTo) {
    if (fitTo.toLowerCase() === 'width') {
      return xres;
    } else if (fitTo.toLowerCase() === 'height') {
      return yres;
    } else {
      throw new Error('"fitTo" option should be "width" or "height"');
    }
  } else {
    return Math.max(xres, yres);
  }
};

g2svg.prototype.convert = function (geojson, options) {
  var opt = extend(this.options, options || {});
  var multiGeometries = ['MultiPoint', 'MultiLineString', 'MultiPolygon'];
  var geometries = ['Point', 'LineString', 'Polygon'];
  var svgElements = [];

  if (geojson.type === 'FeatureCollection') {
    for (var i = 0; i < geojson.features.length; i++) {
      svgElements = svgElements.concat(this.convertFeature(geojson.features[i], opt));
    }
  } else if (geojson.type === 'Feature') {
    svgElements = this.convertFeature(geojson, opt);
  } else if (geojson.type === 'GeometryCollection') {
    for (var i = 0; i < geojson.geometries.length; i++) {
      svgElements = svgElements.concat(this.convertGeometry(geojson.geometries[i], opt));
    }
  } else if (converter[geojson.type]) {
    svgElements = this.convertGeometry(geojson, opt);
  } else {
    return;
  }

  if (opt.callback) opt.callback.call(this, svgElements);

  return svgElements;
};

g2svg.prototype.convertFeature = function (feature, options) {
  if (!feature && !feature.geometry) return;

  var opt = extend(this.options, options || {});

  if (opt.attributes && opt.attributes instanceof Array) {
    var arr = opt.attributes;

    opt.attributes = arr.reduce(function (sum, property) {
      if (typeof (property) === 'string') {
        var val, key = property.split('.').pop();

        try {
          val = valueAt(feature, property)
        } catch (e) {
          val = false
        }

        if (val) sum[key] = val
      } else if (typeof (property) === 'object' && property.type && property.property) {
        if (property.type === 'dynamic') {
          var val, key = property.key ? property.key : property.property.split('.').pop();

          try {
            val = valueAt(feature, property.property)
          } catch (e) {
            val = false
          }

          if (val) sum[key] = val
        } else if (property.type === 'static' && property.value) {
          sum[property.property] = property.value
        }
      }

      return sum
    }, {})
  } else {
    opt.attributes = opt.attributes || {};
  }

  var id = opt.attributes.id || feature.id || (feature.properties && feature.properties.id ? feature.properties.id : null);

  if (id) opt.attributes.id = id;

  return this.convertGeometry(feature.geometry, opt);
};

g2svg.prototype.convertGeometry = function (geom, options) {
  if (converter[geom.type]) {
    var opt = extend(this.options, options || {});
    var output = opt.output || 'svg';
    var paths = converter[geom.type].call(this, geom, this.res, { x: this.mapExtent.left, y: this.mapExtent.top }, opt);
    var svgJsons, svgEles;

    if (output.toLowerCase() === 'svg') {
      svgJsons = paths.map(function (path) {
        return pathToSvgJson(path, geom.type, opt.attributes, opt);
      });

      svgEles = svgJsons.map(function (json) {
        return jsonToSvgElement(json, geom.type, opt);
      });

      return svgEles;
    }

    return paths;
  }
};

function pathToSvgJson (path, type, attributes, opt) {
  var svg = {};
  var pointAsCircle = opt && opt.hasOwnProperty('pointAsCircle') ? opt.pointAsCircle : false;

  if ((type === 'Point' || type === 'MultiPoint') && pointAsCircle) {
    svg['cx'] = path.split(',')[0];
    svg['cy'] = path.split(',')[1];
    svg['r'] = opt && opt.r ? opt.r : '1';
  } else {
    svg = { d: path };
    if (type === 'Polygon' || type === 'MultiPolygon') {
      svg['fill-rule'] = 'evenodd';
    }
  }

  for (var key in attributes) {
    svg[key] = attributes[key];
  }

  return svg;
};

function jsonToSvgElement (json, type, opt) {
  var pointAsCircle = opt && opt.hasOwnProperty('pointAsCircle') ? opt.pointAsCircle : false;
  var ele = '<path';

  if ((type === 'Point' || type === 'MultiPoint') && pointAsCircle) {
    ele = '<circle';
  }

  for (var key in json) {
    ele += ' ' + key + '="' + json[key] + '"';
  }

  ele += '/>';

  return ele;
}

function valueAt (obj, path) {
  //taken from http://stackoverflow.com/a/6394168/713573
  function index (prev, cur, i, arr) {
    if (prev.hasOwnProperty(cur)) {
      return prev[cur];
    } else {
      throw new Error(arr.slice(0, i + 1).join('.') + ' is not a valid property path');
    }
  }

  return path.split('.').reduce(index, obj);
}

module.exports = g2svg;

},{"./converter.js":"/Users/kevin/Development/MapCreator/geojson2svg/src/converter.js","./extend.js":"/Users/kevin/Development/MapCreator/geojson2svg/src/extend.js"}],"/Users/kevin/Development/MapCreator/geojson2svg/src/main.js":[function(require,module,exports){
var g2svg = require('./instance.js');

module.exports = function (options) {
  return new g2svg(options);
};

},{"./instance.js":"/Users/kevin/Development/MapCreator/geojson2svg/src/instance.js"}]},{},["/Users/kevin/Development/MapCreator/geojson2svg/src/main.js"])("/Users/kevin/Development/MapCreator/geojson2svg/src/main.js")
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMva2V2aW4vRGV2ZWxvcG1lbnQvTWFwQ3JlYXRvci9nZW9qc29uMnN2Zy9ub2RlX21vZHVsZXMvbXVsdGlnZW9qc29uL2luZGV4LmpzIiwiL1VzZXJzL2tldmluL0RldmVsb3BtZW50L01hcENyZWF0b3IvZ2VvanNvbjJzdmcvc3JjL2NvbnZlcnRlci5qcyIsIi9Vc2Vycy9rZXZpbi9EZXZlbG9wbWVudC9NYXBDcmVhdG9yL2dlb2pzb24yc3ZnL3NyYy9leHRlbmQuanMiLCIvVXNlcnMva2V2aW4vRGV2ZWxvcG1lbnQvTWFwQ3JlYXRvci9nZW9qc29uMnN2Zy9zcmMvaW5zdGFuY2UuanMiLCIvVXNlcnMva2V2aW4vRGV2ZWxvcG1lbnQvTWFwQ3JlYXRvci9nZW9qc29uMnN2Zy9zcmMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvL2luZGV4LmpzIFxuKGZ1bmN0aW9uKCkgeyBcblx0dmFyIHNpbmdsZXMgPSBbJ1BvaW50JywgJ0xpbmVTdHJpbmcnLCAnUG9seWdvbiddO1xuXHR2YXIgbXVsdGllcyA9IFsnTXVsdGlQb2ludCcsICdNdWx0aUxpbmVTdHJpbmcnLCAnTXVsdGlQb2x5Z29uJ107XG5cdGZ1bmN0aW9uIGV4cGxvZGUoZykge1xuXHQgIGlmKCBtdWx0aWVzLmluZGV4T2YoZy50eXBlKSA+IC0xKSB7XG5cdCAgICByZXR1cm4gZy5jb29yZGluYXRlcy5tYXAoZnVuY3Rpb24ocGFydCkge1xuXHQgICAgICB2YXIgc2luZ2xlID0ge307XG5cdCAgICAgIHNpbmdsZS50eXBlID0gZy50eXBlLnJlcGxhY2UoJ011bHRpJywnJyk7XG5cdCAgICAgIHNpbmdsZS5jb29yZGluYXRlcyA9IHBhcnQ7XG4gICAgICAgIGlmKGcuY3JzKSBzaW5nbGUuY3JzID0gZy5jcnM7XG5cdCAgICAgIHJldHVybiBzaW5nbGU7XG5cdCAgICB9KTsgIFxuXHQgIH0gZWxzZSB7XG5cdCAgICByZXR1cm4gZmFsc2U7XG5cdCAgfVxuXHR9XG5cdGZ1bmN0aW9uIGltcGxvZGUoZ3MpIHtcblx0ICB2YXIgc2FtZVR5cGUgPSBncy5ldmVyeShmdW5jdGlvbihnKSB7IFxuXHQgICAgcmV0dXJuIHNpbmdsZXMuaW5kZXhPZihnLnR5cGUpID4gLTE7XG5cdCAgfSlcbiAgICB2YXIgY3JzID0gZ3NbMF0uY3JzIHx8IDA7XG4gICAgdmFyIHNhbWVDcnMgPSBncy5ldmVyeShmdW5jdGlvbihnKSB7XG4gICAgICB2YXIgZ2NycyA9IGcuY3JzIHx8IDA7XG4gICAgICByZXR1cm4gZ2NycyA9PSBjcnM7XG4gICAgfSk7XG5cdCAgaWYoc2FtZVR5cGUgJiYgc2FtZUNycykge1xuXHQgICAgdmFyIG11bHRpID0ge307XG5cdCAgICBtdWx0aS50eXBlID0gJ011bHRpJyArIGdzWzBdLnR5cGU7XG5cdCAgICBtdWx0aS5jb29yZGluYXRlcyA9IFtdO1xuICAgICAgaWYoY3JzICE9IDApIG11bHRpLmNycyA9IGNycztcblx0ICAgIGdzLmZvckVhY2goZnVuY3Rpb24oZykge1xuXHQgICAgICBtdWx0aS5jb29yZGluYXRlcy5wdXNoKGcuY29vcmRpbmF0ZXMpO1xuXHQgICAgfSk7XG5cdCAgICByZXR1cm4gbXVsdGk7XG5cdCAgfSBlbHNlIHtcblx0ICAgIHJldHVybiBmYWxzZTtcblx0ICB9XG5cdH07XG5cdHZhciBtdWx0aWdlb2pzb24gPSB7XG5cdCAgZXhwbG9kZTogZXhwbG9kZSxcblx0ICBpbXBsb2RlOiBpbXBsb2RlXG5cdH07XG5cdGlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdCAgbW9kdWxlLmV4cG9ydHMgPSBtdWx0aWdlb2pzb247XG5cdH0gZWxzZSBpZih3aW5kb3cpIHtcblx0ICB3aW5kb3cubXVsdGlnZW9qc29uID0gbXVsdGlnZW9qc29uO1xuXHR9XG59KSgpO1xuIiwiLy9jb252ZXJ0ZXIuanNcbnZhciBtdWx0aSA9IHJlcXVpcmUoJ211bHRpZ2VvanNvbicpO1xuXG5mdW5jdGlvbiBnZXRDb29yZFN0cmluZyAoY29vcmRzLCByZXMsIG9yaWdpbiwgb3B0KSB7XG4gIC8vb3JpZ2luIC0gc3ZnIGltYWdlIG9yaWdpblxuICB2YXIgY29vcmRTdHIgPSBjb29yZHMubWFwKGZ1bmN0aW9uIChjb29yZCkge1xuICAgIGlmIChvcHQucHJvamVjdCkge1xuICAgICAgY29vcmQgPSBvcHQucHJvamVjdChjb29yZCk7XG4gICAgfVxuXG4gICAgdmFyIHggPSAoY29vcmRbMF0gLSBvcmlnaW4ueCkgLyByZXM7XG4gICAgdmFyIHkgPSAob3B0LnlEaXJlY3Rpb24gfHwgMSkgKiAob3JpZ2luLnkgLSBjb29yZFsxXSkgLyByZXM7XG5cbiAgICByZXR1cm4geCArICcsJyArIHk7XG4gIH0pO1xuXG4gIHJldHVybiBjb29yZFN0ci5qb2luKCcgJyk7XG59XG5cbmZ1bmN0aW9uIGFkZEF0dHJpYnV0ZXMgKGVsZSwgYXR0cmlidXRlcykge1xuICB2YXIgcGFydCA9IGVsZS5zcGxpdCgnLz4nKVswXTtcblxuICBmb3IgKHZhciBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgIGlmIChhdHRyaWJ1dGVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHBhcnQgKz0gJyAnICsga2V5ICsgJz1cIicgKyBhdHRyaWJ1dGVzW2tleV0gKyAnXCInO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0ICsgJyAvPic7XG59XG5cbmZ1bmN0aW9uIHBvaW50IChnZW9tLCByZXMsIG9yaWdpbiwgb3B0KSB7XG4gIHZhciByID0gb3B0ICYmIG9wdC5yID8gb3B0LnIgOiAxO1xuICB2YXIgcG9pbnRBc0NpcmNsZSA9IG9wdCAmJiBvcHQuaGFzT3duUHJvcGVydHkoJ3BvaW50QXNDaXJjbGUnKSA/IG9wdC5wb2ludEFzQ2lyY2xlIDogZmFsc2U7XG4gIHZhciBjb29yZHMgPSBnZXRDb29yZFN0cmluZyhbZ2VvbS5jb29yZGluYXRlc10sIHJlcywgb3JpZ2luLCBvcHQpO1xuXG4gIGlmIChwb2ludEFzQ2lyY2xlKSB7XG4gICAgcmV0dXJuIFtjb29yZHNdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBbXG4gICAgICAnTScgKyBjb29yZHNcbiAgICAgICsgJyBtJyArIC1yICsgJywwJyArICcgYScgKyByICsgJywnICsgciArICcgMCAxLDEgJyArIDIgKiByICsgJywnICsgMFxuICAgICAgKyAnIGEnICsgciArICcsJyArIHIgKyAnIDAgMSwxICcgKyAtMiAqIHIgKyAnLCcgKyAwXG4gICAgXTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtdWx0aVBvaW50IChnZW9tLCByZXMsIG9yaWdpbiwgb3B0KSB7XG4gIHZhciBleHBsb2RlID0gb3B0ICYmIG9wdC5oYXNPd25Qcm9wZXJ0eSgnZXhwbG9kZScpID8gb3B0LmV4cGxvZGUgOiBmYWxzZTtcbiAgdmFyIHBhdGhzID0gbXVsdGkuZXhwbG9kZShnZW9tKS5tYXAoZnVuY3Rpb24gKHNpbmdsZSkge1xuICAgIHJldHVybiBwb2ludChzaW5nbGUsIHJlcywgb3JpZ2luLCBvcHQpWzBdO1xuICB9KTtcblxuICBpZiAoIWV4cGxvZGUpIHJldHVybiBbcGF0aHMuam9pbignICcpXTtcblxuICByZXR1cm4gcGF0aHM7XG59XG5cbmZ1bmN0aW9uIGxpbmVTdHJpbmcgKGdlb20sIHJlcywgb3JpZ2luLCBvcHQpIHtcbiAgdmFyIGNvb3JkcyA9IGdldENvb3JkU3RyaW5nKGdlb20uY29vcmRpbmF0ZXMsIHJlcywgb3JpZ2luLCBvcHQpO1xuICB2YXIgcGF0aCA9ICdNJyArIGNvb3JkcztcblxuICByZXR1cm4gW3BhdGhdO1xufVxuXG5mdW5jdGlvbiBtdWx0aUxpbmVTdHJpbmcgKGdlb20sIHJlcywgb3JpZ2luLCBvcHQpIHtcbiAgdmFyIGV4cGxvZGUgPSBvcHQgJiYgb3B0Lmhhc093blByb3BlcnR5KCdleHBsb2RlJykgPyBvcHQuZXhwbG9kZSA6IGZhbHNlO1xuICB2YXIgcGF0aHMgPSBtdWx0aS5leHBsb2RlKGdlb20pLm1hcChmdW5jdGlvbiAoc2luZ2xlKSB7XG4gICAgcmV0dXJuIGxpbmVTdHJpbmcoc2luZ2xlLCByZXMsIG9yaWdpbiwgb3B0KVswXTtcbiAgfSk7XG5cbiAgaWYgKCFleHBsb2RlKSByZXR1cm4gW3BhdGhzLmpvaW4oJyAnKV07XG5cbiAgcmV0dXJuIHBhdGhzO1xufVxuXG5mdW5jdGlvbiBwb2x5Z29uIChnZW9tLCByZXMsIG9yaWdpbiwgb3B0KSB7XG4gIHZhciBtYWluU3RyLCBob2xlcywgaG9sZVN0cjtcblxuICBtYWluU3RyID0gZ2V0Q29vcmRTdHJpbmcoZ2VvbS5jb29yZGluYXRlc1swXSwgcmVzLCBvcmlnaW4sIG9wdCk7XG5cbiAgaWYgKGdlb20uY29vcmRpbmF0ZXMubGVuZ3RoID4gMSkge1xuICAgIGhvbGVzID0gZ2VvbS5jb29yZGluYXRlcy5zbGljZSgxLCBnZW9tLmNvb3JkaW5hdGVzLmxlbmd0aCk7XG4gIH1cblxuICB2YXIgcGF0aCA9ICdNJyArIG1haW5TdHI7XG5cbiAgaWYgKGhvbGVzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBob2xlcy5sZW5ndGg7IGkrKykge1xuICAgICAgcGF0aCArPSAnIE0nICsgZ2V0Q29vcmRTdHJpbmcoaG9sZXNbaV0sIHJlcywgb3JpZ2luLCBvcHQpO1xuICAgIH1cbiAgfVxuXG4gIHBhdGggKz0gJ1onO1xuXG4gIHJldHVybiBbcGF0aF07XG59XG5cbmZ1bmN0aW9uIG11bHRpUG9seWdvbiAoZ2VvbSwgcmVzLCBvcmlnaW4sIG9wdCkge1xuICB2YXIgZXhwbG9kZSA9IG9wdC5oYXNPd25Qcm9wZXJ0eSgnZXhwbG9kZScpID8gb3B0LmV4cGxvZGUgOiBmYWxzZTtcbiAgdmFyIHBhdGhzID0gbXVsdGkuZXhwbG9kZShnZW9tKS5tYXAoZnVuY3Rpb24gKHNpbmdsZSkge1xuICAgIHJldHVybiBwb2x5Z29uKHNpbmdsZSwgcmVzLCBvcmlnaW4sIG9wdClbMF07XG4gIH0pO1xuXG4gIGlmICghZXhwbG9kZSkgcmV0dXJuIFtwYXRocy5qb2luKCcgJykucmVwbGFjZSgvWi9nLCAnJykgKyAnWiddO1xuXG4gIHJldHVybiBwYXRocztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIFBvaW50OiBwb2ludCxcbiAgTXVsdGlQb2ludDogbXVsdGlQb2ludCxcbiAgTGluZVN0cmluZzogbGluZVN0cmluZyxcbiAgTXVsdGlMaW5lU3RyaW5nOiBtdWx0aUxpbmVTdHJpbmcsXG4gIFBvbHlnb246IHBvbHlnb24sXG4gIE11bHRpUG9seWdvbjogbXVsdGlQb2x5Z29uXG59O1xuIiwiLy8gZXh0ZW5kLmpzXG4vLyBleHRlbmQgYiB0byBhIHdpdGggc2hhbGxvdyBjb3B5XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gIHZhciBjID0ge307XG5cbiAgT2JqZWN0LmtleXMoYSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgY1trZXldID0gYVtrZXldXG4gIH0pO1xuXG4gIE9iamVjdC5rZXlzKGIpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgIGNba2V5XSA9IGJba2V5XVxuICB9KTtcblxuICByZXR1cm4gYztcbn07XG4iLCJ2YXIgZXh0ZW5kID0gcmVxdWlyZSgnLi9leHRlbmQuanMnKTtcbnZhciBjb252ZXJ0ZXIgPSByZXF1aXJlKCcuL2NvbnZlcnRlci5qcycpO1xuXG4vL2cyc3ZnIGFzIGdlb2pzb24yc3ZnIChzaG9ydGhhbmQpXG52YXIgZzJzdmcgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB0aGlzLnZpZXdwb3J0U2l6ZSA9IHRoaXMub3B0aW9ucy52aWV3cG9ydFNpemUgfHwgeyB3aWR0aDogMjU2LCBoZWlnaHQ6IDI1NiB9O1xuICB0aGlzLm1hcEV4dGVudCA9IHRoaXMub3B0aW9ucy5tYXBFeHRlbnQgfHwge1xuICAgIGxlZnQ6IC0yMDAzNzUwOC4zNDI3ODkyNDQsXG4gICAgcmlnaHQ6IDIwMDM3NTA4LjM0Mjc4OTI0NCxcbiAgICBib3R0b206IC0yMDAzNzUwOC4zNDI3ODkyNDQsXG4gICAgdG9wOiAyMDAzNzUwOC4zNDI3ODkyNDRcbiAgfTtcblxuICB0aGlzLnJlcyA9IHRoaXMuY2FsUmVzb2x1dGlvbih0aGlzLm1hcEV4dGVudCwgdGhpcy52aWV3cG9ydFNpemUsIHRoaXMub3B0aW9ucy5maXRUbyk7XG59O1xuXG5nMnN2Zy5wcm90b3R5cGUuY2FsUmVzb2x1dGlvbiA9IGZ1bmN0aW9uIChleHRlbnQsIHNpemUsIGZpdFRvKSB7XG4gIHZhciB4cmVzID0gKGV4dGVudC5yaWdodCAtIGV4dGVudC5sZWZ0KSAvIHNpemUud2lkdGg7XG4gIHZhciB5cmVzID0gKGV4dGVudC50b3AgLSBleHRlbnQuYm90dG9tKSAvIHNpemUuaGVpZ2h0O1xuXG4gIGlmIChmaXRUbykge1xuICAgIGlmIChmaXRUby50b0xvd2VyQ2FzZSgpID09PSAnd2lkdGgnKSB7XG4gICAgICByZXR1cm4geHJlcztcbiAgICB9IGVsc2UgaWYgKGZpdFRvLnRvTG93ZXJDYXNlKCkgPT09ICdoZWlnaHQnKSB7XG4gICAgICByZXR1cm4geXJlcztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdcImZpdFRvXCIgb3B0aW9uIHNob3VsZCBiZSBcIndpZHRoXCIgb3IgXCJoZWlnaHRcIicpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gTWF0aC5tYXgoeHJlcywgeXJlcyk7XG4gIH1cbn07XG5cbmcyc3ZnLnByb3RvdHlwZS5jb252ZXJ0ID0gZnVuY3Rpb24gKGdlb2pzb24sIG9wdGlvbnMpIHtcbiAgdmFyIG9wdCA9IGV4dGVuZCh0aGlzLm9wdGlvbnMsIG9wdGlvbnMgfHwge30pO1xuICB2YXIgbXVsdGlHZW9tZXRyaWVzID0gWydNdWx0aVBvaW50JywgJ011bHRpTGluZVN0cmluZycsICdNdWx0aVBvbHlnb24nXTtcbiAgdmFyIGdlb21ldHJpZXMgPSBbJ1BvaW50JywgJ0xpbmVTdHJpbmcnLCAnUG9seWdvbiddO1xuICB2YXIgc3ZnRWxlbWVudHMgPSBbXTtcblxuICBpZiAoZ2VvanNvbi50eXBlID09PSAnRmVhdHVyZUNvbGxlY3Rpb24nKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnZW9qc29uLmZlYXR1cmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBzdmdFbGVtZW50cyA9IHN2Z0VsZW1lbnRzLmNvbmNhdCh0aGlzLmNvbnZlcnRGZWF0dXJlKGdlb2pzb24uZmVhdHVyZXNbaV0sIG9wdCkpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChnZW9qc29uLnR5cGUgPT09ICdGZWF0dXJlJykge1xuICAgIHN2Z0VsZW1lbnRzID0gdGhpcy5jb252ZXJ0RmVhdHVyZShnZW9qc29uLCBvcHQpO1xuICB9IGVsc2UgaWYgKGdlb2pzb24udHlwZSA9PT0gJ0dlb21ldHJ5Q29sbGVjdGlvbicpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdlb2pzb24uZ2VvbWV0cmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgc3ZnRWxlbWVudHMgPSBzdmdFbGVtZW50cy5jb25jYXQodGhpcy5jb252ZXJ0R2VvbWV0cnkoZ2VvanNvbi5nZW9tZXRyaWVzW2ldLCBvcHQpKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoY29udmVydGVyW2dlb2pzb24udHlwZV0pIHtcbiAgICBzdmdFbGVtZW50cyA9IHRoaXMuY29udmVydEdlb21ldHJ5KGdlb2pzb24sIG9wdCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKG9wdC5jYWxsYmFjaykgb3B0LmNhbGxiYWNrLmNhbGwodGhpcywgc3ZnRWxlbWVudHMpO1xuXG4gIHJldHVybiBzdmdFbGVtZW50cztcbn07XG5cbmcyc3ZnLnByb3RvdHlwZS5jb252ZXJ0RmVhdHVyZSA9IGZ1bmN0aW9uIChmZWF0dXJlLCBvcHRpb25zKSB7XG4gIGlmICghZmVhdHVyZSAmJiAhZmVhdHVyZS5nZW9tZXRyeSkgcmV0dXJuO1xuXG4gIHZhciBvcHQgPSBleHRlbmQodGhpcy5vcHRpb25zLCBvcHRpb25zIHx8IHt9KTtcblxuICBpZiAob3B0LmF0dHJpYnV0ZXMgJiYgb3B0LmF0dHJpYnV0ZXMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIHZhciBhcnIgPSBvcHQuYXR0cmlidXRlcztcblxuICAgIG9wdC5hdHRyaWJ1dGVzID0gYXJyLnJlZHVjZShmdW5jdGlvbiAoc3VtLCBwcm9wZXJ0eSkge1xuICAgICAgaWYgKHR5cGVvZiAocHJvcGVydHkpID09PSAnc3RyaW5nJykge1xuICAgICAgICB2YXIgdmFsLCBrZXkgPSBwcm9wZXJ0eS5zcGxpdCgnLicpLnBvcCgpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdmFsID0gdmFsdWVBdChmZWF0dXJlLCBwcm9wZXJ0eSlcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHZhbCA9IGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsKSBzdW1ba2V5XSA9IHZhbFxuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgKHByb3BlcnR5KSA9PT0gJ29iamVjdCcgJiYgcHJvcGVydHkudHlwZSAmJiBwcm9wZXJ0eS5wcm9wZXJ0eSkge1xuICAgICAgICBpZiAocHJvcGVydHkudHlwZSA9PT0gJ2R5bmFtaWMnKSB7XG4gICAgICAgICAgdmFyIHZhbCwga2V5ID0gcHJvcGVydHkua2V5ID8gcHJvcGVydHkua2V5IDogcHJvcGVydHkucHJvcGVydHkuc3BsaXQoJy4nKS5wb3AoKTtcblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YWwgPSB2YWx1ZUF0KGZlYXR1cmUsIHByb3BlcnR5LnByb3BlcnR5KVxuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHZhbCA9IGZhbHNlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHZhbCkgc3VtW2tleV0gPSB2YWxcbiAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eS50eXBlID09PSAnc3RhdGljJyAmJiBwcm9wZXJ0eS52YWx1ZSkge1xuICAgICAgICAgIHN1bVtwcm9wZXJ0eS5wcm9wZXJ0eV0gPSBwcm9wZXJ0eS52YWx1ZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzdW1cbiAgICB9LCB7fSlcbiAgfSBlbHNlIHtcbiAgICBvcHQuYXR0cmlidXRlcyA9IG9wdC5hdHRyaWJ1dGVzIHx8IHt9O1xuICB9XG5cbiAgdmFyIGlkID0gb3B0LmF0dHJpYnV0ZXMuaWQgfHwgZmVhdHVyZS5pZCB8fCAoZmVhdHVyZS5wcm9wZXJ0aWVzICYmIGZlYXR1cmUucHJvcGVydGllcy5pZCA/IGZlYXR1cmUucHJvcGVydGllcy5pZCA6IG51bGwpO1xuXG4gIGlmIChpZCkgb3B0LmF0dHJpYnV0ZXMuaWQgPSBpZDtcblxuICByZXR1cm4gdGhpcy5jb252ZXJ0R2VvbWV0cnkoZmVhdHVyZS5nZW9tZXRyeSwgb3B0KTtcbn07XG5cbmcyc3ZnLnByb3RvdHlwZS5jb252ZXJ0R2VvbWV0cnkgPSBmdW5jdGlvbiAoZ2VvbSwgb3B0aW9ucykge1xuICBpZiAoY29udmVydGVyW2dlb20udHlwZV0pIHtcbiAgICB2YXIgb3B0ID0gZXh0ZW5kKHRoaXMub3B0aW9ucywgb3B0aW9ucyB8fCB7fSk7XG4gICAgdmFyIG91dHB1dCA9IG9wdC5vdXRwdXQgfHwgJ3N2Zyc7XG4gICAgdmFyIHBhdGhzID0gY29udmVydGVyW2dlb20udHlwZV0uY2FsbCh0aGlzLCBnZW9tLCB0aGlzLnJlcywgeyB4OiB0aGlzLm1hcEV4dGVudC5sZWZ0LCB5OiB0aGlzLm1hcEV4dGVudC50b3AgfSwgb3B0KTtcbiAgICB2YXIgc3ZnSnNvbnMsIHN2Z0VsZXM7XG5cbiAgICBpZiAob3V0cHV0LnRvTG93ZXJDYXNlKCkgPT09ICdzdmcnKSB7XG4gICAgICBzdmdKc29ucyA9IHBhdGhzLm1hcChmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICByZXR1cm4gcGF0aFRvU3ZnSnNvbihwYXRoLCBnZW9tLnR5cGUsIG9wdC5hdHRyaWJ1dGVzLCBvcHQpO1xuICAgICAgfSk7XG5cbiAgICAgIHN2Z0VsZXMgPSBzdmdKc29ucy5tYXAoZnVuY3Rpb24gKGpzb24pIHtcbiAgICAgICAgcmV0dXJuIGpzb25Ub1N2Z0VsZW1lbnQoanNvbiwgZ2VvbS50eXBlLCBvcHQpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBzdmdFbGVzO1xuICAgIH1cblxuICAgIHJldHVybiBwYXRocztcbiAgfVxufTtcblxuZnVuY3Rpb24gcGF0aFRvU3ZnSnNvbiAocGF0aCwgdHlwZSwgYXR0cmlidXRlcywgb3B0KSB7XG4gIHZhciBzdmcgPSB7fTtcbiAgdmFyIHBvaW50QXNDaXJjbGUgPSBvcHQgJiYgb3B0Lmhhc093blByb3BlcnR5KCdwb2ludEFzQ2lyY2xlJykgPyBvcHQucG9pbnRBc0NpcmNsZSA6IGZhbHNlO1xuXG4gIGlmICgodHlwZSA9PT0gJ1BvaW50JyB8fCB0eXBlID09PSAnTXVsdGlQb2ludCcpICYmIHBvaW50QXNDaXJjbGUpIHtcbiAgICBzdmdbJ2N4J10gPSBwYXRoLnNwbGl0KCcsJylbMF07XG4gICAgc3ZnWydjeSddID0gcGF0aC5zcGxpdCgnLCcpWzFdO1xuICAgIHN2Z1snciddID0gb3B0ICYmIG9wdC5yID8gb3B0LnIgOiAnMSc7XG4gIH0gZWxzZSB7XG4gICAgc3ZnID0geyBkOiBwYXRoIH07XG4gICAgaWYgKHR5cGUgPT09ICdQb2x5Z29uJyB8fCB0eXBlID09PSAnTXVsdGlQb2x5Z29uJykge1xuICAgICAgc3ZnWydmaWxsLXJ1bGUnXSA9ICdldmVub2RkJztcbiAgICB9XG4gIH1cblxuICBmb3IgKHZhciBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgIHN2Z1trZXldID0gYXR0cmlidXRlc1trZXldO1xuICB9XG5cbiAgcmV0dXJuIHN2Zztcbn07XG5cbmZ1bmN0aW9uIGpzb25Ub1N2Z0VsZW1lbnQgKGpzb24sIHR5cGUsIG9wdCkge1xuICB2YXIgcG9pbnRBc0NpcmNsZSA9IG9wdCAmJiBvcHQuaGFzT3duUHJvcGVydHkoJ3BvaW50QXNDaXJjbGUnKSA/IG9wdC5wb2ludEFzQ2lyY2xlIDogZmFsc2U7XG4gIHZhciBlbGUgPSAnPHBhdGgnO1xuXG4gIGlmICgodHlwZSA9PT0gJ1BvaW50JyB8fCB0eXBlID09PSAnTXVsdGlQb2ludCcpICYmIHBvaW50QXNDaXJjbGUpIHtcbiAgICBlbGUgPSAnPGNpcmNsZSc7XG4gIH1cblxuICBmb3IgKHZhciBrZXkgaW4ganNvbikge1xuICAgIGVsZSArPSAnICcgKyBrZXkgKyAnPVwiJyArIGpzb25ba2V5XSArICdcIic7XG4gIH1cblxuICBlbGUgKz0gJy8+JztcblxuICByZXR1cm4gZWxlO1xufVxuXG5mdW5jdGlvbiB2YWx1ZUF0IChvYmosIHBhdGgpIHtcbiAgLy90YWtlbiBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzYzOTQxNjgvNzEzNTczXG4gIGZ1bmN0aW9uIGluZGV4IChwcmV2LCBjdXIsIGksIGFycikge1xuICAgIGlmIChwcmV2Lmhhc093blByb3BlcnR5KGN1cikpIHtcbiAgICAgIHJldHVybiBwcmV2W2N1cl07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihhcnIuc2xpY2UoMCwgaSArIDEpLmpvaW4oJy4nKSArICcgaXMgbm90IGEgdmFsaWQgcHJvcGVydHkgcGF0aCcpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXRoLnNwbGl0KCcuJykucmVkdWNlKGluZGV4LCBvYmopO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGcyc3ZnO1xuIiwidmFyIGcyc3ZnID0gcmVxdWlyZSgnLi9pbnN0YW5jZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIHJldHVybiBuZXcgZzJzdmcob3B0aW9ucyk7XG59O1xuIl19
