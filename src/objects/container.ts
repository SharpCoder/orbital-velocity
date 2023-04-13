import { cuboid, zeros, type Obj3d } from 'webgl-engine';

export function createContainer(props: Partial<Obj3d>): Obj3d {
    return {
        vertexes: [],
        offsets: zeros(),
        position: zeros(),
        rotation: zeros(),
        children: [],
        ...props,
    };
}
