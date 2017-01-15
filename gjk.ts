import { vec2 as vector } from "./vector-light";
import { Shape, Vertex2d, EdgeResult } from './common';

let huge = Number.MAX_VALUE; 
let abs = Math.abs;

export function support(shapeA: Shape, shapeB: Shape, dx: number, dy: number) {
	let resA = shapeA.support(dx,dy);
    let resB = shapeB.support(-dx, -dy);

	return vector.sub(resA.x, resA.y, resB.x, resB.y);
}

// returns closest edge to the origin
export function closest_edge(simplex: Vertex2d[]): EdgeResult {
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

export function EPA(shape_a: Shape, shape_b: Shape, simplex: Vertex2d[]): Vertex2d {
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
export function do_line(simplex: Vertex2d[]): Vertex2d {
	let b = simplex[0];
	let a = simplex[1];

	let abx = b.x - a.x;
	let aby = b.y - a.y;

	let d = vector.perpendicular(abx,aby);

	if (vector.dot(d.x,d.y, -a.x,-a.y) < 0){
		d.x = -d.x;
		d.y = -d.y;
	}
	
	return d;
}
