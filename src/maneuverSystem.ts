import { type Scene, type Obj3d, norm, m4, rads } from 'webgl-engine';
import { drawCube } from './drawing';
import type { Body } from './math/physics';
import { drawOrbit, type Orbit3d } from './objects/orbit';
import gameState from './gameState';
import { pink, sage, yellow } from './colors';

let nodeId = 1;
const colors = [
    [255, 213, 0],
    [0, 255, 85],
    [0, 42, 255],
    [255, 0, 170],
    [113, 255, 0],
    [0, 240, 255],
    [142, 0, 255],
    [255, 15, 0],
];

export type ManeuverProperties = {
    prograde: number;
    phase: number;
};

export type ManeuverPlan = {
    color: number[];
    position: number[];
    velocity: number[];
    targetAngle: number;
} & ManeuverProperties;

type InternalManeuverPlan = ManeuverPlan & {
    status: 'aborted' | 'pending' | 'in-situ' | 'completed';
    planId: number;
    parent?: ManeuverPlan;
    remainingPrograde?: number;
    remainingPhase?: number;
};

export class ManeuverSystem {
    nodes: Array<InternalManeuverPlan>;
    activeNode: InternalManeuverPlan;
    objects: Record<number, [Obj3d, Orbit3d]>;
    player: Body;
    scene: Scene<unknown>;

    constructor(scene: Scene<unknown>, player: Body) {
        this.scene = scene;
        this.player = player;
        this.nodes = [];
        this.activeNode = undefined;
        this.objects = {};
    }

    /**
     * Retrieve the top node in the hierarchy
     */
    getTopNode(): InternalManeuverPlan {
        return this.activeNode;
    }

    getBottomNode(): InternalManeuverPlan {
        let bottomNode = this.nodes[0];
        for (const node of this.nodes) {
            if (node.planId < bottomNode.planId) {
                bottomNode = node;
            }
        }
        return bottomNode;
    }

    /**
     * Add a new maneuver node to the system
     */
    registerNode(node: Omit<ManeuverPlan, 'color'>): InternalManeuverPlan {
        const planId = nodeId++;
        const nextNode: InternalManeuverPlan = {
            status: 'pending',
            planId,
            parent: this.activeNode,
            remainingPhase: Math.abs(node.phase),
            remainingPrograde: Math.abs(node.prograde),
            color: colors[planId % (colors.length - 1)],
            prograde: node.prograde,
            phase: node.phase,
            position: node.position,
            velocity: node.velocity,
            targetAngle: node.targetAngle,
        };

        this.nodes.push(nextNode);
        this.activeNode = nextNode;

        // Create objects
        const { physicsEngine } = gameState.universe;
        const fociPhysObj = physicsEngine.findOrbitingBody(node.position);
        const obj3dList = this.createOrbit(
            [...node.position],
            vecAdd(
                [...node.velocity],
                this.calculateDv(node.velocity, { ...node })
            ),
            [...fociPhysObj.position],
            fociPhysObj.mass,
            nextNode.color
        );

        for (const obj of obj3dList) {
            this.scene.addObject(obj);
        }

        this.objects[nextNode.planId] = obj3dList;
        gameState.setShowDeltaV(true);
        this.dispatch();
        return nextNode;
    }

    /**
     * Remove a maneuver node from the system
     */
    deregisterNode(planId: number, compact: boolean = false) {
        // Find the node and delete all nodes above it.
        const nodesToRemove: InternalManeuverPlan[] = [];
        const nodesToCompact: InternalManeuverPlan[] = [];

        const offset = new Array(0, 0, 0);
        for (const node of this.nodes) {
            if (node.planId === planId) {
                nodesToRemove.push(node);
                offset[0] =
                    this.player.position[0] -
                    (node.position[0] + node.velocity[0]);
                offset[1] =
                    this.player.position[1] -
                    (node.position[1] + node.velocity[1]);
                offset[2] =
                    this.player.position[2] -
                    (node.position[2] + node.velocity[2]);
            } else if (node.planId > planId && compact) {
                nodesToCompact.push(node);
            } else if (node.planId > planId && !compact) {
                nodesToRemove.push(node);
            }
        }

        while (nodesToRemove.length > 0) {
            const node = nodesToRemove.pop();
            const index = this.nodes.indexOf(node);
            if (index >= 0) {
                this.nodes.splice(index, 1);
                // Remove all objects associated with this node
                for (const obj of this.objects[node.planId]) {
                    this.scene.removeObject(obj);
                }
            }
        }

        while (nodesToCompact.length > 0) {
            const node = nodesToCompact.pop();
            const index = this.nodes.indexOf(node);
            if (index >= 0) {
                for (let j = 0; j < 3; j++) {
                    node.position[j] += offset[j];
                    this.objects[node.planId][0].position[j] += offset[j];
                    this.objects[node.planId][1].properties['position'][j] +=
                        offset[j];
                }
            }
        }

        // Find a new active node
        let topNode = this.nodes[0];
        for (const node of this.nodes) {
            if (node.planId > topNode.planId) {
                topNode = node;
            }
        }

        this.activeNode = topNode;
        this.redraw();
        this.dispatch();
    }

    /**
     * Update a given node with new values
     */
    updateNode(planId: number, { prograde, phase }: ManeuverProperties) {
        for (const node of this.nodes) {
            if (node.planId === planId) {
                node.prograde = prograde ?? node.prograde ?? 0;
                node.phase = phase ?? node.phase ?? 0;
                node.remainingPhase = Math.abs(node.phase);
                node.remainingPrograde = Math.abs(node.prograde);
                break;
            }
        }

        this.redraw();
        this.dispatch();
    }

    /**
     * Create a new orbit and associated objects.
     */
    private createOrbit(
        position: number[],
        velocity: number[],
        foci: number[],
        mass: number,
        color: number[]
    ): [Obj3d, Orbit3d] {
        const maneuverCube = drawCube({
            position,
            size: [50, 50, 50],
        });

        const orbit = drawOrbit(
            [...position],
            [...velocity],
            foci,
            mass,
            { color },
            {
                properties: {
                    position: [...position],
                    velocity: [...velocity],
                    origin: [...foci],
                    mass,
                },
            }
        );

        return [maneuverCube, orbit];
    }

    /**
     * Redraw all the orbits and maneuver nodes
     */
    private redraw() {
        for (const planId in this.objects) {
            // Find the plan
            let plan: InternalManeuverPlan = this.nodes.find(
                (plan) => `${plan.planId}` === `${planId}`
            );

            // If it's valid, redraw
            if (
                plan &&
                plan.status !== 'aborted' &&
                plan.status !== 'completed'
            ) {
                for (const object of this.objects[planId]) {
                    if (object.recalculateOrbit) {
                        const { position, velocity, origin, mass } =
                            object.properties;

                        object.recalculateOrbit(
                            [...position],
                            vecAdd(
                                [...velocity],
                                this.calculateDv(velocity, { ...plan })
                            ),
                            [...origin],
                            mass
                        );
                    }
                }
            }
        }
    }

    /** Process all business logic */
    loop() {
        if (gameState.universe.freezePhysicsEngine !== true) {
            this.executePlans();
        }

        const topNode = this.getTopNode();
        if (topNode) {
            for (const planId in this.objects) {
                if (`${planId}` === `${topNode.planId}`) {
                    this.objects[planId][1].setInteractive(true);
                } else {
                    this.objects[planId][1].setInteractive(false);
                }
            }
        }

        for (const node of this.nodes) {
            if (node.status === 'aborted') {
                this.deregisterNode(node.planId);
                this.redraw();
                this.dispatch();
            }
        }
    }

    private executePlans() {
        // Get the bottom plan
        const { physicsEngine } = gameState.universe;
        const plan = this.getBottomNode();
        if (plan && plan.status === 'pending') {
            const { eccentricAonomaly } = physicsEngine.keplerianParameters(
                this.player
            );

            const dist = Math.sqrt(
                Math.pow(eccentricAonomaly - plan.targetAngle, 2)
            );

            if (dist < rads(15)) {
                // Execute!!
                plan.status = 'in-situ';
            }
        } else if (plan && plan.status === 'in-situ') {
            const { prograde, phase, remainingPhase, remainingPrograde } = plan;
            const deltaPrograde = prograde / 25;
            const deltaPhase = phase / 25;
            const deltaV = this.calculateDv(this.player.velocity, {
                prograde: remainingPrograde > 0 ? deltaPrograde : 0,
                phase: remainingPhase > 0 ? deltaPhase : 0,
            });

            for (let j = 0; j < 3; j++) {
                this.player.velocity[j] += deltaV[j];
            }

            plan.remainingPhase -= Math.abs(deltaPhase);
            plan.remainingPrograde -= Math.abs(deltaPrograde);

            if (plan.remainingPhase <= 0 && plan.remainingPrograde <= 0) {
                plan.status = 'completed';
                this.deregisterNode(plan.planId, true);
            }

            this.redraw();
        }
    }

    /**
     * Dispatch an update through gameState
     */
    private dispatch() {
        gameState.dispatch();
    }

    private calculateDv(
        velocity: number[],
        { prograde, phase }: ManeuverProperties
    ) {
        const result = new Array(0, 0, 0);
        const accel = 0.5;
        const unit = [...velocity];
        const unitMag = norm(unit);
        const phaseVec = m4.cross(unit, [1, 0, 0]);
        const phaseVecMag = norm(phaseVec);

        for (let j = 0; j < 3; j++) {
            if (unitMag !== 0) {
                result[j] += accel * (unit[j] / unitMag) * prograde;
            }

            if (phaseVecMag !== 0) {
                result[j] += accel * (phaseVec[j] / phaseVecMag) * phase;
            }
        }

        return result;
    }
}

function vecAdd(v1: number[], v2: number[]) {
    const result = new Array(0, 0, 0);
    for (let j = 0; j < Math.min(v1.length, v2.length); j++) {
        result[j] = v1[j] + v2[j];
    }

    return result;
}
