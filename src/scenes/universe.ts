import {
    DefaultShader,
    degs,
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
    type ParsedModel,
} from 'webgl-engine';
import { purple } from '../colors';
import gameState from '../gameState';
import { useTouchCamera } from '../logic/useTouchCamera';
import { ManeuverSystem } from '../maneuverSystem';
import { createUniverse } from '../mapgen';
import { keplerianParameters, type Body } from '../math/physics';
import { drawOrbit, type Orbit3d } from '../objects/orbit';
import { DepthShader } from '../shaders/depth';
import { StarboxShader } from '../shaders/starbox';
import type { EngineProperties } from '../types';

let dt = 0.08;
let initialized = false;
let player: Body;
let orbit: Orbit3d;

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
                            colors: Flatten(
                                Repeat(
                                    Vec3(255, 255, 255),
                                    models['world'].vertexes.length / 3
                                )
                            ),
                        });

                        gameState.universe.maneuverSystem = new ManeuverSystem(
                            UniverseScene,
                            phys
                        );

                        const orbitingBody = physicsEngine.findOrbitingBody(
                            player.position
                        );

                        orbit = drawOrbit(
                            player.position,
                            player.velocity,
                            orbitingBody.position,
                            orbitingBody.mass,
                            {
                                color: purple,
                            },
                            {
                                update: () => {
                                    const orbitingBody =
                                        physicsEngine.findOrbitingBody(
                                            player.position
                                        );

                                    // Basic orbit logic
                                    const { maneuverSystem } =
                                        gameState.universe;

                                    if (
                                        maneuverSystem &&
                                        maneuverSystem.nodes.length === 0
                                    ) {
                                        orbit.setInteractive(true);
                                    } else {
                                        orbit.setInteractive(false);
                                    }

                                    orbit.properties['position'] = [
                                        ...player.position,
                                    ];
                                    orbit.properties['velocity'] = [
                                        ...player.velocity,
                                    ];
                                    orbit.properties['origin'] = [
                                        ...orbitingBody.position,
                                    ];
                                    orbit.properties['mass'] =
                                        orbitingBody.mass;

                                    // Redraw the base orbit
                                    orbit.recalculateOrbit(
                                        [...player.position],
                                        [...player.velocity],
                                        [...orbitingBody.position],
                                        orbitingBody.mass
                                    );
                                },
                            }
                        );

                        UniverseScene.addObject(orbit);

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

            physicsEngine.update(dt);

            setTimeout(() => {
                UniverseScene.status = 'ready';
            }, 500);
        });
    },
    init: (engine) => {
        const { camera } = UniverseScene;
        engine.settings.fogColor = [0, 0, 0, 1];
        camera.rotation[0] = rads(18);
        camera.rotation[1] = -rads(235);
    },
    update: (time, engine) => {
        useTouchCamera(engine);

        const { physicsEngine, maneuverSystem } = gameState.universe;
        if (
            gameState.universe.freezePhysicsEngine !== true ||
            initialized === false
        ) {
            physicsEngine.update(dt);

            if (player) {
                initialized = true;
                gameState.setPosition(player.position);
                gameState.setVelocity(player.velocity);

                // Update HUD
                const params = physicsEngine.keplerianParameters(player);
                gameState.universe.readout = [
                    `Δv ${gameState.deltaV}`,
                    `e ${r(params.e)}`,
                    `i ${r(degs(params.i))}°`,
                    `Ω ${r(degs(params.rightAscensionNode))}°`,
                    `ω ${r(degs(params.argumentOfPeriapsis))}°`,
                ].join('\n');
            }
        }

        if (player && maneuverSystem) {
            maneuverSystem.loop();
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
                if (maneuverNode.properties['visible'] === true) {
                    const { physicsEngine, maneuverSystem } =
                        gameState.universe;

                    if (maneuverSystem) {
                        let targetAttributes = {
                            position: zeros(),
                            velocity: zeros(),
                        };

                        targetAttributes.position =
                            maneuverNode.properties['orbitPosition'] ??
                            player.position;

                        targetAttributes.velocity =
                            maneuverNode.properties['orbitVelocity'] ??
                            player.velocity;

                        const { mouseAngle } = maneuverNode.properties;

                        // Find the target position.
                        const orbitingBody = physicsEngine.findOrbitingBody(
                            targetAttributes.position
                        );

                        const params = keplerianParameters(
                            targetAttributes.position,
                            targetAttributes.velocity,
                            orbitingBody.position,
                            orbitingBody.mass
                        );

                        const steps = physicsEngine.propogate(
                            targetAttributes.position,
                            targetAttributes.velocity,
                            player.mass,
                            dt,
                            Math.min(params.orbitalPeriod, 10000)
                        );

                        // Find the closest position
                        let bestDistance = Number.MAX_VALUE;
                        let bestNode: Body;
                        for (const step of steps) {
                            const { eccentricAonomaly } = keplerianParameters(
                                step.position,
                                step.velocity,
                                params.center,
                                orbitingBody.mass
                            );

                            const dist = Math.sqrt(
                                Math.pow(
                                    step.position[0] -
                                        maneuverNode.properties
                                            .targetPosition[0],
                                    2
                                ) +
                                    Math.pow(
                                        step.position[1] -
                                            maneuverNode.properties
                                                .targetPosition[1],
                                        2
                                    ) +
                                    Math.pow(
                                        step.position[2] -
                                            maneuverNode.properties
                                                .targetPosition[2],
                                        2
                                    )
                            );

                            if (bestDistance > dist) {
                                bestDistance = dist;
                                bestNode = step;
                            }
                        }

                        if (bestNode) {
                            for (let j = 0; j < 3; j++) {
                                bestNode.velocity[j] += 0.1;
                            }

                            const topOrbit = maneuverSystem.getTopOrbit();
                            const parent = topOrbit ?? orbit;

                            gameState.universe.maneuverSystem.registerNode(
                                parent,
                                {
                                    phase: 0,
                                    prograde: 0,
                                    position: [...bestNode.position],
                                    targetAngle: mouseAngle,
                                    velocity: [...bestNode.velocity],
                                }
                            );
                        }
                    }
                    break;
                }
            }
        }
    },
    status: 'initializing',
});
