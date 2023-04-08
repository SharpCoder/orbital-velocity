<script lang="ts">
    import Slider from '@smui/slider';
    import { onMount } from 'svelte';
    import { rads, type Engine, r } from 'webgl-engine';

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
        <span class="label">
            X-Position <span class="value">{r(xpos)}</span></span
        >
    </div>
    <div class="slider">
        <Slider bind:value={ypos} min={-24.5} step={0.1} max={24.5} />
        <span class="label">
            Y-Position <span class="value">{r(ypos)}</span></span
        >
    </div>
    <div class="slider">
        <Slider bind:value={zpos} min={-24.5} step={0.1} max={24.5} />
        <span class="label">
            Z-Position <span class="value">{r(zpos)}</span></span
        >
    </div>
    <div class="slider">
        <Slider bind:value={xrot} min={-180} max={180} />
        <span class="label">
            X-Roation <span class="value">{r(xrot)}</span>
        </span>
    </div>
    <div class="slider">
        <Slider bind:value={yrot} min={-180} max={180} />
        <span class="label">
            Y-Roation <span class="value">{r(yrot)}</span>
        </span>
    </div>
    <div class="slider">
        <Slider bind:value={zrot} min={-180} max={180} />
        <span class="label">
            Z-Roation <span class="value">{r(zrot)}</span>
        </span>
    </div>
    <button
        on:click={() => {
            const mm = 24.5;
            xpos = 0;
            ypos = 8;
            zpos = -1;
            xrot = 0;
            yrot = 90;
            zrot = 90;
        }}>X Forward</button
    >
    <button
        on:click={() => {
            const mm = 24.5;
            xpos = 4;
            ypos = 1;
            zpos = 0;
            xrot = 0;
            yrot = 90;
            zrot = 0;
        }}>Y Forward</button
    >
    <button
        on:click={() => {
            const mm = 24.5;
            xpos = 0;
            ypos = 0;
            zpos = 8;
            xrot = 0;
            yrot = 0;
            zrot = 0;
        }}>Z Forward</button
    >
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
