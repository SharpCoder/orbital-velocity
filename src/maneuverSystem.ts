import { type Scene, type Obj3d, norm, m4, rads, zeros } from 'webgl-engine';
import { drawCube } from './drawing';
import { keplerianParameters, type Body } from './math/physics';
import { drawOrbit, type Orbit3d } from './objects/orbit';
import gameState from './gameState';
import { pink, sage, yellow } from './colors';
import { normalize } from './utils';

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
    parentOrbit: Orbit3d;
};

export class ManeuverSystem {
    nodes: Array<InternalManeuverPlan>;
    activeNode: InternalManeuverPlan;
    nextNode: InternalManeuverPlan;
    objects: Record<number, [Obj3d, Orbit3d]>;
    player: Body;
    scene: Scene<unknown>;
    private drawn: boolean = false;

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

    /**
     * Retrieve the orbit3d for the top node in the hierarchy
     */
    getTopOrbit(): Orbit3d {
        const node = this.getTopNode();
        if (node) {
            return this.objects[node.planId][1];
        } else {
            return null;
        }
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
    registerNode(
        parentOrbit: Orbit3d,
        node: Omit<ManeuverPlan, 'color'>
    ): InternalManeuverPlan {
        const planId = nodeId++;
        const nextNode: InternalManeuverPlan = {
            status: 'pending',
            planId,
            parentOrbit,
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
        this.nextNode = this.nextNode ?? nextNode;

        // Create objects
        const { physicsEngine } = gameState.universe;
        const fociPhysObj = physicsEngine.findOrbitingBody(node.position);
        const obj3dList = this.createOrbit(
            nextNode,
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
        console.log('deregistering ' + planId, { compact });
        const planToRemove = this.nodes.find((plan) => plan.planId === planId);

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
                // Remove all objects associated with this nod
                const [cube, orbit] = this.objects[node.planId];
                this.scene.removeObject(cube);
                this.scene.removeObject(orbit);
                // Cube cleans up after itself
            }
        }

        while (nodesToCompact.length > 0) {
            const node = nodesToCompact.pop();
            const index = this.nodes.indexOf(node);
            if (index >= 0) {
                for (let j = 0; j < 3; j++) {
                    node.position[j] += offset[j];
                    const [cube, orbit] = this.objects[node.planId];
                    cube.position[j] += offset[j];
                }
            }
        }

        // Find a new active node
        let bottomNode = this.nodes[0];
        for (const node of this.nodes) {
            if (node.status === 'pending' && node.planId > bottomNode.planId) {
                bottomNode = node;
            }
        }

        if (bottomNode) {
            console.log('setting ' + bottomNode.planId + ' as next plan');
            // Propagate the main orbit down through the hierarchy.
            bottomNode.parentOrbit = planToRemove.parentOrbit;
        }

        this.nextNode = bottomNode;

        this.shrink();
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
        plan: InternalManeuverPlan,
        position: number[],
        velocity: number[],
        foci: number[],
        mass: number,
        color: number[]
    ): [Obj3d, Orbit3d] {
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

        const maneuverCube = drawCube({
            position,
            transparent: true,
            size: [50, 50, 50],
            update: function (_t, engine) {
                const { maneuverSystem } = gameState.universe;
                const { orbitPosition, orbitVelocity, orbitOrigin, orbitMass } =
                    plan.parentOrbit.properties;

                const params = keplerianParameters(
                    [...orbitPosition],
                    [...orbitVelocity],
                    [...orbitOrigin],
                    orbitMass
                );

                maneuverCube.offsets = [
                    -25 + params.semiMajorAxis * Math.cos(-plan.targetAngle),
                    -25,
                    -25 + params.semiMinorAxis * Math.sin(-plan.targetAngle),
                ];

                maneuverCube.position = plan.parentOrbit.position;
                maneuverCube.additionalMatrix =
                    plan.parentOrbit._computed.positionMatrix;
            },
        });

        return [maneuverCube, orbit];
    }

    /**
     * Redraw all the orbits and maneuver nodes
     */
    private redraw() {
        if (this.drawn) return;

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
                const [cube, orbit] = this.objects[planId];
                const { position, velocity, origin, mass } = orbit.properties;
                const newVelocity = vecAdd(
                    [...velocity],
                    this.calculateDv(velocity, { ...plan })
                );

                orbit.recalculateOrbit(
                    [...position],
                    newVelocity,
                    [...origin],
                    mass
                );
            }
        }

        this.drawn = true;
    }

    /** Process all business logic */
    loop() {
        this.drawn = false;

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

            if (dist < rads(1)) {
                // Execute!!
                plan.status = 'in-situ';
            }
        } else if (plan && plan.status === 'in-situ') {
            const { prograde, phase, remainingPhase, remainingPrograde } = plan;
            const deltaPrograde = prograde / 15;
            const deltaPhase = phase / 15;
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
     * This method will recalculate the position of all orbits, starting through the hierarchy
     * and propagating as needed, to find the new position. All the way down.
     */
    private shrink() {
        console.log('shrinking');
        const nodes = [...this.nodes].sort((a, b) => a.planId - b.planId);
        let parentPosition = [...this.player.position];
        let parentVelocity = [...this.player.velocity];

        for (const node of nodes) {
            const [position, velocity, origin, mass] =
                this.calculateParametersForOrbitAtAnomaly(
                    parentPosition,
                    parentVelocity,
                    node.targetAngle
                );

            const [_, orbit] = this.objects[node.planId];
            node.position = [...position];
            node.velocity = [...velocity];
            orbit.properties['position'] = [...position];
            orbit.properties['velocity'] = [...velocity];
            orbit.properties['origin'] = [...origin];
            orbit.properties['mass'] = mass;

            parentPosition = position;
            parentVelocity = velocity;
        }

        this.redraw();
    }

    private calculateParametersForOrbitAtAnomaly(
        position: number[],
        velocity: number[],
        targetAngle: number
    ): [number[], number[], number[], number] {
        const { physicsEngine } = gameState.universe;
        const orbitingBody = physicsEngine.findOrbitingBody(position);
        const params = keplerianParameters(
            position,
            velocity,
            orbitingBody.position,
            orbitingBody.mass
        );
        const steps = physicsEngine.propogate(
            position,
            velocity,
            orbitingBody.mass,
            0.5,
            params.orbitalPeriod
        );

        let bestDist = Number.MAX_VALUE;
        let best: Body = null;

        for (const step of steps) {
            // Calculate the parameters
            const orbitalParameters = keplerianParameters(
                step.position,
                step.velocity,
                orbitingBody.position,
                orbitingBody.mass
            );

            const dist = Math.sqrt(
                Math.pow(orbitalParameters.eccentricAonomaly - targetAngle, 2)
            );
            if (bestDist > dist) {
                bestDist = dist;
                best = step;
            }
        }

        return [
            best?.position ?? [0, 0, 0],
            best?.velocity ?? [0, 0, 0],
            orbitingBody.position,
            orbitingBody.mass,
        ];
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
