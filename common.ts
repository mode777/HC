function hashVertex(vertex: Vertex2d){
    return vertex.x + "|" + vertex.y;
}

export interface Vertex2d {
    x: number;
    y: number;
}

export interface CollisionResult {
    collides: boolean;
    sx?: number;
    sy?: number;
}

export interface EdgeResult {
    dist: number;
    n?: Vertex2d;
    index?: number;
}

export abstract class Shape {

    _rotation: number;
    _center: Vertex2d;

    constructor(){
        this._init();
    }

    get center(): Vertex2d {
        return this._center;
    }

    get rotation(): number {
        return this._rotation;
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

    abstract collidesWith(other: Shape): CollisionResult;
    abstract support(dx: number, dy: number): Vertex2d;

    private _init(){
        this._rotation = 0;
    }
    
}

export class VertexSet{

    private _set: { [key: string]: Vertex2d } = {};   

    insert(vertex: Vertex2d){
        let hash = hashVertex(vertex);
        if(this._checkHash(hash))
            throw "Vertex already contained in set";

        this._set[hash] = vertex;
    }

    contains(vertex: Vertex2d){
        let hash = hashVertex(vertex);
        return this._checkHash(hash);
    }

    remove(vertex: Vertex2d){
        let hash = hashVertex(vertex);
        delete this._set[hash];      
    }

    forEach(func: (vertex: Vertex2d, cancel: () => boolean) => void ){
        let _cancel = false;
        let cancel = () => _cancel = true;

        for(var v in this._set){
            func(this._set[v], cancel);
            if(_cancel)
                break;
        }
    }

    clear(){
        this._set = {};
    }

    private _checkHash(hash: string){
        return !!this._set[hash];
    }
}