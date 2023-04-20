<script lang="ts">
    import { onMount } from 'svelte';
    import type { Engine } from 'webgl-engine';
    import type { EngineProperties } from '../types';
    import gameState from '../gameState';
    import ManeuverItem from './ManeuverItem.svelte';
    import type { ManeuverPlan } from '../maneuverSystem';

    const engine = window['gameEngine'] as Engine<EngineProperties>;
    let maneuvers: ManeuverPlan[] = [];
    let readoutEl;
    let timeText = 'Resume';
    let show = true;

    onMount(() => {
        gameState.addListener(() => {
            const { maneuverSystem } = gameState.universe;
            if (maneuverSystem) {
                maneuvers = maneuverSystem.nodes;
            }
        });

        setInterval(() => {
            if (engine && readoutEl) {
                readoutEl.innerText = gameState.universe.readout ?? '';
            }

            show =
                gameState.activeScene === 'universe' &&
                gameState.universe.showHUD;
        }, 40);
    });

    function handleToggleTime() {
        if (engine) {
            if (timeText === 'Freeze') {
                gameState.universe.freezePhysicsEngine = true;
                timeText = 'Resume';
            } else {
                gameState.universe.freezePhysicsEngine = false;
                timeText = 'Freeze';
            }
        }
    }
</script>

{#if show}
    <div class="hud">
        <div class="item-space">
            <div class="readout" bind:this={readoutEl} />
            <div class="physics-space">
                <button on:click={handleToggleTime}>{timeText}</button>
            </div>
        </div>

        <div class="maneuver-items">
            {#each maneuvers as maneuver}
                <ManeuverItem {maneuver} />
            {/each}
        </div>
    </div>
{/if}

<style>
    .hud {
        width: 100%;
        height: 100%;
        display: flex;
        flex-grow: 1;
        position: absolute;
        overflow: hidden;
        flex-direction: column;
        font-family: 'Nanum Gothic Coding', monospace;
    }

    .maneuver-items {
        flex-grow: 1;
        top: 0;
        bottom: 0;
        position: absolute;
        height: 100%;
        display: flex;
        flex-direction: column-reverse;
        justify-content: flex;
    }

    .item-space {
        padding: 20px;
        width: 100%;
        height: 100%;
        display: flex;
        flex-grow: 1;
    }

    .physics-space {
        align-items: flex-end;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        right: 20px;
        position: absolute;
    }

    .physics-space button {
        width: 240px;
        padding: 10px 20px;
        background-color: #222;
        border: none;
        cursor: pointer;
        color: white;
    }

    .physics-space button:hover {
        background-color: black;
        color: white;
        outline: 1px solid white;
    }

    .readout {
        font-family: var(--font);
        color: rgba(99, 245, 66, 0.5);
        font-size: 1.25rem;
        line-height: 2rem;
        -webkit-user-select: none; /* Safari */
        -ms-user-select: none; /* IE 10 and IE 11 */
        user-select: none; /* Standard syntax */
    }
</style>
