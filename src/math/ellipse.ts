import { rads, type Vec2D, type Vec2DArray } from 'webgl-engine';

export type EllipseParameters = {
    semiMajorAxis: number; // a
    semiMinorAxis: number; // b
};

export class EllipseCalculator {
    static compute(parameters: EllipseParameters): Vec2D[] {
        const coordinates: Vec2D[] = [];
        const factor = 2;

        for (let i = 0; i < 361 / factor; i++) {
            coordinates.push([
                parameters.semiMajorAxis * Math.cos(rads(i * factor)),
                parameters.semiMinorAxis * Math.sin(rads(i * factor)),
            ]);
        }

        return coordinates;
    }
}
