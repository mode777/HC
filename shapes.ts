import { Polygon } from "./polygon";

export interface Point {
    x: number;
    y: number;
}

export class Shape {

    _rotation: number;
    _center: Point;

    constructor(){
        this.init();
    }

    init(){
        this._rotation = 0;
    }

    moveTo(x: number, y: number){
        let c = this.center;
        this.move(x - c.x, y - c.y);
    }

    move(x: number, y: number){
        
    }

    rotate(angle: number){
        this._rotation = this._rotation + angle;
    }

    setRotation(angle){
        return this.rotate(angle - this._rotation)
    }

    get center(): Point {
        return this._center;
    }

    get rotation(): number {
        return this._rotation;
    }
}

export class ConvexPolygonShape extends Shape {
    
    _polygon: Polygon;
    
    constructor(polygon: Polygon){
        super();
        if(!this._polygon.isConvex)
            throw "Polygon is not convex";
        this._polygon = polygon;
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