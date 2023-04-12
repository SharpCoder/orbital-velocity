import { Camera, DefaultShader, degs, m4, r, rads, Scene } from 'webgl-engine';
import { useTouchCamera } from '../logic/useTouchCamera';
import { drawCube, lineTo } from '../drawing';
import { NaviCube } from '../objects/naviCube';
import { keplerianParameters, PhysicsEngine } from '../math/physics';
import { Propagator } from '../math/propagator';
import { createContainer } from '../objects/container';

const physicsEngine = new PhysicsEngine();
const Satellite = physicsEngine.addBody({
    position: [1500, 0, 0],
    velocity: [10, 20, 30],
    mass: 1,
});

const Sun = physicsEngine.addBody({
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    mass: 1e26,
});

const Sun2 = physicsEngine.addBody({
    position: [-2000, 0, 0],
    velocity: [22, 0, -40],
    mass: 2,
});

const cubeSize = 60;
const sunSize = 100;
const dt = 1;
const orbitThickness = 5;
const segments = [];
let initialY = 0;
let next = 0;
let elapsed = 0;
let period = 0;
let incl = 0;

const orbit = createContainer();
const ellipse = createContainer();
let elapsedTime = 0;
let nextUpdate = 0;

export const UniverseScene = new Scene({
    title: 'universe',
    shaders: [DefaultShader],
    init: (engine) => {
        engine.settings.fogColor = [1, 1, 1, 1];
        engine.settings.fogColor = [0.0, 0.0, 0.0, 1];
        const { camera } = UniverseScene;
        camera.offset[2] = 0;
        camera.rotation[0] = rads(33);
        camera.rotation[1] = -rads(186);
    },
    update: (time, engine) => {
        const { camera } = UniverseScene;
        useTouchCamera(engine, initialY);
        // camera.position = Satellite.position;

        // if (elapsed > 0) return;

        physicsEngine.update(dt);
        elapsed += dt;

        // Update the orbit
        if (elapsed > next) {
            drawEllipse();
            const { orbitalPeriod, i } = keplerianParameters(
                Satellite.position,
                Satellite.velocity,
                Satellite.mass + Sun.mass
            );

            period = orbitalPeriod;
            next = elapsed + 1; //period * 0.25;
            incl = i;

            const next_solutions = physicsEngine.project(
                Math.min(period + 1, 300),
                dt
            );
            // engine.activeScene.removeObject(orbit);
            // orbit.children.splice(0, orbit.children.length);

            // const color = [255, 128, 0];

            // for (let i = 0; i < next_solutions.length - 1; i++) {
            //     let fromId = i;
            //     let toId = i + 1;

            //     const from = next_solutions[fromId].positions[0];
            //     const to = next_solutions[toId].positions[0];
            //     const next_segment = lineTo({
            //         from: [...from],
            //         to: [...to],
            //         thickness: orbitThickness,
            //         color,
            //     });

            //     orbit.children.push(next_segment);
            // }

            // UniverseScene.addObject(orbit);
        }
    },
    status: 'initializing',
});

const Borg = drawCube({
    x: 0,
    y: 0,
    z: 0,
    size: [cubeSize, cubeSize, cubeSize],
    update: function (t, engine) {
        this.position = Satellite.position;
    },
});

UniverseScene.addObject(
    drawCube({
        x: Sun.position[0],
        y: Sun.position[1],
        z: Sun.position[2],
        size: [sunSize, sunSize, sunSize],
        color: [255, 128, 0],
        update: function (t, engine) {
            this.position = Sun.position;
        },
    })
);

// UniverseScene.addObject(
//     drawCube({
//         x: Sun2.position[0],
//         y: Sun2.position[1],
//         z: Sun2.position[2],
//         size: [cubeSize, cubeSize, cubeSize],
//         update: function (t, engine) {
//             this.position = Sun2.position;
//         },
//     })
// );

UniverseScene.addObject(Borg);
segments.forEach((segment) => UniverseScene.addObject(segment));
UniverseScene.addObject(NaviCube());

const propagator = new Propagator();
function drawEllipse() {
    UniverseScene.removeObject(ellipse);

    // Clear children
    ellipse.children.splice(0, ellipse.children.length);

    // Create new children
    const parameters = keplerianParameters(
        Satellite.position,
        Satellite.velocity,
        Sun.mass + Satellite.mass
    );

    const semiMajorAxis = parameters.semiMajorAxis;
    const semiMinorAxis = parameters.semiMinorAxis;
    const rightAscensionNode = parameters.rightAscensionNode;
    const argumentOfPeriapsis = parameters.argumentOfPeriapsis;
    const inclination = parameters.i;
    const eccentricity = parameters.e;

    if (eccentricity > 1.0) return;

    const positions = propagator.propagate({
        semiMajorAxis: semiMajorAxis,
        semiMinorAxis: semiMinorAxis,
    });

    for (let i = 0; i < positions.length - 1; i++) {
        const from = [positions[i][0], 0, positions[i][1]];
        const to = [positions[i + 1][0], 0, positions[i + 1][1]];
        const child = lineTo({
            from,
            to,
            sides: 10,
            thickness: orbitThickness,
            color: [255, 255, 255],
        });
        ellipse.children.push(child);
    }

    const incl = inclination;

    // Compute rotations
    const matrix = m4.combine([
        m4.rotateY(rightAscensionNode),
        m4.rotateX(incl - Math.PI / 2),
        m4.rotateY(argumentOfPeriapsis),
    ]);

    const rotation = getAnglesFromMatrix(matrix);

    ellipse.rotation = rotation;
    ellipse.offsets = [-semiMajorAxis * eccentricity, 0, 0];

    UniverseScene.addObject(ellipse);
}

function getAnglesFromMatrix(mm: number[]) {
    let thetaX = 0,
        thetaY = 0,
        thetaZ = 0;

    function idx(row, col) {
        return (col - 1) * 4 + row - 1;
    }

    thetaX = Math.asin(mm[idx(3, 2)]);
    if (thetaX < Math.PI / 2) {
        if (thetaX > -Math.PI / 2) {
            thetaZ = Math.atan2(-mm[idx(1, 2)], mm[idx(2, 2)]);
            thetaY = Math.atan2(-mm[idx(3, 1)], mm[idx(3, 3)]);
        } else {
            thetaZ = -Math.atan2(-mm[idx(1, 3)], mm[idx(1, 1)]);
            thetaY = 0;
        }
    } else {
        thetaZ = Math.atan2(mm[idx(1, 3)], mm[idx(1, 1)]);
        thetaY = 0;
    }
    return [thetaX, thetaY, thetaZ];
}
