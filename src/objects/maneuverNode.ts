import { cuboid, rads, zeros, type Obj3d } from 'webgl-engine';
import { drawCube } from '../drawing';
import gameState from '../gameState';
import { normalize } from '../utils';
import { createContainer } from './container';

export type ManeuverNode = Obj3d & {
    configure: (semiMajorAxis: number, semiMinorAxis: number) => void;
};

export function drawManeuverNode(
    planePadding: number,
    containerProps?: Partial<Obj3d>
): ManeuverNode {
    let semiMajorAxis = 0;
    let semiMinorAxis = 0;

    const container = {
        ...createContainer({ ...containerProps }),
        transparent: false,
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
        offsets: [
            -maneuverCubeSize / 2,
            -maneuverCubeSize / 2,
            -maneuverCubeSize / 2,
        ],
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
        if (container.transparent === true) {
            orbitalPlane.properties['plane'] = false;
            maneuverCube.transparent = true;
            return;
        } else {
            orbitalPlane.properties['plane'] = true;
        }

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

        maneuverCube.rotation[1] = mouseAngle;
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
        if (dist < 150) {
            maneuverCube.transparent = false;
            container.properties['visible'] = true;
        } else {
            maneuverCube.transparent = true;
            container.properties['visible'] = false;
        }

        // Hosit the information up
        container.properties['mouseAngle'] = normalize(
            mouseAngle,
            0,
            2 * Math.PI
        );
        container.properties['targetPosition'] = [
            maneuverCube._bbox.x,
            maneuverCube._bbox.y,
            maneuverCube._bbox.z,
        ];
        originalUpdate && originalUpdate.call(this, time_t, engine);
    };

    return container;
}
