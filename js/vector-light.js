define(["require", "exports"], function (require, exports) {
    "use strict";
    var sqrt = Math.sqrt;
    var cos = Math.cos;
    var sin = Math.sin;
    var vec2;
    (function (vec2) {
        function str(x, y) {
            return "(" + x + "," + y + ")";
        }
        vec2.str = str;
        function mul(s, x, y) {
            return { x: s * x, y: s * y };
        }
        vec2.mul = mul;
        function div(s, x, y) {
            return { x: x / s, y: y / s };
        }
        vec2.div = div;
        function add(x1, y1, x2, y2) {
            return { x: x1 + x2, y: y1 + y2 };
        }
        vec2.add = add;
        function sub(x1, y1, x2, y2) {
            return { x: x1 - x2, y: y1 - y2 };
        }
        vec2.sub = sub;
        function permul(x1, y1, x2, y2) {
            return { x: x1 * x2, y: y1 * y2 };
        }
        vec2.permul = permul;
        function dot(x1, y1, x2, y2) {
            return x1 * x2 + y1 * y2;
        }
        vec2.dot = dot;
        function det(x1, y1, x2, y2) {
            return x1 * y2 - y1 * x2;
        }
        vec2.det = det;
        function eq(x1, y1, x2, y2) {
            return x1 == x2 && y1 == y2;
        }
        vec2.eq = eq;
        function eqV(a, b) {
            return a.x == b.x && a.y == b.y;
        }
        vec2.eqV = eqV;
        function lt(x1, y1, x2, y2) {
            return x1 < x2 || (x1 == x2 && y1 < y2);
        }
        vec2.lt = lt;
        function le(x1, y1, x2, y2) {
            return x1 <= x2 && y1 <= y2;
        }
        vec2.le = le;
        function len2(x, y) {
            return x * x + y * y;
        }
        vec2.len2 = len2;
        function len(x, y) {
            return sqrt(x * x + y * y);
        }
        vec2.len = len;
        function dist(x1, y1, x2, y2) {
            return len(x1 - x2, y1 - y2);
        }
        vec2.dist = dist;
        function normalize(x, y) {
            var l = len(x, y);
            return { x: x / l, y: y / l };
        }
        vec2.normalize = normalize;
        function rotate(phi, x, y) {
            var c = cos(phi);
            var s = sin(phi);
            return { x: c * x - s * y, y: s * x + c * y };
        }
        vec2.rotate = rotate;
        function perpendicular(x, y) {
            return { x: -y, y: x };
        }
        vec2.perpendicular = perpendicular;
        function project(x, y, u, v) {
            var s = (x * u + y * v) / (u * u + v * v);
            return { x: s * u, y: s * v };
        }
        vec2.project = project;
        function mirror(x, y, u, v) {
            var s = 2 * (x * u + y * v) / (u * u + v * v);
            return { x: s * u - x, y: s * v - y };
        }
        vec2.mirror = mirror;
    })(vec2 = exports.vec2 || (exports.vec2 = {}));
});
//# sourceMappingURL=vector-light.js.map