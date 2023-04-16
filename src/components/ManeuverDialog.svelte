<script lang="ts">
    import Slider from '@smui/slider';
    import type { Engine } from 'webgl-engine';
    import type { EngineProperties } from '../types';

    export let visible = true;
    let prograde = 0;
    let across = 0;

    $: {
        const engine = window['gameEngine'] as Engine<EngineProperties>;
        if (engine) {
            engine.properties.orbit = {
                prograde,
                across,
            };
        }
    }

    function reset() {
        prograde = 0;
        across = 0;
    }
</script>

<div class="modal-container">
    <div class="modal">
        <div class="modal-title">Orbital Maneuver</div>
        <div class="modal-body">
            <div class="option">
                <div class="label">
                    Retrograde <span class="spacer" /> Prograde
                </div>
                <Slider
                    style="flex-grow: 1; width: 100%;"
                    min={-100}
                    max={100}
                    bind:value={prograde}
                />
            </div>
            <div class="option">
                Phase Shift
                <Slider
                    style="flex-grow: 1; width: 100%;"
                    min={-100}
                    max={100}
                    bind:value={across}
                />
            </div>
            <button class="btn-reset" on:click={reset}>Reset</button>
        </div>
    </div>
</div>

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
        font-family: 'Nanum Gothic Coding', monospace;
        justify-content: flex-end;
        /* align-items: center; */
        pointer-events: none;
    }

    .modal {
        outline: 1px solid #cecece;
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
