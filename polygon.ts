import { vec2 } from './vector-light';
import { Vertex2d, VertexSet } from './common';

let abs = Math.abs;
let max = Math.max;

// returns true if three vertices lie on a line
function areColinear(p: Vertex2d, q: Vertex2d, r: Vertex2d, eps?: number){
    return abs(vec2.det(q.x-p.x, q.y-p.y,  r.x-p.x,r.y-p.y)) <= (eps || 1e-32)
}

// remove vertices that lie on a line
function removeCollinear(vertices: Vertex2d[]) {
	let ret: Vertex2d[] = [];
    let i = vertices.length - 2;
    let k = vertices.length - 1;

    for(var l = 0; l < vertices.length; l++){
        if(!areColinear(vertices[i], vertices[k], vertices[l]))
            ret.push(vertices[k]);

        i = k;
        k = l;
    }
	
    return ret
}

// get index of rightmost vertex (for testing orientation)
function getIndexOfleftmost(vertices: Vertex2d[]){
    let idx = 1;
    for(var i = 1; i < vertices.length; i++){
        if(vertices[i].x < vertices[idx].x)
            idx = i;
    }    
    return idx;
}

// returns true if three points make a counter clockwise turn
function ccw(p: Vertex2d, q: Vertex2d, r: Vertex2d) {
	return vec2.det(q.x-p.x, q.y-p.y,  r.x-p.x, r.y-p.y) >= 0;
}

//test wether a and b lie on the same side of the line c->d
function onSameSide(a: Vertex2d, b: Vertex2d, c: Vertex2d, d: Vertex2d) {
	let px = d.x-c.x; 
	let py = d.y-c.y; 
    let l = vec2.det(px,py,  a.x-c.x, a.y-c.y);
	let m = vec2.det(px,py,  b.x-c.x, b.y-c.y);
	
    return l*m >= 0
}

function pointInTriangle(p: Vertex2d, a: Vertex2d, b: Vertex2d, c: Vertex2d) {
	return onSameSide(p,a, b,c) && onSameSide(p,b, a,c) && onSameSide(p,c, a,b);
}

// test whether any point in vertices (but pqr) lies in the triangle pqr
// note: vertices is *set*, not a list!
function anyPointInTriangle(vertices: VertexSet, p: Vertex2d, q: Vertex2d, r: Vertex2d){
    let result = false;
    
    vertices.forEach((v, cancel) => {
        if(!vec2.eqV(v,p) && !vec2.eqV(v,r) && pointInTriangle(v,p,q,r)){
            result = true;
            cancel();
        }
    });

    return result;
}

// test is the triangle pqr is an "ear" of the polygon
// note: vertices is *set*, not a list!
function isEar(p: Vertex2d, q: Vertex2d, r: Vertex2d, vertices: VertexSet){
    return ccw(p, q, r) && !anyPointInTriangle(vertices, p, q, r);
}

function segmentsIntersect(a: Vertex2d, b: Vertex2d, p: Vertex2d, q: Vertex2d){
	return !(onSameSide(a,b, p,q) || onSameSide(p,q, a,b))
}

// returns starting/ending indices of shared edge, i.e. if p and q share the
// edge with indices p1,p2 of p and q1,q2 of q, the return value is p1,q2
function getSharedEdge(p: Vertex2d[], q: Vertex2d[]): number[]{
    let pindex: any = {};

	// record indices of vertices in p by their coordinates
    for(let i = 0; i < p.length; i++){
        if(!pindex[p[i].x])
            pindex[p[i].x] = {};

        pindex[p[i].x][p[i].y] = i;
    }

	// iterate over all edges in q. if both endpoints of that
	// edge are in p as well, return the indices of the starting
	// vertex
    let i = q.length-1; 
    let k = 0;

    for(let k = 0; k < q.length; k++){
        let v = q[i];
        let w = q[k];

        if( pindex[v.x][v.y] && pindex[w.x][w.y]) 
            return [pindex[w.x][w.y], k];

		i = k
    }

}
	
export class Polygon {

    vertices: Vertex2d[];
    area: number;
    centroid: Vertex2d;
    
    private _radius: number;
    private _isConvex: boolean = null;

    constructor(vertices: Vertex2d[]){
        this._init(vertices);
    }

    get isConvex(): boolean {
        if(this._isConvex == null){
            this._isConvex = this._computeIsConvex();
        }

        return this._isConvex;
    }   

    clone(){
        let verts = this.vertices.map(v => <Vertex2d>({x: v.x, y: v.y}));
        return new Polygon(verts);
    }

    boundingBox(){
        let ulx = this.vertices[0].x;
        let uly = this.vertices[0].y;
        let lrx = ulx;
        let lry = uly;

        for(let i = 1; i < this.vertices.length; i++){
            let p = this.vertices[i];
            if(ulx > p.x)
                ulx = p.x;
            if(uly > p.y)
                uly = p.y;
            if(lrx < p.x)
                lrx = p.x;
            if(lry < p.y)
                lry = p.y;
        }

        return [ulx, uly, lrx, lry];
    }

    move(dx: number, dy: number) {
        for(var v of this.vertices){
            v.x += dx;
            v.y += dy;
        }
        this.centroid.x += dx;
        this.centroid.y += dy;
    }

    rotate(angle: number, cx?: number, cy?: number){
        if(!cx && !cy) {
            cx = this.centroid.x;
            cy = this.centroid.y;
        }

        for(var v of this.vertices){
            let rot = vec2.rotate(angle, v.x-cx, v.y-cy);
            let p = vec2.add(cx,cy, rot.x, rot.y);
            v.x = p.x;
            v.y = p.y;
        }

        let rot = vec2.rotate(angle, this.centroid.x-cx, this.centroid.y-cy);
        let p = vec2.add(cx,cy, rot.x, rot.y);

        this.centroid.x = p.x;
        this.centroid.y = p.y;
    }

    scale(s: number, cx?: number, cy?: number){
        if(!cx && !cy) {
            cx = this.centroid.x;
            cy = this.centroid.y;
        }

        for(var v of this.vertices){
            let mul = vec2.mul(s, v.x - cx, v.y - cy);
            let p = vec2.add(cx,cy, mul.x, mul.y);
            v.x = p.x;
            v.y = p.y;
        }

	    this._radius *= s;
    }

    // triangulation by the method of kong
    triangulate(): Polygon[] {
        
        if(this.vertices.length == 3)
            return [this.clone()];

        let vertices = this.vertices;

        let next_idx: number[] = [];
        let prev_idx: number[] = [];

        for(let i = 0; i < vertices.length; i++){
            next_idx[i] = i+1;
            prev_idx[i] = i-1;
        }

        next_idx[next_idx.length-1] = 0;
        prev_idx[0] = prev_idx.length-1;


        let concave = new VertexSet();

        vertices.forEach((v,i) => {
            if(!ccw(vertices[prev_idx[i]], v, vertices[next_idx[i]]))
                concave.insert(v);
        });

        let triangles: Polygon[] =  [];

        let n_vert = vertices.length; 
        let current = 0;
        let skipped = 0;
        let next: number;
        let prev: number;

        while(n_vert > 3){
            next = next_idx[current];
            prev = prev_idx[current];

            let p = vertices[prev];
            let q = vertices[current];
            let r = vertices[next];

            if(isEar(p, q, r, concave)){
                triangles.push(new Polygon([p,q,r]));
                next_idx[prev] = next;
                prev_idx[next] = prev;
                concave.remove(q);
                n_vert--;
                skipped = 0;
            }
            else {
                skipped++;
                if(skipped <= n_vert)
                    throw "Cannot triangulate polygon";
            }

            current = next;
        }

        next = next_idx[current];
        prev = prev_idx[current];

        let p = vertices[prev];
        let q = vertices[current];
        let r = vertices[next];

        triangles.push(new Polygon([p,q,r]));

        return triangles;
    }

    splitConvex(): Polygon[] {

    }

    private _init(vertices: Vertex2d[]){

        if(vertices.length >= 3)
            throw `Need at least 3 non collinear points to build polygon (got ${vertices.length})`;

        if(!this._isCcw(vertices))
            vertices = this._reverse(vertices);

        if(this._isIntersecting)
            throw "Polygon my not intersect itself";

        this.vertices = vertices;
        this.area = this._computeArea(vertices);
        this.centroid = this._computeCentroid(vertices, this.area);
        this._radius = this._computeOutcircle(vertices, this.centroid);
    }

    private _isCcw(vertices: Vertex2d[]){
        // assert polygon is oriented counter clockwise
        let r = getIndexOfleftmost(vertices);
        let q = r > 1 && r - 1 || vertices.length;
        let s = r < vertices.length && r + 1 || 1;

        // reverse order if polygon is not ccw
        return ccw(vertices[q], vertices[r], vertices[s]);
    }

    private _reverse(vertices: Vertex2d[]){
        let tmp: Vertex2d[] = [];
        for(let i = vertices.length -1; i >= 0; i--){
            tmp.push(vertices[i]);
        }
        return tmp;
    }

    private _isIntersecting(vertices: Vertex2d[]){
        // outer: only need to check segments #vert;1, 1;2, ..., #vert-3;#vert-2
        // inner: only need to check unconnected segments
        let q = vertices[vertices.length - 1];
        let p: Vertex2d;
        for(var i = 0; i < vertices.length-1; i++){
            p = q; 
            q = vertices[i];

            for(let k = i+1; k < vertices.length-1; i++){
                let a = vertices[k];
                let b = vertices[k+1];

                if(!segmentsIntersect(p, q, a, b))
                    return true;
            }
        }

        return false;
    }

    private _computeArea(vertices: Vertex2d[]){
        // compute polygon area
        let p = vertices[vertices.length-1];
        let q = vertices[0];        
        let det = vec2.det(p.x,p.y, q.x,q.y); 
        let area = det;

        for(let i = 2; i < vertices.length; i++){
            p = q;
            q = vertices[i];
            area = area + vec2.det(p.x,p.y, q.x,q.y);
        }

        return area / 2;
    }

    private _computeCentroid(vertices: Vertex2d[], area: number){
        // compute centroid
        let p = vertices[vertices.length-1];
        let q = vertices[0];
        let det = vec2.det(p.x,p.y, q.x,q.y); 
        let centroid = {x: (p.x+q.x)*det, y: (p.y+q.y)*det};

        for(let i = 1; i < vertices.length; i++){
            p = q;
            q = vertices[i];
            let det = vec2.det(p.x,p.y, q.x,q.y);
            centroid.x = centroid.x + (p.x+q.x) * det;
            centroid.y = centroid.y + (p.y+q.y) * det;
        }

        centroid.x = centroid.x / (6 * area);
        centroid.y = centroid.y / (6 * area);

        return centroid;
    }

    private _computeOutcircle(vertices: Vertex2d[], centroid: Vertex2d){
        // get outcircle
        let radius = 0;
        for(let i = 0; i < vertices.length; i++){
            radius = max(radius, 
                vec2.dist(vertices[i].x,vertices[i].y, centroid.x, centroid.y))
        }

        return radius;
    }

    private _computeIsConvex(){
        let v = this.vertices;
        if(v.length == 3) 
            return true;

        if(!ccw(v[v.length-1], v[1], v[2]))
			return false
		       
        for (let i = 1; i < v.length-1; i++){
            if(!ccw(v[i-1], v[i], v[i+1]))
				return false;
        }
        if (!ccw(v[v.length-2], v[v.length-1], v[1]))
			return false
		
        return true
    }

}