import { Vertex2d } from './common';

let sqrt = Math.sqrt;
let cos = Math.cos;
let sin = Math.sin;

export module vec2 {

    export function str(x: number,y: number){    
        return `(${x},${y})`
    }

    export function mul(s: number, x: number, y:number): Vertex2d{
        return { x: s * x, y: s * y };
    }

    export function div(s: number, x: number, y:number): Vertex2d{
        return { x: x / s, y: y / s };
    }

    export function add(x1: number,y1: number, x2: number,y2: number): Vertex2d { 
        return { x: x1+x2, y: y1+y2 };
    }

    export function sub(x1: number,y1: number, x2: number,y2: number): Vertex2d { 
        return { x: x1-x2, y: y1-y2 };
    }

    export function permul(x1: number,y1: number, x2: number,y2: number): Vertex2d {
        return { x: x1*x2, y: y1*y2 };
    }

    export function dot(x1: number,y1: number, x2: number,y2: number) {
        return x1*x2 + y1*y2;
    }

    export function det(x1: number,y1: number, x2: number,y2: number) {
        return x1*y2 - y1*x2;
    }

    export function eq(x1: number,y1: number, x2: number,y2: number) {
        return x1 == x2 && y1 == y2;
    }   

    export function eqV(a: Vertex2d, b: Vertex2d){
        return a.x == b.x && a.y == b.y;
    }

    export function lt(x1: number,y1: number, x2: number,y2: number) {
        return x1 < x2 || (x1 == x2 && y1 < y2);
    }

    export function le(x1: number,y1: number, x2: number,y2: number) {
        return x1 <= x2 && y1 <= y2;
    }

    export function len2(x: number,y: number) {
        return x*x + y*y;
    }

    export function len(x: number,y: number) {
        return sqrt(x*x + y*y);
    }

    export function dist(x1: number,y1: number, x2: number,y2: number) {
        return len(x1-x2, y1-y2);
    }

    export function normalize(x: number,y): Vertex2d {
        let l = len(x,y);
        return { x: x/l, y: y/l };
    }

    export function rotate(phi, x: number,y): Vertex2d {
        let c = cos(phi); 
        let s = sin(phi);
        return { x: c*x - s*y, y: s*x + c*y };
    }

    export function perpendicular(x: number,y): Vertex2d {
        return {x: -y, y: x}
    }

    export function project(x: number, y:number, u: number, v: number): Vertex2d {
        let s = (x*u + y*v) / (u*u + v*v)
        return { x: s*u, y: s*v };
    }

    export function mirror(x: number, y: number, u: number, v: number): Vertex2d {
        let s = 2 * (x*u + y*v) / (u*u + v*v);
        return { x: s*u - x, y: s*v - y };
    }

}
