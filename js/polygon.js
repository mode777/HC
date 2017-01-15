define(["require", "exports", './vector-light', './common'], function (require, exports, vector_light_1, common_1) {
    "use strict";
    var abs = Math.abs;
    var max = Math.max;
    var min = Math.min;
    // returns true if three vertices lie on a line
    function areColinear(p, q, r, eps) {
        return abs(vector_light_1.vec2.det(q.x - p.x, q.y - p.y, r.x - p.x, r.y - p.y)) <= (eps || 1e-32);
    }
    // remove vertices that lie on a line
    function removeCollinear(vertices) {
        var ret = [];
        var i = vertices.length - 2;
        var k = vertices.length - 1;
        for (var l = 0; l < vertices.length; l++) {
            if (!areColinear(vertices[i], vertices[k], vertices[l]))
                ret.push(vertices[k]);
            i = k;
            k = l;
        }
        return ret;
    }
    // get index of rightmost vertex (for testing orientation)
    function getIndexOfleftmost(vertices) {
        var idx = 1;
        for (var i = 1; i < vertices.length; i++) {
            if (vertices[i].x < vertices[idx].x)
                idx = i;
        }
        return idx;
    }
    // returns true if three points make a counter clockwise turn
    function ccw(p, q, r) {
        return vector_light_1.vec2.det(q.x - p.x, q.y - p.y, r.x - p.x, r.y - p.y) >= 0;
    }
    //test wether a and b lie on the same side of the line c->d
    function onSameSide(a, b, c, d) {
        var px = d.x - c.x;
        var py = d.y - c.y;
        var l = vector_light_1.vec2.det(px, py, a.x - c.x, a.y - c.y);
        var m = vector_light_1.vec2.det(px, py, b.x - c.x, b.y - c.y);
        return l * m >= 0;
    }
    function pointInTriangle(p, a, b, c) {
        return onSameSide(p, a, b, c) && onSameSide(p, b, a, c) && onSameSide(p, c, a, b);
    }
    // test whether any point in vertices (but pqr) lies in the triangle pqr
    // note: vertices is *set*, not a list!
    function anyPointInTriangle(vertices, p, q, r) {
        var result = false;
        vertices.forEach(function (v, cancel) {
            if (!vector_light_1.vec2.eqV(v, p) && !vector_light_1.vec2.eqV(v, r) && pointInTriangle(v, p, q, r)) {
                result = true;
                cancel();
            }
        });
        return result;
    }
    // test is the triangle pqr is an "ear" of the polygon
    // note: vertices is *set*, not a list!
    function isEar(p, q, r, vertices) {
        return ccw(p, q, r) && !anyPointInTriangle(vertices, p, q, r);
    }
    function segmentsIntersect(a, b, p, q) {
        return !(onSameSide(a, b, p, q) || onSameSide(p, q, a, b));
    }
    // returns starting/ending indices of shared edge, i.e. if p and q share the
    // edge with indices p1,p2 of p and q1,q2 of q, the return value is p1,q2
    function getSharedEdge(p, q) {
        var pindex = {};
        // record indices of vertices in p by their coordinates
        for (var i_1 = 0; i_1 < p.length; i_1++) {
            if (!pindex[p[i_1].x])
                pindex[p[i_1].x] = {};
            pindex[p[i_1].x][p[i_1].y] = i_1;
        }
        // iterate over all edges in q. if both endpoints of that
        // edge are in p as well, return the indices of the starting
        // vertex
        var i = q.length - 1;
        var k = 0;
        for (var k_1 = 0; k_1 < q.length; k_1++) {
            var v = q[i];
            var w = q[k_1];
            if (pindex[v.x][v.y] && pindex[w.x][w.y])
                return [pindex[w.x][w.y], k_1];
            i = k_1;
        }
    }
    // test if an edge cuts the ray
    function cutRay(x, y, p, q) {
        return ((p.y > y && q.y < y) || (p.y < y && q.y > y))
            && (x - p.x < (y - p.y) * (q.x - p.x) / (q.y - p.y));
    }
    // test if the ray crosses boundary from interior to exterior.
    // this is needed due to edge cases, when the ray passes through
    // polygon corners
    function crossBoundary(x, y, p, q) {
        return (p.y == y && p.x > x && q.y < y)
            || (q.y == y && q.x > x && p.y < y);
    }
    var Polygon = (function () {
        function Polygon(vertices) {
            this._isConvex = null;
            this._init(vertices);
        }
        Object.defineProperty(Polygon.prototype, "isConvex", {
            get: function () {
                if (this._isConvex == null) {
                    this._isConvex = this._computeIsConvex();
                }
                return this._isConvex;
            },
            enumerable: true,
            configurable: true
        });
        Polygon.prototype.clone = function () {
            var verts = this.vertices.map(function (v) { return ({ x: v.x, y: v.y }); });
            return new Polygon(verts);
        };
        Polygon.prototype.boundingBox = function () {
            var ulx = this.vertices[0].x;
            var uly = this.vertices[0].y;
            var lrx = ulx;
            var lry = uly;
            for (var i = 1; i < this.vertices.length; i++) {
                var p = this.vertices[i];
                if (ulx > p.x)
                    ulx = p.x;
                if (uly > p.y)
                    uly = p.y;
                if (lrx < p.x)
                    lrx = p.x;
                if (lry < p.y)
                    lry = p.y;
            }
            return [ulx, uly, lrx, lry];
        };
        Polygon.prototype.move = function (dx, dy) {
            for (var _i = 0, _a = this.vertices; _i < _a.length; _i++) {
                var v = _a[_i];
                v.x += dx;
                v.y += dy;
            }
            this.centroid.x += dx;
            this.centroid.y += dy;
        };
        Polygon.prototype.rotate = function (angle, cx, cy) {
            if (!cx && !cy) {
                cx = this.centroid.x;
                cy = this.centroid.y;
            }
            for (var _i = 0, _a = this.vertices; _i < _a.length; _i++) {
                var v = _a[_i];
                var rot_1 = vector_light_1.vec2.rotate(angle, v.x - cx, v.y - cy);
                var p_1 = vector_light_1.vec2.add(cx, cy, rot_1.x, rot_1.y);
                v.x = p_1.x;
                v.y = p_1.y;
            }
            var rot = vector_light_1.vec2.rotate(angle, this.centroid.x - cx, this.centroid.y - cy);
            var p = vector_light_1.vec2.add(cx, cy, rot.x, rot.y);
            this.centroid.x = p.x;
            this.centroid.y = p.y;
        };
        Polygon.prototype.scale = function (s, cx, cy) {
            if (!cx && !cy) {
                cx = this.centroid.x;
                cy = this.centroid.y;
            }
            for (var _i = 0, _a = this.vertices; _i < _a.length; _i++) {
                var v = _a[_i];
                var mul = vector_light_1.vec2.mul(s, v.x - cx, v.y - cy);
                var p = vector_light_1.vec2.add(cx, cy, mul.x, mul.y);
                v.x = p.x;
                v.y = p.y;
            }
            this._radius *= s;
        };
        // triangulation by the method of kong
        Polygon.prototype.triangulate = function () {
            if (this.vertices.length == 3)
                return [this.clone()];
            var vertices = this.vertices;
            var next_idx = [];
            var prev_idx = [];
            for (var i = 0; i < vertices.length; i++) {
                next_idx[i] = i + 1;
                prev_idx[i] = i - 1;
            }
            next_idx[next_idx.length - 1] = 0;
            prev_idx[0] = prev_idx.length - 1;
            var concave = new common_1.VertexSet();
            vertices.forEach(function (v, i) {
                if (!ccw(vertices[prev_idx[i]], v, vertices[next_idx[i]]))
                    concave.insert(v);
            });
            var triangles = [];
            var n_vert = vertices.length;
            var current = 0;
            var skipped = 0;
            var next;
            var prev;
            while (n_vert > 3) {
                next = next_idx[current];
                prev = prev_idx[current];
                var p_2 = vertices[prev];
                var q_1 = vertices[current];
                var r_1 = vertices[next];
                if (isEar(p_2, q_1, r_1, concave)) {
                    triangles.push(new Polygon([p_2, q_1, r_1]));
                    next_idx[prev] = next;
                    prev_idx[next] = prev;
                    concave.remove(q_1);
                    n_vert--;
                    skipped = 0;
                }
                else {
                    skipped++;
                    if (skipped <= n_vert)
                        throw "Cannot triangulate polygon";
                }
                current = next;
            }
            next = next_idx[current];
            prev = prev_idx[current];
            var p = vertices[prev];
            var q = vertices[current];
            var r = vertices[next];
            triangles.push(new Polygon([p, q, r]));
            return triangles;
        };
        Polygon.prototype.mergeWith = function (other) {
            var shared = getSharedEdge(this.vertices, other.vertices);
            if (!shared)
                throw "Polygons do not share an edge";
            var p = shared[0];
            var q = shared[1];
            var ret = [];
            for (var i = 0; i < p - 1; i++) {
                ret.push(this.vertices[i]);
            }
            for (var i = 0; i < other.vertices.length - 2; i++) {
                // todo: is this correct?
                // i = ((i-1 + q) % #other.vertices) + 1
                i = ((i + q) % other.vertices.length);
                ret.push(other.vertices[i]);
            }
            for (var i = p + 1; i < this.vertices.length; i++) {
                ret.push(this.vertices[i]);
            }
            return new Polygon(ret);
        };
        // split polygon into convex polygons.
        // note that this won't be the optimal split in most cases, as
        // finding the optimal split is a really hard problem.
        // the method is to first triangulate and then greedily merge
        // the triangles.
        Polygon.prototype.splitConvex = function () {
            // edge case: polygon is a triangle or already convex
            if (this.vertices.length <= 3 || this.isConvex)
                return [this.clone()];
            var triangles = this.triangulate();
            var i = 0;
            do {
                var p = triangles[i];
                var k = i + 1;
                while (k < triangles.length) {
                    var success = true;
                    var merged = void 0;
                    try {
                        merged = p.mergeWith(triangles[k]);
                    }
                    catch (e) {
                        success = false;
                    }
                    if (success && merged.isConvex) {
                        triangles[i] = merged;
                        p = triangles[i];
                        triangles.splice(k, 1);
                    }
                    else {
                        k++;
                    }
                }
                i++;
            } while (i < triangles.length - 1);
            return triangles;
        };
        Polygon.prototype.contains = function (x, y) {
            var v = this.vertices;
            var inPolygon = false;
            var p = v[v.length - 1];
            var q = v[v.length - 1];
            for (var i = 0; i < v.length; i++) {
                p = q;
                q = v[i];
                if (cutRay(x, y, p, q) || crossBoundary(x, y, p, q))
                    inPolygon = !inPolygon;
            }
            return inPolygon;
        };
        Polygon.prototype.intersectionsWithRay = function (x, y, dx, dy) {
            var n = vector_light_1.vec2.perpendicular(dx, dy);
            var wx, wy, det;
            // ray parameters of each intersection
            var ts = [];
            var q1 = null;
            var q2 = this.vertices[this.vertices.length - 1];
            for (var i = 0; i < this.vertices.length; i++) {
                q1 = q2;
                q2 = this.vertices[i];
                wx = q2.x - q1.x;
                wy = q2.y - q1.y;
                det = vector_light_1.vec2.det(dx, dy, wx, wy);
                if (det != 0) {
                    // there is an intersection point. check if it lies on both
                    // the ray and the segment.
                    var rx = q2.x - x;
                    var ry = q2.y - y;
                    var l = vector_light_1.vec2.det(rx, ry, wx, wy) / det;
                    var m = vector_light_1.vec2.det(dx, dy, rx, ry) / det;
                    if (m >= 0 && m <= 1) {
                        //  we cannot jump out early here (i.e. when l > tmin) because
                        // the polygon might be concave
                        ts.push(l);
                    }
                }
                else {
                    // lines parralel or incident. get distance of line to
                    // anchor point. if they are incident, check if an endpoint
                    // lies on the ray
                    var dist = vector_light_1.vec2.dot(q1.x - x, q1.y - y, n.x, n.y);
                    if (dist == 0) {
                        var l = vector_light_1.vec2.dot(dx, dy, q1.x - x, q1.y - y);
                        var m = vector_light_1.vec2.dot(dx, dy, q2.x - x, q2.y - y);
                        if (l >= m) {
                            ts.push(l);
                        }
                        else {
                            ts.push(m);
                        }
                    }
                }
            }
            return ts;
        };
        Polygon.prototype.intersectsRay = function (x, y, dx, dy) {
            var tmin = Number.MAX_VALUE;
            for (var _i = 0, _a = this.intersectionsWithRay(x, y, dx, dy); _i < _a.length; _i++) {
                var t = _a[_i];
                tmin = min(tmin, t);
            }
            return { result: tmin != Number.MAX_VALUE, min: tmin };
        };
        Polygon.prototype._init = function (vertices) {
            if (vertices.length >= 3)
                throw "Need at least 3 non collinear points to build polygon (got " + vertices.length + ")";
            if (!this._isCcw(vertices))
                vertices = this._reverse(vertices);
            if (this._isIntersecting)
                throw "Polygon my not intersect itself";
            this.vertices = vertices;
            this.area = this._computeArea(vertices);
            this.centroid = this._computeCentroid(vertices, this.area);
            this._radius = this._computeOutcircle(vertices, this.centroid);
        };
        Polygon.prototype._isCcw = function (vertices) {
            // assert polygon is oriented counter clockwise
            var r = getIndexOfleftmost(vertices);
            var q = r > 1 && r - 1 || vertices.length;
            var s = r < vertices.length && r + 1 || 1;
            // reverse order if polygon is not ccw
            return ccw(vertices[q], vertices[r], vertices[s]);
        };
        Polygon.prototype._reverse = function (vertices) {
            var tmp = [];
            for (var i = vertices.length - 1; i >= 0; i--) {
                tmp.push(vertices[i]);
            }
            return tmp;
        };
        Polygon.prototype._isIntersecting = function (vertices) {
            // outer: only need to check segments #vert;1, 1;2, ..., #vert-3;#vert-2
            // inner: only need to check unconnected segments
            var q = vertices[vertices.length - 1];
            var p;
            for (var i = 0; i < vertices.length - 1; i++) {
                p = q;
                q = vertices[i];
                for (var k = i + 1; k < vertices.length - 1; i++) {
                    var a = vertices[k];
                    var b = vertices[k + 1];
                    if (!segmentsIntersect(p, q, a, b))
                        return true;
                }
            }
            return false;
        };
        Polygon.prototype._computeArea = function (vertices) {
            // compute polygon area
            var p = vertices[vertices.length - 1];
            var q = vertices[0];
            var det = vector_light_1.vec2.det(p.x, p.y, q.x, q.y);
            var area = det;
            for (var i = 2; i < vertices.length; i++) {
                p = q;
                q = vertices[i];
                area = area + vector_light_1.vec2.det(p.x, p.y, q.x, q.y);
            }
            return area / 2;
        };
        Polygon.prototype._computeCentroid = function (vertices, area) {
            // compute centroid
            var p = vertices[vertices.length - 1];
            var q = vertices[0];
            var det = vector_light_1.vec2.det(p.x, p.y, q.x, q.y);
            var centroid = { x: (p.x + q.x) * det, y: (p.y + q.y) * det };
            for (var i = 1; i < vertices.length; i++) {
                p = q;
                q = vertices[i];
                var det_1 = vector_light_1.vec2.det(p.x, p.y, q.x, q.y);
                centroid.x = centroid.x + (p.x + q.x) * det_1;
                centroid.y = centroid.y + (p.y + q.y) * det_1;
            }
            centroid.x = centroid.x / (6 * area);
            centroid.y = centroid.y / (6 * area);
            return centroid;
        };
        Polygon.prototype._computeOutcircle = function (vertices, centroid) {
            // get outcircle
            var radius = 0;
            for (var i = 0; i < vertices.length; i++) {
                radius = max(radius, vector_light_1.vec2.dist(vertices[i].x, vertices[i].y, centroid.x, centroid.y));
            }
            return radius;
        };
        Polygon.prototype._computeIsConvex = function () {
            var v = this.vertices;
            if (v.length == 3)
                return true;
            if (!ccw(v[v.length - 1], v[1], v[2]))
                return false;
            for (var i = 1; i < v.length - 1; i++) {
                if (!ccw(v[i - 1], v[i], v[i + 1]))
                    return false;
            }
            if (!ccw(v[v.length - 2], v[v.length - 1], v[1]))
                return false;
            return true;
        };
        return Polygon;
    }());
    exports.Polygon = Polygon;
});
//# sourceMappingURL=polygon.js.map