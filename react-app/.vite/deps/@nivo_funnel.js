import {
  O,
  R
} from "./chunk-GGKAVXE5.js";
import {
  $r,
  Dr,
  Fr,
  It,
  M,
  Rt,
  T,
  Ye,
  Yr,
  animated,
  b,
  cn,
  hn,
  hr,
  require_get,
  require_isPlainObject,
  useSpring,
  z
} from "./chunk-XPGL4N5M.js";
import {
  area_default,
  basis_default,
  line_default,
  linear,
  linear_default,
  ordinal
} from "./chunk-HSBUN4UU.js";
import "./chunk-FYGYNQUM.js";
import {
  require_jsx_runtime
} from "./chunk-EO7JTZSA.js";
import {
  require_react
} from "./chunk-32EALFBN.js";
import {
  __toESM
} from "./chunk-G3PMV62Z.js";

// node_modules/@nivo/funnel/dist/nivo-funnel.mjs
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var import_isPlainObject = __toESM(require_isPlainObject(), 1);
var import_get = __toESM(require_get(), 1);
function k() {
  return k = Object.assign ? Object.assign.bind() : function(r2) {
    for (var e2 = 1; e2 < arguments.length; e2++) {
      var t2 = arguments[e2];
      for (var o2 in t2) ({}).hasOwnProperty.call(t2, o2) && (r2[o2] = t2[o2]);
    }
    return r2;
  }, k.apply(null, arguments);
}
function A(r2, e2) {
  if (null == r2) return {};
  var t2 = {};
  for (var o2 in r2) if ({}.hasOwnProperty.call(r2, o2)) {
    if (-1 !== e2.indexOf(o2)) continue;
    t2[o2] = r2[o2];
  }
  return t2;
}
var R2 = { layers: ["separators", "parts", "labels", "annotations"], direction: "vertical", interpolation: "smooth", spacing: 0, shapeBlending: 0.66, colors: { scheme: "nivo" }, size: void 0, fillOpacity: 1, borderWidth: 6, borderColor: { from: "color" }, borderOpacity: 0.66, enableLabel: true, labelColor: { theme: "background" }, enableBeforeSeparators: true, beforeSeparatorLength: 0, beforeSeparatorOffset: 0, enableAfterSeparators: true, afterSeparatorLength: 0, afterSeparatorOffset: 0, annotations: [], isInteractive: true, currentPartSizeExtension: 0, role: "img", animate: Yr.animate, motionConfig: Yr.config };
var j = function(r2) {
  var e2 = r2.part;
  return (0, import_jsx_runtime.jsx)(T, { id: e2.data.label, value: e2.formattedValue, color: e2.color, enableChip: true });
};
var F = function(r2, e2) {
  var t2 = area_default();
  return "vertical" === e2 ? t2.curve("smooth" === r2 ? basis_default : linear_default).x0((function(r3) {
    return r3.x0;
  })).x1((function(r3) {
    return r3.x1;
  })).y((function(r3) {
    return r3.y;
  })) : t2.curve("smooth" === r2 ? basis_default : linear_default).y0((function(r3) {
    return r3.y0;
  })).y1((function(r3) {
    return r3.y1;
  })).x((function(r3) {
    return r3.x;
  })), [t2, line_default().defined((function(r3) {
    return null !== r3;
  })).x((function(r3) {
    return r3.x;
  })).y((function(r3) {
    return r3.y;
  })).curve("smooth" === r2 ? basis_default : linear_default)];
};
var T2 = function(r2) {
  var e2, t2, o2 = r2.data, n2 = r2.direction, a = r2.width, i = r2.height, s = r2.spacing;
  "vertical" === n2 ? (e2 = i, t2 = a) : (e2 = a, t2 = i);
  var l = (e2 - s * (o2.length - 1)) / o2.length, p = function(r3) {
    return s * r3 + l * r3;
  };
  p.bandwidth = l;
  var d = o2.map((function(r3) {
    return r3.value;
  }));
  return [p, linear().domain([0, Math.max.apply(Math, d)]).range([0, t2])];
};
var H = function(r2) {
  var e2 = r2.parts, t2 = r2.direction, o2 = r2.width, n2 = r2.height, a = r2.spacing, i = r2.enableBeforeSeparators, s = r2.beforeSeparatorOffset, l = r2.enableAfterSeparators, p = r2.afterSeparatorOffset, d = [], u = [], f = e2[e2.length - 1];
  if ("vertical" === t2) {
    e2.forEach((function(r3) {
      var e3 = r3.y0 - a / 2;
      i && d.push({ partId: r3.data.id, x0: 0, x1: r3.x0 - s, y0: e3, y1: e3 }), l && u.push({ partId: r3.data.id, x0: r3.x1 + p, x1: o2, y0: e3, y1: e3 });
    }));
    var c = f.y1;
    i && d.push(k({}, d[d.length - 1], { partId: "none", y0: c, y1: c })), l && u.push(k({}, u[u.length - 1], { partId: "none", y0: c, y1: c }));
  } else if ("horizontal" === t2) {
    e2.forEach((function(r3) {
      var e3 = r3.x0 - a / 2;
      d.push({ partId: r3.data.id, x0: e3, x1: e3, y0: 0, y1: r3.y0 - s }), u.push({ partId: r3.data.id, x0: e3, x1: e3, y0: r3.y1 + p, y1: n2 });
    }));
    var h = f.x1;
    d.push(k({}, d[d.length - 1], { partId: "none", x0: h, x1: h })), u.push(k({}, u[u.length - 1], { partId: "none", x0: h, x1: h }));
  }
  return [d, u];
};
var D = function(r2) {
  var e2 = r2.parts, o2 = r2.setCurrentPartId, n2 = r2.isInteractive, a = r2.onMouseEnter, i = r2.onMouseLeave, s = r2.onMouseMove, l = r2.onClick, p = r2.showTooltipFromEvent, d = r2.hideTooltip, u = r2.tooltip, f = void 0 === u ? j : u;
  return n2 ? e2.map((function(r3) {
    return k({}, r3, { onMouseEnter: function(e3) {
      o2(r3.data.id), p((0, import_react.createElement)(f, { part: r3 }), e3), null == a || a(r3, e3);
    }, onMouseLeave: function(e3) {
      o2(null), d(), null == i || i(r3, e3);
    }, onMouseMove: function(e3) {
      p((0, import_react.createElement)(f, { part: r3 }), e3), null == s || s(r3, e3);
    }, onClick: void 0 !== l ? function(e3) {
      l(r3, e3);
    } : void 0 });
  })) : e2;
};
var V = function(r2, e2) {
  if ("function" == typeof r2) return r2;
  if (Array.isArray(r2)) {
    var t2 = ordinal(r2);
    return function(r3) {
      return Number(t2(String(r3.id)));
    };
  }
  if ((0, import_isPlainObject.default)(r2)) {
    if ((function(r3) {
      return void 0 !== r3.datum;
    })(r2)) return function(e3) {
      var t3 = (0, import_get.default)(e3, r2.datum);
      return "number" == typeof t3 ? t3 : 0;
    };
    throw new Error("Invalid size, when using an object, you should specify a 'datum' property");
  }
  return function(r3) {
    return e2(r3.value);
  };
};
var N = function(e2, t2) {
  return (0, import_react.useMemo)((function() {
    return V(e2, t2);
  }), [e2, t2]);
};
var q = function(t2) {
  var o2, n2, a = t2.data, s = t2.width, l = t2.height, p = t2.direction, d = void 0 === p ? R2.direction : p, u = t2.interpolation, f = void 0 === u ? R2.interpolation : u, c = t2.spacing, h = void 0 === c ? R2.spacing : c, v = t2.shapeBlending, y = void 0 === v ? R2.shapeBlending : v, b2 = t2.valueFormat, x = t2.colors, P = void 0 === x ? R2.colors : x, C = t2.size, O2 = void 0 === C ? R2.size : C, w2 = t2.fillOpacity, I2 = void 0 === w2 ? R2.fillOpacity : w2, L2 = t2.borderWidth, W2 = void 0 === L2 ? R2.borderWidth : L2, B2 = t2.borderColor, E = void 0 === B2 ? R2.borderColor : B2, z2 = t2.borderOpacity, G = void 0 === z2 ? R2.borderOpacity : z2, A2 = t2.labelColor, j2 = void 0 === A2 ? R2.labelColor : A2, V2 = t2.enableBeforeSeparators, q2 = void 0 === V2 ? R2.enableBeforeSeparators : V2, J2 = t2.beforeSeparatorLength, K2 = void 0 === J2 ? R2.beforeSeparatorLength : J2, Q2 = t2.beforeSeparatorOffset, U2 = void 0 === Q2 ? R2.beforeSeparatorOffset : Q2, X2 = t2.enableAfterSeparators, Y2 = void 0 === X2 ? R2.enableAfterSeparators : X2, Z2 = t2.afterSeparatorLength, $2 = void 0 === Z2 ? R2.afterSeparatorLength : Z2, _2 = t2.afterSeparatorOffset, rr2 = void 0 === _2 ? R2.afterSeparatorOffset : _2, er2 = t2.isInteractive, tr2 = void 0 === er2 ? R2.isInteractive : er2, or2 = t2.currentPartSizeExtension, nr = void 0 === or2 ? R2.currentPartSizeExtension : or2, ar = t2.currentBorderWidth, ir = t2.onMouseEnter, sr = t2.onMouseMove, lr = t2.onMouseLeave, pr = t2.onClick, dr = t2.tooltip, ur = M(), fr = hr(P, "id"), cr = Ye(E, ur), hr2 = Ye(j2, ur), vr = hn(b2), yr = (0, import_react.useMemo)((function() {
    return F(f, d);
  }), [f, d]), br = yr[0], xr = yr[1], mr = q2 ? K2 + U2 : 0, gr = Y2 ? $2 + rr2 : 0;
  "vertical" === d ? (o2 = s - mr - gr, n2 = l) : (o2 = s, n2 = l - mr - gr);
  var Sr = (0, import_react.useMemo)((function() {
    return T2({ data: a, direction: d, width: o2, height: n2, spacing: h });
  }), [a, d, o2, n2, h]), Pr = Sr[0], Cr = Sr[1], Or = N(O2, Cr), Mr = (0, import_react.useState)(null), wr = Mr[0], Ir = Mr[1], Lr = (0, import_react.useMemo)((function() {
    var r2 = a.map((function(r3, e3) {
      var t3, a2, i, s2, l2 = r3.id === wr, p2 = Or(r3);
      "vertical" === d ? (t3 = p2, a2 = Pr.bandwidth, s2 = mr + 0.5 * (o2 - t3), i = Pr(e3)) : (t3 = Pr.bandwidth, a2 = p2, s2 = Pr(e3), i = mr + 0.5 * (n2 - a2));
      var u2 = s2 + t3, f2 = s2 + 0.5 * t3, c2 = i + a2, h2 = i + 0.5 * a2, v2 = { data: r3, width: t3, height: a2, color: fr(r3), fillOpacity: I2, borderWidth: l2 && void 0 !== ar ? ar : W2, borderOpacity: G, formattedValue: vr(r3.value), isCurrent: l2, x: f2, x0: s2, x1: u2, y: h2, y0: i, y1: c2, borderColor: "", labelColor: "", points: [], areaPoints: [], borderPoints: [] };
      return v2.borderColor = cr(v2), v2.labelColor = hr2(v2), v2;
    })), e2 = y / 2;
    return r2.forEach((function(t3, o3) {
      var n3 = r2[o3 + 1];
      if ("vertical" === d) {
        t3.points.push({ x: t3.x0, y: t3.y0 }), t3.points.push({ x: t3.x1, y: t3.y0 }), n3 ? (t3.points.push({ x: n3.x1, y: t3.y1 }), t3.points.push({ x: n3.x0, y: t3.y1 })) : (t3.points.push({ x: t3.points[1].x, y: t3.y1 }), t3.points.push({ x: t3.points[0].x, y: t3.y1 })), t3.isCurrent && (t3.points[0].x -= nr, t3.points[1].x += nr, t3.points[2].x += nr, t3.points[3].x -= nr), t3.areaPoints = [{ x: 0, x0: t3.points[0].x, x1: t3.points[1].x, y: t3.y0, y0: 0, y1: 0 }], t3.areaPoints.push(k({}, t3.areaPoints[0], { y: t3.y0 + t3.height * e2 }));
        var a2 = { x: 0, x0: t3.points[3].x, x1: t3.points[2].x, y: t3.y1, y0: 0, y1: 0 };
        t3.areaPoints.push(k({}, a2, { y: t3.y1 - t3.height * e2 })), t3.areaPoints.push(a2), [0, 1, 2, 3].map((function(r3) {
          t3.borderPoints.push({ x: t3.areaPoints[r3].x0, y: t3.areaPoints[r3].y });
        })), t3.borderPoints.push(null), [3, 2, 1, 0].map((function(r3) {
          t3.borderPoints.push({ x: t3.areaPoints[r3].x1, y: t3.areaPoints[r3].y });
        }));
      } else {
        t3.points.push({ x: t3.x0, y: t3.y0 }), n3 ? (t3.points.push({ x: t3.x1, y: n3.y0 }), t3.points.push({ x: t3.x1, y: n3.y1 })) : (t3.points.push({ x: t3.x1, y: t3.y0 }), t3.points.push({ x: t3.x1, y: t3.y1 })), t3.points.push({ x: t3.x0, y: t3.y1 }), t3.isCurrent && (t3.points[0].y -= nr, t3.points[1].y -= nr, t3.points[2].y += nr, t3.points[3].y += nr), t3.areaPoints = [{ x: t3.x0, x0: 0, x1: 0, y: 0, y0: t3.points[0].y, y1: t3.points[3].y }], t3.areaPoints.push(k({}, t3.areaPoints[0], { x: t3.x0 + t3.width * e2 }));
        var i = { x: t3.x1, x0: 0, x1: 0, y: 0, y0: t3.points[1].y, y1: t3.points[2].y };
        t3.areaPoints.push(k({}, i, { x: t3.x1 - t3.width * e2 })), t3.areaPoints.push(i), [0, 1, 2, 3].map((function(r3) {
          t3.borderPoints.push({ x: t3.areaPoints[r3].x, y: t3.areaPoints[r3].y0 });
        })), t3.borderPoints.push(null), [3, 2, 1, 0].map((function(r3) {
          t3.borderPoints.push({ x: t3.areaPoints[r3].x, y: t3.areaPoints[r3].y1 });
        }));
      }
    })), r2;
  }), [a, d, Pr, o2, n2, mr, y, fr, vr, cr, hr2, wr, G, W2, ar, nr, I2, Or]), Wr = z(), Br = Wr.showTooltipFromEvent, Er = Wr.hideTooltip, zr = (0, import_react.useMemo)((function() {
    return D({ parts: Lr, setCurrentPartId: Ir, isInteractive: tr2, onMouseEnter: ir, onMouseLeave: lr, onMouseMove: sr, onClick: pr, showTooltipFromEvent: Br, hideTooltip: Er, tooltip: dr });
  }), [Lr, Ir, tr2, ir, lr, sr, pr, Br, Er, dr]), Gr = (0, import_react.useMemo)((function() {
    return H({ parts: Lr, direction: d, width: s, height: l, spacing: h, enableBeforeSeparators: q2, beforeSeparatorOffset: U2, enableAfterSeparators: Y2, afterSeparatorOffset: rr2 });
  }), [Lr, d, s, l, h, q2, U2, Y2, rr2]), kr = Gr[0], Ar = Gr[1], Rr = (0, import_react.useMemo)((function() {
    return { width: s, height: l, parts: zr, areaGenerator: br, borderGenerator: xr, beforeSeparators: kr, afterSeparators: Ar, setCurrentPartId: Ir };
  }), [s, l, zr, br, xr, kr, Ar, Ir]);
  return { parts: zr, areaGenerator: br, borderGenerator: xr, beforeSeparators: kr, afterSeparators: Ar, setCurrentPartId: Ir, currentPartId: wr, customLayerProps: Rr };
};
var J = function(r2, e2) {
  return O({ data: r2, annotations: e2, getPosition: function(r3) {
    return { x: r3.x, y: r3.y };
  }, getDimensions: function(r3) {
    var e3 = r3.width, t2 = r3.height;
    return { size: Math.max(e3, t2), width: e3, height: t2 };
  } });
};
var K = function(r2) {
  var e2 = r2.part, t2 = r2.areaGenerator, o2 = r2.borderGenerator, n2 = Dr(), a = n2.animate, i = n2.config, p = It(t2(e2.areaPoints)), d = It(o2(e2.borderPoints)), u = useSpring({ areaColor: e2.color, borderWidth: e2.borderWidth, borderColor: e2.borderColor, config: i, immediate: !a });
  return (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [e2.borderWidth > 0 && (0, import_jsx_runtime.jsx)(animated.path, { d, stroke: u.borderColor, strokeWidth: u.borderWidth, strokeOpacity: e2.borderOpacity, fill: "none" }), (0, import_jsx_runtime.jsx)(animated.path, { d: p, fill: u.areaColor, fillOpacity: e2.fillOpacity, onMouseEnter: e2.onMouseEnter, onMouseLeave: e2.onMouseLeave, onMouseMove: e2.onMouseMove, onClick: e2.onClick })] });
};
var Q = function(r2) {
  var e2 = r2.parts, t2 = r2.areaGenerator, o2 = r2.borderGenerator;
  return (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: e2.map((function(r3) {
    return (0, import_jsx_runtime.jsx)(K, { part: r3, areaGenerator: t2, borderGenerator: o2 }, r3.data.id);
  })) });
};
var U = function(r2) {
  var e2 = r2.part, t2 = M(), o2 = Dr(), n2 = o2.animate, a = o2.config, i = useSpring({ transform: "translate(" + e2.x + ", " + e2.y + ")", color: e2.labelColor, config: a, immediate: !n2 });
  return (0, import_jsx_runtime.jsx)(animated.g, { transform: i.transform, children: (0, import_jsx_runtime.jsx)(b, { textAnchor: "middle", dominantBaseline: "central", style: k({}, t2.labels.text, { fill: i.color, pointerEvents: "none" }), children: e2.formattedValue }) });
};
var X = function(r2) {
  var e2 = r2.parts;
  return (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: e2.map((function(r3) {
    return (0, import_jsx_runtime.jsx)(U, { part: r3 }, r3.data.id);
  })) });
};
var Y = function(r2) {
  var e2 = r2.separator, t2 = M(), o2 = Dr(), n2 = o2.animate, a = o2.config, i = useSpring({ x1: e2.x0, x2: e2.x1, y1: e2.y0, y2: e2.y1, config: a, immediate: !n2 });
  return (0, import_jsx_runtime.jsx)(animated.line, k({ x1: i.x1, x2: i.x2, y1: i.y1, y2: i.y2, fill: "none" }, t2.grid.line));
};
var Z = function(r2) {
  var e2 = r2.beforeSeparators, t2 = r2.afterSeparators;
  return (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [e2.map((function(r3) {
    return (0, import_jsx_runtime.jsx)(Y, { separator: r3 }, r3.partId);
  })), t2.map((function(r3) {
    return (0, import_jsx_runtime.jsx)(Y, { separator: r3 }, r3.partId);
  }))] });
};
var $ = function(r2) {
  var e2 = r2.parts, t2 = r2.annotations, o2 = J(e2, t2);
  return (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: o2.map((function(r3, e3) {
    return (0, import_jsx_runtime.jsx)(R, k({}, r3), e3);
  })) });
};
var _ = ["isInteractive", "animate", "motionConfig", "theme", "renderWrapper"];
var rr = function(r2) {
  var e2 = r2.data, o2 = r2.width, a = r2.height, i = r2.margin, s = r2.direction, l = void 0 === s ? R2.direction : s, p = r2.interpolation, f = void 0 === p ? R2.interpolation : p, c = r2.spacing, h = void 0 === c ? R2.spacing : c, v = r2.shapeBlending, y = void 0 === v ? R2.shapeBlending : v, b2 = r2.valueFormat, x = r2.colors, m = void 0 === x ? R2.colors : x, g = r2.size, S = void 0 === g ? R2.size : g, P = r2.fillOpacity, C = void 0 === P ? R2.fillOpacity : P, O2 = r2.borderWidth, M2 = void 0 === O2 ? R2.borderWidth : O2, I2 = r2.borderColor, L2 = void 0 === I2 ? R2.borderColor : I2, W2 = r2.borderOpacity, B2 = void 0 === W2 ? R2.borderOpacity : W2, E = r2.enableLabel, z2 = void 0 === E ? R2.enableLabel : E, G = r2.labelColor, k2 = void 0 === G ? R2.labelColor : G, A2 = r2.enableBeforeSeparators, j2 = void 0 === A2 ? R2.enableBeforeSeparators : A2, F2 = r2.beforeSeparatorLength, T3 = void 0 === F2 ? R2.beforeSeparatorLength : F2, H2 = r2.beforeSeparatorOffset, D2 = void 0 === H2 ? R2.beforeSeparatorOffset : H2, V2 = r2.enableAfterSeparators, N2 = void 0 === V2 ? R2.enableAfterSeparators : V2, J2 = r2.afterSeparatorLength, K2 = void 0 === J2 ? R2.afterSeparatorLength : J2, U2 = r2.afterSeparatorOffset, Y2 = void 0 === U2 ? R2.afterSeparatorOffset : U2, _2 = r2.layers, rr2 = void 0 === _2 ? R2.layers : _2, er2 = r2.annotations, tr2 = void 0 === er2 ? R2.annotations : er2, or2 = r2.isInteractive, nr = void 0 === or2 ? R2.isInteractive : or2, ar = r2.currentPartSizeExtension, ir = void 0 === ar ? R2.currentPartSizeExtension : ar, sr = r2.currentBorderWidth, lr = r2.onMouseEnter, pr = r2.onMouseMove, dr = r2.onMouseLeave, ur = r2.onClick, fr = r2.tooltip, cr = r2.role, hr2 = void 0 === cr ? R2.role : cr, vr = r2.ariaLabel, yr = r2.ariaLabelledBy, br = r2.ariaDescribedBy, xr = r2.forwardedRef, mr = cn(o2, a, i), gr = mr.margin, Sr = mr.innerWidth, Pr = mr.innerHeight, Cr = mr.outerWidth, Or = mr.outerHeight, Mr = q({ data: e2, width: Sr, height: Pr, direction: l, interpolation: f, spacing: h, shapeBlending: y, valueFormat: b2, colors: m, size: S, fillOpacity: C, borderWidth: M2, borderColor: L2, borderOpacity: B2, labelColor: k2, enableBeforeSeparators: j2, beforeSeparatorLength: T3, beforeSeparatorOffset: D2, enableAfterSeparators: N2, afterSeparatorLength: K2, afterSeparatorOffset: Y2, isInteractive: nr, currentPartSizeExtension: ir, currentBorderWidth: sr, onMouseEnter: lr, onMouseMove: pr, onMouseLeave: dr, onClick: ur, tooltip: fr }), wr = Mr.areaGenerator, Ir = Mr.borderGenerator, Lr = Mr.parts, Wr = Mr.beforeSeparators, Br = Mr.afterSeparators, Er = Mr.customLayerProps, zr = { separators: null, parts: null, annotations: null, labels: null };
  return rr2.includes("separators") && (zr.separators = (0, import_jsx_runtime.jsx)(Z, { beforeSeparators: Wr, afterSeparators: Br }, "separators")), rr2.includes("parts") && (zr.parts = (0, import_jsx_runtime.jsx)(Q, { parts: Lr, areaGenerator: wr, borderGenerator: Ir }, "parts")), null != rr2 && rr2.includes("annotations") && (zr.annotations = (0, import_jsx_runtime.jsx)($, { parts: Lr, annotations: tr2 }, "annotations")), rr2.includes("labels") && z2 && (zr.labels = (0, import_jsx_runtime.jsx)(X, { parts: Lr }, "labels")), (0, import_jsx_runtime.jsx)(Rt, { width: Cr, height: Or, margin: gr, role: hr2, ariaLabel: vr, ariaLabelledBy: yr, ariaDescribedBy: br, ref: xr, children: rr2.map((function(r3, e3) {
    var o3;
    return "function" == typeof r3 ? (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: (0, import_react.createElement)(r3, Er) }, e3) : null != (o3 = null == zr ? void 0 : zr[r3]) ? o3 : null;
  })) });
};
var er = (0, import_react.forwardRef)((function(r2, e2) {
  var t2 = r2.isInteractive, o2 = void 0 === t2 ? R2.isInteractive : t2, n2 = r2.animate, a = void 0 === n2 ? R2.animate : n2, i = r2.motionConfig, s = void 0 === i ? R2.motionConfig : i, l = r2.theme, d = r2.renderWrapper, u = A(r2, _);
  return (0, import_jsx_runtime.jsx)(Fr, { animate: a, isInteractive: o2, motionConfig: s, renderWrapper: d, theme: l, children: (0, import_jsx_runtime.jsx)(rr, k({ isInteractive: o2 }, u, { forwardedRef: e2 })) });
}));
var tr = ["defaultWidth", "defaultHeight", "onResize", "debounceResize"];
var or = (0, import_react.forwardRef)((function(r2, e2) {
  var t2 = r2.defaultWidth, o2 = r2.defaultHeight, n2 = r2.onResize, a = r2.debounceResize, i = A(r2, tr);
  return (0, import_jsx_runtime.jsx)($r, { defaultWidth: t2, defaultHeight: o2, onResize: n2, debounceResize: a, children: function(r3) {
    var t3 = r3.width, o3 = r3.height;
    return (0, import_jsx_runtime.jsx)(er, k({ width: t3, height: o3 }, i, { ref: e2 }));
  } });
}));
export {
  er as Funnel,
  or as ResponsiveFunnel,
  D as computePartsHandlers,
  T2 as computeScales,
  H as computeSeparators,
  F as computeShapeGenerators,
  V as getSizeGenerator,
  R2 as svgDefaultProps,
  q as useFunnel,
  J as useFunnelAnnotations,
  N as useSize
};
//# sourceMappingURL=@nivo_funnel.js.map
