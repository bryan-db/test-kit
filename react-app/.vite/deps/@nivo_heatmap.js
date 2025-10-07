import {
  M as M2,
  Y,
  require_baseUniq,
  require_uniq
} from "./chunk-FT2KIN53.js";
import {
  J,
  O,
  R as R2,
  j,
  require_baseEach,
  require_baseIteratee
} from "./chunk-GGKAVXE5.js";
import {
  $r,
  Dr,
  Fr,
  M,
  R,
  Rn,
  Rt,
  T,
  Ye,
  a,
  animated,
  b,
  bn,
  cn,
  d,
  gt,
  hn,
  kn,
  pr,
  require_arrayMap,
  require_baseFlatten,
  require_baseGet,
  require_baseGetTag,
  require_baseRest,
  require_baseUnary,
  require_identity,
  require_isArray,
  require_isArrayLike,
  require_isIterateeCall,
  require_isObjectLike,
  require_isSymbol,
  require_last,
  require_nodeUtil,
  to,
  useSpring,
  useTransition,
  ut,
  w,
  wn,
  z
} from "./chunk-XPGL4N5M.js";
import {
  band,
  format,
  friday,
  hour_default,
  linear,
  millisecond_default,
  minute_default,
  monday,
  month_default,
  newInterval,
  saturday,
  second_default,
  sunday,
  thursday,
  timeFormat,
  tuesday,
  utcFriday,
  utcHour_default,
  utcMinute_default,
  utcMonday,
  utcMonth_default,
  utcSaturday,
  utcSunday,
  utcThursday,
  utcTuesday,
  utcWednesday,
  utcYear_default,
  wednesday,
  year_default
} from "./chunk-HSBUN4UU.js";
import "./chunk-FYGYNQUM.js";
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

// node_modules/lodash/uniqBy.js
var require_uniqBy = __commonJS({
  "node_modules/lodash/uniqBy.js"(exports, module) {
    var baseIteratee = require_baseIteratee();
    var baseUniq = require_baseUniq();
    function uniqBy(array, iteratee) {
      return array && array.length ? baseUniq(array, baseIteratee(iteratee, 2)) : [];
    }
    module.exports = uniqBy;
  }
});

// node_modules/lodash/_baseMap.js
var require_baseMap = __commonJS({
  "node_modules/lodash/_baseMap.js"(exports, module) {
    var baseEach = require_baseEach();
    var isArrayLike = require_isArrayLike();
    function baseMap(collection, iteratee) {
      var index = -1, result = isArrayLike(collection) ? Array(collection.length) : [];
      baseEach(collection, function(value, key, collection2) {
        result[++index] = iteratee(value, key, collection2);
      });
      return result;
    }
    module.exports = baseMap;
  }
});

// node_modules/lodash/_baseSortBy.js
var require_baseSortBy = __commonJS({
  "node_modules/lodash/_baseSortBy.js"(exports, module) {
    function baseSortBy(array, comparer) {
      var length = array.length;
      array.sort(comparer);
      while (length--) {
        array[length] = array[length].value;
      }
      return array;
    }
    module.exports = baseSortBy;
  }
});

// node_modules/lodash/_compareAscending.js
var require_compareAscending = __commonJS({
  "node_modules/lodash/_compareAscending.js"(exports, module) {
    var isSymbol = require_isSymbol();
    function compareAscending(value, other) {
      if (value !== other) {
        var valIsDefined = value !== void 0, valIsNull = value === null, valIsReflexive = value === value, valIsSymbol = isSymbol(value);
        var othIsDefined = other !== void 0, othIsNull = other === null, othIsReflexive = other === other, othIsSymbol = isSymbol(other);
        if (!othIsNull && !othIsSymbol && !valIsSymbol && value > other || valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol || valIsNull && othIsDefined && othIsReflexive || !valIsDefined && othIsReflexive || !valIsReflexive) {
          return 1;
        }
        if (!valIsNull && !valIsSymbol && !othIsSymbol && value < other || othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol || othIsNull && valIsDefined && valIsReflexive || !othIsDefined && valIsReflexive || !othIsReflexive) {
          return -1;
        }
      }
      return 0;
    }
    module.exports = compareAscending;
  }
});

// node_modules/lodash/_compareMultiple.js
var require_compareMultiple = __commonJS({
  "node_modules/lodash/_compareMultiple.js"(exports, module) {
    var compareAscending = require_compareAscending();
    function compareMultiple(object, other, orders) {
      var index = -1, objCriteria = object.criteria, othCriteria = other.criteria, length = objCriteria.length, ordersLength = orders.length;
      while (++index < length) {
        var result = compareAscending(objCriteria[index], othCriteria[index]);
        if (result) {
          if (index >= ordersLength) {
            return result;
          }
          var order = orders[index];
          return result * (order == "desc" ? -1 : 1);
        }
      }
      return object.index - other.index;
    }
    module.exports = compareMultiple;
  }
});

// node_modules/lodash/_baseOrderBy.js
var require_baseOrderBy = __commonJS({
  "node_modules/lodash/_baseOrderBy.js"(exports, module) {
    var arrayMap = require_arrayMap();
    var baseGet = require_baseGet();
    var baseIteratee = require_baseIteratee();
    var baseMap = require_baseMap();
    var baseSortBy = require_baseSortBy();
    var baseUnary = require_baseUnary();
    var compareMultiple = require_compareMultiple();
    var identity = require_identity();
    var isArray = require_isArray();
    function baseOrderBy(collection, iteratees, orders) {
      if (iteratees.length) {
        iteratees = arrayMap(iteratees, function(iteratee) {
          if (isArray(iteratee)) {
            return function(value) {
              return baseGet(value, iteratee.length === 1 ? iteratee[0] : iteratee);
            };
          }
          return iteratee;
        });
      } else {
        iteratees = [identity];
      }
      var index = -1;
      iteratees = arrayMap(iteratees, baseUnary(baseIteratee));
      var result = baseMap(collection, function(value, key, collection2) {
        var criteria = arrayMap(iteratees, function(iteratee) {
          return iteratee(value);
        });
        return { "criteria": criteria, "index": ++index, "value": value };
      });
      return baseSortBy(result, function(object, other) {
        return compareMultiple(object, other, orders);
      });
    }
    module.exports = baseOrderBy;
  }
});

// node_modules/lodash/sortBy.js
var require_sortBy = __commonJS({
  "node_modules/lodash/sortBy.js"(exports, module) {
    var baseFlatten = require_baseFlatten();
    var baseOrderBy = require_baseOrderBy();
    var baseRest = require_baseRest();
    var isIterateeCall = require_isIterateeCall();
    var sortBy = baseRest(function(collection, iteratees) {
      if (collection == null) {
        return [];
      }
      var length = iteratees.length;
      if (length > 1 && isIterateeCall(collection, iteratees[0], iteratees[1])) {
        iteratees = [];
      } else if (length > 2 && isIterateeCall(iteratees[0], iteratees[1], iteratees[2])) {
        iteratees = [iteratees[0]];
      }
      return baseOrderBy(collection, baseFlatten(iteratees, 1), []);
    });
    module.exports = sortBy;
  }
});

// node_modules/lodash/_baseIsDate.js
var require_baseIsDate = __commonJS({
  "node_modules/lodash/_baseIsDate.js"(exports, module) {
    var baseGetTag = require_baseGetTag();
    var isObjectLike = require_isObjectLike();
    var dateTag = "[object Date]";
    function baseIsDate(value) {
      return isObjectLike(value) && baseGetTag(value) == dateTag;
    }
    module.exports = baseIsDate;
  }
});

// node_modules/lodash/isDate.js
var require_isDate = __commonJS({
  "node_modules/lodash/isDate.js"(exports, module) {
    var baseIsDate = require_baseIsDate();
    var baseUnary = require_baseUnary();
    var nodeUtil = require_nodeUtil();
    var nodeIsDate = nodeUtil && nodeUtil.isDate;
    var isDate = nodeIsDate ? baseUnary(nodeIsDate) : baseIsDate;
    module.exports = isDate;
  }
});

// node_modules/@nivo/heatmap/dist/nivo-heatmap.mjs
var import_react2 = __toESM(require_react(), 1);

// node_modules/@nivo/axes/dist/nivo-axes.mjs
var t2 = __toESM(require_react(), 1);
var import_react = __toESM(require_react(), 1);

// node_modules/@nivo/scales/dist/nivo-scales.mjs
var import_uniq = __toESM(require_uniq(), 1);
var import_uniqBy = __toESM(require_uniqBy(), 1);
var import_sortBy = __toESM(require_sortBy(), 1);
var import_last = __toESM(require_last(), 1);
var import_isDate = __toESM(require_isDate(), 1);
var L = [function(n4) {
  return n4.setMilliseconds(0);
}, function(n4) {
  return n4.setSeconds(0);
}, function(n4) {
  return n4.setMinutes(0);
}, function(n4) {
  return n4.setHours(0);
}, function(n4) {
  return n4.setDate(1);
}, function(n4) {
  return n4.setMonth(0);
}];
var Q = { millisecond: [], second: L.slice(0, 1), minute: L.slice(0, 2), hour: L.slice(0, 3), day: L.slice(0, 4), month: L.slice(0, 5), year: L.slice(0, 6) };
var an = function(n4) {
  var t4 = n4;
  return t4.type = "band", t4;
};
var Mn = function(n4) {
  var t4 = n4.bandwidth();
  if (0 === t4) return n4;
  var e4 = t4 / 2;
  return n4.round() && (e4 = Math.round(e4)), function(t5) {
    var r4;
    return (null != (r4 = n4(t5)) ? r4 : 0) + e4;
  };
};
var wn2 = { millisecond: [millisecond_default, millisecond_default], second: [second_default, second_default], minute: [minute_default, utcMinute_default], hour: [hour_default, utcHour_default], day: [newInterval((function(n4) {
  return n4.setHours(0, 0, 0, 0);
}), (function(n4, t4) {
  return n4.setDate(n4.getDate() + t4);
}), (function(n4, t4) {
  return (t4.getTime() - n4.getTime()) / 864e5;
}), (function(n4) {
  return Math.floor(n4.getTime() / 864e5);
})), newInterval((function(n4) {
  return n4.setUTCHours(0, 0, 0, 0);
}), (function(n4, t4) {
  return n4.setUTCDate(n4.getUTCDate() + t4);
}), (function(n4, t4) {
  return (t4.getTime() - n4.getTime()) / 864e5;
}), (function(n4) {
  return Math.floor(n4.getTime() / 864e5);
}))], week: [sunday, utcSunday], sunday: [sunday, utcSunday], monday: [monday, utcMonday], tuesday: [tuesday, utcTuesday], wednesday: [wednesday, utcWednesday], thursday: [thursday, utcThursday], friday: [friday, utcFriday], saturday: [saturday, utcSaturday], month: [month_default, utcMonth_default], year: [year_default, utcYear_default] };
var En = Object.keys(wn2);
var Sn = new RegExp("^every\\s*(\\d+)?\\s*(" + En.join("|") + ")s?$", "i");
var Cn = function(n4, t4) {
  if (Array.isArray(t4)) return t4;
  if ("string" == typeof t4 && "useUTC" in n4) {
    var e4 = t4.match(Sn);
    if (e4) {
      var r4 = e4[1], i4 = e4[2], a3 = wn2[i4][n4.useUTC ? 1 : 0];
      if ("day" === i4) {
        var o2, u, c = n4.domain(), s = c[0], d3 = c[1], m = new Date(d3);
        return m.setDate(m.getDate() + 1), null != (o2 = null == (u = a3.every(Number(null != r4 ? r4 : 1))) ? void 0 : u.range(s, m)) ? o2 : [];
      }
      if (void 0 === r4) return n4.ticks(a3);
      var f = a3.every(Number(r4));
      if (f) return n4.ticks(f);
    }
    throw new Error("Invalid tickValues: " + t4);
  }
  if ("ticks" in n4) {
    if (void 0 === t4) return n4.ticks();
    if ("number" == typeof (l2 = t4) && isFinite(l2) && Math.floor(l2) === l2) return n4.ticks(t4);
  }
  var l2;
  return n4.domain();
};

// node_modules/@nivo/axes/dist/nivo-axes.mjs
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function A() {
  return A = Object.assign ? Object.assign.bind() : function(t4) {
    for (var e4 = 1; e4 < arguments.length; e4++) {
      var i4 = arguments[e4];
      for (var n4 in i4) ({}).hasOwnProperty.call(i4, n4) && (t4[n4] = i4[n4]);
    }
    return t4;
  }, A.apply(null, arguments);
}
var T2 = function(t4) {
  var e4, i4 = t4.axis, n4 = t4.scale, r4 = t4.ticksPosition, o2 = t4.tickValues, l2 = t4.tickSize, c = t4.tickPadding, s = t4.tickRotation, f = t4.truncateTickAt, d3 = t4.engine, u = void 0 === d3 ? "svg" : d3, x = Cn(n4, o2), m = gt[u], y = "bandwidth" in n4 ? Mn(n4) : n4, g = { lineX: 0, lineY: 0 }, v = { textX: 0, textY: 0 }, k = "object" == typeof document && "rtl" === document.dir, b3 = m.align.center, P2 = m.baseline.center;
  "x" === i4 ? (e4 = function(t5) {
    var e5;
    return { x: null != (e5 = y(t5)) ? e5 : 0, y: 0 };
  }, g.lineY = l2 * ("after" === r4 ? 1 : -1), v.textY = (l2 + c) * ("after" === r4 ? 1 : -1), P2 = "after" === r4 ? m.baseline.top : m.baseline.bottom, 0 === s ? b3 = m.align.center : "after" === r4 && s < 0 || "before" === r4 && s > 0 ? (b3 = m.align[k ? "left" : "right"], P2 = m.baseline.center) : ("after" === r4 && s > 0 || "before" === r4 && s < 0) && (b3 = m.align[k ? "right" : "left"], P2 = m.baseline.center)) : (e4 = function(t5) {
    var e5;
    return { x: 0, y: null != (e5 = y(t5)) ? e5 : 0 };
  }, g.lineX = l2 * ("after" === r4 ? 1 : -1), v.textX = (l2 + c) * ("after" === r4 ? 1 : -1), b3 = "after" === r4 ? m.align.left : m.align.right);
  return { ticks: x.map((function(t5) {
    var i5 = "string" == typeof t5 ? (function(t6) {
      var e5 = String(t6).length;
      return f && f > 0 && e5 > f ? "" + String(t6).slice(0, f).concat("...") : "" + t6;
    })(t5) : t5;
    return A({ key: t5 instanceof Date ? "" + t5.valueOf() : "" + t5, value: i5 }, e4(t5), g, v);
  })), textAlign: b3, textBaseline: P2 };
};
var w2 = function(t4, e4) {
  if (void 0 === t4 || "function" == typeof t4) return t4;
  if ("time" === e4.type) {
    var i4 = timeFormat(t4);
    return function(t5) {
      return i4(t5 instanceof Date ? t5 : new Date(t5));
    };
  }
  return format(t4);
};
var O2 = function(t4) {
  var e4, i4 = t4.width, n4 = t4.height, r4 = t4.scale, a3 = t4.axis, o2 = t4.values, l2 = (e4 = o2, Array.isArray(e4) ? o2 : void 0) || Cn(r4, o2), c = "bandwidth" in r4 ? Mn(r4) : r4, s = "x" === a3 ? l2.map((function(t5) {
    var e5, i5;
    return { key: t5 instanceof Date ? "" + t5.valueOf() : "" + t5, x1: null != (e5 = c(t5)) ? e5 : 0, x2: null != (i5 = c(t5)) ? i5 : 0, y1: 0, y2: n4 };
  })) : l2.map((function(t5) {
    var e5, n5;
    return { key: t5 instanceof Date ? "" + t5.valueOf() : "" + t5, x1: 0, x2: i4, y1: null != (e5 = c(t5)) ? e5 : 0, y2: null != (n5 = c(t5)) ? n5 : 0 };
  }));
  return s;
};
var X = (0, import_react.memo)((function(t4) {
  var e4, n4 = t4.value, r4 = t4.format, a3 = t4.lineX, o2 = t4.lineY, l2 = t4.onClick, c = t4.textBaseline, s = t4.textAnchor, f = t4.theme, u = t4.animatedProps, x = null != (e4 = null == r4 ? void 0 : r4(n4)) ? e4 : n4, y = (0, import_react.useMemo)((function() {
    var t5 = { opacity: u.opacity };
    return l2 ? { style: A({}, t5, { cursor: "pointer" }), onClick: function(t6) {
      return l2(t6, x);
    } } : { style: t5 };
  }), [u.opacity, l2, x]);
  return (0, import_jsx_runtime.jsxs)(animated.g, A({ transform: u.transform }, y, { children: [(0, import_jsx_runtime.jsx)("line", { x1: 0, x2: a3, y1: 0, y2: o2, style: f.line }), (0, import_jsx_runtime.jsx)(b, { dominantBaseline: c, textAnchor: s, transform: u.textTransform, style: f.text, children: "" + x })] }));
}));
var Y2 = { tickSize: 5, tickPadding: 5, tickRotation: 0, legendPosition: "middle", legendOffset: 0 };
var B = function(e4) {
  var r4 = e4.axis, a3 = e4.scale, l2 = e4.x, f = void 0 === l2 ? 0 : l2, u = e4.y, x = void 0 === u ? 0 : u, v = e4.length, k = e4.ticksPosition, h = e4.tickValues, p = e4.tickSize, O3 = void 0 === p ? Y2.tickSize : p, B3 = e4.tickPadding, z3 = void 0 === B3 ? Y2.tickPadding : B3, R4 = e4.tickRotation, V3 = void 0 === R4 ? Y2.tickRotation : R4, C2 = e4.format, D2 = e4.renderTick, j3 = void 0 === D2 ? X : D2, E2 = e4.truncateTickAt, W2 = e4.legend, q3 = e4.legendPosition, H = void 0 === q3 ? Y2.legendPosition : q3, I = e4.legendOffset, F = void 0 === I ? Y2.legendOffset : I, G = e4.style, J3 = e4.onClick, K2 = e4.ariaHidden, L2 = M(), M3 = w(L2.axis, G), N2 = (0, import_react.useMemo)((function() {
    return w2(C2, a3);
  }), [C2, a3]), Q3 = T2({ axis: r4, scale: a3, ticksPosition: k, tickValues: h, tickSize: O3, tickPadding: z3, tickRotation: V3, truncateTickAt: E2 }), U2 = Q3.ticks, Z2 = Q3.textAlign, $2 = Q3.textBaseline, _2 = null;
  if (void 0 !== W2) {
    var tt, et = 0, it = 0, nt = 0;
    "y" === r4 ? (nt = -90, et = F, "start" === H ? (tt = "start", it = v) : "middle" === H ? (tt = "middle", it = v / 2) : "end" === H && (tt = "end")) : (it = F, "start" === H ? tt = "start" : "middle" === H ? (tt = "middle", et = v / 2) : "end" === H && (tt = "end", et = v)), _2 = (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: (0, import_jsx_runtime.jsx)(b, { transform: "translate(" + et + ", " + it + ") rotate(" + nt + ")", textAnchor: tt, style: A({}, M3.legend.text, { dominantBaseline: "central" }), children: W2 }) });
  }
  var rt = Dr(), at = rt.animate, ot = rt.config, lt = useSpring({ transform: "translate(" + f + "," + x + ")", lineX2: "x" === r4 ? v : 0, lineY2: "x" === r4 ? 0 : v, config: ot, immediate: !at }), ct = (0, import_react.useCallback)((function(t4) {
    return { opacity: 1, transform: "translate(" + t4.x + "," + t4.y + ")", textTransform: "translate(" + t4.textX + "," + t4.textY + ") rotate(" + V3 + ")" };
  }), [V3]), st = (0, import_react.useCallback)((function(t4) {
    return { opacity: 0, transform: "translate(" + t4.x + "," + t4.y + ")", textTransform: "translate(" + t4.textX + "," + t4.textY + ") rotate(" + V3 + ")" };
  }), [V3]), ft = useTransition(U2, { keys: function(t4) {
    return t4.key;
  }, initial: ct, from: st, enter: ct, update: ct, leave: { opacity: 0 }, config: ot, immediate: !at });
  return (0, import_jsx_runtime.jsxs)(animated.g, { transform: lt.transform, "aria-hidden": K2, children: [ft((function(e5, i4, n4, r5) {
    return t2.createElement(j3, A({ tickIndex: r5, format: N2, rotate: V3, textBaseline: $2, textAnchor: Z2, truncateTickAt: E2, animatedProps: e5, theme: M3.ticks }, i4, J3 ? { onClick: J3 } : {}));
  })), (0, import_jsx_runtime.jsx)(animated.line, { style: M3.domain.line, x1: 0, x2: lt.lineX2, y1: 0, y2: lt.lineY2 }), _2] });
};
var z2 = (0, import_react.memo)(B);
var R3 = ["top", "right", "bottom", "left"];
var V = (0, import_react.memo)((function(t4) {
  var e4 = t4.xScale, i4 = t4.yScale, n4 = t4.width, r4 = t4.height, a3 = { top: t4.top, right: t4.right, bottom: t4.bottom, left: t4.left };
  return (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: R3.map((function(t5) {
    var o2 = a3[t5];
    if (!o2) return null;
    var l2 = "top" === t5 || "bottom" === t5;
    return (0, import_jsx_runtime.jsx)(z2, A({}, o2, { axis: l2 ? "x" : "y", x: "right" === t5 ? n4 : 0, y: "bottom" === t5 ? r4 : 0, scale: l2 ? e4 : i4, length: l2 ? n4 : r4, ticksPosition: "top" === t5 || "left" === t5 ? "before" : "after", truncateTickAt: o2.truncateTickAt }), t5);
  })) });
}));
var C = (0, import_react.memo)((function(t4) {
  var e4 = t4.animatedProps, i4 = M();
  return (0, import_jsx_runtime.jsx)(animated.line, A({}, e4, i4.grid.line));
}));
var D = (0, import_react.memo)((function(t4) {
  var e4 = t4.lines, i4 = Dr(), n4 = i4.animate, a3 = i4.config, l2 = useTransition(e4, { keys: function(t5) {
    return t5.key;
  }, initial: function(t5) {
    return { opacity: 1, x1: t5.x1, x2: t5.x2, y1: t5.y1, y2: t5.y2 };
  }, from: function(t5) {
    return { opacity: 0, x1: t5.x1, x2: t5.x2, y1: t5.y1, y2: t5.y2 };
  }, enter: function(t5) {
    return { opacity: 1, x1: t5.x1, x2: t5.x2, y1: t5.y1, y2: t5.y2 };
  }, update: function(t5) {
    return { opacity: 1, x1: t5.x1, x2: t5.x2, y1: t5.y1, y2: t5.y2 };
  }, leave: { opacity: 0 }, config: a3, immediate: !n4 });
  return (0, import_jsx_runtime.jsx)("g", { children: l2((function(t5, e5) {
    return (0, import_react.createElement)(C, A({}, e5, { key: e5.key, animatedProps: t5 }));
  })) });
}));
var j2 = (0, import_react.memo)((function(t4) {
  var e4 = t4.width, n4 = t4.height, r4 = t4.xScale, a3 = t4.yScale, o2 = t4.xValues, l2 = t4.yValues, c = (0, import_react.useMemo)((function() {
    return !!r4 && O2({ width: e4, height: n4, scale: r4, axis: "x", values: o2 });
  }), [r4, o2, e4, n4]), s = (0, import_react.useMemo)((function() {
    return !!a3 && O2({ width: e4, height: n4, scale: a3, axis: "y", values: l2 });
  }), [n4, e4, a3, l2]);
  return (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [c && (0, import_jsx_runtime.jsx)(D, { lines: c }), s && (0, import_jsx_runtime.jsx)(D, { lines: s })] });
}));
var E = function(t4, e4) {
  var i4, n4, r4 = e4.axis, a3 = e4.scale, o2 = e4.x, c = void 0 === o2 ? 0 : o2, s = e4.y, d3 = void 0 === s ? 0 : s, m = e4.length, y = e4.ticksPosition, g = e4.tickValues, v = e4.tickSize, k = void 0 === v ? Y2.tickSize : v, h = e4.tickPadding, p = void 0 === h ? Y2.tickPadding : h, b3 = e4.tickRotation, P2 = void 0 === b3 ? Y2.tickRotation : b3, S2 = e4.format, A2 = e4.legend, w3 = e4.legendPosition, O3 = void 0 === w3 ? Y2.legendPosition : w3, X2 = e4.legendOffset, B3 = void 0 === X2 ? Y2.legendOffset : X2, z3 = e4.theme, R4 = e4.style, V3 = T2({ axis: r4, scale: a3, ticksPosition: y, tickValues: g, tickSize: k, tickPadding: p, tickRotation: P2, engine: "canvas" }), C2 = V3.ticks, D2 = V3.textAlign, j3 = V3.textBaseline;
  t4.save(), t4.translate(c, d3);
  var E2 = R(z3.axis, R4);
  t4.textAlign = D2, t4.textBaseline = j3, a(t4, E2.ticks.text);
  var W2 = null != (i4 = E2.domain.line.strokeWidth) ? i4 : 0;
  "string" != typeof W2 && W2 > 0 && (t4.lineWidth = W2, t4.lineCap = "square", E2.domain.line.stroke && (t4.strokeStyle = E2.domain.line.stroke), t4.beginPath(), t4.moveTo(0, 0), t4.lineTo("x" === r4 ? m : 0, "x" === r4 ? 0 : m), t4.stroke());
  var q3 = "function" == typeof S2 ? S2 : function(t5) {
    return "" + t5;
  }, H = null != (n4 = E2.ticks.line.strokeWidth) ? n4 : 0, I = "string" != typeof H && H > 0;
  if (C2.forEach((function(e5) {
    I && (t4.lineWidth = H, t4.lineCap = "square", E2.ticks.line.stroke && (t4.strokeStyle = E2.ticks.line.stroke), t4.beginPath(), t4.moveTo(e5.x, e5.y), t4.lineTo(e5.x + e5.lineX, e5.y + e5.lineY), t4.stroke());
    var i5 = q3(e5.value);
    t4.save(), t4.translate(e5.x + e5.textX, e5.y + e5.textY), t4.rotate(ut(P2)), d(t4, E2.ticks.text, "" + i5), t4.fillText("" + i5, 0, 0), t4.restore();
  })), void 0 !== A2) {
    var F = 0, G = 0, J3 = 0, K2 = "center";
    "y" === r4 ? (J3 = -90, F = B3, "start" === O3 ? (K2 = "start", G = m) : "middle" === O3 ? (K2 = "center", G = m / 2) : "end" === O3 && (K2 = "end")) : (G = B3, "start" === O3 ? K2 = "start" : "middle" === O3 ? (K2 = "center", F = m / 2) : "end" === O3 && (K2 = "end", F = m)), t4.translate(F, G), t4.rotate(ut(J3)), a(t4, E2.legend.text), E2.legend.text.fill && (t4.fillStyle = E2.legend.text.fill), t4.textAlign = K2, t4.textBaseline = "middle", d(t4, E2.legend.text, A2);
  }
  t4.restore();
};
var W = function(t4, e4) {
  var i4 = e4.xScale, n4 = e4.yScale, r4 = e4.width, a3 = e4.height, o2 = e4.top, l2 = e4.right, c = e4.bottom, s = e4.left, f = e4.theme, d3 = { top: o2, right: l2, bottom: c, left: s };
  R3.forEach((function(e5) {
    var o3 = d3[e5];
    if (!o3) return null;
    var l3 = "top" === e5 || "bottom" === e5, c2 = "top" === e5 || "left" === e5 ? "before" : "after", s2 = l3 ? i4 : n4, u = w2(o3.format, s2);
    E(t4, A({}, o3, { axis: l3 ? "x" : "y", x: "right" === e5 ? r4 : 0, y: "bottom" === e5 ? a3 : 0, scale: s2, format: u, length: l3 ? r4 : a3, ticksPosition: c2, theme: f }));
  }));
};
var q = function(t4, e4) {
  var i4 = e4.width, n4 = e4.height, r4 = e4.scale, a3 = e4.axis, o2 = e4.values;
  O2({ width: i4, height: n4, scale: r4, axis: a3, values: o2 }).forEach((function(e5) {
    t4.beginPath(), t4.moveTo(e5.x1, e5.y1), t4.lineTo(e5.x2, e5.y2), t4.stroke();
  }));
};

// node_modules/@nivo/heatmap/dist/nivo-heatmap.mjs
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
function _() {
  return _ = Object.assign ? Object.assign.bind() : function(e4) {
    for (var i4 = 1; i4 < arguments.length; i4++) {
      var t4 = arguments[i4];
      for (var o2 in t4) ({}).hasOwnProperty.call(t4, o2) && (e4[o2] = t4[o2]);
    }
    return e4;
  }, _.apply(null, arguments);
}
function J2(e4, i4) {
  if (null == e4) return {};
  var t4 = {};
  for (var o2 in e4) if ({}.hasOwnProperty.call(e4, o2)) {
    if (-1 !== i4.indexOf(o2)) continue;
    t4[o2] = e4[o2];
  }
  return t4;
}
var K = { layers: ["grid", "axes", "cells", "legends", "annotations"], forceSquare: false, xInnerPadding: 0, xOuterPadding: 0, yInnerPadding: 0, yOuterPadding: 0, sizeVariation: false, opacity: 1, activeOpacity: 1, inactiveOpacity: 0.15, borderWidth: 0, borderColor: { from: "color", modifiers: [["darker", 0.8]] }, enableGridX: false, enableGridY: false, enableLabels: true, label: "formattedValue", labelTextColor: { from: "color", modifiers: [["darker", 2]] }, colors: { type: "sequential", scheme: "brown_blueGreen" }, emptyColor: "#000000", legends: [], annotations: [], isInteractive: true, hoverTarget: "rowColumn", tooltip: (0, import_react2.memo)((function(e4) {
  var i4 = e4.cell;
  return null === i4.formattedValue ? null : (0, import_jsx_runtime2.jsx)(T, { id: i4.serieId + " - " + i4.data.x, value: i4.formattedValue, enableChip: true, color: i4.color });
})), animate: true, motionConfig: "gentle" };
var N = _({}, K, { axisTop: {}, axisRight: null, axisBottom: null, axisLeft: {}, borderRadius: 0, cellComponent: "rect" });
var Q2 = _({}, K, { axisTop: {}, axisRight: null, axisBottom: null, axisLeft: {}, renderCell: "rect", pixelRatio: "undefined" != typeof window && window.devicePixelRatio || 1 });
var U = function(e4) {
  var i4 = e4.width, t4 = e4.height, o2 = e4.rows, n4 = e4.columns, r4 = i4, a3 = t4, l2 = 0, d3 = 0;
  if (e4.forceSquare) {
    var c = Math.max(i4 / n4, 0), u = Math.max(t4 / o2, 0), s = Math.min(c, u);
    l2 = (i4 - (r4 = s * n4)) / 2, d3 = (t4 - (a3 = s * o2)) / 2;
  }
  return { offsetX: l2, offsetY: d3, width: r4, height: a3 };
};
var Z = function(e4) {
  var i4 = e4.data, t4 = e4.width, o2 = e4.height, n4 = e4.xInnerPadding, r4 = e4.xOuterPadding, a3 = e4.yInnerPadding, l2 = e4.yOuterPadding, d3 = e4.forceSquare, c = /* @__PURE__ */ new Set(), u = [], s = [], h = [];
  i4.forEach((function(e5) {
    u.push(e5.id), e5.data.forEach((function(i5) {
      c.add(i5.x);
      var t5 = null;
      void 0 !== i5.y && null !== i5.y && (s.push(i5.y), t5 = i5.y), h.push({ id: e5.id + "." + i5.x, serieId: e5.id, value: t5, data: i5 });
    }));
  }));
  var f = Array.from(c), v = U({ width: t4, height: o2, columns: f.length, rows: u.length, forceSquare: d3 }), g = v.width, b3 = v.height, m = v.offsetX, p = v.offsetY, y = an(band().domain(f).range([0, g]).paddingOuter(r4).paddingInner(n4)), x = an(band().domain(u).range([0, b3]).paddingOuter(l2).paddingInner(a3)), C2 = y.bandwidth(), w3 = x.bandwidth(), P2 = h.map((function(e5) {
    return _({}, e5, { x: y(e5.data.x) + C2 / 2, y: x(e5.serieId) + w3 / 2, width: C2, height: w3 });
  }));
  return { width: g, height: b3, offsetX: m, offsetY: p, xScale: y, yScale: x, minValue: Math.min.apply(Math, s), maxValue: Math.max.apply(Math, s), cells: P2 };
};
var $ = function(e4, i4, t4) {
  if (!e4) return function() {
    return 1;
  };
  var o2 = linear().domain(e4.values ? e4.values : [i4, t4]).range(e4.sizes);
  return function(e5) {
    return null === e5 ? 1 : o2(e5);
  };
};
var ee = function(e4) {
  return { x: e4.x, y: e4.y };
};
var ie = function(e4) {
  return { size: Math.max(e4.width, e4.height), width: e4.width, height: e4.height };
};
var te = function(e4) {
  var t4 = e4.data, o2 = e4.width, n4 = e4.height, r4 = e4.xInnerPadding, a3 = e4.xOuterPadding, l2 = e4.yInnerPadding, d3 = e4.yOuterPadding, c = e4.forceSquare;
  return (0, import_react2.useMemo)((function() {
    return Z({ data: t4, width: o2, height: n4, xInnerPadding: r4, xOuterPadding: a3, yInnerPadding: l2, yOuterPadding: d3, forceSquare: c });
  }), [t4, o2, n4, r4, a3, l2, d3, c]);
};
var oe = { cell: function(e4, i4) {
  return e4.id === i4.id;
}, row: function(e4, i4) {
  return e4.serieId === i4.serieId;
}, column: function(e4, i4) {
  return e4.data.x === i4.data.x;
}, rowColumn: function(e4, i4) {
  return e4.serieId === i4.serieId || e4.data.x === i4.data.x;
} };
var ne = function(e4) {
  var t4, n4, r4, a3 = e4.cells, l2 = e4.minValue, d3 = e4.maxValue, s = e4.sizeVariation, h = e4.colors, f = e4.emptyColor, v = e4.opacity, g = e4.activeOpacity, b3 = e4.inactiveOpacity, m = e4.borderColor, p = e4.label, y = e4.labelTextColor, x = e4.valueFormat, C2 = e4.activeIds, w3 = (0, import_react2.useMemo)((function() {
    return $(t4, n4, r4);
  }), [t4 = s, n4 = l2, r4 = d3]), P2 = (0, import_react2.useMemo)((function() {
    return "function" == typeof h ? null : pr(h, { min: l2, max: d3 });
  }), [h, l2, d3]), O3 = (0, import_react2.useCallback)((function(e5) {
    if (null !== e5.value) {
      if ("function" == typeof h) return h(e5);
      if (null !== P2) return P2(e5.value);
    }
    return f;
  }), [h, P2, f]), T3 = M(), W2 = Ye(m, T3), R4 = Ye(y, T3), L2 = hn(x), k = bn(p);
  return { cells: (0, import_react2.useMemo)((function() {
    return a3.map((function(e5) {
      var i4 = v;
      C2.length > 0 && (i4 = C2.includes(e5.id) ? g : b3);
      var t5 = w3(e5.value), o2 = _({}, e5, { width: e5.width * t5, height: e5.height * t5, formattedValue: null !== e5.value ? L2(e5.value) : null, opacity: i4 });
      return o2.label = k(o2), o2.color = O3(o2), o2.borderColor = W2(o2), o2.labelTextColor = R4(o2), o2;
    }));
  }), [a3, w3, O3, W2, R4, L2, k, C2, v, g, b3]), colorScale: P2 };
};
var re = function(e4) {
  var o2 = e4.data, n4 = e4.valueFormat, r4 = e4.width, a3 = e4.height, l2 = e4.xOuterPadding, d3 = void 0 === l2 ? K.xOuterPadding : l2, c = e4.xInnerPadding, u = void 0 === c ? K.xInnerPadding : c, s = e4.yOuterPadding, h = void 0 === s ? K.yOuterPadding : s, f = e4.yInnerPadding, v = void 0 === f ? K.yInnerPadding : f, g = e4.forceSquare, b3 = void 0 === g ? K.forceSquare : g, m = e4.sizeVariation, p = void 0 === m ? K.sizeVariation : m, y = e4.colors, x = void 0 === y ? K.colors : y, C2 = e4.emptyColor, w3 = void 0 === C2 ? K.emptyColor : C2, P2 = e4.opacity, O3 = void 0 === P2 ? K.opacity : P2, I = e4.activeOpacity, M3 = void 0 === I ? K.activeOpacity : I, S2 = e4.inactiveOpacity, T3 = void 0 === S2 ? K.inactiveOpacity : S2, W2 = e4.borderColor, R4 = void 0 === W2 ? K.borderColor : W2, L2 = e4.label, k = void 0 === L2 ? K.label : L2, z3 = e4.labelTextColor, V3 = void 0 === z3 ? K.labelTextColor : z3, B3 = e4.hoverTarget, q3 = void 0 === B3 ? K.hoverTarget : B3, E2 = (0, import_react2.useState)(null), A2 = E2[0], H = E2[1], X2 = te({ data: o2, width: r4, height: a3, xOuterPadding: d3, xInnerPadding: u, yOuterPadding: h, yInnerPadding: v, forceSquare: b3 }), Y3 = X2.width, G = X2.height, F = X2.offsetX, j3 = X2.offsetY, D2 = X2.cells, _2 = X2.xScale, J3 = X2.yScale, N2 = X2.minValue, Q3 = X2.maxValue, U2 = (0, import_react2.useMemo)((function() {
    if (!A2) return [];
    var e5 = oe[q3];
    return D2.filter((function(i4) {
      return e5(i4, A2);
    })).map((function(e6) {
      return e6.id;
    }));
  }), [D2, A2, q3]), Z2 = ne({ cells: D2, minValue: N2, maxValue: Q3, sizeVariation: p, colors: x, emptyColor: w3, opacity: O3, activeOpacity: M3, inactiveOpacity: T3, borderColor: R4, label: k, labelTextColor: V3, valueFormat: n4, activeIds: U2 });
  return { width: Y3, height: G, offsetX: F, offsetY: j3, cells: Z2.cells, xScale: _2, yScale: J3, colorScale: Z2.colorScale, activeCell: A2, setActiveCell: H };
};
var ae = function(e4, i4) {
  return O({ data: e4, annotations: i4, getPosition: ee, getDimensions: ie });
};
var le = (0, import_react2.memo)((function(e4) {
  var t4 = e4.cell, o2 = e4.borderWidth, n4 = e4.borderRadius, r4 = e4.animatedProps, a3 = e4.onMouseEnter, l2 = e4.onMouseMove, d3 = e4.onMouseLeave, c = e4.onClick, u = e4.enableLabels, s = M(), h = (0, import_react2.useMemo)((function() {
    return { onMouseEnter: a3 ? a3(t4) : void 0, onMouseMove: l2 ? l2(t4) : void 0, onMouseLeave: d3 ? d3(t4) : void 0, onClick: c ? c(t4) : void 0 };
  }), [t4, a3, l2, d3, c]);
  return (0, import_jsx_runtime2.jsxs)(animated.g, _({ "data-testid": "cell." + t4.id, style: { cursor: "pointer" }, opacity: r4.opacity }, h, { transform: to([r4.x, r4.y, r4.scale], (function(e5, i4, t5) {
    return "translate(" + e5 + ", " + i4 + ") scale(" + t5 + ")";
  })), children: [(0, import_jsx_runtime2.jsx)(animated.rect, { transform: to([r4.width, r4.height], (function(e5, i4) {
    return "translate(" + -0.5 * e5 + ", " + -0.5 * i4 + ")";
  })), fill: r4.color, width: r4.width, height: r4.height, stroke: r4.borderColor, strokeWidth: o2, rx: n4, ry: n4 }, t4.id), u && (0, import_jsx_runtime2.jsx)(b, { textAnchor: "middle", dominantBaseline: "central", fill: r4.labelTextColor, style: _({}, s.labels.text, { fill: void 0, userSelect: "none" }), children: t4.label })] }));
}));
var de = (0, import_react2.memo)((function(e4) {
  var t4 = e4.cell, o2 = e4.borderWidth, n4 = e4.animatedProps, r4 = e4.onMouseEnter, a3 = e4.onMouseMove, l2 = e4.onMouseLeave, d3 = e4.onClick, c = e4.enableLabels, u = M(), s = (0, import_react2.useMemo)((function() {
    return { onMouseEnter: r4 ? r4(t4) : void 0, onMouseMove: a3 ? a3(t4) : void 0, onMouseLeave: l2 ? l2(t4) : void 0, onClick: d3 ? d3(t4) : void 0 };
  }), [t4, r4, a3, l2, d3]);
  return (0, import_jsx_runtime2.jsxs)(animated.g, _({ "data-testid": "cell." + t4.id, style: { cursor: "pointer" }, opacity: n4.opacity }, s, { transform: to([n4.x, n4.y], (function(e5, i4) {
    return "translate(" + e5 + ", " + i4 + ")";
  })), children: [(0, import_jsx_runtime2.jsx)(animated.circle, { r: to([n4.width, n4.height], (function(e5, i4) {
    return Math.min(e5, i4) / 2;
  })), fill: n4.color, fillOpacity: n4.opacity, strokeWidth: o2, stroke: n4.borderColor }), c && (0, import_jsx_runtime2.jsx)(b, { dominantBaseline: "central", textAnchor: "middle", fill: n4.labelTextColor, style: _({}, u.labels.text, { fill: void 0 }), children: t4.label })] }));
}));
var ce = function(e4) {
  return { x: e4.x, y: e4.y, width: e4.width, height: e4.height, color: e4.color, opacity: 0, borderColor: e4.borderColor, labelTextColor: e4.labelTextColor, scale: 0 };
};
var ue = function(e4) {
  return { x: e4.x, y: e4.y, width: e4.width, height: e4.height, color: e4.color, opacity: e4.opacity, borderColor: e4.borderColor, labelTextColor: e4.labelTextColor, scale: 1 };
};
var se = function(e4) {
  return { x: e4.x, y: e4.y, width: e4.width, height: e4.height, color: e4.color, opacity: 0, borderColor: e4.borderColor, labelTextColor: e4.labelTextColor, scale: 0 };
};
var he = function(e4) {
  var t4, o2 = e4.cells, r4 = e4.cellComponent, a3 = e4.borderRadius, l2 = e4.borderWidth, d3 = e4.isInteractive, c = e4.setActiveCell, u = e4.onMouseEnter, h = e4.onMouseMove, f = e4.onMouseLeave, v = e4.onClick, g = e4.tooltip, b3 = e4.enableLabels, m = Dr(), p = m.animate, y = m.config, x = useTransition(o2, { keys: function(e5) {
    return e5.id;
  }, initial: ue, from: ce, enter: ue, update: ue, leave: se, config: y, immediate: !p }), C2 = z(), w3 = C2.showTooltipFromEvent, P2 = C2.hideTooltip, O3 = (0, import_react2.useMemo)((function() {
    if (d3) return function(e5) {
      return function(i4) {
        w3((0, import_react2.createElement)(g, { cell: e5 }), i4), c(e5), null == u || u(e5, i4);
      };
    };
  }), [d3, w3, g, c, u]), I = (0, import_react2.useMemo)((function() {
    if (d3) return function(e5) {
      return function(i4) {
        w3((0, import_react2.createElement)(g, { cell: e5 }), i4), null == h || h(e5, i4);
      };
    };
  }), [d3, w3, g, h]), M3 = (0, import_react2.useMemo)((function() {
    if (d3) return function(e5) {
      return function(i4) {
        P2(), c(null), null == f || f(e5, i4);
      };
    };
  }), [d3, P2, c, f]), S2 = (0, import_react2.useMemo)((function() {
    if (d3) return function(e5) {
      return function(i4) {
        null == v || v(e5, i4);
      };
    };
  }), [d3, v]);
  return t4 = "rect" === r4 ? le : "circle" === r4 ? de : r4, (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, { children: x((function(e5, i4) {
    return (0, import_react2.createElement)(t4, { cell: i4, borderRadius: a3, borderWidth: l2, animatedProps: e5, enableLabels: b3, onMouseEnter: O3, onMouseMove: I, onMouseLeave: M3, onClick: S2 });
  })) });
};
var fe = function(e4) {
  var i4 = e4.cells, t4 = e4.annotations, o2 = ae(i4, t4);
  return (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, { children: o2.map((function(e5, i5) {
    return (0, import_jsx_runtime2.jsx)(R2, _({}, e5), i5);
  })) });
};
var ve = ["isInteractive", "animate", "motionConfig", "theme", "renderWrapper"];
var ge = function(e4) {
  var t4 = e4.data, o2 = e4.layers, r4 = void 0 === o2 ? N.layers : o2, l2 = e4.valueFormat, d3 = e4.width, c = e4.height, u = e4.margin, s = e4.forceSquare, h = void 0 === s ? N.forceSquare : s, g = e4.xInnerPadding, b3 = void 0 === g ? N.xInnerPadding : g, m = e4.xOuterPadding, p = void 0 === m ? N.xOuterPadding : m, C2 = e4.yInnerPadding, w3 = void 0 === C2 ? N.yInnerPadding : C2, O3 = e4.yOuterPadding, I = void 0 === O3 ? N.yOuterPadding : O3, M3 = e4.sizeVariation, S2 = void 0 === M3 ? N.sizeVariation : M3, T3 = e4.cellComponent, W2 = void 0 === T3 ? N.cellComponent : T3, R4 = e4.opacity, L2 = void 0 === R4 ? N.opacity : R4, k = e4.activeOpacity, z3 = void 0 === k ? N.activeOpacity : k, B3 = e4.inactiveOpacity, q3 = void 0 === B3 ? N.inactiveOpacity : B3, E2 = e4.borderRadius, A2 = void 0 === E2 ? N.borderRadius : E2, H = e4.borderWidth, X2 = void 0 === H ? N.borderWidth : H, Y3 = e4.borderColor, G = void 0 === Y3 ? N.borderColor : Y3, F = e4.enableGridX, j3 = void 0 === F ? N.enableGridX : F, D2 = e4.enableGridY, J3 = void 0 === D2 ? N.enableGridY : D2, K2 = e4.axisTop, Q3 = void 0 === K2 ? N.axisTop : K2, U2 = e4.axisRight, Z2 = void 0 === U2 ? N.axisRight : U2, $2 = e4.axisBottom, ee2 = void 0 === $2 ? N.axisBottom : $2, ie2 = e4.axisLeft, te2 = void 0 === ie2 ? N.axisLeft : ie2, oe2 = e4.enableLabels, ne2 = void 0 === oe2 ? N.enableLabels : oe2, ae2 = e4.label, le2 = void 0 === ae2 ? N.label : ae2, de2 = e4.labelTextColor, ce2 = void 0 === de2 ? N.labelTextColor : de2, ue2 = e4.colors, se2 = void 0 === ue2 ? N.colors : ue2, ve2 = e4.emptyColor, ge2 = void 0 === ve2 ? N.emptyColor : ve2, be2 = e4.legends, me2 = void 0 === be2 ? N.legends : be2, pe2 = e4.annotations, ye2 = void 0 === pe2 ? N.annotations : pe2, xe2 = e4.isInteractive, Ce2 = void 0 === xe2 ? N.isInteractive : xe2, we2 = e4.onMouseEnter, Pe2 = e4.onMouseMove, Oe2 = e4.onMouseLeave, Ie2 = e4.onClick, Me = e4.hoverTarget, Se = void 0 === Me ? N.hoverTarget : Me, Te = e4.tooltip, We = void 0 === Te ? N.tooltip : Te, Re = e4.role, Le = e4.ariaLabel, ke = e4.ariaLabelledBy, ze = e4.ariaDescribedBy, Ve = e4.forwardedRef, Be = cn(d3, c, u), qe = Be.margin, Ee = Be.innerWidth, Ae = Be.innerHeight, He = Be.outerWidth, Xe = Be.outerHeight, Ye2 = re({ data: t4, valueFormat: l2, width: Ee, height: Ae, forceSquare: h, xInnerPadding: b3, xOuterPadding: p, yInnerPadding: w3, yOuterPadding: I, sizeVariation: S2, colors: se2, emptyColor: ge2, opacity: L2, activeOpacity: z3, inactiveOpacity: q3, borderColor: G, label: le2, labelTextColor: ce2, hoverTarget: Se }), Ge = Ye2.width, Fe = Ye2.height, je = Ye2.offsetX, De = Ye2.offsetY, _e = Ye2.xScale, Je = Ye2.yScale, Ke = Ye2.cells, Ne = Ye2.colorScale, Qe = Ye2.activeCell, Ue = Ye2.setActiveCell, Ze = (0, import_react2.useMemo)((function() {
    return _({}, qe, { top: qe.top + De, left: qe.left + je });
  }), [qe, je, De]), $e = { grid: null, axes: null, cells: null, legends: null, annotations: null };
  r4.includes("grid") && ($e.grid = (0, import_jsx_runtime2.jsx)(j2, { width: Ge, height: Fe, xScale: j3 ? _e : null, yScale: J3 ? Je : null }, "grid")), r4.includes("axes") && ($e.axes = (0, import_jsx_runtime2.jsx)(V, { xScale: _e, yScale: Je, width: Ge, height: Fe, top: Q3, right: Z2, bottom: ee2, left: te2 }, "axes")), r4.includes("cells") && ($e.cells = (0, import_jsx_runtime2.jsx)(import_react2.Fragment, { children: (0, import_jsx_runtime2.jsx)(he, { cells: Ke, cellComponent: W2, borderRadius: A2, borderWidth: X2, isInteractive: Ce2, setActiveCell: Ue, onMouseEnter: we2, onMouseMove: Pe2, onMouseLeave: Oe2, onClick: Ie2, tooltip: We, enableLabels: ne2 }) }, "cells")), r4.includes("legends") && null !== Ne && ($e.legends = (0, import_jsx_runtime2.jsx)(import_react2.Fragment, { children: me2.map((function(e5, i4) {
    return (0, import_react2.createElement)(Y, _({}, e5, { key: i4, containerWidth: Ge, containerHeight: Fe, scale: Ne }));
  })) }, "legends")), r4.includes("annotations") && ye2.length > 0 && ($e.annotations = (0, import_jsx_runtime2.jsx)(fe, { cells: Ke, annotations: ye2 }, "annotations"));
  var ei = { cells: Ke, activeCell: Qe, setActiveCell: Ue };
  return (0, import_jsx_runtime2.jsx)(Rt, { width: He, height: Xe, margin: Object.assign({}, Ze, { top: Ze.top, left: Ze.left }), role: Re, ariaLabel: Le, ariaLabelledBy: ke, ariaDescribedBy: ze, ref: Ve, children: r4.map((function(e5, i4) {
    var t5;
    return "function" == typeof e5 ? (0, import_jsx_runtime2.jsx)(import_react2.Fragment, { children: (0, import_react2.createElement)(e5, ei) }, i4) : null != (t5 = null == $e ? void 0 : $e[e5]) ? t5 : null;
  })) });
};
var be = (0, import_react2.forwardRef)((function(e4, i4) {
  var t4 = e4.isInteractive, o2 = void 0 === t4 ? N.isInteractive : t4, n4 = e4.animate, r4 = void 0 === n4 ? N.animate : n4, a3 = e4.motionConfig, l2 = void 0 === a3 ? N.motionConfig : a3, d3 = e4.theme, c = e4.renderWrapper, u = J2(e4, ve);
  return (0, import_jsx_runtime2.jsx)(Fr, { animate: r4, isInteractive: o2, motionConfig: l2, renderWrapper: c, theme: d3, children: (0, import_jsx_runtime2.jsx)(ge, _({ isInteractive: o2 }, u, { forwardedRef: i4 })) });
}));
var me = ["defaultWidth", "defaultHeight", "onResize", "debounceResize"];
var pe = (0, import_react2.forwardRef)((function(e4, i4) {
  var t4 = e4.defaultWidth, o2 = e4.defaultHeight, n4 = e4.onResize, r4 = e4.debounceResize, a3 = J2(e4, me);
  return (0, import_jsx_runtime2.jsx)($r, { defaultWidth: t4, defaultHeight: o2, onResize: n4, debounceResize: r4, children: function(e5) {
    var t5 = e5.width, o3 = e5.height;
    return (0, import_jsx_runtime2.jsx)(be, _({ width: t5, height: o3 }, a3, { ref: i4 }));
  } });
}));
var ye = function(e4, i4) {
  var t4 = i4.cell, o2 = t4.x, n4 = t4.y, r4 = t4.width, a3 = t4.height, l2 = t4.color, d3 = t4.borderColor, c = t4.opacity, u = t4.labelTextColor, s = t4.label, h = i4.borderWidth, f = i4.enableLabels, v = i4.theme;
  e4.save(), e4.globalAlpha = c, e4.fillStyle = l2, h > 0 && (e4.strokeStyle = d3, e4.lineWidth = h), e4.fillRect(o2 - r4 / 2, n4 - a3 / 2, r4, a3), h > 0 && e4.strokeRect(o2 - r4 / 2, n4 - a3 / 2, r4, a3), f && (a(e4, v.labels.text), e4.textAlign = "center", e4.textBaseline = "middle", d(e4, _({}, v.labels.text, { fill: u }), s, o2, n4)), e4.restore();
};
var xe = function(e4, i4) {
  var t4 = i4.cell, o2 = t4.x, n4 = t4.y, r4 = t4.width, a3 = t4.height, l2 = t4.color, d3 = t4.borderColor, c = t4.opacity, u = t4.labelTextColor, s = t4.label, h = i4.borderWidth, f = i4.enableLabels, v = i4.theme;
  e4.save(), e4.globalAlpha = c;
  var g = Math.min(r4, a3) / 2;
  e4.fillStyle = l2, h > 0 && (e4.strokeStyle = d3, e4.lineWidth = h), e4.beginPath(), e4.arc(o2, n4, g, 0, 2 * Math.PI), e4.fill(), h > 0 && e4.stroke(), f && (a(e4, v.labels.text), e4.textAlign = "center", e4.textBaseline = "middle", d(e4, _({}, v.labels.text, { fill: u }), s, o2, n4)), e4.restore();
};
var Ce = ["theme", "isInteractive", "animate", "motionConfig", "renderWrapper"];
var we = function(e4) {
  var t4, r4 = e4.data, a3 = e4.layers, c = void 0 === a3 ? Q2.layers : a3, u = e4.valueFormat, s = e4.width, h = e4.height, v = e4.margin, g = e4.xInnerPadding, y = void 0 === g ? Q2.xInnerPadding : g, x = e4.xOuterPadding, P2 = void 0 === x ? Q2.xOuterPadding : x, M3 = e4.yInnerPadding, S2 = void 0 === M3 ? Q2.yInnerPadding : M3, T3 = e4.yOuterPadding, W2 = void 0 === T3 ? Q2.yOuterPadding : T3, k = e4.forceSquare, B3 = void 0 === k ? Q2.forceSquare : k, q3 = e4.sizeVariation, E2 = void 0 === q3 ? Q2.sizeVariation : q3, A2 = e4.renderCell, H = void 0 === A2 ? Q2.renderCell : A2, X2 = e4.opacity, Y3 = void 0 === X2 ? Q2.opacity : X2, G = e4.activeOpacity, F = void 0 === G ? Q2.activeOpacity : G, j3 = e4.inactiveOpacity, D2 = void 0 === j3 ? Q2.inactiveOpacity : j3, J3 = e4.borderWidth, K2 = void 0 === J3 ? Q2.borderWidth : J3, N2 = e4.borderColor, U2 = void 0 === N2 ? Q2.borderColor : N2, Z2 = e4.enableGridX, $2 = void 0 === Z2 ? Q2.enableGridX : Z2, ee2 = e4.enableGridY, ie2 = void 0 === ee2 ? Q2.enableGridY : ee2, te2 = e4.axisTop, oe2 = void 0 === te2 ? Q2.axisTop : te2, ne2 = e4.axisRight, le2 = void 0 === ne2 ? Q2.axisRight : ne2, de2 = e4.axisBottom, ce2 = void 0 === de2 ? Q2.axisBottom : de2, ue2 = e4.axisLeft, se2 = void 0 === ue2 ? Q2.axisLeft : ue2, he2 = e4.enableLabels, fe2 = void 0 === he2 ? Q2.enableLabels : he2, ve2 = e4.label, ge2 = void 0 === ve2 ? Q2.label : ve2, be2 = e4.labelTextColor, me2 = void 0 === be2 ? Q2.labelTextColor : be2, pe2 = e4.colors, Ce2 = void 0 === pe2 ? Q2.colors : pe2, we2 = e4.emptyColor, Pe2 = void 0 === we2 ? Q2.emptyColor : we2, Oe2 = e4.legends, Ie2 = void 0 === Oe2 ? Q2.legends : Oe2, Me = e4.annotations, Se = void 0 === Me ? Q2.annotations : Me, Te = e4.isInteractive, We = void 0 === Te ? Q2.isInteractive : Te, Re = e4.onClick, Le = e4.hoverTarget, ke = void 0 === Le ? Q2.hoverTarget : Le, ze = e4.tooltip, Ve = void 0 === ze ? Q2.tooltip : ze, Be = e4.role, qe = e4.ariaLabel, Ee = e4.ariaLabelledBy, Ae = e4.ariaDescribedBy, He = e4.pixelRatio, Xe = void 0 === He ? Q2.pixelRatio : He, Ye2 = e4.forwardedRef, Ge = (0, import_react2.useRef)(null), Fe = cn(s, h, v), je = Fe.margin, De = Fe.innerWidth, _e = Fe.innerHeight, Je = Fe.outerWidth, Ke = Fe.outerHeight, Ne = re({ data: r4, valueFormat: u, width: De, height: _e, xInnerPadding: y, xOuterPadding: P2, yInnerPadding: S2, yOuterPadding: W2, forceSquare: B3, sizeVariation: E2, colors: Ce2, emptyColor: Pe2, opacity: Y3, activeOpacity: F, inactiveOpacity: D2, borderColor: U2, label: ge2, labelTextColor: me2, hoverTarget: ke }), Qe = Ne.width, Ue = Ne.height, Ze = Ne.offsetX, $e = Ne.offsetY, ei = Ne.xScale, ii = Ne.yScale, ti = Ne.cells, oi = Ne.colorScale, ni = Ne.activeCell, ri = Ne.setActiveCell, ai = (0, import_react2.useMemo)((function() {
    return _({}, je, { top: je.top + $e, left: je.left + Ze });
  }), [je, Ze, $e]), li = ae(ti, Se), di = j({ annotations: li });
  t4 = "function" == typeof H ? H : "circle" === H ? xe : ye;
  var ci = M(), ui = (0, import_react2.useMemo)((function() {
    return { cells: ti, activeCell: ni, setActiveCell: ri };
  }), [ti, ni, ri]);
  (0, import_react2.useEffect)((function() {
    if (null !== Ge.current) {
      var e5 = Ge.current.getContext("2d");
      e5 && (Ge.current.width = Je * Xe, Ge.current.height = Ke * Xe, e5.scale(Xe, Xe), e5.fillStyle = ci.background, e5.fillRect(0, 0, Je, Ke), e5.translate(ai.left, ai.top), c.forEach((function(i4) {
        "grid" === i4 ? (e5.lineWidth = ci.grid.line.strokeWidth, e5.strokeStyle = ci.grid.line.stroke, $2 && q(e5, { width: Qe, height: Ue, scale: ei, axis: "x" }), ie2 && q(e5, { width: Qe, height: Ue, scale: ii, axis: "y" })) : "axes" === i4 ? W(e5, { xScale: ei, yScale: ii, width: Qe, height: Ue, top: oe2, right: le2, bottom: ce2, left: se2, theme: ci }) : "cells" === i4 ? (e5.textAlign = "center", e5.textBaseline = "middle", ti.forEach((function(i5) {
          t4(e5, { cell: i5, borderWidth: K2, enableLabels: fe2, theme: ci });
        }))) : "legends" === i4 && null !== oi ? Ie2.forEach((function(i5) {
          M2(e5, _({}, i5, { containerWidth: Qe, containerHeight: Ue, scale: oi, theme: ci }));
        })) : "annotations" === i4 ? J(e5, { annotations: di, theme: ci }) : "function" == typeof i4 && i4(e5, ui);
      })));
    }
  }), [Ge, Xe, Je, Ke, Qe, Ue, ai, c, ui, ti, t4, $2, ie2, oe2, le2, ce2, se2, ei, ii, ci, K2, fe2, oi, Ie2, di]);
  var si = z(), hi = si.showTooltipFromEvent, fi = si.hideTooltip, vi = (0, import_react2.useCallback)((function(e5) {
    if (null !== Ge.current) {
      var i4 = kn(Ge.current, e5), t5 = i4[0], o2 = i4[1], r5 = ti.find((function(e6) {
        return wn(e6.x + ai.left - e6.width / 2, e6.y + ai.top - e6.height / 2, e6.width, e6.height, t5, o2);
      }));
      void 0 !== r5 ? (ri(r5), hi((0, import_react2.createElement)(Ve, { cell: r5 }), e5)) : (ri(null), fi());
    }
  }), [Ge, ti, ai, ri, hi, fi, Ve]), gi = (0, import_react2.useCallback)((function() {
    ri(null), fi();
  }), [ri, fi]), bi = (0, import_react2.useCallback)((function(e5) {
    null !== ni && (null == Re || Re(ni, e5));
  }), [ni, Re]);
  return (0, import_jsx_runtime2.jsx)("canvas", { ref: Rn(Ge, Ye2), width: Je * Xe, height: Ke * Xe, style: { width: Je, height: Ke }, onMouseEnter: We ? vi : void 0, onMouseMove: We ? vi : void 0, onMouseLeave: We ? gi : void 0, onClick: We ? bi : void 0, role: Be, "aria-label": qe, "aria-labelledby": Ee, "aria-describedby": Ae });
};
var Pe = (0, import_react2.forwardRef)((function(e4, i4) {
  var t4 = e4.theme, o2 = e4.isInteractive, n4 = void 0 === o2 ? Q2.isInteractive : o2, r4 = e4.animate, a3 = void 0 === r4 ? Q2.animate : r4, l2 = e4.motionConfig, d3 = void 0 === l2 ? Q2.motionConfig : l2, c = e4.renderWrapper, u = J2(e4, Ce);
  return (0, import_jsx_runtime2.jsx)(Fr, { isInteractive: n4, animate: a3, motionConfig: d3, theme: t4, renderWrapper: c, children: (0, import_jsx_runtime2.jsx)(we, _({ isInteractive: n4 }, u, { forwardedRef: i4 })) });
}));
var Oe = ["defaultWidth", "defaultHeight", "onResize", "debounceResize"];
var Ie = (0, import_react2.forwardRef)((function(e4, i4) {
  var t4 = e4.defaultWidth, o2 = e4.defaultHeight, n4 = e4.onResize, r4 = e4.debounceResize, a3 = J2(e4, Oe);
  return (0, import_jsx_runtime2.jsx)($r, { defaultWidth: t4, defaultHeight: o2, onResize: n4, debounceResize: r4, children: function(e5) {
    var t5 = e5.width, o3 = e5.height;
    return (0, import_jsx_runtime2.jsx)(Pe, _({ width: t5, height: o3 }, a3, { ref: i4 }));
  } });
}));
export {
  be as HeatMap,
  Pe as HeatMapCanvas,
  pe as ResponsiveHeatMap,
  Ie as ResponsiveHeatMapCanvas,
  Q2 as canvasDefaultProps,
  K as commonDefaultProps,
  Z as computeCells,
  U as computeLayout,
  $ as computeSizeScale,
  ie as getCellAnnotationDimensions,
  ee as getCellAnnotationPosition,
  N as svgDefaultProps,
  ae as useCellAnnotations,
  te as useComputeCells,
  re as useHeatMap
};
//# sourceMappingURL=@nivo_heatmap.js.map
