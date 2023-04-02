import { sgp4, type SatRec } from 'satellite.js';
import {
    type Obj3d,
    type Vec3D,
    cylinder,
    Flatten,
    Repeat,
    Vec3,
    degs,
    rads,
} from 'webgl-engine';
import { zero } from '../utils';

function lineTo(
    from: Vec3D,
    to: Vec3D,
    scale: number,
    ox: number,
    oy: number,
    oz: number
): Obj3d {
    for (let i = 0; i < 3; i++) {
        from[i] *= scale;
        to[i] *= scale;
    }

    const minX = Math.min(from[0], to[0]);
    const minY = Math.min(from[1], to[1]);
    const minZ = Math.min(from[2], to[2]);
    const maxX = Math.max(from[0], to[0]);
    const maxY = Math.max(from[1], to[1]);
    const maxZ = Math.max(from[2], to[2]);

    const mx = (to[0] - from[0]) / 2;
    const my = (to[1] - from[1]) / 2;
    const mz = (to[2] - from[2]) / 2;

    const lengths = [maxX - minX, maxY - minY, maxZ - minZ];
    const mag = Math.sqrt(
        Math.pow(lengths[0], 2) +
            Math.pow(lengths[1], 2) +
            Math.pow(lengths[2], 2)
    );

    const theta = Math.atan2(my, mx) + rads(90);

    const dia = 0.25;
    const vertexes = cylinder(10, mag * 1, dia);
    return {
        vertexes,
        colors: Flatten(Repeat(Vec3(255, 0, 0), vertexes.length / 3)),
        scale: [1, 1, 1],
        offsets: [-mx, -my, -mz],
        position: [to[0], to[1], to[2]],
        rotation: [0, 0, theta],
    };
}

export function drawOrbit(
    rec: SatRec,
    sizeScale: number,
    orbitScalar: number
): Obj3d[] {
    const objects = [];
    const inputs: Array<{ from: Vec3D; to: Vec3D }> = [];

    let x = 0,
        y = 0,
        z = 0;

    for (let i = 0; i < 100; i++) {
        const { position } = sgp4(rec, i) as any;
        if (i !== 0) {
            inputs.push({
                from: Vec3(x, y, z),
                to: Vec3(
                    position.x / orbitScalar,
                    position.y / orbitScalar,
                    position.z / orbitScalar
                ),
            });
        }

        x = position.x / orbitScalar;
        y = position.y / orbitScalar;
        z = position.z / orbitScalar;
    }

    // Calculate origin
    const max = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE],
        min = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];

    for (const point of inputs) {
        for (let i = 0; i < 3; i++) {
            if (max[i] < point.from[i]) {
                max[i] = point.from[i];
            }

            if (min[i] > point.from[i]) {
                min[i] = point.from[i];
            }
        }
    }

    const ox = (max[0] - min[0]) / 2;
    const oy = (max[1] - min[1]) / 2;
    const oz = (max[2] - min[2]) / 2;

    for (const point of inputs) {
        objects.push(lineTo(point.from, point.to, sizeScale, ox, oy, oz));
    }

    return objects;
}
