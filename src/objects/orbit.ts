import {
    type Obj3d,
    m4,
    getAnglesFromMatrix,
    zeros,
    degs,
    rads,
    r,
    cuboid,
    getAnglesFromMatrix2,
} from 'webgl-engine';
import {
    drawCube,
    drawCylinder,
    lineTo,
    lineToPositionAndRotation,
    type LineToProps,
} from '../drawing';
import { EllipseCalculator } from '../math/ellipse';
import {
    type PhysicsEngine,
    type Body,
    keplerianParameters,
} from '../math/physics';
import { createContainer } from './container';

export type Orbit3d = Obj3d & {
    recalculateOrbit: (
        position: number[],
        velocity: number[],
        origin: number[],
        mass: number
    ) => void;
};

export function drawOrbit(
    position: number[],
    velocity: number[],
    origin: number[],
    mass: number,
    lineProps?: Partial<Omit<Omit<LineToProps, 'from'>, 'to'>>,
    containerProps?: Partial<Obj3d>
): Orbit3d {
    let e,
        center,
        semiMajorAxis,
        semiMinorAxis,
        rightAscensionNode,
        argumentOfPeriapsis,
        i;

    const thickness = 15;
    const orbit: Orbit3d = {
        ...createContainer({
            ...containerProps,
        }),
        recalculateOrbit: (p, v, o, mass) => {
            const params = keplerianParameters([...p], [...v], [...o], mass);

            e = params.e;
            center = params.center;
            semiMajorAxis = params.semiMajorAxis;
            semiMinorAxis = params.semiMinorAxis;
            rightAscensionNode = params.rightAscensionNode;
            argumentOfPeriapsis = params.argumentOfPeriapsis;
            i = params.i;
        },
    };

    // Create the segments
    const segments: Obj3d[] = [];
    const positions = EllipseCalculator.compute({
        semiMajorAxis: 1,
        semiMinorAxis: 1,
    });

    for (let i = 0; i < positions.length - 1; i++) {
        const segment = lineTo({
            from: zeros(),
            to: zeros(),
            sides: 4,
            thickness,
            color: [255, 0, 0],
            ...lineProps,
        });

        segments.push(segment);
        orbit.children.push(segment);
    }

    orbit.recalculateOrbit(position, velocity, origin, mass);

    const originalUpdate = containerProps?.update;
    orbit.update = function (time_t, engine) {
        // TODO: Handle eccentricity > 1.0
        if (e <= 1.0) {
            const positions = EllipseCalculator.compute({
                semiMajorAxis,
                semiMinorAxis,
            });

            for (
                let i = 0;
                i < Math.min(segments.length, positions.length - 1);
                i++
            ) {
                const segment = segments[i];
                const from = [positions[i][0], 0, positions[i][1]];
                const to = [positions[i + 1][0], 0, positions[i + 1][1]];
                const cylinder = drawCylinder({
                    ...lineToPositionAndRotation({ from, to }),
                    sides: 4,
                    thickness,
                    color: [255, 0, 0],
                    ...lineProps,
                });

                segment.vertexes = cylinder.vertexes;
                segment.rotation = cylinder.rotation;
                segment.offsets = cylinder.offsets;
                segment.colors = cylinder.colors;
                segment.normals = cylinder.normals;
                segment.position = cylinder.position;
            }

            // console.log(i);

            // Rotate ourself
            const matrix = m4.combine([
                m4.identity(),
                m4.rotateX(rads(90)),
                m4.rotateY(-rightAscensionNode),
                m4.rotateX(i),
                m4.rotateY(-argumentOfPeriapsis),
            ]);

            // TODO: idk if this is right
            let fociX = -semiMajorAxis * e;

            // This fixes the orbit when it is in locations
            // other than 0,0,0
            const matrixPosition = m4.combine([
                m4.translate(center[0], center[1], center[2]),
                matrix,
            ]);

            const orbitPosition = [
                matrixPosition[12],
                matrixPosition[13],
                matrixPosition[14],
            ];

            orbit.position = orbitPosition;
            orbit.additionalMatrix = matrix;
            orbit.offsets = [fociX, 0, 0];
        }

        originalUpdate && originalUpdate.call(this, time_t, engine);
    };

    return orbit;
}
