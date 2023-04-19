import { cuboid, zeros, type Obj3d } from 'webgl-engine';
import { drawCube } from '../drawing';
import gameState from '../gameState';
import { createContainer } from './container';

export type ManeuverNode = Obj3d & {
    configure: (semiMajorAxis: number, semiMinorAxis: number) => void;
};

export function drawManeuverNode(
    id: number,
    planePadding: number,
    containerProps?: Partial<Obj3d>
): ManeuverNode {
    let semiMajorAxis = 0;
    let semiMinorAxis = 0;

    const container = {
        ...createContainer(containerProps),
        configure: (_semiMajorAxis: number, _semiMinorAxis: number) => {
            semiMajorAxis = _semiMajorAxis;
            semiMinorAxis = _semiMinorAxis;
        },
    };

    container.properties = container.properties ?? {};
    container.properties['maneuverNode'] = true;

    // Create the plane
    const maneuverCubeSize = 35;
    const maneuverCube = drawCube({
        position: zeros(),
        size: [maneuverCubeSize, maneuverCubeSize, maneuverCubeSize],
    });

    const orbitalPlane = drawCube({
        properties: {
            plane: true,
            id,
        },
        position: zeros(),
        size: [1, 1, 1],
        transparent: true,
    });

    container.children.push(maneuverCube);
    container.children.push(orbitalPlane);

    const originalUpdate = container.update;
    container.update = function (time_t, engine) {
        const mouse_x = engine.properties['mouse_x'] ?? 0;
        const mouse_z = engine.properties['mouse_z'] ?? 0;

        const w = semiMajorAxis * 2 * planePadding;
        const h = semiMinorAxis * 2 * planePadding;
        const ratioY = w / h;
        const mx = mouse_x;
        const mz = mouse_z;
        const y = semiMinorAxis * (0.5 - mz) * ratioY;
        const x = semiMajorAxis * (mx - 0.5);
        let mouseAngle = Math.atan2(y, x);

        maneuverCube.position = [
            semiMajorAxis * Math.cos(mouseAngle),
            0,
            semiMinorAxis * Math.sin(mouseAngle),
        ];

        // Render the orbital plane
        orbitalPlane.vertexes = cuboid(w, 1, h);
        orbitalPlane.offsets = [-w / 2, 0.5, -h / 2];

        const orbitalX = orbitalPlane.position[0];
        const orbitalZ = orbitalPlane.position[2];
        const normalizedCubeX = maneuverCube.position[0] - orbitalX;
        const normalizedCubeZ = maneuverCube.position[2] - orbitalZ;
        const mouseRealX = (mx - 0.5) * w;
        const mouseRealY = (0.5 - mz) * h;

        // Compute the distance
        const dist = Math.sqrt(
            Math.pow(normalizedCubeX - mouseRealX, 2) +
                Math.pow(normalizedCubeZ - mouseRealY, 2)
        );
        if (
            dist < 150 &&
            container.properties['id'] === gameState.universe.activeOrbitId
        ) {
            maneuverCube.transparent = false;
            container.transparent = false;
        } else {
            maneuverCube.transparent = true;
            container.transparent = true;
        }

        // Hosit the information up
        container.properties['targetPosition'] = [
            maneuverCube._bbox.x,
            maneuverCube._bbox.y,
            maneuverCube._bbox.z,
        ];
        originalUpdate && originalUpdate.call(this, time_t, engine);
    };

    return container;
}

function normalize(value: number, start: number, end: number) {
    const width = end - start; //
    const offsetValue = value - start; // value relative to 0
    return offsetValue - Math.floor(offsetValue / width) * width + start;
}
