import { rads, type Vec2D, type Vec2DArray } from 'webgl-engine';

export type OrbitalParameters = {
    semiMajorAxis: number; // a
    semiMinorAxis: number; // b
};

export class Propagator {
    propagate(parameters: OrbitalParameters): Vec2D[] {
        const coordinates: Vec2D[] = [];

        for (let i = 0; i < 361; i++) {
            coordinates.push([
                parameters.semiMajorAxis * Math.cos(rads(i)),
                parameters.semiMinorAxis * Math.sin(rads(i)),
            ]);
        }

        return coordinates;
    }
}
