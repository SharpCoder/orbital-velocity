import { XORShift } from 'random-seedable';
import type { Engine } from 'webgl-engine';
import type { ManeuverSystem } from './maneuverSystem';
import { PhysicsEngine } from './math/physics';

class GameState {
    random: XORShift;
    activeScene: string;
    listeners: Array<() => void>;
    deltaV: number;
    universe: {
        maneuverSystem?: ManeuverSystem;
        readout: string;
        activeOrbitId: number;
        totalOrbits: number;
        showDeltaV: boolean;
        showHUD: boolean;
        current: {
            position: [number, number, number];
            velocity: [number, number, number];
        };
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
            },
            freezePhysicsEngine: true,
            physicsEngine: new PhysicsEngine(),
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
        if (this.universe.maneuverSystem) {
            const { planId } = this.universe.maneuverSystem.activeNode;
            if (planId) {
                this.universe.maneuverSystem.updateNode(planId, {
                    prograde,
                    phase,
                });
            }
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

    setFreezePhysicsEngine(value: boolean) {
        this.universe.freezePhysicsEngine = value;
        this.dispatch();
    }
}

const state = new GameState();
export default state;
