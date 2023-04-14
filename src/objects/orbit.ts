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
import type { PhysicsEngine, Body } from '../math/physics';
import { createContainer } from './container';

export function drawOrbit(
    physicsEngine: PhysicsEngine,
    body: Body,
    lineProps?: Partial<Omit<Omit<LineToProps, 'from'>, 'to'>>,
    containerProps?: Partial<Obj3d>
): Obj3d {
    const orbit = createContainer({
        ...containerProps,
    });

    const mouseBoxSize = 50;
    const mouseBox = drawCube({
        position: zeros(),
        size: [mouseBoxSize, mouseBoxSize, mouseBoxSize],
    });

    const orbitalPlane = drawCube({
        properties: {
            plane: true,
        },
        position: zeros(),
        size: [1, 1, 1],
        transparent: true,
    });

    orbit.children.push(orbitalPlane);
    orbit.children.push(mouseBox);

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

    const originalUpdate = containerProps?.update;
    orbit.update = function (time_t, engine) {
        const { camera } = engine.activeScene;
        const {
            e,
            center,
            semiMajorAxis,
            semiMinorAxis,
            rightAscensionNode,
            argumentOfPeriapsis,
            i,
        } = physicsEngine.keplerianParameters(body);

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

            /**
             * Orbital alignment
             */
            const planeExtender = 1.25;
            const cross = (engine.properties['mouse_x'] ?? 0) / planeExtender;
            const depth = (engine.properties['mouse_z'] ?? 0) / planeExtender;

            const skewX =
                Math.abs(fociX) >= 1
                    ? (255 * (1.0 - e)) / (-center[0] - fociX)
                    : 1.0;
            const skewY =
                Math.abs(center[2]) >= 1 ? (255 * (1.0 - e)) / center[2] : 1.0;

            engine.debug(`${skewY} [skewY]`);
            const y = semiMajorAxis * (0.5 * skewY - depth);
            const x =
                semiMinorAxis * (cross - 0.5 * skewX) - (-center[0] - fociX);
            const mouseAngle = Math.atan2(y, x);

            mouseBox.position = [
                semiMajorAxis * Math.cos(mouseAngle),
                0,
                semiMinorAxis * Math.sin(mouseAngle),
            ];

            // Render the orbital plane
            const w = semiMajorAxis * 2 * planeExtender;
            const h = semiMinorAxis * 2 * planeExtender;
            orbitalPlane.vertexes = cuboid(w, 1, h);
            orbitalPlane.offsets = [-w / 2, 0.5, -h / 2];
        } else {
            console.error('oops e is not within tolerance');
        }

        originalUpdate && originalUpdate.call(this, time_t, engine);
    };

    return orbit;
}
