import {
    DefaultShader,
    Engine,
    Flatten,
    loadModel,
    m4,
    norm,
    rads,
    Repeat,
    Scene,
    Vec3,
    zeros,
    type ParsedModel,
} from 'webgl-engine';
import { pink, purple, sage, yellow } from '../colors';
import { drawCube } from '../drawing';
import gameState, { type Maneuver } from '../gameState';
import { useTouchCamera } from '../logic/useTouchCamera';
import { createUniverse } from '../mapgen';
import {
    keplerianParameters,
    type Body,
    type PhysicsEngine,
} from '../math/physics';
import { drawOrbit } from '../objects/orbit';
import { DepthShader } from '../shaders/depth';
import { StarboxShader } from '../shaders/starbox';
import type { EngineProperties } from '../types';

let dt = 0.1;
let player: Body;

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
    once: (engine) => {
        const { camera } = UniverseScene;
        // Start with physics frozen
        engine.properties.freezePhysics = true;

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
                        // Add the initial maneuver orbit
                        addManeuver(phys, physicsEngine);
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
        physicsEngine.update(dt);
    },
    init: (engine) => {
        const { camera } = UniverseScene;
        engine.settings.fogColor = [0, 0, 0, 1];
        camera.rotation[0] = rads(18);
        camera.rotation[1] = -rads(235);
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
        // Collect all maneuver nodes
        const { objects } = engine.activeScene;
        const maneuverNodes = objects.filter(
            (obj) => obj.properties?.['maneuverNode']
        );

        if (mouseClickDuration < 180) {
            for (const maneuverNode of maneuverNodes) {
                if (
                    maneuverNode.transparent === false &&
                    maneuverNode.properties['id'] === activeOrbitId
                ) {
                    const { physicsEngine } = gameState.universe;
                    const targetBody =
                        chainedOrbits[gameState.universe.activeOrbitId];

                    console.log({ activeOrbitId, chainedOrbits, targetBody });
                    const { targetPosition } = maneuverNode.properties;
                    const center = physicsEngine.findOrbitingBody(targetBody);
                    const params = keplerianParameters(
                        targetBody.position,
                        targetBody.velocity,
                        center.position,
                        center.mass + targetBody.mass
                    );

                    const steps = physicsEngine.propogate(
                        targetBody,
                        dt,
                        params.orbitalPeriod
                    );

                    // Find the closest position
                    let bestDistance = Number.MAX_VALUE;
                    let bestNode: Body;

                    for (const step of steps) {
                        const dist = Math.sqrt(
                            Math.pow(step.position[0] - targetPosition[0], 2) +
                                Math.pow(
                                    step.position[1] - targetPosition[1],
                                    2
                                ) +
                                Math.pow(
                                    step.position[2] - targetPosition[2],
                                    2
                                )
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
            }
        }
    },
    status: 'initializing',
});

const orbits = [];
let activeOrbitId = 0;
const chainedOrbits = {};

function addManeuver(targetBody: Body, physicsEngine: PhysicsEngine) {
    const orbitId = activeOrbitId + 1;
    activeOrbitId = orbitId;
    gameState.universe.activeOrbitId = orbitId;
    gameState.universe.totalOrbits = orbits.length + 1;

    const orbitingBody = physicsEngine.findOrbitingBody(player);
    const maneuverBody: Body = {
        position: [...targetBody.position],
        _forces: [...targetBody._forces],
        internalId: targetBody.internalId,
        mass: targetBody.mass,
        velocity: [...targetBody.velocity],
    };

    chainedOrbits[orbitId] = maneuverBody;

    const colors = [purple, sage, yellow, pink];
    const colorIdx = orbits.length % (colors.length - 1);
    const maneuverPlan: Maneuver = {
        active: true,
        executed: false,
        phase: 0,
        position: [...targetBody.position],
        prograde: 0,
        velocity: targetBody.velocity,
    };

    if (orbitId > 1) {
        gameState.setManeuver(maneuverPlan);
        gameState.setShowDeltaV(true);
    }

    const maneuverCube = drawCube({
        position: targetBody.position,
        size: [50, 50, 50],
    });

    UniverseScene.addObject(maneuverCube);

    function cleanup() {
        gameState.setShowDeltaV(false);
        gameState.clearManeuver();
        UniverseScene.removeObject(maneuverCube);
        UniverseScene.removeObject(maneuverOrbit);
        if (orbits.includes(maneuverOrbit)) {
            orbits.splice(orbits.indexOf(maneuverOrbit), 1);
        }

        gameState.universe.activeOrbitId -= 1;
        gameState.universe.totalOrbits -= 1;
        activeOrbitId = gameState.universe.activeOrbitId;
    }

    const maneuverOrbit = drawOrbit(
        orbitId,
        targetBody.position,
        targetBody.velocity,
        orbitingBody.position,
        orbitingBody.mass + targetBody.mass,
        {
            color: colors[colorIdx],
        },
        {
            children: [],
            properties: { maneuverCube },
            update: (time_t, engine) => {
                if (gameState.universe.current.maneuver) {
                    const { prograde, phase } = maneuverPlan;

                    // Check if this maneuver is still active.
                    if (maneuverPlan.active === false) {
                        // Destroy!!!!
                        cleanup();
                    } else {
                        // Calculate the new orbit
                        const accel = 0.5;

                        // Calculate the gravity field
                        const gravityField = targetBody._forces.reduce(
                            (acc, cur) => {
                                acc[0] += cur[0];
                                acc[1] += cur[1];
                                acc[2] += cur[2];
                                return acc;
                            },
                            [0, 0, 0]
                        );

                        const unit = [...targetBody.velocity];
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

                        const maneuverPosition = [...targetBody.position];
                        const maneuverVelocity = [
                            targetBody.velocity[0] + dvx,
                            targetBody.velocity[1] + dvy,
                            targetBody.velocity[2] + dvz,
                        ];

                        // Update maneuverBody
                        maneuverBody.velocity[0] = targetBody.velocity[0] + dvx;
                        maneuverBody.velocity[1] = targetBody.velocity[1] + dvy;
                        maneuverBody.velocity[2] = targetBody.velocity[2] + dvz;

                        maneuverOrbit.recalculateOrbit(
                            [...maneuverPosition],
                            [...maneuverVelocity],
                            [...orbitingBody.position],
                            orbitingBody.mass + targetBody.mass
                        );
                    }
                }
            },
        }
    );

    orbits.push(maneuverOrbit);
    UniverseScene.addObject(maneuverOrbit);
    // Reset maneuver parameters.
    gameState.setManeuverParameters(0, 0);
}

function updatePlayer(
    physicsBody: Body,
    time_t: number,
    engine: Engine<unknown>
) {
    useTouchCamera(engine);
}
