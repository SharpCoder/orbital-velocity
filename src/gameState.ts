import { XORShift } from 'random-seedable';
import type { Engine } from 'webgl-engine';
import { PhysicsEngine } from './math/physics';

export type Maneuver = {
    /** Position of the satellite at execution time */
    position: [number, number, number];
    /** Velocity of the satellite at execution time */
    velocity: [number, number, number];
    /** Prograde velocity */
    prograde: number;
    /** Phase velocity */
    phase: number;
    /** The physicsEngine time which this maneuver should be executed */
    executeAt: number;
};

class GameState {
    random: XORShift;
    activeScene: string;
    listeners: Array<() => void>;
    deltaV: number;
    universe: {
        showDeltaV: boolean;
        showHUD: boolean;
        current: {
            position: [number, number, number];
            velocity: [number, number, number];
            maneuver: {
                active: boolean;
                theta: number;
            } & Omit<Omit<Maneuver, 'position'>, 'velocity'>;
        };
        maneuvers: Maneuver[];
        freezePhysicsEngine: boolean;
        physicsEngine: PhysicsEngine;
    };

    constructor() {
        this.random = new XORShift(1337);
        this.activeScene = 'universe';
        this.listeners = [];
        this.deltaV = 100;
        this.universe = {
            showDeltaV: true,
            showHUD: true,
            current: {
                position: [0, 0, 0],
                velocity: [0, 0, 0],
                maneuver: {
                    active: true,
                    theta: 0,
                    executeAt: 0,
                    prograde: 0,
                    phase: 0,
                },
            },
            freezePhysicsEngine: true,
            physicsEngine: new PhysicsEngine(),
            maneuvers: [],
        };
    }

    private gameEngine(): Engine<unknown> {
        return window['gameEngine'];
    }

    private dispatch() {
        for (const fn of this.listeners) {
            fn();
        }
    }

    seedPrng(seed: number | bigint) {
        this.random = new XORShift(seed);
    }

    addListener(listener: () => void) {
        this.listeners.push(listener);
    }

    setScene(scene: string) {
        this.activeScene = scene;
        this.gameEngine().setScene(scene);

        if (scene === 'universe') {
            this.universe.showHUD = true;
        } else {
            this.universe.showHUD = false;
        }

        this.dispatch();
    }

    setShowDeltaV(show: boolean) {
        this.universe.showDeltaV = show;
        this.dispatch();
    }

    setShowHUD(show: boolean) {
        this.universe.showHUD = show;
        this.dispatch();
    }

    setPhysicsEngine(engine: PhysicsEngine) {
        this.universe.physicsEngine = engine;
        this.dispatch();
    }

    setPosition(position: [number, number, number]) {
        this.universe.current.position = position;
        this.dispatch();
    }

    setVelocity(velocity: [number, number, number]) {
        this.universe.current.velocity = velocity;
        this.dispatch();
    }

    setManeuverTheta(theta: number) {
        this.universe.current.maneuver.theta = theta;
        this.dispatch();
    }

    setFreezePhysicsEngine(value: boolean) {
        this.universe.freezePhysicsEngine = value;
        this.dispatch();
    }

    addManeuverNode(maneuver) {
        if (this.universe.maneuvers.indexOf(maneuver) === -1) {
            this.universe.maneuvers.push(maneuver);
        }
        this.dispatch();
    }

    removeManeuverNode(maneuver) {
        const index = this.universe.maneuvers.indexOf(maneuver);
        if (index >= 0) {
            this.universe.maneuvers.splice(index, 1);
        }
        this.dispatch();
    }
}

const state = new GameState();
export default state;