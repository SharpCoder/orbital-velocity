import { XORShift } from 'random-seedable';
import type { Engine } from 'webgl-engine';
import { PhysicsEngine } from './math/physics';

export type Maneuver = {
    /** The id of the orbit which is tied to this plan */
    orbitId: number;
    /** The color of this orbit node */
    orbitColor: [number, number, number];
    /** The maneuver status */
    status: 'pending' | 'executing' | 'complete' | 'aborted';
    /** Position of the satellite at execution time */
    position: [number, number, number];
    /** Velocity of the satellite at execution time */
    velocity: [number, number, number];
    /** Original amount of delta-v in the prograde direction */
    prograde: number;
    /** Original amount of delta-v in the phase direction */
    phase: number;
    /** Remaining delta-V in the prograde direction */
    remainingPrograde: number;
    /** Remaining delta-v in the phase direction */
    remainingPhase: number;
};

class GameState {
    random: XORShift;
    activeScene: string;
    listeners: Array<() => void>;
    deltaV: number;
    universe: {
        readout: string;
        activeOrbitId: number;
        totalOrbits: number;
        showDeltaV: boolean;
        showHUD: boolean;
        current: {
            position: [number, number, number];
            velocity: [number, number, number];
            maneuver?: Maneuver;
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
            readout: '',
            totalOrbits: 1,
            activeOrbitId: 0,
            showDeltaV: false,
            showHUD: true,
            current: {
                position: [0, 0, 0],
                velocity: [0, 0, 0],
                maneuver: undefined,
            },
            freezePhysicsEngine: true,
            physicsEngine: new PhysicsEngine(),
            maneuvers: [],
        };
    }

    private gameEngine(): Engine<unknown> {
        return window['gameEngine'];
    }

    dispatch() {
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

    setManeuverParameters(prograde: number, phase: number) {
        if (this.universe.current.maneuver) {
            this.universe.current.maneuver.prograde = prograde;
            this.universe.current.maneuver.phase = phase;
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

    setManeuver(maneuver: Maneuver) {
        this.universe.current.maneuver = maneuver;
        this.dispatch();
    }

    clearManeuver() {
        this.universe.current.maneuver = undefined;
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
