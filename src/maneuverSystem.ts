import type { Obj3d } from 'webgl-engine';

export class ManeuverSystem {
    nodes: Array<unknown>;
    objects: Record<number, Obj3d>;

    /**
     * Retrieve the top node in the hierarchy
     */
    getTopNode() {}

    /**
     * Add a new maneuver node to the system
     */
    registerNode() {}

    /**
     * Remove a maneuver node from the system
     */
    deregisterNode() {}

    /**
     * Update a given node with new values
     */
    updateNode() {}

    /**
     * Redraw all the orbits and maneuver nodes
     */
    private redraw() {}

    /**
     * Calculate the difference between original intended orbit and
     * actual orbit and offset everything by the correct amount so it
     * still lines up. Either using offsets or nu.
     */
    private shrink() {}

    /**
     * Dispatch an update through gameState
     */
    private dispatch() {}
}
