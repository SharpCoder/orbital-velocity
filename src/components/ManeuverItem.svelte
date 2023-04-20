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
    style="border: 2px solid rgb({maneuver.color.join(',')});"
>
    <div>prograde {maneuver.prograde}</div>
    <div>phase {maneuver.phase}</div>
</div>

<style>
    .orbit-node {
        background-color: black;
        color: white;
        font-size: 1rem;
        font-family: var(--font);
        display: flex;
        flex-direction: column;
        padding: 2px 10px;
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
