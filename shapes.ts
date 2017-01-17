import { vec2 as vector } from './vector-light';
import { Polygon } from "./polygon";
import { Vertex2d, Shape, CollisionResult, IntersectionResult } from './common';
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
            let d = vector.dot(vert.x,vert.y, dx,dy);
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
                sep: res.sep != null ? { x: -res.sep.x, y: -res.sep.y  } : null,
            }
        }

        // else: type is ConvexPolygonShape
        return GJK(this, other);
    }

    contains(x: number, y: number){
        return this._polygon.contains(x,y);
    }

    intersectsRay(x: number, y: number, dx: number, dy: number){
        return this._polygon.intersectsRay(x,y, dx,dy);
    }

    intersectionsWithRay(x: number, y: number, dx: number, dy: number){
        return this._polygon.intersectionsWithRay(x,y, dx,dy);
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

    collidesWith(other: Shape): CollisionResult {
        if (this == other)
            return { collides: false };

        if (other instanceof PointShape){
            return other.collidesWith(this)
        }

        // TODO: better way of doing this. report all the separations?
        let collide = false;
        let d = { x: 0, y: 0};
        for(let s of this._shapes){
            let res = s.collidesWith(other);
            collide = collide || res.collides;
            if(res.collides){
                if(Math.abs(d.x) < Math.abs(res.sep.x))
                    d.x = res.sep.x;
                if(Math.abs(d.y) < Math.abs(res.sep.y))
                    d.y = res.sep.y;
            }
        }
        
        return {
            collides: collide, 
            sep: d
        };
    }

    contains(x: number, y: number){
        return this._polygon.contains(x,y);
    }

    support(dx: number, dy: number): Vertex2d{
        throw "Not supported";
    }

    intersectsRay(x: number, y: number, dx: number, dy: number){
        return this._polygon.intersectsRay(x,y, dx,dy);
    }

    intersectionsWithRay(x: number, y: number, dx: number, dy: number){
        return this._polygon.intersectionsWithRay(x,y, dx,dy);
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
        let n = vector.normalize(dx,dy);
        let mul = vector.mul(this._radius, n.x, n.y);
        return vector.add(this._center.x, this._center.y, mul.x, mul.y);        
    }

    collidesWith(other: Shape): CollisionResult {
        if (this == other) 
            return { collides: false };

        if (other instanceof CircleShape){
            let px = this._center.x-other._center.x;
            let py = this._center.y-other._center.y;
            let d = vector.len2(px,py);
            let radii = this._radius + other._radius;
            if (d < radii*radii) {
                // if circles overlap, push it out upwards
                if (d == 0)
                    return { 
                        collides: true, 
                        sep: { x: 0, y: radii }
                    };
                
                // otherwise push out in best direction
                let norm = vector.normalize(px,py);
                return { 
                    collides: true, 
                    sep: vector.mul(radii - Math.sqrt(d), norm.x, norm.y) 
                };
            }
            return { collides: false };
        }
        else if(other instanceof ConvexPolygonShape){
            return GJK(this, other);
        }

        // else: let the other shape decide
        let res = other.collidesWith(this);
        return {
            collides: res.collides, 
            sep: res.sep != null ? { x: res.sep.x, y: res.sep.y } : null
        };
    }

    contains(x: number, y: number){
        return vector.len2(x - this._center.x, y - this._center.y) < this._radius * this._radius;
    }

    // circle intersection if distance of ray/center is smaller
    // than radius.
    // with r(s) = p + d*s = (x,y) + (dx,dy) * s defining the ray and
    // (x - cx)^2 + (y - cy)^2 = r^2, this problem is eqivalent to
    // solving [with c = (cx,cy)]:
    //
    //     d*d s^2 + 2 d*(p-c) s + (p-c)*(p-c)-r^2 = 0
    intersectionsWithRay(x: number, y: number, dx: number, dy: number){
        let pc = { 
            x: x - this._center.x, 
            y: y - this._center.y 
        };

        let a = vector.len2(dx,dy);
        let b = 2 * vector.dot(dx,dy, pc.x,pc.y);
        let c = vector.len2(pc.x, pc.y) - this._radius * this._radius;
        let discr = b*b - 4*a*c;

        if (discr < 0)
            return [];

        discr = Math.sqrt(discr);
        let ts: number[] = [];
        let t1 = discr-b; 
        let t2 = -discr-b;
        
        if (t1 >= 0)
            ts.push(t1/(2*a));
        if (t2 >= 0)
            ts.push(t2/(2*a));

        return ts
    }

    intersectsRay(x: number, y: number, dx: number, dy: number){
        let tmin = Number.MAX_VALUE;
        
        for(let t of this.intersectionsWithRay(x,y,dx,dy)) {
            tmin = Math.min(t, tmin);
        }
        
        return {
            result: tmin != Number.MAX_VALUE,
            min: tmin
        };
    }

}

export class PointShape extends Shape{

    _pos: Vertex2d;

    constructor(x: number, y: number){
        super();
        this._pos = {x: x, y: y};
        this._center = this._pos;
    }

    support(dx: number, dy: number): Vertex2d {
        return { x: this._pos.x, y: this._pos.y };
    }

    collidesWith(other: Shape): CollisionResult {
        if (this == other)
            return { collides: false };
        
        if (other instanceof PointShape)
            return { 
                collides: vector.eqV(this._pos, this._pos), 
                sep: { x: 0, y: 0 }
            }
        
        return { 
            collides: other.contains(this._pos.x, this._pos.y), 
            sep: { x: 0, y: 0 }
        }
    }

    contains(x: number, y: number){
        return x == this._pos.x && y == this._pos.y;
    }

    // point shape intersects ray if it lies on the ray
    intersectsRay(x: number, y: number, dx: number, dy: number){
        let p = { x: this._pos.x-x, y: this._pos.y-y };
        let t = vector.dot(p.x, p.y, dx, dy) / vector.len2(dx,dy);
        
        return { 
            result: t >= 0, 
            min:t 
        };
    }

    intersectionsWithRay(x: number, y: number, dx: number ,dy: number) {
        let res = this.intersectsRay(x,y, dx,dy)
        return res.result ? [res.min] : [];
    }

}


