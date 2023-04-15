import { cuboid, r, zeros, type Obj3d } from 'webgl-engine';
import { drawCube } from '../drawing';
import type { Body, PhysicsEngine } from '../math/physics';
import { createContainer } from './container';

export function drawManeuverNode(
    physicsEngine: PhysicsEngine,
    body: Body,
    planePadding: number,
    containerProps?: Partial<Obj3d>
): Obj3d {
    const container = createContainer(containerProps);

    // Create the plane
    const maneuverCubeSize = 50;
    const maneuverCube = drawCube({
        position: zeros(),
        size: [maneuverCubeSize, maneuverCubeSize, maneuverCubeSize],
    });

    const orbitalPlane = drawCube({
        properties: {
            plane: true,
        },
        position: zeros(),
        size: [1, 1, 1],
        transparent: true,
    });

    container.children.push(maneuverCube);
    container.children.push(orbitalPlane);

    const originalUpdate = container.update;
    container.update = function (time_t, engine) {
        const { e, center, semiMajorAxis, semiMinorAxis } =
            physicsEngine.keplerianParameters(body);

        const bboxW = orbitalPlane._bbox?.w ?? 0;
        const centerX = (orbitalPlane._bbox?.x ?? 0) - bboxW;

        const mouse_x = (engine.properties['mouse_x'] ?? 0) / planePadding;
        const mouse_z = (engine.properties['mouse_z'] ?? 0) / planePadding;

        const mx = mouse_x * planePadding;
        const mz = mouse_z * planePadding;
        const y = semiMinorAxis * (0.5 - mz);
        const x = semiMajorAxis * (mx - 0.5);
        const mouseAngle = Math.atan2(y, x);

        maneuverCube.position = [
            semiMajorAxis * Math.cos(mouseAngle),
            0,
            semiMinorAxis * Math.sin(mouseAngle),
        ];

        // Render the orbital plane
        const w = semiMajorAxis * 2 * planePadding;
        const h = semiMinorAxis * 2 * planePadding;
        orbitalPlane.vertexes = cuboid(w, 1, h);
        orbitalPlane.offsets = [-w / 2, 0.5, -h / 2];

        const orbitalX = orbitalPlane.position[0];
        const orbitalZ = orbitalPlane.position[2];
        const normalizedCubeX = maneuverCube.position[0] - orbitalX;
        const normalizedCubeZ = maneuverCube.position[2] - orbitalZ;

        // Compute the distance
        const dist = Math.sqrt(
            Math.pow(normalizedCubeX - x * 2, 2) +
                Math.pow(normalizedCubeZ - y * 2, 2)
        );

        if (dist > 300) {
            maneuverCube.transparent = true;
        } else {
            maneuverCube.transparent = false;
        }

        originalUpdate && originalUpdate.call(this, time_t, engine);
    };

    return container;
}
