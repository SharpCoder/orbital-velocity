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
    zeros,
    m3,
    cuboid,
} from 'webgl-engine';

export function mag(vec: [number, number, number] | number[]): number {
    return Math.sqrt(
        vec.map((_, i) => Math.pow(vec[i], 2)).reduce((m, n) => m + n)
    );
}

export function normalize(
    vec: [number, number, number] | number[]
): [number, number, number] {
    const magnitude = mag(vec);
    return [vec[0] / magnitude, vec[1] / magnitude, vec[2] / magnitude];
}

export function lineTo(
    from: Vec3D,
    to: Vec3D,
    scale: number,
    color?: Vec3D
): Obj3d {
    for (let i = 0; i < 3; i++) {
        from[i] *= scale;
        to[i] *= scale;
    }

    // from[2] = 0;
    // to[2] = 0;

    const minX = Math.min(from[0], to[0]);
    const minY = Math.min(from[1], to[1]);
    const minZ = Math.min(from[2], to[2]);
    const maxX = Math.max(from[0], to[0]);
    const maxY = Math.max(from[1], to[1]);
    const maxZ = Math.max(from[2], to[2]);

    const cx = maxX - minX;
    const cy = maxY - minY;
    const cz = maxZ - minZ;
    const x1 = from[0];
    const y1 = from[1];
    const z1 = from[2];
    const x2 = to[0];
    const y2 = to[1];
    const z2 = to[2];

    const lengths = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
    const magnitude = mag(lengths);

    const min = [Math.min(x1, x2), Math.min(y1, y2), Math.min(z1, z2)];
    const max = [Math.max(x1, x2), Math.max(y1, y2), Math.max(z1, z2)];
    const vel = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];

    const midpoint = [
        min[0] + vel[0] / 2,
        min[1] + vel[1] / 2,
        min[2] + vel[2] / 2,
    ];
    const currentDirection = [1, 0, 0];
    const signs = [0, 0, 0];

    if (x1 < x2) signs[0] = -1;
    else signs[0] = 1;

    if (y1 > y2) signs[1] = -1;
    else signs[1] = 1;

    if (z1 < z2) signs[2] = -1;
    else signs[2] = 1;

    const newDirection = normalize([
        (max[0] - min[0]) * signs[0],
        (max[1] - min[1]) * signs[1],
        (max[2] - min[2]) * signs[2],
    ]);

    const rotationAxis = normalize(m3.cross(currentDirection, newDirection));
    const rotationAngle = Math.acos(m3.dot(currentDirection, newDirection));

    // console.log(rotationAxis);
    function ff(v) {
        if (isNaN(v)) {
            return 0;
        } else {
            return v;
        }
    }

    // const thetaX = rads(360) - Math.atan2(to[2] - from[2], to[1] - from[1]);
    // const thetaY = rads(360) + Math.atan2(to[1] - from[1], to[0] - from[0]);
    // const thetaZ = rads(360) + Math.atan2(to[0] - from[0], to[2] - from[2]);

    // const thetaX = rads(360) - Math.atan2(from[2] - to[2], from[1] - to[1]);
    // const thetaY = rads(360) - Math.atan2(from[1] - to[1], from[0] - to[0]);
    // const thetaZ = rads(360) + Math.atan2(from[0] - to[0], from[2] - to[2]);

    // const thetaX = -Math.atan2(minZ - maxZ, minY - maxY);
    // const thetaY = -Math.atan2(minY - maxY, minX - maxX);
    // const thetaZ = -Math.atan2(minX - maxX, minZ - maxZ);
    // const rotangles = [];
    // const rotaxises = [];

    // for (let i = 0; i < 3; i++) {
    //     const pvector = [1, 1, 1];
    //     console.log(pvector);
    //     const newvec = normalize([
    //         from[0] - to[0],
    //         from[1] - to[1],
    //         from[2] - to[2],
    //     ]);
    //     const rotaxis = normalize(m3.cross(pvector, newvec));
    //     const rotangle = Math.acos(m3.dot(pvector, newvec));
    //     rotangles[i] = rotangle;
    //     rotaxises[i] = rotaxis[i];
    // }

    // const pvector = [0, 1, 0];
    // console.log(pvector);
    // const newvec = normalize([
    // -from[0] + to[0],
    // from[1] - to[1],
    // -from[2] + to[2],
    // ]);
    // const newvec = normalize([
    //     to[0] - from[0],
    //     to[1] - from[1],
    //     to[2] - from[2],
    // ]);
    // const rotaxis = normalize(m3.cross(pvector, newvec));
    // const rotangle = Math.acos(m3.dot(pvector, newvec));

    // console.log({ rotaxises, rotangles });
    // function ff(n) {
    //     let res = 0;
    //     if (!isNaN(n)) {
    //         res = n;
    //     }

    //     return res;
    // }

    // const thetaX = ff(Math.atan((to[1] - from[1]) / (to[2] - from[2])));
    // const thetaY = ff(Math.atan((to[2] - from[2]) / (to[0] - from[0])));
    // const thetaZ = ff(Math.atan(-(to[0] - from[0]) / (from[2] - to[2])));

    const dia = 2;
    // const vertexes = cylinder(10, magnitude * 1, dia);
    const sizes = [magnitude, 1, 1];
    const vertexes = cuboid(sizes[0], sizes[1], sizes[2]);

    return {
        vertexes,
        colors: Flatten(Repeat(color ?? Vec3(255, 0, 0), vertexes.length / 3)),
        scale: [1, 1, 1],
        // offsets: [-dia / 2, -magnitude / 2, -dia / 2], // [cx / 2, cy / 2, cz / 2],
        offsets: [-sizes[0] / 2, -sizes[1] / 2, -sizes[2] / 2],
        position: [minX + cx / 2, minY + cy / 2, minZ + cz / 2],
        rotation: [
            ff(rotationAngle) * ff(rotationAxis[0]),
            ff(rotationAngle) * ff(rotationAxis[1]),
            ff(rotationAngle) * ff(rotationAxis[2]),
        ],
        // rotation: [thetaX, thetaY, thetaZ],
        // rotation: [subTheta[0], subTheta[2], subTheta[1]],
        allowClipping: true,
        properties: {},
        update: function (t) {
            if (color[0] === 0 && color[1] === 0 && color[2] === 0) {
                // this.rotation[0] = this.properties.thetaX - rads(90) + t / 1000;
                // this.rotation[1] = this.properties.thetaY + rads(90) - t / 500;
                // this.rotation[2] += rads(1);
                // this.rotation[2] =
                //     this.properties.thetaZ - rads(90) + (t / 5000) * rads(1);
            }
        },
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

    const now = (new Date().getTime() - 1680398531648) / 1000;
    for (let i = 0; i < 100; i++) {
        const { position } = sgp4(rec, now + i) as any;
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

    for (const point of inputs) {
        objects.push(lineTo(point.from, point.to, sizeScale));
    }

    return objects;
}
