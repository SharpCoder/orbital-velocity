import {
    DefaultShader,
    getAnglesFromMatrix,
    m4,
    rads,
    Scene,
} from 'webgl-engine';
import { useTouchCamera } from '../logic/useTouchCamera';
import { drawCube, lineTo } from '../drawing';
import { PhysicsEngine } from '../math/physics';
import { EllipseCalculator } from '../math/ellipse';
import { createContainer } from '../objects/container';

const physicsEngine = new PhysicsEngine();
const Satellite = physicsEngine.addBody({
    position: [500, 0, 0],
    velocity: [0, 20, 40],
    mass: 1,
});

const Sun = physicsEngine.addBody({
    position: [-500, 0, 0],
    velocity: [0, 0, 0],
    mass: 1e26,
});

const Sun2 = physicsEngine.addBody({
    position: [1000, 0, 0],
    velocity: [0, 25, 40],
    mass: 1e2,
});

window['sat'] = Satellite;

const cubeSize = 60;
const sunSize = 100;
const dt = 0.25;
const orbitThickness = 5;
const segments = [];
let initialY = 0;

const ellipse = createContainer();

export const UniverseScene = new Scene({
    title: 'universe',
    shaders: [DefaultShader],
    init: (engine) => {
        engine.settings.fogColor = [1, 1, 1, 1];
        engine.settings.fogColor = [0.0, 0.0, 0.0, 1];
        const { camera } = UniverseScene;
        camera.offset[0] = -500;
        camera.rotation[0] = rads(-65);
        camera.rotation[1] = -rads(180);
    },
    update: (time, engine) => {
        const { camera } = engine.activeScene;

        camera.position = Sun.position;

        useTouchCamera(engine, initialY);
        physicsEngine.update(dt);
        drawEllipse();
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

const TheSun = drawCube({
    x: Sun.position[0],
    y: Sun.position[1],
    z: Sun.position[2],
    size: [sunSize, sunSize, sunSize],
    color: [255, 255, 255],
    update: function (t, engine) {
        this.position = Sun.position;
    },
});

UniverseScene.addObject(TheSun);

UniverseScene.addObject(
    drawCube({
        x: Sun2.position[0],
        y: Sun2.position[1],
        z: Sun2.position[2],
        size: [cubeSize, cubeSize, cubeSize],
        update: function (t, engine) {
            this.position = Sun2.position;
        },
    })
);

UniverseScene.addObject(Borg);
segments.forEach((segment) => UniverseScene.addObject(segment));

function drawEllipse() {
    UniverseScene.removeObject(ellipse);

    // Clear children
    ellipse.children.splice(0, ellipse.children.length);

    // Create new children
    const parameters = physicsEngine.keplerianParameters(Satellite);

    const origin = parameters.center;
    const semiMajorAxis = parameters.semiMajorAxis;
    const semiMinorAxis = parameters.semiMinorAxis;
    const rightAscensionNode = parameters.rightAscensionNode;
    const argumentOfPeriapsis = parameters.argumentOfPeriapsis;
    const inclination = parameters.i;
    const eccentricity = parameters.e;

    if (eccentricity > 1.0) return;

    const positions = EllipseCalculator.compute({
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
            color: [0, 128, 255],
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
    // ellipse.offsets = origin;
    ellipse.offsets = [
        -semiMajorAxis * eccentricity - origin[0],
        -origin[1],
        -origin[2],
    ];
    Borg.rotation = ellipse.rotation;
    UniverseScene.addObject(ellipse);
}
