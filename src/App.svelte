<script lang="ts">
    import type { Engine } from 'webgl-engine';

    let webglCanvas: HTMLCanvasElement;
    let initialized = false;

    $: {
        const engine: Engine = window['gameEngine'];

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

<canvas id="canvas" bind:this={webglCanvas} />

<style>
    #canvas {
        width: 100%;
        height: 100%;
    }
</style>
