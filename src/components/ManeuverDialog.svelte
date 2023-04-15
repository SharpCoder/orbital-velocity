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
</script>

<div class="modal-container">
    <div class="modal">
        <div class="modal-title">Orbital Maneuver</div>
        <div class="modal-body">
            <div class="option">
                Prograde
                <Slider
                    style="flex-grow: 1; width: 100%;"
                    min={-100}
                    max={100}
                    bind:value={prograde}
                />
            </div>
            <div class="option">
                Across
                <Slider
                    style="flex-grow: 1; width: 100%;"
                    min={-100}
                    max={100}
                    bind:value={across}
                />
            </div>
        </div>
    </div>
</div>

<style type="text/css">
    .modal-container {
        position: absolute;
        width: 100%;
        height: 100%;
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
        width: 200px;
        height: 200px;
        padding: 20px;
        margin-right: 20px;
        margin-top: 100px;
        border-radius: 8px;
        pointer-events: all;
    }

    .modal-title {
        text-align: center;
        font-weight: bold;
        font-size: 1.25rem;
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
