import { rads, type Vec2D, type Vec2DArray } from 'webgl-engine';

export type EllipseParameters = {
    semiMajorAxis: number; // a
    semiMinorAxis: number; // b
};

export class EllipseCalculator {
    static compute(parameters: EllipseParameters): Vec2D[] {
        const coordinates: Vec2D[] = [];

        for (let i = 0; i < 361 / 3; i++) {
            coordinates.push([
                parameters.semiMajorAxis * Math.cos(rads(i * 3)),
                parameters.semiMinorAxis * Math.sin(rads(i * 3)),
            ]);
        }

        return coordinates;
    }
}
