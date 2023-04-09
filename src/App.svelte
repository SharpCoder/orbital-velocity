<script lang="ts">
    import { onMount } from 'svelte';
    import type { Engine } from 'webgl-engine';

    let xpos = 0;
    let ypos = 0;
    let zpos = 8;
    let xrot = 0;
    let yrot = 0;
    let zrot = 0;

    let debugEl: HTMLDivElement;
    let webglCanvas: HTMLCanvasElement;
    let initialized = false;
    let timerId;

    onMount(() => {
        const engine = window['gameEngine'] as Engine;

        if (timerId) {
            clearInterval(timerId);
        }

        timerId = setInterval(() => {
            if (debugEl) {
                debugEl.innerText = `${engine._debugLogs}`;
            }
        }, 20);
    });

    $: {
        const engine: Engine = window['gameEngine'];
        engine.properties = {
            xpos,
            ypos,
            zpos,
            xrot,
            yrot,
            zrot,
        };

        if (webglCanvas) {
            if (!initialized) {
                initialized = true;
                engine.initialize(webglCanvas);
            } else if (engine.canvas !== webglCanvas) {
                engine.setCanvas(webglCanvas);
            }
        }
    }
</script>

<div id="debug" bind:this={debugEl} />
<canvas id="canvas" bind:this={webglCanvas} />

<style>
    .sliders {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        position: absolute;
    }
    .slider {
        flex-shrink: 1;
        display: flex;
        flex-direction: column-reverse;
        text-align: left;
        font-size: 0.8rem;
        font-family: monospace;
        padding-left: 20px;
    }

    .label {
        display: flex;
        flex-grow: 1;
    }

    .slider .label .value {
        justify-self: flex-end;
        text-align: right;
        width: 100%;
        font-weight: bold;
    }

    .slider:first-of-type {
        padding-top: 20px;
    }

    button {
        margin-left: 20px;
        margin-top: 20px;
        padding: 5px;
        width: 90%;
    }

    #canvas {
        width: 100%;
        height: 100%;
    }

    #debug {
        font-family: monospace;
        position: absolute;
        font-size: 1.5rem;
        color: black;
        top: 0;
        right: 0;
        padding: 20px;
        opacity: 0.8;
        text-align: right;
        cursor: none;
    }
</style>
