<script lang="ts">
    import Slider from '@smui/slider';
    import gameState, { type Maneuver } from '../gameState';
    import { onMount } from 'svelte';

    export let visible = true;

    let prograde = 0;
    let phase = 0;
    let show = true;

    onMount(() => {
        gameState.addListener(() => {
            show = gameState.universe.showDeltaV;
            if (gameState.universe.current.maneuver) {
                prograde = gameState.universe.current.maneuver.prograde;
                phase = gameState.universe.current.maneuver.phase;
            }
        });
    });

    $: {
        if (gameState.universe.current.maneuver) {
            gameState.universe.current.maneuver.prograde = prograde;
            gameState.universe.current.maneuver.phase = phase;
        }
    }

    function reset() {
        prograde = 0;
        phase = 0;

        if (gameState.universe.current.maneuver) {
            gameState.universe.current.maneuver.active = false;
        }
    }
</script>

{#if show}
    <div class="modal-container">
        <div class="modal">
            <div class="modal-title">&Delta;v</div>
            <div class="modal-body">
                <div class="option">
                    <div class="label">
                        Retrograde <span class="spacer" /> Prograde
                    </div>
                    <Slider
                        style="flex-grow: 1; width: 100%;"
                        min={-gameState.deltaV}
                        max={gameState.deltaV}
                        bind:value={prograde}
                    />
                </div>
                <div class="option">
                    Phase Shift
                    <Slider
                        style="flex-grow: 1; width: 100%;"
                        min={-gameState.deltaV}
                        max={gameState.deltaV}
                        bind:value={phase}
                    />
                </div>
                <button class="btn-reset" on:click={reset}>Reset</button>
                <button class="btn-reset" on:click={reset}>Accept</button>
            </div>
        </div>
    </div>
{/if}

<style type="text/css">
    .label {
        display: flex;
        width: 100%;
    }
    .spacer {
        flex-grow: 1;
    }
    .btn-reset {
        padding: 10px;
        width: 100%;
        cursor: pointer;
        background-color: #222;
        color: white;
        border: none;
        margin-top: 20px;
    }

    .modal-container {
        position: absolute;
        width: 100%;
        flex-grow: 1;
        display: flex;
        font-family: var(--font);
        justify-content: flex-end;
        /* align-items: center; */
        pointer-events: none;
    }

    .modal {
        outline: 1px solid rgba(255, 255, 255, 0.4);
        background-color: rgba(0, 0, 0, 0.85);
        color: #cecece;
        width: 220px;
        flex-shrink: 1;
        padding: 10px;
        padding-top: 20px;
        margin-right: 20px;
        margin-top: 100px;
        border-radius: 8px;
        pointer-events: all;
    }

    .modal-title {
        text-align: center;
        font-weight: bold;
        font-size: 1.15rem;
        padding-bottom: 15px;
    }

    .modal-body {
        padding: 20px;
    }

    .option {
        display: flex;
        flex-direction: column;
        width: 100%;
        flex-grow: 1;
        align-items: center;
    }
</style>
