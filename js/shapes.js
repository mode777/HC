var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports"], function (require, exports) {
    "use strict";
    var Shape = (function () {
        function Shape() {
            this.init();
        }
        Shape.prototype.init = function () {
            this._rotation = 0;
        };
        Shape.prototype.moveTo = function (x, y) {
            var c = this.center;
            this.move(x - c.x, y - c.y);
        };
        Shape.prototype.move = function (x, y) {
        };
        Shape.prototype.rotate = function (angle) {
            this._rotation = this._rotation + angle;
        };
        Shape.prototype.setRotation = function (angle) {
            return this.rotate(angle - this._rotation);
        };
        Object.defineProperty(Shape.prototype, "center", {
            get: function () {
                return this._center;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape.prototype, "rotation", {
            get: function () {
                return this._rotation;
            },
            enumerable: true,
            configurable: true
        });
        return Shape;
    }());
    exports.Shape = Shape;
    var ConvexPolygonShape = (function (_super) {
        __extends(ConvexPolygonShape, _super);
        function ConvexPolygonShape() {
            _super.apply(this, arguments);
        }
        return ConvexPolygonShape;
    }(Shape));
    exports.ConvexPolygonShape = ConvexPolygonShape;
});
//# sourceMappingURL=shapes.js.map