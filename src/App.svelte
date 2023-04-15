<script lang="ts">
    import { onMount } from 'svelte';
    import type { Engine } from 'webgl-engine';
    import Hud from './components/Hud.svelte';
    import type { EngineHud } from './types';

    let debugEl: HTMLDivElement;
    let webglCanvas: HTMLCanvasElement;
    let initialized = false;
    let timerId;

    onMount(() => {
        const engine = window['gameEngine'] as Engine<EngineHud>;

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
        const engine: Engine<EngineHud> = window['gameEngine'];

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
<Hud />

<style>
    #canvas {
        width: 100%;
        height: 100%;
    }

    #debug {
        font-family: monospace;
        position: absolute;
        font-size: 1.5rem;
        color: white;
        top: 0;
        right: 0;
        padding: 20px;
        opacity: 0.8;
        text-align: right;
        cursor: none;
    }
</style>
