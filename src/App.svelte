<script lang="ts">
    import Slider from '@smui/slider';
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

<div class="sliders">
    <div class="slider">
        <Slider bind:value={xpos} min={-24.5} step={0.1} max={24.5} />
        <span class="label"> X-Position {xpos}</span>
    </div>
    <div class="slider">
        <Slider bind:value={ypos} min={-24.5} step={0.1} max={24.5} />
        <span class="label"> Y-Position {ypos}</span>
    </div>
    <div class="slider">
        <Slider bind:value={zpos} min={-24.5} step={0.1} max={24.5} />
        <span class="label"> Z-Position {zpos}</span>
    </div>
    <div class="slider">
        <Slider bind:value={xrot} min={-180} max={180} />
        <span class="label"> X-Roation {xrot} </span>
    </div>
    <div class="slider">
        <Slider bind:value={yrot} min={-180} max={180} />
        <span class="label"> Y-Roation {yrot} </span>
    </div>
    <div class="slider">
        <Slider bind:value={zrot} min={-180} max={180} />
        <span class="label"> Z-Roation {zrot} </span>
    </div>
</div>

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
        padding-left: 20px;
    }

    .slider:first-of-type {
        padding-top: 20px;
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
