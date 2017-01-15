import { vec2 } from './vector-light';
import { Polygon } from "./polygon";
import { Vertex2d, Shape, CollisionResult } from './common';
import { GJK } from './gjk';

export class ConvexPolygonShape extends Shape {
    
    _polygon: Polygon;
    
    constructor(polygon: Polygon){
        super();
        if(!this._polygon.isConvex)
            throw "Polygon is not convex";
        this._polygon = polygon;
    }    

    support(dx: number, dy: number): Vertex2d{
        let v = this._polygon.vertices;
        let max = -Number.MAX_VALUE;
        let vmax: Vertex2d = null;

        v.forEach((vert, i) => {
            let d = vec2.dot(vert.x,vert.y, dx,dy);
            if(d > max){
                max = d;
                vmax = vert;
            }
        });
        
        return {x: vmax.x, y: vmax.y};
    }

    // collision dispatching:
    // let circle shape or compund shape handle the collision
    collidesWith(other: Shape): CollisionResult {
        if (this == other) 
            return { collides: false };

        if (!(other instanceof ConvexPolygonShape)){
            var res = other.collidesWith(this);
            return {
                collides: res.collides,
                sx: res.collides ? -res.sx : null,
                sy: res.collides ? -res.sy : null,
            }
        }

        // else: type is ConvexPolygonShape
        return GJK(this, other);
    }

}

export class ConcavePolygonShape extends Shape {
    
    _polygon: Polygon;
    _shapes: Shape[];

    constructor(polygon: Polygon){
        super();
        this._polygon = polygon;
        let polys = polygon.splitConvex();
        this._shapes = polys.map(x => new ConvexPolygonShape(x));
    }    
}

export class CircleShape extends Shape{

    _radius: number;

    constructor(cx: number, cy: number, radius: number){
        super();
        this._center = {x: cx, y: cy};
        this._radius = radius;
    }

    support(dx: number, dy: number){
        let n = vec2.normalize(dx,dy);
        let mul = vec2.mul(this._radius, n.x, n.y);
        return vec2.add(this._center.x, this._center.y, mul.x, mul.y);        
    }
}

export class PointShape extends Shape{

    _pos: Vertex2d;

    constructor(x: number, y: number){
        super();
        this._pos = {x: x, y: y};
        this._center = this._pos;
    }
}


