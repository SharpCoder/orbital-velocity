<script lang="ts">
    import { onMount } from 'svelte';
    import gameState from '../gameState';
    import type { ManeuverPlan } from '../maneuverSystem';

    export let maneuver: ManeuverPlan;

    function edit() {
        gameState.setShowDeltaV(true);
    }
</script>

<div
    class="orbit-node"
    style="border: 2px solid rgb({maneuver.color.join(
        ','
    )}); background-color: rgb({maneuver.color.join(',')});"
>
    <div>prograde {maneuver.prograde}</div>
    <div>phase {maneuver.phase}</div>
</div>

<style>
    .orbit-node {
        font-weight: bold;
        font-size: 1rem;
        font-family: var(--font);
        display: flex;
        flex-direction: column;
        padding: 2px 20px;
        margin: 10px 0px;
    }

    button {
        background-color: #222;
        border: none;
        color: white;
        padding: 10px;
        margin: 10px;
    }
</style>
