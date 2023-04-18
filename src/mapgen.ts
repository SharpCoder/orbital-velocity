/**
 * The code here defines how a universe/game map is generated.
 */
import { XORShift } from 'random-seedable';
import gameState from './gameState';
import { PhysicsEngine, type Body } from './math/physics';

export type UniverseObject = {
    body: Body;
    type: 'planet' | 'sun' | 'player';
};

export type UniverseSimulation = {
    objects: UniverseObject[];
    player: Body;
    physicsEngine: PhysicsEngine;
};

export function createUniverse(seed): UniverseSimulation {
    const prng = new XORShift(seed);

    // For the initial implementation, we will actually just hardcode everything.
    const physicsEngine = new PhysicsEngine();
    const player = physicsEngine.addBody({
        position: [1500, -50, -500],
        velocity: [0, 30, 40],
        mass: 1,
    });

    const planet = physicsEngine.addBody({
        position: [0, 0, 0],
        velocity: [0, 0, 0],
        mass: 1e26,
    });

    const objects: UniverseObject[] = [
        { body: player, type: 'player' },
        { body: planet, type: 'planet' },
    ];

    return {
        objects,
        player,
        physicsEngine,
    };
}
