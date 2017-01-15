import { vec2 as vector } from "./vector-light";
import { Shape, Vertex2d, CollisionResult } from './common';

let huge = Number.MAX_VALUE; 
let abs = Math.abs;

interface EdgeResult {
    dist: number;
    n?: Vertex2d;
    index?: number;
}

function support(shapeA: Shape, shapeB: Shape, dx: number, dy: number) {
	let resA = shapeA.support(dx,dy);
    let resB = shapeB.support(-dx, -dy);

	return vector.sub(resA.x, resA.y, resB.x, resB.y);
}

// returns closest edge to the origin
function closest_edge(simplex: Vertex2d[]): EdgeResult {
	let e: EdgeResult = {dist: huge}

	let i = simplex.length-1;
    for(let k = 0; k < simplex.length; k++){
        let a = simplex[i];
        let b = simplex[k];
		i = k;

		let p = vector.perpendicular(b.x - a.x, b.y - a.y);
		let n = vector.normalize(p.x,p.y);
		let d = vector.dot(a.x,a.y, n.x,n.y);

        if (d < e.dist){
			e.dist = d;
			e.n = n;
			e.index = k;
        }
    }

	return e
}

function EPA(shape_a: Shape, shape_b: Shape, simplex: Vertex2d[]): Vertex2d {
	// make sure simplex is oriented counter clockwise
	let c = simplex[0];
    let b = simplex[1];
    let a = simplex[2];

    if(vector.dot(a.x - b.x, a.y - b.y, c.x - b.x, c.y - b.y) < 0){
        simplex[0] = a;
		simplex[2] = c;
    }

	// the expanding polytype algorithm
	let is_either_circle = shape_a._center || shape_b._center;
	let last_diff_dist = huge;
	while(true){
		let e = closest_edge(simplex);
		let p = support(shape_a, shape_b, e.n.x, e.n.y);
		let d = vector.dot(p.x,p.y, e.n.x, e.n.y);

		let diff_dist = d - e.dist;
		if(diff_dist < 1e-6 || (is_either_circle && abs(last_diff_dist - diff_dist) < 1e-10)) {
			return { x: -d * e.n.x, y: -d * e.n.y }
		}
		last_diff_dist = diff_dist;
		
		simplex.splice(e.index, 0, p);
	}
}

//   :      :     origin must be in plane between A and B
// B o------o A   since A is the furthest point on the MD
//   :      :     in direction of the origin.
function do_line(out_simplex: Vertex2d[], out_vertex: Vertex2d) {
	let b = out_simplex[0];
	let a = out_simplex[1];

	let abx = b.x - a.x;
	let aby = b.y - a.y;

	let d = vector.perpendicular(abx,aby);

	if (vector.dot(d.x,d.y, -a.x,-a.y) < 0){
		d.x = -d.x;
		d.y = -d.y;
	}
	
	out_vertex.x = d.x;
	out_vertex.y = d.y;
}

// B .'
//  o-._  1
//  |   `-. .'     The origin can only be in regions 1, 3 or 4:
//  |  4   o A 2   A lies on the edge of the MD and we came
//  |  _.-' '.     from left of BC.
//  o-'  3
// C '.
function do_triangle(out_simplex: Vertex2d[], out_vertex: Vertex2d){
	let c = out_simplex[0];
	let b = out_simplex[1];
	let a = out_simplex[2];

	let aox = -a.x;
	let aoy = -a.y;
	let abx = b.x - a.x;
	let aby = b.y - a.y;
	let acx = c.x - a.x;
	let acy = c.y - a.y;

	// test region 1
	let d = vector.perpendicular(abx,aby);
	if (vector.dot(d.x,d.y, acx,acy) > 0){
		d.x = -d.x;
		d.y = -d.y;
	}
	if (vector.dot(d.x,d.y, aox,aoy) > 0){
		// simplex = {bx,by, ax,ay}
		out_simplex[0] = b
		out_simplex[1] = a
		out_simplex[2] = null;
		
		out_vertex.x = d.x;
		out_vertex.y = d.y;
	}

	// test region 3
	d = vector.perpendicular(acx,acy);
	if (vector.dot(d.x,d.y, abx,aby) > 0) {
		d.x = -d.x;
		d.y = -d.y;
	}
	if (vector.dot(d.x,d.y, aox, aoy) > 0) {
		// simplex = {cx,cy, ax,ay}
		out_simplex[1] = a;
		out_simplex[2] = null;
		
		out_vertex.x = d.x;
		out_vertex.y = d.y;
	}
}

export function GJK(shape_a: Shape, shape_b: Shape): CollisionResult {
	let a = support(shape_a, shape_b, 1,0);
	if (a.x == 0 && a.y == 0){
		// only true if shape_a and shape_b are touching in a vertex, e.g.
		//  .---                .---.
		//  | A |           .-. | B |   support(A, 1,0)  = x
		//  '---x---.  or  : A :x---'   support(B, -1,0) = x
		//      | B |       `-'         => support(A,B,1,0) = x - x = 0
		//      '---'
		// Since CircleShape:support(dx,dy) normalizes dx,dy we have to opt
		// out or the algorithm blows up. In accordance to the cases below
		// choose to judge this situation as not colliding.
		return {
			collides: false
		};
	}

	let d = { x: -a.x, y: -a.y };
	let simplex: Vertex2d[] = [a];
	//let n = 2

	// first iteration: line case
	a = support(shape_a, shape_b, d.x, d.y)
	if (vector.dot(a.x,a.y, d.x, d.y) <= 0){
		return {
			collides: false
		};
	}

	simplex.push(a);
	do_line(simplex, d);
	//n = 4

	// all other iterations must be the triangle case
	while(true){
		a = support(shape_a, shape_b, d.x, d.y);

		if (vector.dot(a.x,a.y, d.x, d.y) <= 0){
			return {
				collides: false
			};
		}

		simplex.push(a);
		do_triangle(simplex, d);
		
		if (simplex.length == 3) {
			return {
				 collides: true, 
				 sep: EPA(shape_a, shape_b, simplex)
			}
		}
	}
}

