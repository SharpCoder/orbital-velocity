import { type Scene, type Obj3d, m4, getAnglesFromMatrix } from 'webgl-engine';
import { lineTo, type LineToProps } from '../drawing';
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

    const originalUpdate = containerProps?.update;
    orbit.update = function (time_t, engine) {
        const scene = engine.activeScene;
        scene.removeObject(orbit);
        delete orbit.children;
        orbit.children = [];

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

            for (let i = 0; i < positions.length - 1; i++) {
                const from = [positions[i][0], 0, positions[i][1]];
                const to = [positions[i + 1][0], 0, positions[i + 1][1]];
                orbit.children.push(
                    lineTo({
                        from,
                        to,
                        sides: 4,
                        thickness: 5,
                        color: [255, 0, 0],
                        ...lineProps,
                    })
                );
            }

            // Rotate ourself
            const matrix = m4.combine([
                m4.rotateY(rightAscensionNode),
                m4.rotateX(i - Math.PI / 2),
                m4.rotateY(argumentOfPeriapsis),
            ]);

            const rotation = getAnglesFromMatrix(matrix);
            orbit.rotation = rotation;
            orbit.offsets = [
                -semiMajorAxis * e - center[0],
                -center[1],
                -center[2],
            ];
        }

        scene.addObject(orbit);
        originalUpdate && originalUpdate.call(this, time_t, engine);
    };

    return orbit;
}
