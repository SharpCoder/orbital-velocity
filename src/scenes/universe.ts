import { debug } from 'svelte/internal';
import {
    cuboid,
    DefaultShader,
    degs,
    Engine,
    Flatten,
    loadModel,
    m3,
    m4,
    norm,
    r,
    rads,
    Repeat,
    Scene,
    Vec3,
    zeros,
    type Obj3d,
} from 'webgl-engine';
import { pink, purple, sage, yellow } from '../colors';
import { lineTo, lineToPositionAndRotation } from '../drawing';
import { useTouchCamera } from '../logic/useTouchCamera';
import { EllipseCalculator } from '../math/ellipse';
import {
    G,
    keplerianParameters,
    PhysicsEngine,
    type Body,
} from '../math/physics';
import { createContainer } from '../objects/container';
import { drawManeuverNode } from '../objects/maneuverNode';
import { drawOrbit } from '../objects/orbit';
import { DepthShader } from '../shaders/depth';
import { StarboxShader } from '../shaders/starbox';
import type { EngineProperties } from '../types';

const physicsEngine = new PhysicsEngine();

const Sun = physicsEngine.addBody({
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    mass: 1e26,
});

const Satellite = physicsEngine.addBody({
    position: [1500, 0, 500],
    velocity: [0, 20, 40],
    mass: 1,
});

let dt = 0.5;
const cubeSize = 25;
const orbitalManeuverNode = drawManeuverNode(physicsEngine, Satellite, 1.1);
const orbit = drawOrbit(
    Satellite.position,
    Satellite.velocity,
    Sun.position,
    Sun.mass + Satellite.mass,
    {
        color: purple,
    },
    {
        children: [orbitalManeuverNode],
    }
);

const maneuverOrbit = drawOrbit(
    Satellite.position,
    Satellite.velocity,
    Sun.position,
    Sun.mass + Satellite.mass,
    {
        color: sage,
    }
);

// Draw a baseline ellipse
const baselineOrbit = createContainer({});
const baselinePositions = EllipseCalculator.compute({
    semiMajorAxis: 1050,
    semiMinorAxis: 1050,
});
for (let i = 0; i < baselinePositions.length - 1; i++) {
    const from = [baselinePositions[i][0], 0, baselinePositions[i][1]];
    const to = [baselinePositions[i + 1][0], 0, baselinePositions[i + 1][1]];
    const segment = lineTo({
        from: from,
        to: to,
        thickness: 5,
        sides: 4,
        color: [255, 255, 255],
    });
    baselineOrbit.children.push(segment);
}

const originalOrbitalElements = keplerianParameters(
    Satellite.position,
    Satellite.velocity,
    Sun.position,
    Sun.mass
);

export const UniverseScene = new Scene<EngineProperties>({
    title: 'universe',
    shaders: [DefaultShader, DepthShader, StarboxShader],
    init: (engine) => {
        const { camera } = UniverseScene;
        engine.settings.fogColor = [0, 0, 0, 1];

        // Start with physics frozen
        engine.properties.freezePhysics = true;

        camera.rotation[0] = rads(18);
        camera.rotation[1] = -rads(235);
        camera.rotation[2] = originalOrbitalElements.e;

        camera.position = [...Sun.position];
    },
    update: (time, engine) => {
        const { prograde, across } = engine.properties.orbit;

        useTouchCamera(engine);

        if (engine.properties.freezePhysics !== true) {
            physicsEngine.update(dt);
        }

        // Calculate the new orbit
        const accel = 0.5;

        // Calculate the gravity field
        const gravityField = Satellite._forces.reduce(
            (acc, cur) => {
                acc[0] += cur[0];
                acc[1] += cur[1];
                acc[2] += cur[2];
                return acc;
            },
            [0, 0, 0]
        );

        const unit = [...Satellite.velocity]; //.map((u, i) => u - gravityField[i]);
        const mag = norm(unit);

        const vx = accel * (unit[0] / mag);
        const vy = accel * (unit[1] / mag);
        const vz = accel * (unit[2] / mag);

        const v2 = m4.cross(
            unit.map((v, i) => gravityField[i]),
            unit.map((v) => v)
        );
        const v2norm = norm(v2);

        let dvx = vx * prograde + across * accel * (v2[0] / v2norm);
        let dvy = vy * prograde + across * accel * (v2[1] / v2norm);
        let dvz = vz * prograde + across * accel * (v2[2] / v2norm);

        const maneuverPosition = [...Satellite.position];
        const maneuverVelocity = [
            Satellite.velocity[0] + dvx,
            Satellite.velocity[1] + dvy,
            Satellite.velocity[2] + dvz,
        ];

        maneuverOrbit.recalculateOrbit(
            [...maneuverPosition],
            [...maneuverVelocity],
            Sun.position,
            Sun.mass + Satellite.mass
        );

        orbit.recalculateOrbit(
            Satellite.position,
            Satellite.velocity,
            Sun.position,
            Sun.mass + Satellite.mass
        );
    },
    onMouseUp: (engine) => {
        const { mouseClickDuration } = engine;
        if (mouseClickDuration < 180 && !orbitalManeuverNode.transparent) {
            // alert('hello');
        }
    },
    status: 'initializing',
});

fetch('models/ball.obj')
    .then((obj) => {
        return obj.blob();
    })
    .then(async (moonModel) => {
        const scale = 100;
        const obj = await loadModel(moonModel, 'obj');
        const sizes = obj.vertexes.reduce(
            (a, b) => {
                if (isNaN(b)) b = 0;
                if (a[0] > b) a[0] = b;
                if (a[1] < b) a[1] = b;
                return a;
            },
            [Number.MAX_VALUE, -Number.MAX_VALUE]
        );

        const size = sizes[1];

        const vertexes = obj.vertexes.map((p) => {
            if (isNaN(p)) p = 0;
            return p / size;
        });

        const TheSun: Obj3d = {
            vertexes: vertexes,
            position: Sun.position,
            offsets: zeros(),
            scale: [scale, scale, scale],
            rotation: zeros(),
            colors: Flatten(
                Repeat(Vec3(255, 255, 255), obj.vertexes.length / 3)
            ),
            update: function (t, engine) {
                this.position = Sun.position;
                this.offsets = [-scale / 2, -scale / 2, -scale / 2];
            },
        };

        UniverseScene.addObject(TheSun);

        UniverseScene.addObject({
            ...obj,
            position: zeros(),
            offsets: zeros(),
            rotation: zeros(),
            scale: [cubeSize, cubeSize, cubeSize],
            colors: Flatten(
                Repeat(Vec3(255, 255, 255), obj.vertexes.length / 3)
            ),
            update: function (t, engine) {
                this.position = Satellite.position;
                this.offsets = [-cubeSize / 4, -cubeSize / 4, -cubeSize / 4];
                const params = physicsEngine.keplerianParameters(Satellite);

                const readoutLines = [
                    `c: ${engine.activeScene.camera.rotation
                        .map((d) => r(degs(d)))
                        .join(', ')}`,
                    `orbital period: ${r(params.orbitalPeriod)}`,
                    `rightAscensionNode: ${r(degs(params.rightAscensionNode))}`,
                    `argumentOfPeriapsis: ${r(
                        degs(params.argumentOfPeriapsis)
                    )}`,
                    `e: ${r(params.e)}`,
                    `inclination: ${r(degs(params.i))}`,
                    `velocity <${r(Satellite.velocity[0])}, ${r(
                        Satellite.velocity[1]
                    )}, ${r(Satellite.velocity[2])}>`,
                ];

                engine.properties['readout'] = readoutLines.join('\n');
            },
        });
    });

UniverseScene.addObject(orbit);
UniverseScene.addObject(maneuverOrbit);
