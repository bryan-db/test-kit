import {
  M,
  a,
  b,
  d,
  fn,
  mr,
  require_Set,
  require_SetCache,
  require_arrayIncludes,
  require_arrayIncludesWith,
  require_cacheHas,
  require_setToArray,
  ut
} from "./chunk-XPGL4N5M.js";
import {
  linear
} from "./chunk-HSBUN4UU.js";
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

// node_modules/lodash/noop.js
var require_noop = __commonJS({
  "node_modules/lodash/noop.js"(exports, module) {
    function noop() {
    }
    module.exports = noop;
  }
});

// node_modules/lodash/_createSet.js
var require_createSet = __commonJS({
  "node_modules/lodash/_createSet.js"(exports, module) {
    var Set = require_Set();
    var noop = require_noop();
    var setToArray = require_setToArray();
    var INFINITY = 1 / 0;
    var createSet = !(Set && 1 / setToArray(new Set([, -0]))[1] == INFINITY) ? noop : function(values) {
      return new Set(values);
    };
    module.exports = createSet;
  }
});

// node_modules/lodash/_baseUniq.js
var require_baseUniq = __commonJS({
  "node_modules/lodash/_baseUniq.js"(exports, module) {
    var SetCache = require_SetCache();
    var arrayIncludes = require_arrayIncludes();
    var arrayIncludesWith = require_arrayIncludesWith();
    var cacheHas = require_cacheHas();
    var createSet = require_createSet();
    var setToArray = require_setToArray();
    var LARGE_ARRAY_SIZE = 200;
    function baseUniq(array, iteratee, comparator) {
      var index = -1, includes = arrayIncludes, length = array.length, isCommon = true, result = [], seen = result;
      if (comparator) {
        isCommon = false;
        includes = arrayIncludesWith;
      } else if (length >= LARGE_ARRAY_SIZE) {
        var set = iteratee ? null : createSet(array);
        if (set) {
          return setToArray(set);
        }
        isCommon = false;
        includes = cacheHas;
        seen = new SetCache();
      } else {
        seen = iteratee ? [] : result;
      }
      outer:
        while (++index < length) {
          var value = array[index], computed = iteratee ? iteratee(value) : value;
          value = comparator || value !== 0 ? value : 0;
          if (isCommon && computed === computed) {
            var seenIndex = seen.length;
            while (seenIndex--) {
              if (seen[seenIndex] === computed) {
                continue outer;
              }
            }
            if (iteratee) {
              seen.push(computed);
            }
            result.push(value);
          } else if (!includes(seen, computed, comparator)) {
            if (seen !== result) {
              seen.push(computed);
            }
            result.push(value);
          }
        }
      return result;
    }
    module.exports = baseUniq;
  }
});

// node_modules/lodash/uniq.js
var require_uniq = __commonJS({
  "node_modules/lodash/uniq.js"(exports, module) {
    var baseUniq = require_baseUniq();
    function uniq(array) {
      return array && array.length ? baseUniq(array) : [];
    }
    module.exports = uniq;
  }
});

// node_modules/@nivo/legends/dist/nivo-legends.mjs
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var l = __toESM(require_react(), 1);
var import_react = __toESM(require_react(), 1);
var v = function(e2) {
  var i = e2.x, n = e2.y, o = e2.size, r = e2.fill, l2 = e2.opacity, a3 = void 0 === l2 ? 1 : l2, c2 = e2.borderWidth, s2 = void 0 === c2 ? 0 : c2, d3 = e2.borderColor;
  return (0, import_jsx_runtime.jsx)("circle", { r: o / 2, cx: i + o / 2, cy: n + o / 2, fill: r, opacity: a3, strokeWidth: s2, stroke: void 0 === d3 ? "transparent" : d3, style: { pointerEvents: "none" } });
};
var u = function(e2) {
  var i = e2.x, n = e2.y, o = e2.size, r = e2.fill, l2 = e2.opacity, a3 = void 0 === l2 ? 1 : l2, c2 = e2.borderWidth, s2 = void 0 === c2 ? 0 : c2, d3 = e2.borderColor;
  return (0, import_jsx_runtime.jsx)("g", { transform: "translate(" + i + "," + n + ")", children: (0, import_jsx_runtime.jsx)("path", { d: "\n                    M" + o / 2 + " 0\n                    L" + 0.8 * o + " " + o / 2 + "\n                    L" + o / 2 + " " + o + "\n                    L" + 0.2 * o + " " + o / 2 + "\n                    L" + o / 2 + " 0\n                ", fill: r, opacity: a3, strokeWidth: s2, stroke: void 0 === d3 ? "transparent" : d3, style: { pointerEvents: "none" } }) });
};
var p = function(e2) {
  var i = e2.x, n = e2.y, o = e2.size, r = e2.fill, l2 = e2.opacity, a3 = void 0 === l2 ? 1 : l2, c2 = e2.borderWidth, s2 = void 0 === c2 ? 0 : c2, d3 = e2.borderColor;
  return (0, import_jsx_runtime.jsx)("rect", { x: i, y: n, fill: r, opacity: a3, strokeWidth: s2, stroke: void 0 === d3 ? "transparent" : d3, width: o, height: o, style: { pointerEvents: "none" } });
};
var y = function(e2) {
  var i = e2.x, n = e2.y, o = e2.size, r = e2.fill, l2 = e2.opacity, a3 = void 0 === l2 ? 1 : l2, c2 = e2.borderWidth, s2 = void 0 === c2 ? 0 : c2, d3 = e2.borderColor;
  return (0, import_jsx_runtime.jsx)("g", { transform: "translate(" + i + "," + n + ")", children: (0, import_jsx_runtime.jsx)("path", { d: "\n                M" + o / 2 + " 0\n                L" + o + " " + o + "\n                L0 " + o + "\n                L" + o / 2 + " 0\n            ", fill: r, opacity: a3, strokeWidth: s2, stroke: void 0 === d3 ? "transparent" : d3, style: { pointerEvents: "none" } }) });
};
function b2() {
  return b2 = Object.assign ? Object.assign.bind() : function(t2) {
    for (var e2 = 1; e2 < arguments.length; e2++) {
      var i = arguments[e2];
      for (var n in i) ({}).hasOwnProperty.call(i, n) && (t2[n] = i[n]);
    }
    return t2;
  }, b2.apply(null, arguments);
}
var k = { translateX: 0, translateY: 0, padding: 0, itemsSpacing: 0, itemDirection: "left-to-right", justify: false, symbolShape: "square", symbolSize: 16, symbolSpacing: 8 };
var x = { length: 200, thickness: 16, direction: "row", tickPosition: "after", tickSize: 4, tickSpacing: 3, tickOverlap: false, tickFormat: function(t2) {
  return "" + t2;
}, titleAlign: "start", titleOffset: 4 };
var S = { top: 0, right: 0, bottom: 0, left: 0 };
var A = function(t2) {
  var e2, i = t2.direction, n = t2.itemsSpacing, o = t2.padding, r = t2.itemCount, l2 = t2.itemWidth, a3 = t2.itemHeight;
  if ("number" != typeof o && ("object" != typeof (e2 = o) || Array.isArray(e2) || null === e2)) throw new Error("Invalid property padding, must be one of: number, object");
  var c2 = "number" == typeof o ? { top: o, right: o, bottom: o, left: o } : b2({}, S, o), s2 = c2.left + c2.right, d3 = c2.top + c2.bottom, h = l2 + s2, g = a3 + d3, m = (r - 1) * n;
  return "row" === i ? h = l2 * r + m + s2 : "column" === i && (g = a3 * r + m + d3), { width: h, height: g, padding: c2 };
};
var C = function(t2) {
  var e2 = t2.anchor, i = t2.translateX, n = t2.translateY, o = t2.containerWidth, r = t2.containerHeight, l2 = t2.width, a3 = t2.height, c2 = i, s2 = n;
  switch (e2) {
    case "top":
      c2 += (o - l2) / 2;
      break;
    case "top-right":
      c2 += o - l2;
      break;
    case "right":
      c2 += o - l2, s2 += (r - a3) / 2;
      break;
    case "bottom-right":
      c2 += o - l2, s2 += r - a3;
      break;
    case "bottom":
      c2 += (o - l2) / 2, s2 += r - a3;
      break;
    case "bottom-left":
      s2 += r - a3;
      break;
    case "left":
      s2 += (r - a3) / 2;
      break;
    case "center":
      c2 += (o - l2) / 2, s2 += (r - a3) / 2;
  }
  return { x: c2, y: s2 };
};
var z = function(t2) {
  var e2, i, n, o, r, l2, a3 = t2.direction, c2 = t2.justify, s2 = t2.symbolSize, d3 = t2.symbolSpacing, h = t2.width, g = t2.height;
  switch (a3) {
    case "left-to-right":
      e2 = 0, i = (g - s2) / 2, o = g / 2, l2 = "central", c2 ? (n = h, r = "end") : (n = s2 + d3, r = "start");
      break;
    case "right-to-left":
      e2 = h - s2, i = (g - s2) / 2, o = g / 2, l2 = "central", c2 ? (n = 0, r = "start") : (n = h - s2 - d3, r = "end");
      break;
    case "top-to-bottom":
      e2 = (h - s2) / 2, i = 0, n = h / 2, r = "middle", c2 ? (o = g, l2 = "alphabetic") : (o = s2 + d3, l2 = "text-before-edge");
      break;
    case "bottom-to-top":
      e2 = (h - s2) / 2, i = g - s2, n = h / 2, r = "middle", c2 ? (o = 0, l2 = "text-before-edge") : (o = g - s2 - d3, l2 = "alphabetic");
  }
  return { symbolX: e2, symbolY: i, labelX: n, labelY: o, labelAnchor: r, labelAlignment: l2 };
};
var W = function(t2) {
  var e2, o = t2.scale, l2 = t2.ticks, a3 = t2.length, c2 = void 0 === a3 ? x.length : a3, s2 = t2.thickness, d3 = void 0 === s2 ? x.thickness : s2, h = t2.direction, g = void 0 === h ? x.direction : h, m = t2.tickPosition, f = void 0 === m ? x.tickPosition : m, v2 = t2.tickSize, u2 = void 0 === v2 ? x.tickSize : v2, p2 = t2.tickSpacing, y2 = void 0 === p2 ? x.tickSpacing : p2, b3 = t2.tickOverlap, k2 = void 0 === b3 ? x.tickOverlap : b3, S2 = t2.tickFormat, A2 = void 0 === S2 ? x.tickFormat : S2, C2 = t2.title, z2 = t2.titleAlign, W2 = void 0 === z2 ? x.titleAlign : z2, w2 = t2.titleOffset, X2 = void 0 === w2 ? x.titleOffset : w2, Y2 = "column" === g ? [].concat(o.domain()).reverse() : o.domain(), O2 = linear().domain(Y2);
  2 === Y2.length ? O2.range([0, c2]) : 3 === Y2.length && O2.range([0, c2 / 2, c2]), e2 = "thresholds" in o ? [Y2[0]].concat(o.thresholds(), [Y2[1]]) : Array.isArray(l2) ? l2 : o.ticks(l2);
  var B2, H2, E2, j, L, M3, P = mr(o, 32), F = fn(A2), T = [], V = 0, D = 0;
  if ("row" === g) {
    var R, q, G;
    B2 = c2, H2 = d3, D = 1;
    var I;
    L = 0, E2 = "start" === W2 ? 0 : "middle" === W2 ? c2 / 2 : c2, "before" === f ? (R = -u2, q = k2 ? d3 : 0, G = -u2 - y2, I = "alphabetic", j = d3 + X2, M3 = "hanging") : (R = k2 ? 0 : d3, G = (q = d3 + u2) + y2, I = "hanging", j = -X2, M3 = "alphabetic"), e2.forEach((function(t3) {
      var e3 = O2(t3);
      T.push({ x1: e3, y1: R, x2: e3, y2: q, text: F(t3), textX: e3, textY: G, textHorizontalAlign: "middle", textVerticalAlign: I });
    }));
  } else {
    var _, J, K, N;
    B2 = d3, H2 = c2, V = 1;
    L = -90, j = "start" === W2 ? c2 : "middle" === W2 ? c2 / 2 : 0, "before" === f ? (J = k2 ? d3 : 0, K = (_ = -u2) - y2, N = "end", E2 = d3 + X2, M3 = "hanging") : (_ = k2 ? 0 : d3, K = (J = d3 + u2) + y2, N = "start", E2 = -X2, M3 = "alphabetic"), e2.forEach((function(t3) {
      var e3 = O2(t3);
      T.push({ x1: _, y1: e3, x2: J, y2: e3, text: F(t3), textX: K, textY: e3, textHorizontalAlign: N, textVerticalAlign: "central" });
    }));
  }
  return { width: B2, height: H2, gradientX1: 0, gradientY1: V, gradientX2: D, gradientY2: 0, colorStops: P, ticks: T, titleText: C2, titleX: E2, titleY: j, titleRotation: L, titleHorizontalAlign: W2, titleVerticalAlign: M3 };
};
var w = function(i) {
  var n = i.scale, o = i.ticks, r = i.length, l2 = void 0 === r ? x.length : r, c2 = i.thickness, s2 = void 0 === c2 ? x.thickness : c2, d3 = i.direction, m = void 0 === d3 ? x.direction : d3, f = i.tickPosition, v2 = void 0 === f ? x.tickPosition : f, u2 = i.tickSize, p2 = void 0 === u2 ? x.tickSize : u2, y2 = i.tickSpacing, b3 = void 0 === y2 ? x.tickSpacing : y2, k2 = i.tickOverlap, S2 = void 0 === k2 ? x.tickOverlap : k2, A2 = i.tickFormat, C2 = void 0 === A2 ? x.tickFormat : A2, z2 = i.title, w2 = i.titleAlign, X2 = void 0 === w2 ? x.titleAlign : w2, Y2 = i.titleOffset, O2 = W({ scale: n, ticks: o, length: l2, thickness: s2, direction: m, tickPosition: v2, tickSize: p2, tickSpacing: b3, tickOverlap: S2, tickFormat: C2, title: z2, titleAlign: X2, titleOffset: void 0 === Y2 ? x.titleOffset : Y2 }), B2 = O2.width, H2 = O2.height, E2 = O2.gradientX1, j = O2.gradientY1, L = O2.gradientX2, M3 = O2.gradientY2, P = O2.ticks, F = O2.colorStops, T = O2.titleText, V = O2.titleX, D = O2.titleY, R = O2.titleRotation, q = O2.titleVerticalAlign, G = O2.titleHorizontalAlign, I = M(), _ = "ContinuousColorsLegendSvgGradient." + m + "." + F.map((function(t2) {
    return t2.stopColor.replace(/[(),\s]/g, "") + "." + t2.offset;
  })).join("_");
  return (0, import_jsx_runtime.jsxs)("g", { children: [(0, import_jsx_runtime.jsx)("defs", { children: (0, import_jsx_runtime.jsx)("linearGradient", { id: _, x1: E2, y1: j, x2: L, y2: M3, children: F.map((function(e2) {
    return (0, import_jsx_runtime.jsx)("stop", { offset: e2.offset, stopColor: e2.stopColor }, e2.key);
  })) }) }), T && (0, import_jsx_runtime.jsx)("text", { transform: "translate(" + V + ", " + D + ") rotate(" + R + ")", textAnchor: G, dominantBaseline: q, style: I.legends.title.text, children: T }), (0, import_jsx_runtime.jsx)("rect", { width: B2, height: H2, fill: "url(#" + _ }), P.map((function(i2, n2) {
    return (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [(0, import_jsx_runtime.jsx)("line", { x1: i2.x1, y1: i2.y1, x2: i2.x2, y2: i2.y2, style: I.legends.ticks.line }), (0, import_jsx_runtime.jsx)(b, { x: i2.textX, y: i2.textY, textAnchor: i2.textHorizontalAlign, dominantBaseline: i2.textVerticalAlign, style: I.legends.ticks.text, children: i2.text })] }, n2);
  }))] });
};
var X = ["containerWidth", "containerHeight", "anchor", "translateX", "translateY", "length", "thickness", "direction"];
var Y = function(e2) {
  var i, n, o = e2.containerWidth, r = e2.containerHeight, l2 = e2.anchor, a3 = e2.translateX, c2 = void 0 === a3 ? 0 : a3, s2 = e2.translateY, d3 = void 0 === s2 ? 0 : s2, h = e2.length, g = void 0 === h ? x.length : h, m = e2.thickness, f = void 0 === m ? x.thickness : m, v2 = e2.direction, u2 = void 0 === v2 ? x.direction : v2, p2 = (function(t2, e3) {
    if (null == t2) return {};
    var i2 = {};
    for (var n2 in t2) if ({}.hasOwnProperty.call(t2, n2)) {
      if (-1 !== e3.indexOf(n2)) continue;
      i2[n2] = t2[n2];
    }
    return i2;
  })(e2, X);
  "row" === u2 ? (i = g, n = f) : (i = f, n = g);
  var y2 = C({ anchor: l2, translateX: c2, translateY: d3, containerWidth: o, containerHeight: r, width: i, height: n }), k2 = y2.x, S2 = y2.y;
  return (0, import_jsx_runtime.jsx)("g", { transform: "translate(" + k2 + ", " + S2 + ")", children: (0, import_jsx_runtime.jsx)(w, b2({ length: g, thickness: f, direction: u2 }, p2)) });
};
var O = { circle: v, diamond: u, square: p, triangle: y };
var B = function(i) {
  var n, o, r, a3, d3, m, f, v2, u2, p2, y2, x2 = i.x, S2 = i.y, A2 = i.width, C2 = i.height, W2 = i.data, w2 = i.direction, X2 = void 0 === w2 ? k.itemDirection : w2, Y2 = i.justify, B2 = void 0 === Y2 ? k.justify : Y2, H2 = i.textColor, E2 = i.background, j = void 0 === E2 ? "transparent" : E2, L = i.opacity, M3 = void 0 === L ? 1 : L, P = i.symbolShape, F = void 0 === P ? k.symbolShape : P, T = i.symbolSize, V = void 0 === T ? k.symbolSize : T, D = i.symbolSpacing, R = void 0 === D ? k.symbolSpacing : D, q = i.symbolBorderWidth, G = void 0 === q ? 0 : q, I = i.symbolBorderColor, _ = void 0 === I ? "transparent" : I, J = i.onClick, K = i.onMouseEnter, N = i.onMouseLeave, Q = i.toggleSerie, U = i.effects, Z = (0, import_react.useState)({}), $ = Z[0], tt = Z[1], et = M(), it = (0, import_react.useCallback)((function(t2) {
    if (U) {
      var e2 = U.filter((function(t3) {
        return "hover" === t3.on;
      })).reduce((function(t3, e3) {
        return b2({}, t3, e3.style);
      }), {});
      tt(e2);
    }
    null == K || K(W2, t2);
  }), [K, W2, U]), nt = (0, import_react.useCallback)((function(t2) {
    if (U) {
      var e2 = U.filter((function(t3) {
        return "hover" !== t3.on;
      })).reduce((function(t3, e3) {
        return b2({}, t3, e3.style);
      }), {});
      tt(e2);
    }
    null == N || N(W2, t2);
  }), [N, W2, U]), ot = z({ direction: X2, justify: B2, symbolSize: null != (n = $.symbolSize) ? n : V, symbolSpacing: R, width: A2, height: C2 }), rt = ot.symbolX, lt = ot.symbolY, at = ot.labelX, ct = ot.labelY, st = ot.labelAnchor, dt = ot.labelAlignment, ht = [J, K, N, Q].some((function(t2) {
    return void 0 !== t2;
  })), gt = "function" == typeof F ? F : O[F];
  return (0, import_jsx_runtime.jsxs)("g", { transform: "translate(" + x2 + "," + S2 + ")", style: { opacity: null != (o = $.itemOpacity) ? o : M3 }, children: [(0, import_jsx_runtime.jsx)("rect", { width: A2, height: C2, fill: null != (r = $.itemBackground) ? r : j, style: { cursor: ht ? "pointer" : "auto" }, onClick: function(t2) {
    null == J || J(W2, t2), null == Q || Q(W2.id);
  }, onMouseEnter: it, onMouseLeave: nt }), l.createElement(gt, b2({ id: W2.id, x: rt, y: lt, size: null != (a3 = $.symbolSize) ? a3 : V, fill: null != (d3 = null != (m = W2.fill) ? m : W2.color) ? d3 : "black", borderWidth: null != (f = $.symbolBorderWidth) ? f : G, borderColor: null != (v2 = $.symbolBorderColor) ? v2 : _ }, W2.hidden ? et.legends.hidden.symbol : void 0)), (0, import_jsx_runtime.jsx)(b, { textAnchor: st, style: b2({}, et.legends.text, { fill: null != (u2 = null != (p2 = null != (y2 = $.itemTextColor) ? y2 : H2) ? p2 : et.legends.text.fill) ? u2 : "black", dominantBaseline: dt, pointerEvents: "none", userSelect: "none" }, W2.hidden ? et.legends.hidden.text : void 0), x: at, y: ct, children: W2.label })] });
};
var H = function(e2) {
  var i = e2.data, n = e2.x, o = e2.y, r = e2.direction, l2 = e2.padding, a3 = void 0 === l2 ? k.padding : l2, c2 = e2.justify, s2 = e2.effects, d3 = e2.itemWidth, h = e2.itemHeight, g = e2.itemDirection, m = void 0 === g ? k.itemDirection : g, f = e2.itemsSpacing, v2 = void 0 === f ? k.itemsSpacing : f, u2 = e2.itemTextColor, p2 = e2.itemBackground, y2 = void 0 === p2 ? "transparent" : p2, b3 = e2.itemOpacity, x2 = void 0 === b3 ? 1 : b3, S2 = e2.symbolShape, C2 = e2.symbolSize, z2 = e2.symbolSpacing, W2 = e2.symbolBorderWidth, w2 = e2.symbolBorderColor, X2 = e2.onClick, Y2 = e2.onMouseEnter, O2 = e2.onMouseLeave, H2 = e2.toggleSerie, E2 = A({ itemCount: i.length, itemWidth: d3, itemHeight: h, itemsSpacing: v2, direction: r, padding: a3 }).padding, j = "row" === r ? d3 + v2 : 0, L = "column" === r ? h + v2 : 0;
  return (0, import_jsx_runtime.jsx)("g", { transform: "translate(" + n + "," + o + ")", children: i.map((function(e3, i2) {
    return (0, import_jsx_runtime.jsx)(B, { data: e3, x: i2 * j + E2.left, y: i2 * L + E2.top, width: d3, height: h, direction: m, justify: c2, effects: s2, textColor: u2, background: y2, opacity: x2, symbolShape: S2, symbolSize: C2, symbolSpacing: z2, symbolBorderWidth: W2, symbolBorderColor: w2, onClick: X2, onMouseEnter: Y2, onMouseLeave: O2, toggleSerie: H2 }, i2);
  })) });
};
var E = function(e2) {
  var i = e2.data, n = e2.containerWidth, o = e2.containerHeight, r = e2.translateX, l2 = void 0 === r ? k.translateX : r, a3 = e2.translateY, c2 = void 0 === a3 ? k.translateY : a3, s2 = e2.anchor, d3 = e2.direction, h = e2.padding, g = void 0 === h ? k.padding : h, m = e2.justify, f = e2.itemsSpacing, v2 = void 0 === f ? k.itemsSpacing : f, u2 = e2.itemWidth, p2 = e2.itemHeight, y2 = e2.itemDirection, b3 = e2.itemTextColor, x2 = e2.itemBackground, S2 = e2.itemOpacity, z2 = e2.symbolShape, W2 = e2.symbolSize, w2 = e2.symbolSpacing, X2 = e2.symbolBorderWidth, Y2 = e2.symbolBorderColor, O2 = e2.onClick, B2 = e2.onMouseEnter, E2 = e2.onMouseLeave, j = e2.toggleSerie, L = e2.effects, M3 = A({ itemCount: i.length, itemsSpacing: v2, itemWidth: u2, itemHeight: p2, direction: d3, padding: g }), P = M3.width, F = M3.height, T = C({ anchor: s2, translateX: l2, translateY: c2, containerWidth: n, containerHeight: o, width: P, height: F }), V = T.x, D = T.y;
  return (0, import_jsx_runtime.jsx)(H, { data: i, x: V, y: D, direction: d3, padding: g, justify: m, effects: L, itemsSpacing: v2, itemWidth: u2, itemHeight: p2, itemDirection: y2, itemTextColor: b3, itemBackground: x2, itemOpacity: S2, symbolShape: z2, symbolSize: W2, symbolSpacing: w2, symbolBorderWidth: X2, symbolBorderColor: Y2, onClick: O2, onMouseEnter: B2, onMouseLeave: E2, toggleSerie: "boolean" == typeof j ? void 0 : j });
};
var M2 = function(t2, e2) {
  var i, n = e2.containerWidth, r = e2.containerHeight, l2 = e2.anchor, a3 = e2.translateX, c2 = void 0 === a3 ? 0 : a3, s2 = e2.translateY, d3 = void 0 === s2 ? 0 : s2, h = e2.scale, g = e2.length, v2 = void 0 === g ? x.length : g, u2 = e2.thickness, p2 = void 0 === u2 ? x.thickness : u2, y2 = e2.direction, b3 = void 0 === y2 ? x.direction : y2, k2 = e2.ticks, S2 = e2.tickPosition, A2 = void 0 === S2 ? x.tickPosition : S2, z2 = e2.tickSize, w2 = void 0 === z2 ? x.tickSize : z2, X2 = e2.tickSpacing, Y2 = void 0 === X2 ? x.tickSpacing : X2, O2 = e2.tickOverlap, B2 = void 0 === O2 ? x.tickOverlap : O2, H2 = e2.tickFormat, E2 = void 0 === H2 ? x.tickFormat : H2, j = e2.title, L = e2.titleAlign, M3 = void 0 === L ? x.titleAlign : L, P = e2.titleOffset, F = void 0 === P ? x.titleOffset : P, T = e2.theme, V = W({ scale: h, ticks: k2, length: v2, thickness: p2, direction: b3, tickPosition: A2, tickSize: w2, tickSpacing: Y2, tickOverlap: B2, tickFormat: E2, title: j, titleAlign: M3, titleOffset: F }), D = V.width, R = V.height, q = V.gradientX1, G = V.gradientY1, I = V.gradientX2, _ = V.gradientY2, J = V.colorStops, K = V.ticks, N = V.titleText, Q = V.titleX, U = V.titleY, Z = V.titleRotation, $ = V.titleVerticalAlign, tt = V.titleHorizontalAlign, et = C({ anchor: l2, translateX: c2, translateY: d3, containerWidth: n, containerHeight: r, width: D, height: R }), it = et.x, nt = et.y, ot = { font: t2.font, textAlign: t2.textAlign, textBaseline: t2.textBaseline };
  t2.save(), t2.translate(it, nt);
  var rt = t2.createLinearGradient(q * D, G * R, I * D, _ * R);
  J.forEach((function(t3) {
    rt.addColorStop(t3.offset, t3.stopColor);
  })), t2.fillStyle = rt, t2.fillRect(0, 0, D, R), a(t2, T.legends.ticks.text);
  var lt = null != (i = T.legends.ticks.line.strokeWidth) ? i : 0, at = "string" != typeof lt && lt > 0;
  K.forEach((function(e3) {
    at && (t2.lineWidth = lt, T.axis.ticks.line.stroke && (t2.strokeStyle = T.axis.ticks.line.stroke), t2.lineCap = "square", t2.beginPath(), t2.moveTo(e3.x1, e3.y1), t2.lineTo(e3.x2, e3.y2), t2.stroke()), t2.textAlign = "middle" === e3.textHorizontalAlign ? "center" : e3.textHorizontalAlign, t2.textBaseline = "central" === e3.textVerticalAlign ? "middle" : e3.textVerticalAlign, d(t2, T.legends.ticks.text, e3.text, e3.textX, e3.textY);
  })), N && (t2.save(), t2.translate(Q, U), t2.rotate(ut(Z)), a(t2, T.legends.title.text), t2.textAlign = "middle" === tt ? "center" : tt, t2.textBaseline = $, d(t2, T.legends.title.text, N), t2.restore()), t2.restore(), t2.font = ot.font, t2.textAlign = ot.textAlign, t2.textBaseline = ot.textBaseline;
};

export {
  require_baseUniq,
  require_uniq,
  Y,
  E,
  M2 as M
};
//# sourceMappingURL=chunk-FT2KIN53.js.map
