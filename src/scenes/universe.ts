import { debug } from 'svelte/internal';
import {
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
import { keplerianParameters, PhysicsEngine, type Body } from '../math/physics';
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
    // position: [1500 - offset, 0, 0],
    // velocity: [0, 20, 30],
    position: [1500, 150, 0],
    velocity: [0, 20, 40],
    mass: 1,
});

// const Planet = physicsEngine.addBody({
//     position: [1500000 - offset, 0, 0],
//     velocity: [0, 0, 0],
//     mass: 1e26,
// });

let dt = 0.05;
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

const maneuverSatellite = createContainer({});
const maneuverOrbit = drawOrbit(
    Satellite.position,
    Satellite.velocity,
    Sun.position,
    Sun.mass + Satellite.mass,
    {
        color: sage,
    }
);

const vectorLine = lineTo({
    from: [0, 0, 0],
    to: [0, 0, 0],
    thickness: 1,
    color: [255, 0, 0],
});

const tangentLine = lineTo({
    from: [0, 0, 0],
    to: [0, 0, 0],
    thickness: 1,
    color: [255, 0, 0],
});

const orbitalVelocityLine = lineTo({
    from: [0, 0, 0],
    to: [0, 0, 0],
    thickness: 1,
    color: [0, 0, 255],
});

let elapsedPhysicsTimer = 0;

// Advance 41 seconds
for (let t = 0; t < 78; t += dt) {
    physicsEngine.update(dt);
    elapsedPhysicsTimer += dt;
}

export const UniverseScene = new Scene<EngineProperties>({
    title: 'universe',
    shaders: [DefaultShader, DepthShader, StarboxShader],
    init: (engine) => {
        const { camera } = UniverseScene;
        engine.settings.fogColor = [0, 0, 0, 1];

        // Start with physics frozen
        engine.properties.freezePhysics = true;

        // camera.rotation[0] = -rads(180 + 45);
        // camera.rotation[1] = -rads(180);

        // camera.rotation[0] = -rads(188);
        // camera.rotation[1] = -rads(263);

        camera.rotation[0] = -rads(185);
        camera.rotation[1] = rads(272);

        camera.position = [...Sun.position];
        camera.position[0] += -500;
    },
    update: (time, engine) => {
        const { prograde, across } = engine.properties.orbit;

        useTouchCamera(engine);

        if (engine.properties.freezePhysics !== true) {
            physicsEngine.update(dt);
            elapsedPhysicsTimer += dt;
        }

        // Calculate the new orbit
        const accel = 1.0;
        const params = keplerianParameters(
            Satellite.position,
            Satellite.velocity,
            Sun.position,
            Sun.mass
        );

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

        const gfieldMag = norm(gravityField);

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

        // for (let j = 0; j < 3; j++) {
        //     dv[j] = gravityField[j] - dv[j];
        // }
        // let dvx = vx * prograde + v3[0];
        // let dvy = vy * prograde + v3[1];
        // let dvz = vz * prograde + v3[2];

        const vectorLineUpdate = lineTo({
            from: [...Satellite.position],
            to: [
                Satellite.position[0] + dvx * 10,
                Satellite.position[1] + dvy * 10,
                Satellite.position[2] + dvz * 10,
            ],
            thickness: 5,
        });

        for (const prop in vectorLineUpdate) {
            vectorLine[prop] = vectorLineUpdate[prop];
        }

        const orbitalLineUpdate = lineTo({
            from: [...Satellite.position],
            to: [
                Satellite.position[0] + gravityField[0] * 50,
                Satellite.position[1] + gravityField[1] * 50,
                Satellite.position[2] + gravityField[2] * 50,
            ],
            color: [0, 128, 255],
            thickness: 5,
        });

        for (const prop in orbitalLineUpdate) {
            orbitalVelocityLine[prop] = orbitalLineUpdate[prop];
        }

        const tangentLineUpdate = lineTo({
            from: [...Satellite.position],
            to: [
                Satellite.position[0] + unit[0] * 5,
                Satellite.position[1] + unit[1] * 5,
                Satellite.position[2] + unit[2] * 5,
            ],
            color: pink,
            thickness: 5,
        });

        for (const prop in tangentLineUpdate) {
            tangentLine[prop] = tangentLineUpdate[prop];
        }

        let shadowBody: Body = {
            _forces: [...Satellite._forces],
            internalId: Satellite.internalId,
            mass: Satellite.mass,
            position: [...Satellite.position],
            velocity: [
                Satellite.velocity[0] + dvx,
                Satellite.velocity[1] + dvy,
                Satellite.velocity[2] + dvz,
            ],
        };

        shadowBody = physicsEngine.project(dt, 7, shadowBody);

        // Update velocity
        // console.log({
        //     futureBodyPos: shadowBody.position,
        //     futureBodyvel: shadowBody.velocity,
        // });

        engine.debug(`${shadowBody.velocity.map((a) => r(a))}`);
        // engine.debug(`${Satellite.position[2]} [y-component]`);

        const maneuverPosition = [...shadowBody.position];
        const maneuverVelocity = [...shadowBody.velocity];

        maneuverOrbit.recalculateOrbit(
            [...maneuverPosition],
            [...maneuverVelocity],
            Sun.position,
            Sun.mass + Satellite.mass
        );

        // maneuverSatellite.children[0].transparent = true;
        maneuverSatellite.position = [...shadowBody.position];

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
        const obj = await loadModel(moonModel, 'obj');
        const size = obj.vertexes.reduce((a, b) => {
            if (isNaN(a)) a = 0;
            if (isNaN(b)) b = 0;
            return Math.max(Math.abs(a), Math.abs(b));
        }, 0);

        const vertexes = obj.vertexes.map((p) => {
            if (isNaN(p)) p = 0;
            return p / size;
        });

        const scale = 50;
        const TheSun: Obj3d = {
            vertexes: vertexes,
            position: Sun.position,
            offsets: zeros(),
            rotation: zeros(),
            scale: [scale, scale, scale],
            colors: Flatten(
                Repeat(Vec3(255, 255, 255), obj.vertexes.length / 3)
            ),
            update: function (t, engine) {
                this.position = Sun.position;
                this.offsets = [-scale / 2, -scale / 2, -scale / 2];
            },
        };

        UniverseScene.addObject(TheSun);

        const ShadowSatellite: Obj3d = {
            ...obj,
            position: zeros(),
            offsets: zeros(),
            rotation: zeros(),
            scale: [cubeSize, cubeSize, cubeSize],
            colors: Flatten(Repeat(sage, obj.vertexes.length / 3)),
        };

        maneuverSatellite.children = [ShadowSatellite];

        // const planetScale = 1000;
        // const ThePlanet: Obj3d = {
        //     vertexes: vertexes,
        //     position: Planet.position,
        //     offsets: zeros(),
        //     rotation: zeros(),
        //     scale: [planetScale, planetScale, planetScale],
        //     colors: Flatten(
        //         Repeat(Vec3(255, 255, 255), obj.vertexes.length / 3)
        //     ),
        //     update: function (t, engine) {
        //         this.position = Planet.position;
        //         this.offsets = [
        //             -planetScale / 2,
        //             -planetScale / 2,
        //             -planetScale / 2,
        //         ];
        //     },
        // };

        // UniverseScene.addObject(ThePlanet);

        UniverseScene.addObject(maneuverSatellite);
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
                        .map((d) => degs(d))
                        .join(', ')}`,
                    `t: ${elapsedPhysicsTimer}`,
                    `rightAscensionNode: ${r(degs(params.rightAscensionNode))}`,
                    `argumentOfPeriapsis: ${r(
                        degs(params.argumentOfPeriapsis)
                    )}`,
                    `a: ${r(params.semiMajorAxis)}`,
                    `b: ${r(params.semiMinorAxis)}`,
                    `inclination: ${r(degs(params.i))}`,
                    `velocity <${r(Satellite.velocity[0])}, ${r(
                        Satellite.velocity[1]
                    )}, ${r(Satellite.velocity[2])}>`,
                ];

                engine.properties['readout'] = readoutLines.join('\n');
            },
        });
    });

UniverseScene.addObject(tangentLine);
UniverseScene.addObject(vectorLine);
UniverseScene.addObject(orbitalVelocityLine);
UniverseScene.addObject(orbit);
UniverseScene.addObject(maneuverOrbit);
