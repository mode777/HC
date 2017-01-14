export interface Vertex2d {
    x: number;
    y: number;
}

function hashVertex(vertex: Vertex2d){
    return vertex.x + "|" + vertex.y;
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