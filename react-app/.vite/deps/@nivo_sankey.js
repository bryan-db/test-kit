import {
  E,
  require_uniq
} from "./chunk-FT2KIN53.js";
import {
  $r,
  Dr,
  Fr,
  It,
  M,
  Rt,
  T,
  Ye,
  animated,
  b,
  bn,
  cn,
  hn,
  hr,
  require_baseClone,
  useSpring,
  useSprings,
  w2 as w,
  z
} from "./chunk-XPGL4N5M.js";
import {
  line_default,
  max,
  min,
  monotoneX,
  monotoneY,
  sum
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

// node_modules/lodash/cloneDeep.js
var require_cloneDeep = __commonJS({
  "node_modules/lodash/cloneDeep.js"(exports, module) {
    var baseClone = require_baseClone();
    var CLONE_DEEP_FLAG = 1;
    var CLONE_SYMBOLS_FLAG = 4;
    function cloneDeep(value2) {
      return baseClone(value2, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
    }
    module.exports = cloneDeep;
  }
});

// node_modules/@nivo/sankey/dist/nivo-sankey.mjs
var import_react = __toESM(require_react(), 1);
var import_uniq = __toESM(require_uniq(), 1);

// node_modules/d3-sankey/src/align.js
function targetDepth(d) {
  return d.target.depth;
}
function left(node) {
  return node.depth;
}
function right(node, n2) {
  return n2 - 1 - node.height;
}
function justify(node, n2) {
  return node.sourceLinks.length ? node.depth : n2 - 1;
}
function center(node) {
  return node.targetLinks.length ? node.depth : node.sourceLinks.length ? min(node.sourceLinks, targetDepth) - 1 : 0;
}

// node_modules/d3-sankey/src/constant.js
function constant(x2) {
  return function() {
    return x2;
  };
}

// node_modules/d3-sankey/src/sankey.js
function ascendingSourceBreadth(a2, b2) {
  return ascendingBreadth(a2.source, b2.source) || a2.index - b2.index;
}
function ascendingTargetBreadth(a2, b2) {
  return ascendingBreadth(a2.target, b2.target) || a2.index - b2.index;
}
function ascendingBreadth(a2, b2) {
  return a2.y0 - b2.y0;
}
function value(d) {
  return d.value;
}
function defaultId(d) {
  return d.index;
}
function defaultNodes(graph) {
  return graph.nodes;
}
function defaultLinks(graph) {
  return graph.links;
}
function find(nodeById, id) {
  const node = nodeById.get(id);
  if (!node) throw new Error("missing: " + id);
  return node;
}
function computeLinkBreadths({ nodes }) {
  for (const node of nodes) {
    let y0 = node.y0;
    let y1 = y0;
    for (const link of node.sourceLinks) {
      link.y0 = y0 + link.width / 2;
      y0 += link.width;
    }
    for (const link of node.targetLinks) {
      link.y1 = y1 + link.width / 2;
      y1 += link.width;
    }
  }
}
function Sankey() {
  let x0 = 0, y0 = 0, x1 = 1, y1 = 1;
  let dx = 24;
  let dy = 8, py;
  let id = defaultId;
  let align = justify;
  let sort;
  let linkSort;
  let nodes = defaultNodes;
  let links = defaultLinks;
  let iterations = 6;
  function sankey() {
    const graph = { nodes: nodes.apply(null, arguments), links: links.apply(null, arguments) };
    computeNodeLinks(graph);
    computeNodeValues(graph);
    computeNodeDepths(graph);
    computeNodeHeights(graph);
    computeNodeBreadths(graph);
    computeLinkBreadths(graph);
    return graph;
  }
  sankey.update = function(graph) {
    computeLinkBreadths(graph);
    return graph;
  };
  sankey.nodeId = function(_2) {
    return arguments.length ? (id = typeof _2 === "function" ? _2 : constant(_2), sankey) : id;
  };
  sankey.nodeAlign = function(_2) {
    return arguments.length ? (align = typeof _2 === "function" ? _2 : constant(_2), sankey) : align;
  };
  sankey.nodeSort = function(_2) {
    return arguments.length ? (sort = _2, sankey) : sort;
  };
  sankey.nodeWidth = function(_2) {
    return arguments.length ? (dx = +_2, sankey) : dx;
  };
  sankey.nodePadding = function(_2) {
    return arguments.length ? (dy = py = +_2, sankey) : dy;
  };
  sankey.nodes = function(_2) {
    return arguments.length ? (nodes = typeof _2 === "function" ? _2 : constant(_2), sankey) : nodes;
  };
  sankey.links = function(_2) {
    return arguments.length ? (links = typeof _2 === "function" ? _2 : constant(_2), sankey) : links;
  };
  sankey.linkSort = function(_2) {
    return arguments.length ? (linkSort = _2, sankey) : linkSort;
  };
  sankey.size = function(_2) {
    return arguments.length ? (x0 = y0 = 0, x1 = +_2[0], y1 = +_2[1], sankey) : [x1 - x0, y1 - y0];
  };
  sankey.extent = function(_2) {
    return arguments.length ? (x0 = +_2[0][0], x1 = +_2[1][0], y0 = +_2[0][1], y1 = +_2[1][1], sankey) : [[x0, y0], [x1, y1]];
  };
  sankey.iterations = function(_2) {
    return arguments.length ? (iterations = +_2, sankey) : iterations;
  };
  function computeNodeLinks({ nodes: nodes2, links: links2 }) {
    for (const [i2, node] of nodes2.entries()) {
      node.index = i2;
      node.sourceLinks = [];
      node.targetLinks = [];
    }
    const nodeById = new Map(nodes2.map((d, i2) => [id(d, i2, nodes2), d]));
    for (const [i2, link] of links2.entries()) {
      link.index = i2;
      let { source, target } = link;
      if (typeof source !== "object") source = link.source = find(nodeById, source);
      if (typeof target !== "object") target = link.target = find(nodeById, target);
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
    }
    if (linkSort != null) {
      for (const { sourceLinks, targetLinks } of nodes2) {
        sourceLinks.sort(linkSort);
        targetLinks.sort(linkSort);
      }
    }
  }
  function computeNodeValues({ nodes: nodes2 }) {
    for (const node of nodes2) {
      node.value = node.fixedValue === void 0 ? Math.max(sum(node.sourceLinks, value), sum(node.targetLinks, value)) : node.fixedValue;
    }
  }
  function computeNodeDepths({ nodes: nodes2 }) {
    const n2 = nodes2.length;
    let current = new Set(nodes2);
    let next = /* @__PURE__ */ new Set();
    let x2 = 0;
    while (current.size) {
      for (const node of current) {
        node.depth = x2;
        for (const { target } of node.sourceLinks) {
          next.add(target);
        }
      }
      if (++x2 > n2) throw new Error("circular link");
      current = next;
      next = /* @__PURE__ */ new Set();
    }
  }
  function computeNodeHeights({ nodes: nodes2 }) {
    const n2 = nodes2.length;
    let current = new Set(nodes2);
    let next = /* @__PURE__ */ new Set();
    let x2 = 0;
    while (current.size) {
      for (const node of current) {
        node.height = x2;
        for (const { source } of node.targetLinks) {
          next.add(source);
        }
      }
      if (++x2 > n2) throw new Error("circular link");
      current = next;
      next = /* @__PURE__ */ new Set();
    }
  }
  function computeNodeLayers({ nodes: nodes2 }) {
    const x2 = max(nodes2, (d) => d.depth) + 1;
    const kx2 = (x1 - x0 - dx) / (x2 - 1);
    const columns = new Array(x2);
    for (const node of nodes2) {
      const i2 = Math.max(0, Math.min(x2 - 1, Math.floor(align.call(null, node, x2))));
      node.layer = i2;
      node.x0 = x0 + i2 * kx2;
      node.x1 = node.x0 + dx;
      if (columns[i2]) columns[i2].push(node);
      else columns[i2] = [node];
    }
    if (sort) for (const column of columns) {
      column.sort(sort);
    }
    return columns;
  }
  function initializeNodeBreadths(columns) {
    const ky2 = min(columns, (c) => (y1 - y0 - (c.length - 1) * py) / sum(c, value));
    for (const nodes2 of columns) {
      let y2 = y0;
      for (const node of nodes2) {
        node.y0 = y2;
        node.y1 = y2 + node.value * ky2;
        y2 = node.y1 + py;
        for (const link of node.sourceLinks) {
          link.width = link.value * ky2;
        }
      }
      y2 = (y1 - y2 + py) / (nodes2.length + 1);
      for (let i2 = 0; i2 < nodes2.length; ++i2) {
        const node = nodes2[i2];
        node.y0 += y2 * (i2 + 1);
        node.y1 += y2 * (i2 + 1);
      }
      reorderLinks(nodes2);
    }
  }
  function computeNodeBreadths(graph) {
    const columns = computeNodeLayers(graph);
    py = Math.min(dy, (y1 - y0) / (max(columns, (c) => c.length) - 1));
    initializeNodeBreadths(columns);
    for (let i2 = 0; i2 < iterations; ++i2) {
      const alpha = Math.pow(0.99, i2);
      const beta = Math.max(1 - alpha, (i2 + 1) / iterations);
      relaxRightToLeft(columns, alpha, beta);
      relaxLeftToRight(columns, alpha, beta);
    }
  }
  function relaxLeftToRight(columns, alpha, beta) {
    for (let i2 = 1, n2 = columns.length; i2 < n2; ++i2) {
      const column = columns[i2];
      for (const target of column) {
        let y2 = 0;
        let w3 = 0;
        for (const { source, value: value2 } of target.targetLinks) {
          let v = value2 * (target.layer - source.layer);
          y2 += targetTop(source, target) * v;
          w3 += v;
        }
        if (!(w3 > 0)) continue;
        let dy2 = (y2 / w3 - target.y0) * alpha;
        target.y0 += dy2;
        target.y1 += dy2;
        reorderNodeLinks(target);
      }
      if (sort === void 0) column.sort(ascendingBreadth);
      resolveCollisions(column, beta);
    }
  }
  function relaxRightToLeft(columns, alpha, beta) {
    for (let n2 = columns.length, i2 = n2 - 2; i2 >= 0; --i2) {
      const column = columns[i2];
      for (const source of column) {
        let y2 = 0;
        let w3 = 0;
        for (const { target, value: value2 } of source.sourceLinks) {
          let v = value2 * (target.layer - source.layer);
          y2 += sourceTop(source, target) * v;
          w3 += v;
        }
        if (!(w3 > 0)) continue;
        let dy2 = (y2 / w3 - source.y0) * alpha;
        source.y0 += dy2;
        source.y1 += dy2;
        reorderNodeLinks(source);
      }
      if (sort === void 0) column.sort(ascendingBreadth);
      resolveCollisions(column, beta);
    }
  }
  function resolveCollisions(nodes2, alpha) {
    const i2 = nodes2.length >> 1;
    const subject = nodes2[i2];
    resolveCollisionsBottomToTop(nodes2, subject.y0 - py, i2 - 1, alpha);
    resolveCollisionsTopToBottom(nodes2, subject.y1 + py, i2 + 1, alpha);
    resolveCollisionsBottomToTop(nodes2, y1, nodes2.length - 1, alpha);
    resolveCollisionsTopToBottom(nodes2, y0, 0, alpha);
  }
  function resolveCollisionsTopToBottom(nodes2, y2, i2, alpha) {
    for (; i2 < nodes2.length; ++i2) {
      const node = nodes2[i2];
      const dy2 = (y2 - node.y0) * alpha;
      if (dy2 > 1e-6) node.y0 += dy2, node.y1 += dy2;
      y2 = node.y1 + py;
    }
  }
  function resolveCollisionsBottomToTop(nodes2, y2, i2, alpha) {
    for (; i2 >= 0; --i2) {
      const node = nodes2[i2];
      const dy2 = (node.y1 - y2) * alpha;
      if (dy2 > 1e-6) node.y0 -= dy2, node.y1 -= dy2;
      y2 = node.y0 - py;
    }
  }
  function reorderNodeLinks({ sourceLinks, targetLinks }) {
    if (linkSort === void 0) {
      for (const { source: { sourceLinks: sourceLinks2 } } of targetLinks) {
        sourceLinks2.sort(ascendingTargetBreadth);
      }
      for (const { target: { targetLinks: targetLinks2 } } of sourceLinks) {
        targetLinks2.sort(ascendingSourceBreadth);
      }
    }
  }
  function reorderLinks(nodes2) {
    if (linkSort === void 0) {
      for (const { sourceLinks, targetLinks } of nodes2) {
        sourceLinks.sort(ascendingTargetBreadth);
        targetLinks.sort(ascendingSourceBreadth);
      }
    }
  }
  function targetTop(source, target) {
    let y2 = source.y0 - (source.sourceLinks.length - 1) * py / 2;
    for (const { target: node, width } of source.sourceLinks) {
      if (node === target) break;
      y2 += width + py;
    }
    for (const { source: node, width } of target.targetLinks) {
      if (node === source) break;
      y2 -= width;
    }
    return y2;
  }
  function sourceTop(source, target) {
    let y2 = target.y0 - (target.targetLinks.length - 1) * py / 2;
    for (const { source: node, width } of target.targetLinks) {
      if (node === source) break;
      y2 += width + py;
    }
    for (const { target: node, width } of source.sourceLinks) {
      if (node === target) break;
      y2 -= width;
    }
    return y2;
  }
  return sankey;
}

// node_modules/d3-sankey/node_modules/d3-path/src/path.js
var pi = Math.PI;
var tau = 2 * pi;
var epsilon = 1e-6;
var tauEpsilon = tau - epsilon;
function Path() {
  this._x0 = this._y0 = // start of current subpath
  this._x1 = this._y1 = null;
  this._ = "";
}
function path() {
  return new Path();
}
Path.prototype = path.prototype = {
  constructor: Path,
  moveTo: function(x2, y2) {
    this._ += "M" + (this._x0 = this._x1 = +x2) + "," + (this._y0 = this._y1 = +y2);
  },
  closePath: function() {
    if (this._x1 !== null) {
      this._x1 = this._x0, this._y1 = this._y0;
      this._ += "Z";
    }
  },
  lineTo: function(x2, y2) {
    this._ += "L" + (this._x1 = +x2) + "," + (this._y1 = +y2);
  },
  quadraticCurveTo: function(x1, y1, x2, y2) {
    this._ += "Q" + +x1 + "," + +y1 + "," + (this._x1 = +x2) + "," + (this._y1 = +y2);
  },
  bezierCurveTo: function(x1, y1, x2, y2, x3, y3) {
    this._ += "C" + +x1 + "," + +y1 + "," + +x2 + "," + +y2 + "," + (this._x1 = +x3) + "," + (this._y1 = +y3);
  },
  arcTo: function(x1, y1, x2, y2, r2) {
    x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r2 = +r2;
    var x0 = this._x1, y0 = this._y1, x21 = x2 - x1, y21 = y2 - y1, x01 = x0 - x1, y01 = y0 - y1, l01_2 = x01 * x01 + y01 * y01;
    if (r2 < 0) throw new Error("negative radius: " + r2);
    if (this._x1 === null) {
      this._ += "M" + (this._x1 = x1) + "," + (this._y1 = y1);
    } else if (!(l01_2 > epsilon)) ;
    else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r2) {
      this._ += "L" + (this._x1 = x1) + "," + (this._y1 = y1);
    } else {
      var x20 = x2 - x0, y20 = y2 - y0, l21_2 = x21 * x21 + y21 * y21, l20_2 = x20 * x20 + y20 * y20, l21 = Math.sqrt(l21_2), l01 = Math.sqrt(l01_2), l2 = r2 * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2), t01 = l2 / l01, t21 = l2 / l21;
      if (Math.abs(t01 - 1) > epsilon) {
        this._ += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01);
      }
      this._ += "A" + r2 + "," + r2 + ",0,0," + +(y01 * x20 > x01 * y20) + "," + (this._x1 = x1 + t21 * x21) + "," + (this._y1 = y1 + t21 * y21);
    }
  },
  arc: function(x2, y2, r2, a0, a1, ccw) {
    x2 = +x2, y2 = +y2, r2 = +r2, ccw = !!ccw;
    var dx = r2 * Math.cos(a0), dy = r2 * Math.sin(a0), x0 = x2 + dx, y0 = y2 + dy, cw = 1 ^ ccw, da = ccw ? a0 - a1 : a1 - a0;
    if (r2 < 0) throw new Error("negative radius: " + r2);
    if (this._x1 === null) {
      this._ += "M" + x0 + "," + y0;
    } else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
      this._ += "L" + x0 + "," + y0;
    }
    if (!r2) return;
    if (da < 0) da = da % tau + tau;
    if (da > tauEpsilon) {
      this._ += "A" + r2 + "," + r2 + ",0,1," + cw + "," + (x2 - dx) + "," + (y2 - dy) + "A" + r2 + "," + r2 + ",0,1," + cw + "," + (this._x1 = x0) + "," + (this._y1 = y0);
    } else if (da > epsilon) {
      this._ += "A" + r2 + "," + r2 + ",0," + +(da >= pi) + "," + cw + "," + (this._x1 = x2 + r2 * Math.cos(a1)) + "," + (this._y1 = y2 + r2 * Math.sin(a1));
    }
  },
  rect: function(x2, y2, w3, h) {
    this._ += "M" + (this._x0 = this._x1 = +x2) + "," + (this._y0 = this._y1 = +y2) + "h" + +w3 + "v" + +h + "h" + -w3 + "Z";
  },
  toString: function() {
    return this._;
  }
};

// node_modules/d3-sankey/node_modules/d3-shape/src/math.js
var epsilon2 = 1e-12;
var pi2 = Math.PI;
var halfPi = pi2 / 2;
var tau2 = 2 * pi2;

// node_modules/d3-sankey/node_modules/d3-shape/src/curve/linear.js
function Linear(context) {
  this._context = context;
}
Linear.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x2, y2) : this._context.moveTo(x2, y2);
        break;
      case 1:
        this._point = 2;
      // proceed
      default:
        this._context.lineTo(x2, y2);
        break;
    }
  }
};
function linear_default(context) {
  return new Linear(context);
}

// node_modules/d3-sankey/node_modules/d3-shape/src/curve/radial.js
var curveRadialLinear = curveRadial(linear_default);
function Radial(curve) {
  this._curve = curve;
}
Radial.prototype = {
  areaStart: function() {
    this._curve.areaStart();
  },
  areaEnd: function() {
    this._curve.areaEnd();
  },
  lineStart: function() {
    this._curve.lineStart();
  },
  lineEnd: function() {
    this._curve.lineEnd();
  },
  point: function(a2, r2) {
    this._curve.point(r2 * Math.sin(a2), r2 * -Math.cos(a2));
  }
};
function curveRadial(curve) {
  function radial(context) {
    return new Radial(curve(context));
  }
  radial._curve = curve;
  return radial;
}

// node_modules/d3-sankey/node_modules/d3-shape/src/array.js
var slice = Array.prototype.slice;

// node_modules/d3-sankey/node_modules/d3-shape/src/symbol/diamond.js
var tan30 = Math.sqrt(1 / 3);
var tan30_2 = tan30 * 2;

// node_modules/d3-sankey/node_modules/d3-shape/src/symbol/star.js
var kr = Math.sin(pi2 / 10) / Math.sin(7 * pi2 / 10);
var kx = Math.sin(tau2 / 10) * kr;
var ky = -Math.cos(tau2 / 10) * kr;

// node_modules/d3-sankey/node_modules/d3-shape/src/symbol/triangle.js
var sqrt3 = Math.sqrt(3);

// node_modules/d3-sankey/node_modules/d3-shape/src/symbol/wye.js
var s = Math.sqrt(3) / 2;
var k = 1 / Math.sqrt(12);
var a = (k / 2 + 1) * 3;

// node_modules/d3-sankey/node_modules/d3-shape/src/noop.js
function noop_default() {
}

// node_modules/d3-sankey/node_modules/d3-shape/src/curve/basis.js
function point(that, x2, y2) {
  that._context.bezierCurveTo(
    (2 * that._x0 + that._x1) / 3,
    (2 * that._y0 + that._y1) / 3,
    (that._x0 + 2 * that._x1) / 3,
    (that._y0 + 2 * that._y1) / 3,
    (that._x0 + 4 * that._x1 + x2) / 6,
    (that._y0 + 4 * that._y1 + y2) / 6
  );
}
function Basis(context) {
  this._context = context;
}
Basis.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 3:
        point(this, this._x1, this._y1);
      // proceed
      case 2:
        this._context.lineTo(this._x1, this._y1);
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x2, y2) : this._context.moveTo(x2, y2);
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6);
      // proceed
      default:
        point(this, x2, y2);
        break;
    }
    this._x0 = this._x1, this._x1 = x2;
    this._y0 = this._y1, this._y1 = y2;
  }
};

// node_modules/d3-sankey/node_modules/d3-shape/src/curve/basisClosed.js
function BasisClosed(context) {
  this._context = context;
}
BasisClosed.prototype = {
  areaStart: noop_default,
  areaEnd: noop_default,
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x2, this._y2);
        this._context.closePath();
        break;
      }
      case 2: {
        this._context.moveTo((this._x2 + 2 * this._x3) / 3, (this._y2 + 2 * this._y3) / 3);
        this._context.lineTo((this._x3 + 2 * this._x2) / 3, (this._y3 + 2 * this._y2) / 3);
        this._context.closePath();
        break;
      }
      case 3: {
        this.point(this._x2, this._y2);
        this.point(this._x3, this._y3);
        this.point(this._x4, this._y4);
        break;
      }
    }
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._x2 = x2, this._y2 = y2;
        break;
      case 1:
        this._point = 2;
        this._x3 = x2, this._y3 = y2;
        break;
      case 2:
        this._point = 3;
        this._x4 = x2, this._y4 = y2;
        this._context.moveTo((this._x0 + 4 * this._x1 + x2) / 6, (this._y0 + 4 * this._y1 + y2) / 6);
        break;
      default:
        point(this, x2, y2);
        break;
    }
    this._x0 = this._x1, this._x1 = x2;
    this._y0 = this._y1, this._y1 = y2;
  }
};

// node_modules/d3-sankey/node_modules/d3-shape/src/curve/basisOpen.js
function BasisOpen(context) {
  this._context = context;
}
BasisOpen.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    switch (this._point) {
      case 0:
        this._point = 1;
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        var x0 = (this._x0 + 4 * this._x1 + x2) / 6, y0 = (this._y0 + 4 * this._y1 + y2) / 6;
        this._line ? this._context.lineTo(x0, y0) : this._context.moveTo(x0, y0);
        break;
      case 3:
        this._point = 4;
      // proceed
      default:
        point(this, x2, y2);
        break;
    }
    this._x0 = this._x1, this._x1 = x2;
    this._y0 = this._y1, this._y1 = y2;
  }
};

// node_modules/d3-sankey/node_modules/d3-shape/src/curve/bundle.js
function Bundle(context, beta) {
  this._basis = new Basis(context);
  this._beta = beta;
}
Bundle.prototype = {
  lineStart: function() {
    this._x = [];
    this._y = [];
    this._basis.lineStart();
  },
  lineEnd: function() {
    var x2 = this._x, y2 = this._y, j2 = x2.length - 1;
    if (j2 > 0) {
      var x0 = x2[0], y0 = y2[0], dx = x2[j2] - x0, dy = y2[j2] - y0, i2 = -1, t2;
      while (++i2 <= j2) {
        t2 = i2 / j2;
        this._basis.point(
          this._beta * x2[i2] + (1 - this._beta) * (x0 + t2 * dx),
          this._beta * y2[i2] + (1 - this._beta) * (y0 + t2 * dy)
        );
      }
    }
    this._x = this._y = null;
    this._basis.lineEnd();
  },
  point: function(x2, y2) {
    this._x.push(+x2);
    this._y.push(+y2);
  }
};
var bundle_default = (function custom(beta) {
  function bundle(context) {
    return beta === 1 ? new Basis(context) : new Bundle(context, beta);
  }
  bundle.beta = function(beta2) {
    return custom(+beta2);
  };
  return bundle;
})(0.85);

// node_modules/d3-sankey/node_modules/d3-shape/src/curve/cardinal.js
function point2(that, x2, y2) {
  that._context.bezierCurveTo(
    that._x1 + that._k * (that._x2 - that._x0),
    that._y1 + that._k * (that._y2 - that._y0),
    that._x2 + that._k * (that._x1 - x2),
    that._y2 + that._k * (that._y1 - y2),
    that._x2,
    that._y2
  );
}
function Cardinal(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}
Cardinal.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2);
        break;
      case 3:
        point2(this, this._x1, this._y1);
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x2, y2) : this._context.moveTo(x2, y2);
        break;
      case 1:
        this._point = 2;
        this._x1 = x2, this._y1 = y2;
        break;
      case 2:
        this._point = 3;
      // proceed
      default:
        point2(this, x2, y2);
        break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x2;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y2;
  }
};
var cardinal_default = (function custom2(tension) {
  function cardinal(context) {
    return new Cardinal(context, tension);
  }
  cardinal.tension = function(tension2) {
    return custom2(+tension2);
  };
  return cardinal;
})(0);

// node_modules/d3-sankey/node_modules/d3-shape/src/curve/cardinalClosed.js
function CardinalClosed(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}
CardinalClosed.prototype = {
  areaStart: noop_default,
  areaEnd: noop_default,
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 2: {
        this._context.lineTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 3: {
        this.point(this._x3, this._y3);
        this.point(this._x4, this._y4);
        this.point(this._x5, this._y5);
        break;
      }
    }
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._x3 = x2, this._y3 = y2;
        break;
      case 1:
        this._point = 2;
        this._context.moveTo(this._x4 = x2, this._y4 = y2);
        break;
      case 2:
        this._point = 3;
        this._x5 = x2, this._y5 = y2;
        break;
      default:
        point2(this, x2, y2);
        break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x2;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y2;
  }
};
var cardinalClosed_default = (function custom3(tension) {
  function cardinal(context) {
    return new CardinalClosed(context, tension);
  }
  cardinal.tension = function(tension2) {
    return custom3(+tension2);
  };
  return cardinal;
})(0);

// node_modules/d3-sankey/node_modules/d3-shape/src/curve/cardinalOpen.js
function CardinalOpen(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}
CardinalOpen.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    switch (this._point) {
      case 0:
        this._point = 1;
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);
        break;
      case 3:
        this._point = 4;
      // proceed
      default:
        point2(this, x2, y2);
        break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x2;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y2;
  }
};
var cardinalOpen_default = (function custom4(tension) {
  function cardinal(context) {
    return new CardinalOpen(context, tension);
  }
  cardinal.tension = function(tension2) {
    return custom4(+tension2);
  };
  return cardinal;
})(0);

// node_modules/d3-sankey/node_modules/d3-shape/src/curve/catmullRom.js
function point3(that, x2, y2) {
  var x1 = that._x1, y1 = that._y1, x22 = that._x2, y22 = that._y2;
  if (that._l01_a > epsilon2) {
    var a2 = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a, n2 = 3 * that._l01_a * (that._l01_a + that._l12_a);
    x1 = (x1 * a2 - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n2;
    y1 = (y1 * a2 - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n2;
  }
  if (that._l23_a > epsilon2) {
    var b2 = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a, m = 3 * that._l23_a * (that._l23_a + that._l12_a);
    x22 = (x22 * b2 + that._x1 * that._l23_2a - x2 * that._l12_2a) / m;
    y22 = (y22 * b2 + that._y1 * that._l23_2a - y2 * that._l12_2a) / m;
  }
  that._context.bezierCurveTo(x1, y1, x22, y22, that._x2, that._y2);
}
function CatmullRom(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}
CatmullRom.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2);
        break;
      case 3:
        this.point(this._x2, this._y2);
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    if (this._point) {
      var x23 = this._x2 - x2, y23 = this._y2 - y2;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x2, y2) : this._context.moveTo(x2, y2);
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
      // proceed
      default:
        point3(this, x2, y2);
        break;
    }
    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x2;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y2;
  }
};
var catmullRom_default = (function custom5(alpha) {
  function catmullRom(context) {
    return alpha ? new CatmullRom(context, alpha) : new Cardinal(context, 0);
  }
  catmullRom.alpha = function(alpha2) {
    return custom5(+alpha2);
  };
  return catmullRom;
})(0.5);

// node_modules/d3-sankey/node_modules/d3-shape/src/curve/catmullRomClosed.js
function CatmullRomClosed(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}
CatmullRomClosed.prototype = {
  areaStart: noop_default,
  areaEnd: noop_default,
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 2: {
        this._context.lineTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 3: {
        this.point(this._x3, this._y3);
        this.point(this._x4, this._y4);
        this.point(this._x5, this._y5);
        break;
      }
    }
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    if (this._point) {
      var x23 = this._x2 - x2, y23 = this._y2 - y2;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }
    switch (this._point) {
      case 0:
        this._point = 1;
        this._x3 = x2, this._y3 = y2;
        break;
      case 1:
        this._point = 2;
        this._context.moveTo(this._x4 = x2, this._y4 = y2);
        break;
      case 2:
        this._point = 3;
        this._x5 = x2, this._y5 = y2;
        break;
      default:
        point3(this, x2, y2);
        break;
    }
    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x2;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y2;
  }
};
var catmullRomClosed_default = (function custom6(alpha) {
  function catmullRom(context) {
    return alpha ? new CatmullRomClosed(context, alpha) : new CardinalClosed(context, 0);
  }
  catmullRom.alpha = function(alpha2) {
    return custom6(+alpha2);
  };
  return catmullRom;
})(0.5);

// node_modules/d3-sankey/node_modules/d3-shape/src/curve/catmullRomOpen.js
function CatmullRomOpen(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}
CatmullRomOpen.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    if (this._point) {
      var x23 = this._x2 - x2, y23 = this._y2 - y2;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }
    switch (this._point) {
      case 0:
        this._point = 1;
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);
        break;
      case 3:
        this._point = 4;
      // proceed
      default:
        point3(this, x2, y2);
        break;
    }
    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x2;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y2;
  }
};
var catmullRomOpen_default = (function custom7(alpha) {
  function catmullRom(context) {
    return alpha ? new CatmullRomOpen(context, alpha) : new CardinalOpen(context, 0);
  }
  catmullRom.alpha = function(alpha2) {
    return custom7(+alpha2);
  };
  return catmullRom;
})(0.5);

// node_modules/d3-sankey/node_modules/d3-shape/src/curve/linearClosed.js
function LinearClosed(context) {
  this._context = context;
}
LinearClosed.prototype = {
  areaStart: noop_default,
  areaEnd: noop_default,
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._point) this._context.closePath();
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    if (this._point) this._context.lineTo(x2, y2);
    else this._point = 1, this._context.moveTo(x2, y2);
  }
};

// node_modules/d3-sankey/node_modules/d3-shape/src/curve/monotone.js
function sign(x2) {
  return x2 < 0 ? -1 : 1;
}
function slope3(that, x2, y2) {
  var h0 = that._x1 - that._x0, h1 = x2 - that._x1, s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0), s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0), p = (s0 * h1 + s1 * h0) / (h0 + h1);
  return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
}
function slope2(that, t2) {
  var h = that._x1 - that._x0;
  return h ? (3 * (that._y1 - that._y0) / h - t2) / 2 : t2;
}
function point4(that, t0, t1) {
  var x0 = that._x0, y0 = that._y0, x1 = that._x1, y1 = that._y1, dx = (x1 - x0) / 3;
  that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
}
function MonotoneX(context) {
  this._context = context;
}
MonotoneX.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x1, this._y1);
        break;
      case 3:
        point4(this, this._t0, slope2(this, this._t0));
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    var t1 = NaN;
    x2 = +x2, y2 = +y2;
    if (x2 === this._x1 && y2 === this._y1) return;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x2, y2) : this._context.moveTo(x2, y2);
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        point4(this, slope2(this, t1 = slope3(this, x2, y2)), t1);
        break;
      default:
        point4(this, this._t0, t1 = slope3(this, x2, y2));
        break;
    }
    this._x0 = this._x1, this._x1 = x2;
    this._y0 = this._y1, this._y1 = y2;
    this._t0 = t1;
  }
};
function MonotoneY(context) {
  this._context = new ReflectContext(context);
}
(MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function(x2, y2) {
  MonotoneX.prototype.point.call(this, y2, x2);
};
function ReflectContext(context) {
  this._context = context;
}
ReflectContext.prototype = {
  moveTo: function(x2, y2) {
    this._context.moveTo(y2, x2);
  },
  closePath: function() {
    this._context.closePath();
  },
  lineTo: function(x2, y2) {
    this._context.lineTo(y2, x2);
  },
  bezierCurveTo: function(x1, y1, x2, y2, x3, y3) {
    this._context.bezierCurveTo(y1, x1, y2, x2, y3, x3);
  }
};

// node_modules/d3-sankey/node_modules/d3-shape/src/curve/natural.js
function Natural(context) {
  this._context = context;
}
Natural.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x = [];
    this._y = [];
  },
  lineEnd: function() {
    var x2 = this._x, y2 = this._y, n2 = x2.length;
    if (n2) {
      this._line ? this._context.lineTo(x2[0], y2[0]) : this._context.moveTo(x2[0], y2[0]);
      if (n2 === 2) {
        this._context.lineTo(x2[1], y2[1]);
      } else {
        var px = controlPoints(x2), py = controlPoints(y2);
        for (var i0 = 0, i1 = 1; i1 < n2; ++i0, ++i1) {
          this._context.bezierCurveTo(px[0][i0], py[0][i0], px[1][i0], py[1][i0], x2[i1], y2[i1]);
        }
      }
    }
    if (this._line || this._line !== 0 && n2 === 1) this._context.closePath();
    this._line = 1 - this._line;
    this._x = this._y = null;
  },
  point: function(x2, y2) {
    this._x.push(+x2);
    this._y.push(+y2);
  }
};
function controlPoints(x2) {
  var i2, n2 = x2.length - 1, m, a2 = new Array(n2), b2 = new Array(n2), r2 = new Array(n2);
  a2[0] = 0, b2[0] = 2, r2[0] = x2[0] + 2 * x2[1];
  for (i2 = 1; i2 < n2 - 1; ++i2) a2[i2] = 1, b2[i2] = 4, r2[i2] = 4 * x2[i2] + 2 * x2[i2 + 1];
  a2[n2 - 1] = 2, b2[n2 - 1] = 7, r2[n2 - 1] = 8 * x2[n2 - 1] + x2[n2];
  for (i2 = 1; i2 < n2; ++i2) m = a2[i2] / b2[i2 - 1], b2[i2] -= m, r2[i2] -= m * r2[i2 - 1];
  a2[n2 - 1] = r2[n2 - 1] / b2[n2 - 1];
  for (i2 = n2 - 2; i2 >= 0; --i2) a2[i2] = (r2[i2] - a2[i2 + 1]) / b2[i2];
  b2[n2 - 1] = (x2[n2] + a2[n2 - 1]) / 2;
  for (i2 = 0; i2 < n2 - 1; ++i2) b2[i2] = 2 * x2[i2 + 1] - a2[i2 + 1];
  return [a2, b2];
}

// node_modules/d3-sankey/node_modules/d3-shape/src/curve/step.js
function Step(context, t2) {
  this._context = context;
  this._t = t2;
}
Step.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x = this._y = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    if (this._line >= 0) this._t = 1 - this._t, this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x2, y2) : this._context.moveTo(x2, y2);
        break;
      case 1:
        this._point = 2;
      // proceed
      default: {
        if (this._t <= 0) {
          this._context.lineTo(this._x, y2);
          this._context.lineTo(x2, y2);
        } else {
          var x1 = this._x * (1 - this._t) + x2 * this._t;
          this._context.lineTo(x1, this._y);
          this._context.lineTo(x1, y2);
        }
        break;
      }
    }
    this._x = x2, this._y = y2;
  }
};

// node_modules/@nivo/sankey/dist/nivo-sankey.mjs
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var import_cloneDeep = __toESM(require_cloneDeep(), 1);
function E2() {
  return E2 = Object.assign ? Object.assign.bind() : function(e2) {
    for (var o2 = 1; o2 < arguments.length; o2++) {
      var n2 = arguments[o2];
      for (var t2 in n2) ({}).hasOwnProperty.call(n2, t2) && (e2[t2] = n2[t2]);
    }
    return e2;
  }, E2.apply(null, arguments);
}
function G(e2, o2) {
  if (null == e2) return {};
  var n2 = {};
  for (var t2 in e2) if ({}.hasOwnProperty.call(e2, t2)) {
    if (-1 !== o2.indexOf(t2)) continue;
    n2[t2] = e2[t2];
  }
  return n2;
}
var j = { container: { display: "flex", alignItems: "center" }, sourceChip: { marginRight: 7 }, targetChip: { marginLeft: 7, marginRight: 7 } };
var D = { center, justify, start: left, end: right };
var V = Object.keys(D);
var A = function(e2) {
  return D[e2];
};
var Z = { layout: "horizontal", align: "center", sort: "auto", colors: { scheme: "nivo" }, nodeOpacity: 0.75, nodeHoverOpacity: 1, nodeHoverOthersOpacity: 0.15, nodeThickness: 12, nodeSpacing: 12, nodeInnerPadding: 0, nodeBorderWidth: 1, nodeBorderColor: { from: "color", modifiers: [["darker", 0.5]] }, nodeBorderRadius: 0, linkOpacity: 0.25, linkHoverOpacity: 0.6, linkHoverOthersOpacity: 0.15, linkContract: 0, linkBlendMode: "multiply", enableLinkGradient: false, enableLabels: true, label: "id", labelPosition: "inside", labelPadding: 9, labelOrientation: "horizontal", labelTextColor: { from: "color", modifiers: [["darker", 0.8]] }, labelComponent: b, isInteractive: true, nodeTooltip: function(e2) {
  var o2 = e2.node;
  return (0, import_jsx_runtime.jsx)(T, { id: o2.label, enableChip: true, color: o2.color });
}, linkTooltip: function(e2) {
  var o2 = e2.link;
  return (0, import_jsx_runtime.jsx)(T, { id: (0, import_jsx_runtime.jsxs)("span", { style: j.container, children: [(0, import_jsx_runtime.jsx)(w, { color: o2.source.color, style: j.sourceChip }), (0, import_jsx_runtime.jsx)("strong", { children: o2.source.label }), " > ", (0, import_jsx_runtime.jsx)("strong", { children: o2.target.label }), (0, import_jsx_runtime.jsx)(w, { color: o2.target.color, style: j.targetChip }), (0, import_jsx_runtime.jsx)("strong", { children: o2.formattedValue })] }) });
}, legends: [], layers: ["links", "nodes", "labels", "legends"], role: "img", animate: true, motionConfig: "gentle" };
var q = function(e2) {
  return e2.id;
};
var U = function(n2) {
  var t2 = n2.data, i2 = n2.valueFormat, r2 = n2.layout, l2 = n2.width, c = n2.height, s2 = n2.sort, u = n2.align, h = n2.colors, v = n2.nodeThickness, p = n2.nodeSpacing, f = n2.nodeInnerPadding, g = n2.nodeBorderColor, y2 = n2.label, m = n2.labelTextColor, k2 = (0, import_react.useState)(null), C = k2[0], x2 = k2[1], O = (0, import_react.useState)(null), L = O[0], w3 = O[1], H2 = (0, import_react.useMemo)((function() {
    if ("auto" !== s2) return "input" === s2 ? null : "ascending" === s2 ? function(e2, o2) {
      return e2.value - o2.value;
    } : "descending" === s2 ? function(e2, o2) {
      return o2.value - e2.value;
    } : s2;
  }), [s2]), I2 = "input" === s2 ? null : void 0, N = (0, import_react.useMemo)((function() {
    return "function" == typeof u ? u : A(u);
  }), [u]), W = M(), R = hr(h, "id"), z2 = Ye(g, W), F = bn(y2), S = Ye(m, W), E3 = hn(i2), G2 = (0, import_react.useMemo)((function() {
    return (function(e2) {
      var o2 = e2.data, n3 = e2.formatValue, t3 = e2.layout, i3 = e2.alignFunction, r3 = e2.sortFunction, l3 = e2.linkSortMode, a2 = e2.nodeThickness, d = e2.nodeSpacing, c2 = e2.nodeInnerPadding, s3 = e2.width, u2 = e2.height, h2 = e2.getColor, v2 = e2.getLabel, p2 = Sankey().nodeAlign(i3).nodeSort(r3).linkSort(l3).nodeWidth(a2).nodePadding(d).size("horizontal" === t3 ? [s3, u2] : [u2, s3]).nodeId(q), f2 = (0, import_cloneDeep.default)(o2);
      return p2(f2), f2.nodes.forEach((function(e3) {
        if (e3.color = h2(e3), e3.label = v2(e3), e3.formattedValue = n3(e3.value), "horizontal" === t3) e3.x = e3.x0 + c2, e3.y = e3.y0, e3.width = Math.max(e3.x1 - e3.x0 - 2 * c2, 0), e3.height = Math.max(e3.y1 - e3.y0, 0);
        else {
          e3.x = e3.y0, e3.y = e3.x0 + c2, e3.width = Math.max(e3.y1 - e3.y0, 0), e3.height = Math.max(e3.x1 - e3.x0 - 2 * c2, 0);
          var o3 = e3.x0, i4 = e3.x1;
          e3.x0 = e3.y0, e3.x1 = e3.y1, e3.y0 = o3, e3.y1 = i4;
        }
      })), f2.links.forEach((function(e3) {
        e3.formattedValue = n3(e3.value), e3.color = e3.source.color, e3.pos0 = e3.y0, e3.pos1 = e3.y1, e3.thickness = e3.width, delete e3.y0, delete e3.y1, delete e3.width;
      })), f2;
    })({ data: t2, formatValue: E3, layout: r2, alignFunction: N, sortFunction: H2, linkSortMode: I2, nodeThickness: v, nodeSpacing: p, nodeInnerPadding: f, width: l2, height: c, getColor: R, getLabel: F });
  }), [t2, E3, r2, N, H2, I2, v, p, f, l2, c, R, F]), j2 = G2.nodes, D2 = G2.links, V2 = (0, import_react.useMemo)((function() {
    return j2.map((function(e2) {
      return { id: e2.id, label: e2.label, color: e2.color };
    }));
  }), [j2]);
  return { nodes: j2, links: D2, legendData: V2, getNodeBorderColor: z2, currentNode: C, setCurrentNode: x2, currentLink: L, setCurrentLink: w3, getLabelTextColor: S };
};
var J = function(e2) {
  var o2 = e2.node, i2 = e2.x, r2 = e2.y, l2 = e2.width, a2 = e2.height, d = e2.color, s2 = e2.opacity, u = e2.borderWidth, h = e2.borderColor, v = e2.borderRadius, p = e2.setCurrent, f = e2.isInteractive, g = e2.onClick, y2 = e2.tooltip, m = Dr(), k2 = m.animate, b2 = m.config, C = useSpring({ x: i2, y: r2, width: l2, height: a2, opacity: s2, color: d, config: b2, immediate: !k2 }), x2 = z(), O = x2.showTooltipFromEvent, H2 = x2.hideTooltip, I2 = (0, import_react.useCallback)((function(e3) {
    p(o2), O((0, import_react.createElement)(y2, { node: o2 }), e3, "left");
  }), [p, o2, O, y2]), M3 = (0, import_react.useCallback)((function(e3) {
    O((0, import_react.createElement)(y2, { node: o2 }), e3, "left");
  }), [O, o2, y2]), T2 = (0, import_react.useCallback)((function() {
    p(null), H2();
  }), [p, H2]), B = (0, import_react.useCallback)((function(e3) {
    null == g || g(o2, e3);
  }), [g, o2]);
  return (0, import_jsx_runtime.jsx)(animated.rect, { x: C.x, y: C.y, rx: v, ry: v, width: C.width.to((function(e3) {
    return Math.max(e3, 0);
  })), height: C.height.to((function(e3) {
    return Math.max(e3, 0);
  })), fill: C.color, fillOpacity: C.opacity, strokeWidth: u, stroke: h, strokeOpacity: s2, onMouseEnter: f ? I2 : void 0, onMouseMove: f ? M3 : void 0, onMouseLeave: f ? T2 : void 0, onClick: f ? B : void 0 });
};
var K = function(e2) {
  var o2 = e2.nodes, n2 = e2.nodeOpacity, t2 = e2.nodeHoverOpacity, i2 = e2.nodeHoverOthersOpacity, r2 = e2.borderWidth, l2 = e2.getBorderColor, a2 = e2.borderRadius, d = e2.setCurrentNode, c = e2.currentNode, s2 = e2.currentLink, u = e2.isCurrentNode, h = e2.isInteractive, v = e2.onClick, p = e2.tooltip, f = function(e3) {
    return c || s2 ? u(e3) ? t2 : i2 : n2;
  };
  return (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: o2.map((function(e3) {
    return (0, import_jsx_runtime.jsx)(J, { node: e3, x: e3.x, y: e3.y, width: e3.width, height: e3.height, color: e3.color, opacity: f(e3), borderWidth: r2, borderColor: l2(e3), borderRadius: a2, setCurrent: d, isInteractive: h, onClick: v, tooltip: p }, e3.id);
  })) });
};
var Q = function(e2) {
  var o2 = e2.id, n2 = e2.layout, t2 = e2.startColor, i2 = e2.endColor;
  return (0, import_jsx_runtime.jsxs)("linearGradient", E2({ id: o2, spreadMethod: "pad" }, "horizontal" === n2 ? { x1: "0%", x2: "100%", y1: "0%", y2: "0%" } : { x1: "0%", x2: "0%", y1: "0%", y2: "100%" }, { children: [(0, import_jsx_runtime.jsx)("stop", { offset: "0%", stopColor: t2 }), (0, import_jsx_runtime.jsx)("stop", { offset: "100%", stopColor: i2 })] }));
};
var X = function(e2) {
  var o2 = e2.link, i2 = e2.layout, r2 = e2.path, l2 = e2.color, a2 = e2.opacity, d = e2.blendMode, u = e2.enableGradient, h = e2.setCurrent, v = e2.tooltip, p = e2.isInteractive, f = e2.onClick, g = o2.source.id + "." + o2.target.id + "." + o2.index, y2 = Dr(), m = y2.animate, k2 = y2.config, b2 = It(r2), C = useSpring({ color: l2, opacity: a2, config: k2, immediate: !m }), x2 = z(), O = x2.showTooltipFromEvent, M3 = x2.hideTooltip, T2 = (0, import_react.useCallback)((function(e3) {
    h(o2), O((0, import_react.createElement)(v, { link: o2 }), e3, "left");
  }), [h, o2, O, v]), B = (0, import_react.useCallback)((function(e3) {
    O((0, import_react.createElement)(v, { link: o2 }), e3, "left");
  }), [O, o2, v]), P = (0, import_react.useCallback)((function() {
    h(null), M3();
  }), [h, M3]), R = (0, import_react.useCallback)((function(e3) {
    null == f || f(o2, e3);
  }), [f, o2]);
  return (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [u && (0, import_jsx_runtime.jsx)(Q, { id: g, layout: i2, startColor: o2.startColor || o2.source.color, endColor: o2.endColor || o2.target.color }), (0, import_jsx_runtime.jsx)(animated.path, { fill: u ? 'url("#' + encodeURI(g) + '")' : C.color, d: b2, fillOpacity: C.opacity, onMouseEnter: p ? T2 : void 0, onMouseMove: p ? B : void 0, onMouseLeave: p ? P : void 0, onClick: p ? R : void 0, style: { mixBlendMode: d } })] });
};
var Y = function(e2) {
  var n2 = e2.links, t2 = e2.layout, i2 = e2.linkOpacity, r2 = e2.linkHoverOpacity, l2 = e2.linkHoverOthersOpacity, a2 = e2.linkContract, d = e2.linkBlendMode, c = e2.enableLinkGradient, s2 = e2.setCurrentLink, u = e2.currentLink, h = e2.currentNode, v = e2.isCurrentLink, p = e2.isInteractive, f = e2.onClick, g = e2.tooltip, y2 = function(e3) {
    return h || u ? v(e3) ? r2 : l2 : i2;
  }, m = (0, import_react.useMemo)((function() {
    return "horizontal" === t2 ? (e3 = line_default().curve(monotoneX), function(o2, n3) {
      var t3 = Math.max(1, o2.thickness - 2 * n3) / 2, i3 = 0.12 * (o2.target.x0 - o2.source.x1), r3 = [[o2.source.x1, o2.pos0 - t3], [o2.source.x1 + i3, o2.pos0 - t3], [o2.target.x0 - i3, o2.pos1 - t3], [o2.target.x0, o2.pos1 - t3], [o2.target.x0, o2.pos1 + t3], [o2.target.x0 - i3, o2.pos1 + t3], [o2.source.x1 + i3, o2.pos0 + t3], [o2.source.x1, o2.pos0 + t3], [o2.source.x1, o2.pos0 - t3]];
      return e3(r3) + "Z";
    }) : (function() {
      var e4 = line_default().curve(monotoneY);
      return function(o2, n3) {
        var t3 = Math.max(1, o2.thickness - 2 * n3) / 2, i3 = 0.12 * (o2.target.y0 - o2.source.y1), r3 = [[o2.pos0 + t3, o2.source.y1], [o2.pos0 + t3, o2.source.y1 + i3], [o2.pos1 + t3, o2.target.y0 - i3], [o2.pos1 + t3, o2.target.y0], [o2.pos1 - t3, o2.target.y0], [o2.pos1 - t3, o2.target.y0 - i3], [o2.pos0 - t3, o2.source.y1 + i3], [o2.pos0 - t3, o2.source.y1], [o2.pos0 + t3, o2.source.y1]];
        return e4(r3) + "Z";
      };
    })();
    var e3;
  }), [t2]);
  return (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: n2.map((function(e3) {
    return (0, import_jsx_runtime.jsx)(X, { link: e3, layout: t2, path: m(e3, a2), color: e3.color, opacity: y2(e3), blendMode: d, enableGradient: c, setCurrent: s2, isInteractive: p, onClick: f, tooltip: g }, e3.source.id + "." + e3.target.id + "." + e3.index);
  })) });
};
var $ = function(e2) {
  var o2 = e2.nodes, n2 = e2.layout, t2 = e2.width, i2 = e2.height, r2 = e2.labelPosition, l2 = e2.labelPadding, a2 = e2.labelOrientation, d = e2.getLabelTextColor, s2 = e2.labelComponent, u = M(), h = "vertical" === a2 ? -90 : 0, v = o2.map((function(e3) {
    var o3, c, s3;
    return "horizontal" === n2 ? (c = e3.y + e3.height / 2, e3.x < t2 / 2 ? "inside" === r2 ? (o3 = e3.x1 + l2, s3 = "vertical" === a2 ? "middle" : "start") : (o3 = e3.x - l2, s3 = "vertical" === a2 ? "middle" : "end") : "inside" === r2 ? (o3 = e3.x - l2, s3 = "vertical" === a2 ? "middle" : "end") : (o3 = e3.x1 + l2, s3 = "vertical" === a2 ? "middle" : "start")) : "vertical" === n2 && (o3 = e3.x + e3.width / 2, e3.y < i2 / 2 ? "inside" === r2 ? (c = e3.y1 + l2, s3 = "vertical" === a2 ? "end" : "middle") : (c = e3.y - l2, s3 = "vertical" === a2 ? "start" : "middle") : "inside" === r2 ? (c = e3.y - l2, s3 = "vertical" === a2 ? "start" : "middle") : (c = e3.y1 + l2, s3 = "vertical" === a2 ? "end" : "middle")), { id: e3.id, label: e3.label, x: o3, y: c, textAnchor: s3, color: d(e3) };
  })), p = Dr(), f = p.animate, g = p.config, y2 = useSprings(v.length, v.map((function(e3) {
    return { transform: "translate(" + e3.x + ", " + e3.y + ") rotate(" + h + ")", color: e3.color, config: g, immediate: !f };
  })));
  return (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: y2.map((function(e3, n3) {
    var t3 = v[n3];
    return (0, import_jsx_runtime.jsx)(s2, { dominantBaseline: "central", textAnchor: t3.textAnchor, transform: e3.transform, style: E2({}, u.labels.text, { fill: e3.color, pointerEvents: "none" }), node: o2[n3], children: t3.label }, t3.id);
  })) });
};
var _ = ["isInteractive", "animate", "motionConfig", "theme", "renderWrapper"];
var ee = function(e2) {
  var n2 = e2.data, i2 = e2.valueFormat, a2 = e2.layout, d = void 0 === a2 ? Z.layout : a2, c = e2.sort, s2 = void 0 === c ? Z.sort : c, u = e2.align, p = void 0 === u ? Z.align : u, g = e2.width, y2 = e2.height, m = e2.margin, k2 = e2.colors, b2 = void 0 === k2 ? Z.colors : k2, C = e2.nodeThickness, x2 = void 0 === C ? Z.nodeThickness : C, O = e2.nodeSpacing, L = void 0 === O ? Z.nodeThickness : O, H2 = e2.nodeInnerPadding, I2 = void 0 === H2 ? Z.nodeInnerPadding : H2, M3 = e2.nodeBorderColor, T2 = void 0 === M3 ? Z.nodeBorderColor : M3, B = e2.nodeOpacity, P = void 0 === B ? Z.nodeOpacity : B, N = e2.nodeHoverOpacity, W = void 0 === N ? Z.nodeHoverOpacity : N, R = e2.nodeHoverOthersOpacity, z2 = void 0 === R ? Z.nodeHoverOthersOpacity : R, F = e2.nodeBorderWidth, S = void 0 === F ? Z.nodeBorderWidth : F, G2 = e2.nodeBorderRadius, j2 = void 0 === G2 ? Z.nodeBorderRadius : G2, D2 = e2.linkOpacity, V2 = void 0 === D2 ? Z.linkOpacity : D2, A2 = e2.linkHoverOpacity, q2 = void 0 === A2 ? Z.linkHoverOpacity : A2, J2 = e2.linkHoverOthersOpacity, Q2 = void 0 === J2 ? Z.linkHoverOthersOpacity : J2, X2 = e2.linkContract, _2 = void 0 === X2 ? Z.linkContract : X2, ee2 = e2.linkBlendMode, oe2 = void 0 === ee2 ? Z.linkBlendMode : ee2, ne2 = e2.enableLinkGradient, te2 = void 0 === ne2 ? Z.enableLinkGradient : ne2, ie = e2.enableLabels, re = void 0 === ie ? Z.enableLabels : ie, le = e2.labelComponent, ae = void 0 === le ? Z.labelComponent : le, de = e2.labelPosition, ce = void 0 === de ? Z.labelPosition : de, se = e2.labelPadding, ue = void 0 === se ? Z.labelPadding : se, he = e2.labelOrientation, ve = void 0 === he ? Z.labelOrientation : he, pe = e2.label, fe = void 0 === pe ? Z.label : pe, ge = e2.labelTextColor, ye = void 0 === ge ? Z.labelTextColor : ge, me = e2.nodeTooltip, ke = void 0 === me ? Z.nodeTooltip : me, be = e2.linkTooltip, Ce = void 0 === be ? Z.linkTooltip : be, xe = e2.isInteractive, Oe = void 0 === xe ? Z.isInteractive : xe, Le = e2.onClick, we = e2.legends, He = void 0 === we ? Z.legends : we, Ie = e2.layers, Me = void 0 === Ie ? Z.layers : Ie, Te = e2.role, Be = void 0 === Te ? Z.role : Te, Pe = e2.ariaLabel, Ne = e2.ariaLabelledBy, We = e2.ariaDescribedBy, Re = e2.forwardedRef, ze = cn(g, y2, m), Fe = ze.margin, Se = ze.innerWidth, Ee = ze.innerHeight, Ge = ze.outerWidth, je = ze.outerHeight, De = U({ data: n2, valueFormat: i2, layout: d, width: Se, height: Ee, sort: s2, align: p, colors: b2, nodeThickness: x2, nodeSpacing: L, nodeInnerPadding: I2, nodeBorderColor: T2, label: fe, labelTextColor: ye }), Ve = De.nodes, Ae = De.links, Ze = De.legendData, qe = De.getNodeBorderColor, Ue = De.currentNode, Je = De.setCurrentNode, Ke = De.currentLink, Qe = De.setCurrentLink, Xe = De.getLabelTextColor, Ye2 = (0, import_react.useMemo)((function() {
    var e3 = function() {
      return false;
    }, o2 = function() {
      return false;
    };
    if (Ke && (e3 = function(e4) {
      var o3 = e4.id;
      return o3 === Ke.source.id || o3 === Ke.target.id;
    }, o2 = function(e4) {
      var o3 = e4.source, n4 = e4.target;
      return o3.id === Ke.source.id && n4.id === Ke.target.id;
    }), Ue) {
      var n3 = [Ue.id];
      Ae.filter((function(e4) {
        var o3 = e4.source, n4 = e4.target;
        return o3.id === Ue.id || n4.id === Ue.id;
      })).forEach((function(e4) {
        var o3 = e4.source, t2 = e4.target;
        n3.push(o3.id), n3.push(t2.id);
      })), n3 = (0, import_uniq.default)(n3), e3 = function(e4) {
        var o3 = e4.id;
        return n3.includes(o3);
      }, o2 = function(e4) {
        var o3 = e4.source, n4 = e4.target;
        return o3.id === Ue.id || n4.id === Ue.id;
      };
    }
    return { isCurrentNode: e3, isCurrentLink: o2 };
  }), [Ke, Ue, Ae]), $e = Ye2.isCurrentNode, _e = Ye2.isCurrentLink, eo = (0, import_react.useMemo)((function() {
    return { links: Ae, nodes: Ve, margin: Fe, width: g, height: y2, outerWidth: Ge, outerHeight: je, currentNode: Ue, isCurrentNode: $e, setCurrentNode: Je, currentLink: Ke, isCurrentLink: _e, setCurrentLink: Qe, isInteractive: Oe };
  }), [Ae, Ve, Fe, g, y2, Ge, je, Ue, $e, Je, Ke, _e, Qe, Oe]), oo = { links: null, nodes: null, labels: null, legends: null };
  return Me.includes("links") && (oo.links = (0, import_jsx_runtime.jsx)(Y, { links: Ae, layout: d, linkContract: _2, linkOpacity: V2, linkHoverOpacity: q2, linkHoverOthersOpacity: Q2, linkBlendMode: oe2, enableLinkGradient: te2, setCurrentLink: Qe, currentNode: Ue, currentLink: Ke, isCurrentLink: _e, isInteractive: Oe, onClick: Le, tooltip: Ce }, "links")), Me.includes("nodes") && (oo.nodes = (0, import_jsx_runtime.jsx)(K, { nodes: Ve, nodeOpacity: P, nodeHoverOpacity: W, nodeHoverOthersOpacity: z2, borderWidth: S, borderRadius: j2, getBorderColor: qe, setCurrentNode: Je, currentNode: Ue, currentLink: Ke, isCurrentNode: $e, isInteractive: Oe, onClick: Le, tooltip: ke }, "nodes")), Me.includes("labels") && re && (oo.labels = (0, import_jsx_runtime.jsx)($, { nodes: Ve, layout: d, width: Se, height: Ee, labelPosition: ce, labelPadding: ue, labelOrientation: ve, getLabelTextColor: Xe, labelComponent: ae }, "labels")), Me.includes("legends") && (oo.legends = (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: He.map((function(e3, o2) {
    return (0, import_jsx_runtime.jsx)(E, E2({}, e3, { containerWidth: Se, containerHeight: Ee, data: Ze }), "legend" + o2);
  })) }, "legends")), (0, import_jsx_runtime.jsx)(Rt, { width: Ge, height: je, margin: Fe, role: Be, ariaLabel: Pe, ariaLabelledBy: Ne, ariaDescribedBy: We, ref: Re, children: Me.map((function(e3, o2) {
    var n3;
    return "function" == typeof e3 ? (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: (0, import_react.createElement)(e3, eo) }, o2) : null != (n3 = null == oo ? void 0 : oo[e3]) ? n3 : null;
  })) });
};
var oe = (0, import_react.forwardRef)((function(e2, o2) {
  var n2 = e2.isInteractive, t2 = void 0 === n2 ? Z.isInteractive : n2, i2 = e2.animate, r2 = void 0 === i2 ? Z.animate : i2, l2 = e2.motionConfig, a2 = void 0 === l2 ? Z.motionConfig : l2, d = e2.theme, c = e2.renderWrapper, s2 = G(e2, _);
  return (0, import_jsx_runtime.jsx)(Fr, { animate: r2, isInteractive: t2, motionConfig: a2, renderWrapper: c, theme: d, children: (0, import_jsx_runtime.jsx)(ee, E2({ isInteractive: t2 }, s2, { forwardedRef: o2 })) });
}));
var ne = ["defaultWidth", "defaultHeight", "onResize", "debounceResize"];
var te = (0, import_react.forwardRef)((function(e2, o2) {
  var n2 = e2.defaultWidth, t2 = e2.defaultHeight, i2 = e2.onResize, r2 = e2.debounceResize, l2 = G(e2, ne);
  return (0, import_jsx_runtime.jsx)($r, { defaultWidth: n2, defaultHeight: t2, onResize: i2, debounceResize: r2, children: function(e3) {
    var n3 = e3.width, t3 = e3.height;
    return (0, import_jsx_runtime.jsx)(oe, E2({ width: n3, height: t3 }, l2, { ref: o2 }));
  } });
}));
export {
  te as ResponsiveSankey,
  oe as Sankey,
  A as sankeyAlignmentFromProp,
  V as sankeyAlignmentPropKeys,
  D as sankeyAlignmentPropMapping,
  Z as svgDefaultProps
};
//# sourceMappingURL=@nivo_sankey.js.map
