import {
    type Obj3d,
    m4,
    getAnglesFromMatrix,
    zeros,
    degs,
    rads,
    r,
    cuboid,
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

    const orbit: Orbit3d = {
        ...createContainer({
            ...containerProps,
        }),
        recalculateOrbit: (position, velocity, origin, mass) => {
            const params = keplerianParameters(
                [...position],
                [...velocity],
                [...origin],
                mass
            );

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
            thickness: 5,
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
                    thickness: 5,
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

            // Rotate ourself
            const matrix = m4.combine([
                m4.rotateY(rightAscensionNode),
                m4.rotateX(i - Math.PI / 2),
                m4.rotateY(argumentOfPeriapsis),
            ]);

            // TODO: idk if this is right
            let fociX = -semiMajorAxis * e;
            if (argumentOfPeriapsis < rads(90)) {
                fociX += center[0];
            } else {
                fociX -= center[0];
            }

            const rotation = getAnglesFromMatrix(matrix);
            orbit.rotation = rotation;
            orbit.offsets = [fociX, -center[1], -center[2]];
        }

        originalUpdate && originalUpdate.call(this, time_t, engine);
    };

    return orbit;
}
