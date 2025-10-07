import {
  Dr,
  It,
  M,
  animated,
  ct,
  ft,
  ht,
  require_Stack,
  require_arrayFilter,
  require_arrayMap,
  require_baseClone,
  require_baseFor,
  require_baseGet,
  require_baseGetTag,
  require_baseIsEqual,
  require_castPath,
  require_copyObject,
  require_flatRest,
  require_get,
  require_getAllKeysIn,
  require_hasIn,
  require_identity,
  require_isArray,
  require_isArrayLike,
  require_isKey,
  require_isObject,
  require_isObjectLike,
  require_isPlainObject,
  require_keys,
  require_last,
  require_toKey,
  useSpring,
  ut
} from "./chunk-XPGL4N5M.js";
import {
  require_jsx_runtime
} from "./chunk-EO7JTZSA.js";
import {
  require_react
} from "./chunk-32EALFBN.js";
import {
  __commonJS,
  __toESM
} from "./chunk-G3PMV62Z.js";

// node_modules/lodash/_baseForOwn.js
var require_baseForOwn = __commonJS({
  "node_modules/lodash/_baseForOwn.js"(exports, module) {
    var baseFor = require_baseFor();
    var keys = require_keys();
    function baseForOwn(object, iteratee) {
      return object && baseFor(object, iteratee, keys);
    }
    module.exports = baseForOwn;
  }
});

// node_modules/lodash/_createBaseEach.js
var require_createBaseEach = __commonJS({
  "node_modules/lodash/_createBaseEach.js"(exports, module) {
    var isArrayLike = require_isArrayLike();
    function createBaseEach(eachFunc, fromRight) {
      return function(collection, iteratee) {
        if (collection == null) {
          return collection;
        }
        if (!isArrayLike(collection)) {
          return eachFunc(collection, iteratee);
        }
        var length = collection.length, index = fromRight ? length : -1, iterable = Object(collection);
        while (fromRight ? index-- : ++index < length) {
          if (iteratee(iterable[index], index, iterable) === false) {
            break;
          }
        }
        return collection;
      };
    }
    module.exports = createBaseEach;
  }
});

// node_modules/lodash/_baseEach.js
var require_baseEach = __commonJS({
  "node_modules/lodash/_baseEach.js"(exports, module) {
    var baseForOwn = require_baseForOwn();
    var createBaseEach = require_createBaseEach();
    var baseEach = createBaseEach(baseForOwn);
    module.exports = baseEach;
  }
});

// node_modules/lodash/_baseFilter.js
var require_baseFilter = __commonJS({
  "node_modules/lodash/_baseFilter.js"(exports, module) {
    var baseEach = require_baseEach();
    function baseFilter(collection, predicate) {
      var result = [];
      baseEach(collection, function(value, index, collection2) {
        if (predicate(value, index, collection2)) {
          result.push(value);
        }
      });
      return result;
    }
    module.exports = baseFilter;
  }
});

// node_modules/lodash/_baseIsMatch.js
var require_baseIsMatch = __commonJS({
  "node_modules/lodash/_baseIsMatch.js"(exports, module) {
    var Stack = require_Stack();
    var baseIsEqual = require_baseIsEqual();
    var COMPARE_PARTIAL_FLAG = 1;
    var COMPARE_UNORDERED_FLAG = 2;
    function baseIsMatch(object, source, matchData, customizer) {
      var index = matchData.length, length = index, noCustomizer = !customizer;
      if (object == null) {
        return !length;
      }
      object = Object(object);
      while (index--) {
        var data = matchData[index];
        if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
          return false;
        }
      }
      while (++index < length) {
        data = matchData[index];
        var key = data[0], objValue = object[key], srcValue = data[1];
        if (noCustomizer && data[2]) {
          if (objValue === void 0 && !(key in object)) {
            return false;
          }
        } else {
          var stack = new Stack();
          if (customizer) {
            var result = customizer(objValue, srcValue, key, object, source, stack);
          }
          if (!(result === void 0 ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack) : result)) {
            return false;
          }
        }
      }
      return true;
    }
    module.exports = baseIsMatch;
  }
});

// node_modules/lodash/_isStrictComparable.js
var require_isStrictComparable = __commonJS({
  "node_modules/lodash/_isStrictComparable.js"(exports, module) {
    var isObject = require_isObject();
    function isStrictComparable(value) {
      return value === value && !isObject(value);
    }
    module.exports = isStrictComparable;
  }
});

// node_modules/lodash/_getMatchData.js
var require_getMatchData = __commonJS({
  "node_modules/lodash/_getMatchData.js"(exports, module) {
    var isStrictComparable = require_isStrictComparable();
    var keys = require_keys();
    function getMatchData(object) {
      var result = keys(object), length = result.length;
      while (length--) {
        var key = result[length], value = object[key];
        result[length] = [key, value, isStrictComparable(value)];
      }
      return result;
    }
    module.exports = getMatchData;
  }
});

// node_modules/lodash/_matchesStrictComparable.js
var require_matchesStrictComparable = __commonJS({
  "node_modules/lodash/_matchesStrictComparable.js"(exports, module) {
    function matchesStrictComparable(key, srcValue) {
      return function(object) {
        if (object == null) {
          return false;
        }
        return object[key] === srcValue && (srcValue !== void 0 || key in Object(object));
      };
    }
    module.exports = matchesStrictComparable;
  }
});

// node_modules/lodash/_baseMatches.js
var require_baseMatches = __commonJS({
  "node_modules/lodash/_baseMatches.js"(exports, module) {
    var baseIsMatch = require_baseIsMatch();
    var getMatchData = require_getMatchData();
    var matchesStrictComparable = require_matchesStrictComparable();
    function baseMatches(source) {
      var matchData = getMatchData(source);
      if (matchData.length == 1 && matchData[0][2]) {
        return matchesStrictComparable(matchData[0][0], matchData[0][1]);
      }
      return function(object) {
        return object === source || baseIsMatch(object, source, matchData);
      };
    }
    module.exports = baseMatches;
  }
});

// node_modules/lodash/_baseMatchesProperty.js
var require_baseMatchesProperty = __commonJS({
  "node_modules/lodash/_baseMatchesProperty.js"(exports, module) {
    var baseIsEqual = require_baseIsEqual();
    var get = require_get();
    var hasIn = require_hasIn();
    var isKey = require_isKey();
    var isStrictComparable = require_isStrictComparable();
    var matchesStrictComparable = require_matchesStrictComparable();
    var toKey = require_toKey();
    var COMPARE_PARTIAL_FLAG = 1;
    var COMPARE_UNORDERED_FLAG = 2;
    function baseMatchesProperty(path, srcValue) {
      if (isKey(path) && isStrictComparable(srcValue)) {
        return matchesStrictComparable(toKey(path), srcValue);
      }
      return function(object) {
        var objValue = get(object, path);
        return objValue === void 0 && objValue === srcValue ? hasIn(object, path) : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
      };
    }
    module.exports = baseMatchesProperty;
  }
});

// node_modules/lodash/_baseProperty.js
var require_baseProperty = __commonJS({
  "node_modules/lodash/_baseProperty.js"(exports, module) {
    function baseProperty(key) {
      return function(object) {
        return object == null ? void 0 : object[key];
      };
    }
    module.exports = baseProperty;
  }
});

// node_modules/lodash/_basePropertyDeep.js
var require_basePropertyDeep = __commonJS({
  "node_modules/lodash/_basePropertyDeep.js"(exports, module) {
    var baseGet = require_baseGet();
    function basePropertyDeep(path) {
      return function(object) {
        return baseGet(object, path);
      };
    }
    module.exports = basePropertyDeep;
  }
});

// node_modules/lodash/property.js
var require_property = __commonJS({
  "node_modules/lodash/property.js"(exports, module) {
    var baseProperty = require_baseProperty();
    var basePropertyDeep = require_basePropertyDeep();
    var isKey = require_isKey();
    var toKey = require_toKey();
    function property(path) {
      return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
    }
    module.exports = property;
  }
});

// node_modules/lodash/_baseIteratee.js
var require_baseIteratee = __commonJS({
  "node_modules/lodash/_baseIteratee.js"(exports, module) {
    var baseMatches = require_baseMatches();
    var baseMatchesProperty = require_baseMatchesProperty();
    var identity = require_identity();
    var isArray = require_isArray();
    var property = require_property();
    function baseIteratee(value) {
      if (typeof value == "function") {
        return value;
      }
      if (value == null) {
        return identity;
      }
      if (typeof value == "object") {
        return isArray(value) ? baseMatchesProperty(value[0], value[1]) : baseMatches(value);
      }
      return property(value);
    }
    module.exports = baseIteratee;
  }
});

// node_modules/lodash/filter.js
var require_filter = __commonJS({
  "node_modules/lodash/filter.js"(exports, module) {
    var arrayFilter = require_arrayFilter();
    var baseFilter = require_baseFilter();
    var baseIteratee = require_baseIteratee();
    var isArray = require_isArray();
    function filter(collection, predicate) {
      var func = isArray(collection) ? arrayFilter : baseFilter;
      return func(collection, baseIteratee(predicate, 3));
    }
    module.exports = filter;
  }
});

// node_modules/lodash/isNumber.js
var require_isNumber = __commonJS({
  "node_modules/lodash/isNumber.js"(exports, module) {
    var baseGetTag = require_baseGetTag();
    var isObjectLike = require_isObjectLike();
    var numberTag = "[object Number]";
    function isNumber(value) {
      return typeof value == "number" || isObjectLike(value) && baseGetTag(value) == numberTag;
    }
    module.exports = isNumber;
  }
});

// node_modules/lodash/_baseSlice.js
var require_baseSlice = __commonJS({
  "node_modules/lodash/_baseSlice.js"(exports, module) {
    function baseSlice(array, start, end) {
      var index = -1, length = array.length;
      if (start < 0) {
        start = -start > length ? 0 : length + start;
      }
      end = end > length ? length : end;
      if (end < 0) {
        end += length;
      }
      length = start > end ? 0 : end - start >>> 0;
      start >>>= 0;
      var result = Array(length);
      while (++index < length) {
        result[index] = array[index + start];
      }
      return result;
    }
    module.exports = baseSlice;
  }
});

// node_modules/lodash/_parent.js
var require_parent = __commonJS({
  "node_modules/lodash/_parent.js"(exports, module) {
    var baseGet = require_baseGet();
    var baseSlice = require_baseSlice();
    function parent(object, path) {
      return path.length < 2 ? object : baseGet(object, baseSlice(path, 0, -1));
    }
    module.exports = parent;
  }
});

// node_modules/lodash/_baseUnset.js
var require_baseUnset = __commonJS({
  "node_modules/lodash/_baseUnset.js"(exports, module) {
    var castPath = require_castPath();
    var last = require_last();
    var parent = require_parent();
    var toKey = require_toKey();
    function baseUnset(object, path) {
      path = castPath(path, object);
      object = parent(object, path);
      return object == null || delete object[toKey(last(path))];
    }
    module.exports = baseUnset;
  }
});

// node_modules/lodash/_customOmitClone.js
var require_customOmitClone = __commonJS({
  "node_modules/lodash/_customOmitClone.js"(exports, module) {
    var isPlainObject = require_isPlainObject();
    function customOmitClone(value) {
      return isPlainObject(value) ? void 0 : value;
    }
    module.exports = customOmitClone;
  }
});

// node_modules/lodash/omit.js
var require_omit = __commonJS({
  "node_modules/lodash/omit.js"(exports, module) {
    var arrayMap = require_arrayMap();
    var baseClone = require_baseClone();
    var baseUnset = require_baseUnset();
    var castPath = require_castPath();
    var copyObject = require_copyObject();
    var customOmitClone = require_customOmitClone();
    var flatRest = require_flatRest();
    var getAllKeysIn = require_getAllKeysIn();
    var CLONE_DEEP_FLAG = 1;
    var CLONE_FLAT_FLAG = 2;
    var CLONE_SYMBOLS_FLAG = 4;
    var omit = flatRest(function(object, paths) {
      var result = {};
      if (object == null) {
        return result;
      }
      var isDeep = false;
      paths = arrayMap(paths, function(path) {
        path = castPath(path, object);
        isDeep || (isDeep = path.length > 1);
        return path;
      });
      copyObject(object, getAllKeysIn(object), result);
      if (isDeep) {
        result = baseClone(result, CLONE_DEEP_FLAG | CLONE_FLAT_FLAG | CLONE_SYMBOLS_FLAG, customOmitClone);
      }
      var length = paths.length;
      while (length--) {
        baseUnset(result, paths[length]);
      }
      return result;
    });
    module.exports = omit;
  }
});

// node_modules/@nivo/annotations/dist/nivo-annotations.mjs
var import_react = __toESM(require_react(), 1);
var import_filter = __toESM(require_filter(), 1);
var import_isNumber = __toESM(require_isNumber(), 1);
var import_omit = __toESM(require_omit(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function g() {
  return g = Object.assign ? Object.assign.bind() : function(t2) {
    for (var n2 = 1; n2 < arguments.length; n2++) {
      var i2 = arguments[n2];
      for (var o2 in i2) ({}).hasOwnProperty.call(i2, o2) && (t2[o2] = i2[o2]);
    }
    return t2;
  }, g.apply(null, arguments);
}
var k = { dotSize: 4, noteWidth: 120, noteTextOffset: 8, animate: true };
var W = function(n2) {
  var i2 = typeof n2;
  return (0, import_react.isValidElement)(n2) || "string" === i2 || "function" === i2 || "object" === i2;
};
var v = function(t2) {
  var n2 = typeof t2;
  return "string" === n2 || "function" === n2;
};
var b = function(t2) {
  return "circle" === t2.type;
};
var w = function(t2) {
  return "dot" === t2.type;
};
var z = function(t2) {
  return "rect" === t2.type;
};
var P = function(t2) {
  var n2 = t2.data, i2 = t2.annotations, e2 = t2.getPosition, r = t2.getDimensions;
  return i2.reduce((function(t3, i3) {
    var s = i3.offset || 0;
    return [].concat(t3, (0, import_filter.default)(n2, i3.match).map((function(t4) {
      var n3 = e2(t4), o2 = r(t4);
      return (b(i3) || z(i3)) && (o2.size = o2.size + 2 * s, o2.width = o2.width + 2 * s, o2.height = o2.height + 2 * s), g({}, (0, import_omit.default)(i3, ["match", "offset"]), n3, o2, { size: i3.size || o2.size, datum: t4 });
    })));
  }), []);
};
var C = function(t2, n2, i2, o2) {
  var e2 = Math.atan2(o2 - n2, i2 - t2);
  return ht(ct(e2));
};
var S = function(t2) {
  var n2, i2, o2 = t2.x, a2 = t2.y, r = t2.noteX, s = t2.noteY, h = t2.noteWidth, d = void 0 === h ? k.noteWidth : h, c = t2.noteTextOffset, f = void 0 === c ? k.noteTextOffset : c;
  if ((0, import_isNumber.default)(r)) n2 = o2 + r;
  else {
    if (void 0 === r.abs) throw new Error("noteX should be either a number or an object containing an 'abs' property");
    n2 = r.abs;
  }
  if ((0, import_isNumber.default)(s)) i2 = a2 + s;
  else {
    if (void 0 === s.abs) throw new Error("noteY should be either a number or an object containing an 'abs' property");
    i2 = s.abs;
  }
  var y = o2, x2 = a2, m2 = C(o2, a2, n2, i2);
  if (b(t2)) {
    var p2 = ft(ut(m2), t2.size / 2);
    y += p2.x, x2 += p2.y;
  }
  if (z(t2)) {
    var g2 = Math.round((m2 + 90) / 45) % 8;
    0 === g2 && (x2 -= t2.height / 2), 1 === g2 && (y += t2.width / 2, x2 -= t2.height / 2), 2 === g2 && (y += t2.width / 2), 3 === g2 && (y += t2.width / 2, x2 += t2.height / 2), 4 === g2 && (x2 += t2.height / 2), 5 === g2 && (y -= t2.width / 2, x2 += t2.height / 2), 6 === g2 && (y -= t2.width / 2), 7 === g2 && (y -= t2.width / 2, x2 -= t2.height / 2);
  }
  var W2 = n2, v2 = n2;
  return (m2 + 90) % 360 > 180 ? (W2 -= d, v2 -= d) : v2 += d, { points: [[y, x2], [n2, i2], [v2, i2]], text: [W2, i2 - f], angle: m2 + 90 };
};
var O = function(t2) {
  var i2 = t2.data, o2 = t2.annotations, e2 = t2.getPosition, a2 = t2.getDimensions;
  return (0, import_react.useMemo)((function() {
    return P({ data: i2, annotations: o2, getPosition: e2, getDimensions: a2 });
  }), [i2, o2, e2, a2]);
};
var j = function(t2) {
  var i2 = t2.annotations;
  return (0, import_react.useMemo)((function() {
    return i2.map((function(t3) {
      return g({}, t3, { computed: S(g({}, t3)) });
    }));
  }), [i2]);
};
var M2 = function(t2) {
  return (0, import_react.useMemo)((function() {
    return S(t2);
  }), [t2]);
};
var T = function(t2) {
  var n2 = t2.datum, o2 = t2.x, e2 = t2.y, r = t2.note, s = M(), l = Dr(), u = l.animate, d = l.config, k2 = useSpring({ x: o2, y: e2, config: d, immediate: !u });
  return "function" == typeof r ? (0, import_react.createElement)(r, { x: o2, y: e2, datum: n2 }) : (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [s.annotations.text.outlineWidth > 0 && (0, import_jsx_runtime.jsx)(animated.text, { x: k2.x, y: k2.y, style: g({}, s.annotations.text, { strokeLinejoin: "round", strokeWidth: 2 * s.annotations.text.outlineWidth, stroke: s.annotations.text.outlineColor }), children: r }), (0, import_jsx_runtime.jsx)(animated.text, { x: k2.x, y: k2.y, style: (0, import_omit.default)(s.annotations.text, ["outlineWidth", "outlineColor"]), children: r })] });
};
var E = function(t2) {
  var i2 = t2.points, o2 = t2.isOutline, e2 = void 0 !== o2 && o2, a2 = M(), r = (0, import_react.useMemo)((function() {
    var t3 = i2[0];
    return i2.slice(1).reduce((function(t4, n2) {
      return t4 + " L" + n2[0] + "," + n2[1];
    }), "M" + t3[0] + "," + t3[1]);
  }), [i2]), s = It(r);
  if (e2 && a2.annotations.link.outlineWidth <= 0) return null;
  var l = g({}, a2.annotations.link);
  return e2 && (l.strokeLinecap = "square", l.strokeWidth = a2.annotations.link.strokeWidth + 2 * a2.annotations.link.outlineWidth, l.stroke = a2.annotations.link.outlineColor, l.opacity = a2.annotations.link.outlineOpacity), (0, import_jsx_runtime.jsx)(animated.path, { fill: "none", d: s, style: l });
};
var I = function(t2) {
  var n2 = t2.x, i2 = t2.y, o2 = t2.size, e2 = M(), a2 = Dr(), r = a2.animate, s = a2.config, l = useSpring({ x: n2, y: i2, radius: o2 / 2, config: s, immediate: !r });
  return (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [e2.annotations.outline.outlineWidth > 0 && (0, import_jsx_runtime.jsx)(animated.circle, { cx: l.x, cy: l.y, r: l.radius, style: g({}, e2.annotations.outline, { fill: "none", strokeWidth: e2.annotations.outline.strokeWidth + 2 * e2.annotations.outline.outlineWidth, stroke: e2.annotations.outline.outlineColor, opacity: e2.annotations.outline.outlineOpacity }) }), (0, import_jsx_runtime.jsx)(animated.circle, { cx: l.x, cy: l.y, r: l.radius, style: e2.annotations.outline })] });
};
var D = function(t2) {
  var n2 = t2.x, i2 = t2.y, o2 = t2.size, e2 = void 0 === o2 ? k.dotSize : o2, a2 = M(), r = Dr(), s = r.animate, l = r.config, u = useSpring({ x: n2, y: i2, radius: e2 / 2, config: l, immediate: !s });
  return (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [a2.annotations.outline.outlineWidth > 0 && (0, import_jsx_runtime.jsx)(animated.circle, { cx: u.x, cy: u.y, r: u.radius, style: g({}, a2.annotations.outline, { fill: "none", strokeWidth: 2 * a2.annotations.outline.outlineWidth, stroke: a2.annotations.outline.outlineColor, opacity: a2.annotations.outline.outlineOpacity }) }), (0, import_jsx_runtime.jsx)(animated.circle, { cx: u.x, cy: u.y, r: u.radius, style: a2.annotations.symbol })] });
};
var L = function(t2) {
  var n2 = t2.x, i2 = t2.y, o2 = t2.width, e2 = t2.height, a2 = t2.borderRadius, r = void 0 === a2 ? 6 : a2, s = M(), l = Dr(), u = l.animate, d = l.config, k2 = useSpring({ x: n2 - o2 / 2, y: i2 - e2 / 2, width: o2, height: e2, config: d, immediate: !u });
  return (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [s.annotations.outline.outlineWidth > 0 && (0, import_jsx_runtime.jsx)(animated.rect, { x: k2.x, y: k2.y, rx: r, ry: r, width: k2.width, height: k2.height, style: g({}, s.annotations.outline, { fill: "none", strokeWidth: s.annotations.outline.strokeWidth + 2 * s.annotations.outline.outlineWidth, stroke: s.annotations.outline.outlineColor, opacity: s.annotations.outline.outlineOpacity }) }), (0, import_jsx_runtime.jsx)(animated.rect, { x: k2.x, y: k2.y, rx: r, ry: r, width: k2.width, height: k2.height, style: s.annotations.outline })] });
};
var R = function(t2) {
  var n2 = t2.datum, i2 = t2.x, o2 = t2.y, e2 = t2.note, a2 = M2(t2);
  if (!W(e2)) throw new Error("note should be a valid react element");
  return (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [(0, import_jsx_runtime.jsx)(E, { points: a2.points, isOutline: true }), b(t2) && (0, import_jsx_runtime.jsx)(I, { x: i2, y: o2, size: t2.size }), w(t2) && (0, import_jsx_runtime.jsx)(D, { x: i2, y: o2, size: t2.size }), z(t2) && (0, import_jsx_runtime.jsx)(L, { x: i2, y: o2, width: t2.width, height: t2.height, borderRadius: t2.borderRadius }), (0, import_jsx_runtime.jsx)(E, { points: a2.points }), (0, import_jsx_runtime.jsx)(T, { datum: n2, x: a2.text[0], y: a2.text[1], note: e2 })] });
};
var q = function(t2, n2) {
  n2.forEach((function(n3, i2) {
    var o2 = n3[0], e2 = n3[1];
    0 === i2 ? t2.moveTo(o2, e2) : t2.lineTo(o2, e2);
  }));
};
var J = function(t2, n2) {
  var i2 = n2.annotations, o2 = n2.theme;
  0 !== i2.length && (t2.save(), i2.forEach((function(n3) {
    if (!v(n3.note)) throw new Error("note is invalid for canvas implementation");
    o2.annotations.link.outlineWidth > 0 && (t2.lineCap = "square", t2.strokeStyle = o2.annotations.link.outlineColor, t2.lineWidth = o2.annotations.link.strokeWidth + 2 * o2.annotations.link.outlineWidth, t2.beginPath(), q(t2, n3.computed.points), t2.stroke(), t2.lineCap = "butt"), b(n3) && o2.annotations.outline.outlineWidth > 0 && (t2.strokeStyle = o2.annotations.outline.outlineColor, t2.lineWidth = o2.annotations.outline.strokeWidth + 2 * o2.annotations.outline.outlineWidth, t2.beginPath(), t2.arc(n3.x, n3.y, n3.size / 2, 0, 2 * Math.PI), t2.stroke()), w(n3) && o2.annotations.symbol.outlineWidth > 0 && (t2.strokeStyle = o2.annotations.symbol.outlineColor, t2.lineWidth = 2 * o2.annotations.symbol.outlineWidth, t2.beginPath(), t2.arc(n3.x, n3.y, n3.size / 2, 0, 2 * Math.PI), t2.stroke()), z(n3) && o2.annotations.outline.outlineWidth > 0 && (t2.strokeStyle = o2.annotations.outline.outlineColor, t2.lineWidth = o2.annotations.outline.strokeWidth + 2 * o2.annotations.outline.outlineWidth, t2.beginPath(), t2.rect(n3.x - n3.width / 2, n3.y - n3.height / 2, n3.width, n3.height), t2.stroke()), t2.strokeStyle = o2.annotations.link.stroke, t2.lineWidth = o2.annotations.link.strokeWidth, t2.beginPath(), q(t2, n3.computed.points), t2.stroke(), b(n3) && (t2.strokeStyle = o2.annotations.outline.stroke, t2.lineWidth = o2.annotations.outline.strokeWidth, t2.beginPath(), t2.arc(n3.x, n3.y, n3.size / 2, 0, 2 * Math.PI), t2.stroke()), w(n3) && (t2.fillStyle = o2.annotations.symbol.fill, t2.beginPath(), t2.arc(n3.x, n3.y, n3.size / 2, 0, 2 * Math.PI), t2.fill()), z(n3) && (t2.strokeStyle = o2.annotations.outline.stroke, t2.lineWidth = o2.annotations.outline.strokeWidth, t2.beginPath(), t2.rect(n3.x - n3.width / 2, n3.y - n3.height / 2, n3.width, n3.height), t2.stroke()), "function" == typeof n3.note ? n3.note(t2, { datum: n3.datum, x: n3.computed.text[0], y: n3.computed.text[1], theme: o2 }) : (t2.font = o2.annotations.text.fontSize + "px " + o2.annotations.text.fontFamily, t2.textAlign = "left", t2.textBaseline = "alphabetic", t2.fillStyle = o2.annotations.text.fill, t2.strokeStyle = o2.annotations.text.outlineColor, t2.lineWidth = 2 * o2.annotations.text.outlineWidth, o2.annotations.text.outlineWidth > 0 && (t2.lineJoin = "round", t2.strokeText(n3.note, n3.computed.text[0], n3.computed.text[1]), t2.lineJoin = "miter"), t2.fillText(n3.note, n3.computed.text[0], n3.computed.text[1]));
  })), t2.restore());
};

export {
  require_baseIteratee,
  require_baseEach,
  O,
  j,
  R,
  J
};
//# sourceMappingURL=chunk-GGKAVXE5.js.map
