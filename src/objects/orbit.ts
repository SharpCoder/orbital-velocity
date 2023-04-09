import { sgp4, type SatRec } from 'satellite.js';
import { type Obj3d, type Vec3D, Vec3 } from 'webgl-engine';
import { lineTo } from '../drawing';

export function drawOrbit(
    rec: SatRec,
    originTime: number,
    sizeScale: number,
    orbitScalar: number
): Obj3d[] {
    const objects = [];
    const inputs: Array<{ from: Vec3D; to: Vec3D }> = [];

    let x = 0,
        y = 0,
        z = 0;

    for (let i = 0; i < 100; i++) {
        const { position } = sgp4(rec, originTime + i) as any;
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
        const from = point.from.map((p) => p * sizeScale);
        const to = point.to.map((p) => p * sizeScale);
        objects.push(lineTo({ from, to, thickness: 0.8, color: [0, 0, 0] }));
    }

    return objects;
}
