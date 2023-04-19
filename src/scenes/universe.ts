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
    type ParsedModel,
} from 'webgl-engine';
import { pink, purple, sage, yellow } from '../colors';
import { drawCube, lineTo, lineToPositionAndRotation } from '../drawing';
import { useTouchCamera } from '../logic/useTouchCamera';
import { EllipseCalculator } from '../math/ellipse';
import type { Body, PhysicsEngine } from '../math/physics';
import { DepthShader } from '../shaders/depth';
import { StarboxShader } from '../shaders/starbox';
import type { EngineProperties } from '../types';
import gameState, { type Maneuver } from '../gameState';
import { createUniverse } from '../mapgen';
import { drawOrbit } from '../objects/orbit';
import { drawManeuverNode } from '../objects/maneuverNode';

let dt = 0.1;
let player: Body;
const orbitalManeuverNode = drawManeuverNode(1.5);
const orbit = drawOrbit(
    zeros(),
    zeros(),
    zeros(),
    0,
    {
        color: purple,
    },
    {
        children: [orbitalManeuverNode],
    }
);

async function loadModels(): Promise<Record<string, ParsedModel>> {
    const result = {};
    const promises = [];
    const models = {
        world: 'models/ball.obj',
    };

    for (const model in models) {
        promises.push(
            fetch(models[model])
                .then((file) => file.blob())
                .then(async (blob) => {
                    result[model] = await loadModel(blob, 'obj', true);
                })
        );
    }

    await Promise.all(promises);
    return Promise.resolve(result);
}

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

        // Setup the default universe
        const universe = createUniverse(1337);
        const { physicsEngine } = universe;

        gameState.setPhysicsEngine(physicsEngine);

        // Fetch the models
        loadModels().then((models) => {
            for (const obj of universe.objects) {
                const phys = obj.body;
                switch (obj.type) {
                    case 'planet': {
                        UniverseScene.addObject({
                            ...models['world'],
                            position: phys.position,
                            offsets: zeros(),
                            scale: [100, 100, 100],
                            rotation: zeros(),
                            colors: Flatten(
                                Repeat(
                                    Vec3(255, 255, 255),
                                    models['world'].vertexes.length / 3
                                )
                            ),
                        });
                        break;
                    }

                    case 'player': {
                        player = phys;
                        camera.position = { ...phys.position };
                        UniverseScene.addObject({
                            ...models['world'],
                            position: phys.position,
                            offsets: zeros(),
                            scale: [50, 50, 50],
                            rotation: zeros(),
                            update: updatePlayer.bind(this, phys),
                            colors: Flatten(
                                Repeat(
                                    Vec3(255, 255, 255),
                                    models['world'].vertexes.length / 3
                                )
                            ),
                        });
                        break;
                    }

                    case 'sun': {
                        UniverseScene.addObject({
                            ...models['world'],
                            position: phys.position,
                            offsets: zeros(),
                            scale: [1000, 1000, 1000],
                            rotation: zeros(),
                            colors: Flatten(
                                Repeat(
                                    Vec3(255, 255, 255),
                                    models['world'].vertexes.length / 3
                                )
                            ),
                        });
                        break;
                    }
                }
            }
        });

        // Initial propagation
        orbitalManeuverNode.configure(physicsEngine, universe.player);
        physicsEngine.update(dt);
    },
    update: (time, engine) => {
        const { physicsEngine } = gameState.universe;
        if (gameState.universe.freezePhysicsEngine !== true) {
            physicsEngine.update(dt);

            if (player) {
                gameState.setPosition(player.position);
                gameState.setVelocity(player.velocity);
            }
        }
    },
    onMouseUp: (engine) => {
        const { mouseClickDuration } = engine;
        if (mouseClickDuration < 180 && !orbitalManeuverNode.transparent) {
            const { physicsEngine } = gameState.universe;
            const { orbitAngle } = orbitalManeuverNode.properties;

            // Estimate time_t to intercept
            if (player) {
                const { targetPosition } = orbitalManeuverNode.properties;
                const params = physicsEngine.keplerianParameters(player);
                const steps = physicsEngine.propogate(
                    player,
                    dt,
                    params.orbitalPeriod
                );

                console.log({ targetPosition });

                // Find the closest position
                let bestDistance = Number.MAX_VALUE;
                let bestNode: Body;

                for (const step of steps) {
                    const dist = Math.sqrt(
                        Math.pow(step.position[0] - targetPosition[0], 2) +
                            Math.pow(step.position[1] - targetPosition[1], 2) +
                            Math.pow(step.position[2] - targetPosition[2], 2)
                    );

                    if (bestDistance > dist) {
                        bestDistance = dist;
                        bestNode = step;
                    }
                }

                if (bestNode) {
                    console.log({ bestNode });
                    for (let j = 0; j < 3; j++) bestNode.velocity[j] += 0.1;
                    addManeuver(bestNode, physicsEngine);
                }
            }

            // alert('hello');
        }
    },
    status: 'initializing',
});

const orbits = [];
function addManeuver(player: Body, physicsEngine: PhysicsEngine) {
    const orbitingBody = physicsEngine.findOrbitingBody(player);
    const colors = [sage, yellow, pink, purple];
    const colorIdx = orbits.length % (colors.length - 1);
    const maneuverPlan: Maneuver = {
        active: true,
        phase: 0,
        position: [...player.position],
        prograde: 0,
        velocity: player.velocity,
    };

    gameState.setManeuver(maneuverPlan);

    gameState.setShowDeltaV(true);
    const maneuverCube = drawCube({
        position: player.position,
        size: [50, 50, 50],
    });

    UniverseScene.addObject(maneuverCube);

    const maneuverOrbit = drawOrbit(
        player.position,
        player.velocity,
        orbitingBody.position,
        orbitingBody.mass + player.mass,
        {
            color: colors[colorIdx],
        },
        {
            properties: { maneuverCube },
            update: (time_t, engine) => {
                if (gameState.universe.current.maneuver) {
                    const { prograde, phase } = maneuverPlan;

                    // Check if this maneuver is still active.
                    if (maneuverPlan.active === false) {
                        // Destroy!!!!
                        gameState.setShowDeltaV(false);
                        gameState.clearManeuver();
                        UniverseScene.removeObject(maneuverCube);
                        UniverseScene.removeObject(maneuverOrbit);
                        if (orbits.includes(maneuverOrbit)) {
                            orbits.splice(orbits.indexOf(maneuverOrbit), 1);
                        }
                    } else {
                        // Calculate the new orbit
                        const accel = 0.5;

                        // Calculate the gravity field
                        const gravityField = player._forces.reduce(
                            (acc, cur) => {
                                acc[0] += cur[0];
                                acc[1] += cur[1];
                                acc[2] += cur[2];
                                return acc;
                            },
                            [0, 0, 0]
                        );

                        const unit = [...player.velocity];
                        const mag = norm(unit);

                        const vx = accel * (unit[0] / mag);
                        const vy = accel * (unit[1] / mag);
                        const vz = accel * (unit[2] / mag);

                        const v2 = m4.cross(
                            unit.map((v, i) => gravityField[i]),
                            unit.map((v) => v)
                        );
                        const v2norm = norm(v2);

                        let dvx =
                            vx * prograde + phase * accel * (v2[0] / v2norm);
                        let dvy =
                            vy * prograde + phase * accel * (v2[1] / v2norm);
                        let dvz =
                            vz * prograde + phase * accel * (v2[2] / v2norm);

                        const maneuverPosition = [...player.position];
                        const maneuverVelocity = [
                            player.velocity[0] + dvx,
                            player.velocity[1] + dvy,
                            player.velocity[2] + dvz,
                        ];

                        maneuverOrbit.recalculateOrbit(
                            [...maneuverPosition],
                            [...maneuverVelocity],
                            [...orbitingBody.position],
                            orbitingBody.mass + player.mass
                        );
                    }
                }
            },
        }
    );

    orbits.push(maneuverOrbit);
    UniverseScene.addObject(maneuverOrbit);
}

function updatePlayer(
    physicsBody: Body,
    time_t: number,
    engine: Engine<unknown>
) {
    useTouchCamera(engine);

    const { physicsEngine } = gameState.universe;
    const orbitingBody = physicsEngine.findOrbitingBody(physicsBody);

    orbit.recalculateOrbit(
        physicsBody.position,
        physicsBody.velocity,
        [...orbitingBody.position],
        orbitingBody.mass + physicsBody.mass
    );

    engine.debug(`${physicsEngine.elapsed} dt`);
    /**
     * This section is all about the maneuver node functionality?
     * TODO: delegate somewhere else.
     */
    // const { prograde, phase } = gameState.universe.current.maneuver;

    // // Calculate the new orbit
    // const accel = 0.5;

    // // Calculate the gravity field
    // const gravityField = physicsBody._forces.reduce(
    //     (acc, cur) => {
    //         acc[0] += cur[0];
    //         acc[1] += cur[1];
    //         acc[2] += cur[2];
    //         return acc;
    //     },
    //     [0, 0, 0]
    // );

    // const unit = [...physicsBody.velocity]; //.map((u, i) => u - gravityField[i]);
    // const mag = norm(unit);

    // const vx = accel * (unit[0] / mag);
    // const vy = accel * (unit[1] / mag);
    // const vz = accel * (unit[2] / mag);

    // const v2 = m4.cross(
    //     unit.map((v, i) => gravityField[i]),
    //     unit.map((v) => v)
    // );
    // const v2norm = norm(v2);

    // let dvx = vx * prograde + phase * accel * (v2[0] / v2norm);
    // let dvy = vy * prograde + phase * accel * (v2[1] / v2norm);
    // let dvz = vz * prograde + phase * accel * (v2[2] / v2norm);

    // const maneuverPosition = [...physicsBody.position];
    // const maneuverVelocity = [
    //     physicsBody.velocity[0] + dvx,
    //     physicsBody.velocity[1] + dvy,
    //     physicsBody.velocity[2] + dvz,
    // ];

    // maneuverOrbit.recalculateOrbit(
    //     [...maneuverPosition],
    //     [...maneuverVelocity],
    //     [...orbitingBody.position],
    //     orbitingBody.mass + physicsBody.mass
    // );
}

UniverseScene.addObject(orbit);
