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
import { pink, sage, yellow } from '../colors';
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
const Planet = physicsEngine.addBody({
    position: [1500000 - offset, 0, 0],
    velocity: [0, 0, 0],
    mass: 1e26,
});

const cubeSize = 25;
const orbitalManeuverNode = drawManeuverNode(physicsEngine, Satellite, 1.1);
const orbit = drawOrbit(
    Satellite.position,
    Satellite.velocity,
    Sun.position,
    Sun.mass + Satellite.mass,
    {
        color: sage,
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
        color: pink,
    }
);

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
            physicsEngine.update(0.025);
        }

        // Calculate the new orbit
        const accel = 0.3;
        // const unit = m4.cross(Sun.position, Satellite.position);
        // const unit = Satellite.velocity;

        const unit = Satellite.velocity;
        const mag = norm(unit) * 1;

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

        const maneuverPosition = [...Satellite.position];
        const maneuverVelocity = [
            Satellite.velocity[0] + vx * prograde,
            Satellite.velocity[1] + vy * prograde,
            Satellite.velocity[2] + vz * prograde,
        ];

        maneuverOrbit.recalculateOrbit(
            maneuverPosition,
            maneuverVelocity,
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

        const planetScale = 1000;
        const ThePlanet: Obj3d = {
            vertexes: vertexes,
            position: Planet.position,
            offsets: zeros(),
            rotation: zeros(),
            scale: [planetScale, planetScale, planetScale],
            colors: Flatten(
                Repeat(Vec3(255, 255, 255), obj.vertexes.length / 3)
            ),
            update: function (t, engine) {
                this.position = Planet.position;
                this.offsets = [
                    -planetScale / 2,
                    -planetScale / 2,
                    -planetScale / 2,
                ];
            },
        };

        UniverseScene.addObject(ThePlanet);

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

UniverseScene.addObject(orbit);
UniverseScene.addObject(maneuverOrbit);
