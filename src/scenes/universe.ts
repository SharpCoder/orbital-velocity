import { debug } from 'svelte/internal';
import {
    DefaultShader,
    Engine,
    Flatten,
    loadModel,
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
import { keplerianParameters, PhysicsEngine } from '../math/physics';
import { drawManeuverNode } from '../objects/maneuverNode';
import { drawOrbit } from '../objects/orbit';
import { DepthShader } from '../shaders/depth';
import { StarboxShader } from '../shaders/starbox';
import type { EngineProperties } from '../types';

const offset = 0;
const offsetY = 0;

const physicsEngine = new PhysicsEngine();

const Sun = physicsEngine.addBody({
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    mass: 1e26,
});

const Satellite = physicsEngine.addBody({
    position: [1500 - offset, 0, 0],
    velocity: [0, 20, 30],
    mass: 1e1,
});
// const Planet = physicsEngine.addBody({
//     position: [1500000 - offset, 0, 0],
//     velocity: [0, 0, 0],
//     mass: 1e26,
// });

const dt = 0.05;
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

const vectorLine = lineTo({
    from: [0, 0, 0],
    to: [0, 0, 0],
    thickness: 1,
    color: [255, 0, 0],
});

export const UniverseScene = new Scene<EngineProperties>({
    title: 'universe',
    shaders: [DefaultShader, DepthShader, StarboxShader],
    init: (engine) => {
        const { camera } = UniverseScene;
        engine.settings.fogColor = [0, 0, 0, 1];

        // Start with physics frozen
        engine.properties.freezePhysics = true;

        camera.rotation[0] = -rads(180 + 45);
        camera.rotation[1] = -rads(180);
        camera.position = [...Sun.position];
        camera.position[0] += 500;
    },
    update: (time, engine) => {
        const { camera } = engine.activeScene;
        useTouchCamera(engine);

        if (engine.properties.freezePhysics !== true) {
            physicsEngine.update(dt);
        }

        // Calculate the new orbit
        const accel = 0.4;
        // const unit = m4.cross(Sun.position, Satellite.position);
        // const unit = Satellite.velocity;

        const unit = [...Satellite.velocity];
        const mag = norm(unit);

        const vx = accel * (unit[0] / mag);
        const vy = accel * (unit[1] / mag);
        const vz = accel * (unit[2] / mag);

        const params = keplerianParameters(
            Satellite.position,
            Satellite.velocity,
            Sun.position,
            Sun.mass
        );

        const { prograde, across } = engine.properties.orbit;

        // Calculate the gravity field
        const gfield = Satellite._forces.reduce(
            (acc, cur) => {
                acc[0] += cur[0];
                acc[1] += cur[1];
                acc[2] += cur[2];
                return acc;
            },
            [0, 0, 0]
        );

        const gfieldMag = norm(gfield);

        const matrixes = m4.combine([
            m4.rotateY(params.rightAscensionNode),
            m4.rotateX(params.i - Math.PI / 2),
            m4.rotateY(params.argumentOfPeriapsis),
            m4.rotateZ(rads(90)),
            // m4.rotateZ(-params.nu),
            // m4.rotateX(-rads(90)),
            // m4.translate(unit[0], unit[1], unit[2]),
            m4.translate(1, 0, 0),
            // m4.translate(unit[0] / mag, unit[1] / mag, unit[2] / mag),
            // m4.rotateY(rads(45)),
        ]);

        const v2 = [matrixes[12], matrixes[13], matrixes[14]];
        // const v2 = m4.cross(
        //     unit,
        //     // gfield,
        //     [1, 0, 0]
        // );

        const v2norm = norm(v2);
        let dvx = vx * prograde + accel * across * (v2[0] / v2norm);
        let dvy = vy * prograde + accel * across * (v2[1] / v2norm);
        let dvz = vz * prograde + accel * across * (v2[2] / v2norm);

        engine.debug(`${dvx} [dvx]`);
        engine.debug(`${dvy} [dvy]`);
        engine.debug(`${dvz} [dvz]`);
        // Project
        // const stateVector = physicsEngine.project(
        //     Satellite,
        //     [dvx, dvy, dvz],
        //     dt,
        //     dt
        // );

        // const midpoint = stateVector.length / 2;
        const maneuverPosition = [...Satellite.position];
        const maneuverVelocity = [unit[0] + dvx, unit[1] + dvy, unit[2] + dvz];
        const vectorLineUpdate = lineTo({
            from: [...Satellite.position],
            to: [
                Satellite.position[0] + (unit[0] + dvx) * 2,
                Satellite.position[1] + (unit[1] + dvy) * 2,
                Satellite.position[2] + (unit[2] + dvz) * 2,
            ],
            thickness: 5,
        });

        for (const prop in vectorLineUpdate) {
            vectorLine[prop] = vectorLineUpdate[prop];
        }

        // const maneuverPosition = [...Satellite.position];
        // const maneuverVelocity = [unit[0] + dvx, unit[1] + dvy, unit[2] + dvz];
        const gf = gfield.map((p) => p / gfieldMag);

        maneuverOrbit.recalculateOrbit(
            [...Satellite.position],
            [unit[0] + dvx, unit[1] + dvy, unit[2] + dvz],
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
            alert('hello');
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

                const readoutLines = [
                    `velocity <${r(Satellite.velocity[0])}, ${r(
                        Satellite.velocity[1]
                    )}, ${r(Satellite.velocity[2])}>`,
                ];

                engine.properties['readout'] = readoutLines.join('\n');
            },
        });
    });

UniverseScene.addObject(vectorLine);
UniverseScene.addObject(orbit);
UniverseScene.addObject(maneuverOrbit);
