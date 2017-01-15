define(["require", "exports"], function (require, exports) {
    "use strict";
    function hashVertex(vertex) {
        return vertex.x + "|" + vertex.y;
    }
    var VertexSet = (function () {
        function VertexSet() {
            this._set = {};
        }
        VertexSet.prototype.insert = function (vertex) {
            var hash = hashVertex(vertex);
            if (this._checkHash(hash))
                throw "Vertex already contained in set";
            this._set[hash] = vertex;
        };
        VertexSet.prototype.contains = function (vertex) {
            var hash = hashVertex(vertex);
            return this._checkHash(hash);
        };
        VertexSet.prototype.remove = function (vertex) {
            var hash = hashVertex(vertex);
            delete this._set[hash];
        };
        VertexSet.prototype.forEach = function (func) {
            var _cancel = false;
            var cancel = function () { return _cancel = true; };
            for (var v in this._set) {
                func(this._set[v], cancel);
                if (_cancel)
                    break;
            }
        };
        VertexSet.prototype.clear = function () {
            this._set = {};
        };
        VertexSet.prototype._checkHash = function (hash) {
            return !!this._set[hash];
        };
        return VertexSet;
    }());
    exports.VertexSet = VertexSet;
});
//# sourceMappingURL=common.js.map