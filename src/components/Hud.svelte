<script lang="ts">
    import { onMount } from 'svelte';
    import type { Engine } from 'webgl-engine';
    const engine = window['gameEngine'] as Engine;
    let readoutEl;
    let timeText = 'Freeze';
    let readout = '';

    onMount(() => {
        setInterval(() => {
            if (engine && readoutEl) {
                readoutEl.innerText = engine.properties['readout'];
            }
        }, 40);
    });

    function handleToggleTime() {
        console.log(engine);
        if (engine) {
            if (timeText === 'Freeze') {
                engine.properties['freeze_physics'] = true;
                timeText = 'Resume';
            } else {
                engine.properties['freeze_physics'] = false;
                timeText = 'Freeze';
            }
        }
    }
</script>

<div class="hud">
    <div class="item-space">
        <div class="readout" bind:this={readoutEl} />
        <div class="physics-space">
            <button on:click={handleToggleTime}>{timeText}</button>
        </div>
    </div>
</div>

<style>
    .hud {
        width: 100%;
        height: 100%;
        display: flex;
        flex-grow: 1;
        position: absolute;
        overflow: hidden;
        font-family: 'Nanum Gothic Coding', monospace;
    }
    .item-space {
        padding: 20px;
        width: 100%;
        height: 100%;
        display: flex;
        flex-grow: 1;
    }

    .physics-space {
        /* align-self: flex-end; */
        align-items: flex-end;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
    }

    .physics-space button {
        width: 100px;
        padding: 10px;
        background-color: black;
        border: none;
        cursor: pointer;
        color: white;
        outline: 1px solid var(--sage);
    }

    .physics-space button:hover {
        background-color: black;
        color: white;
        outline: 1px solid white;
    }

    .readout {
        color: white;
        line-height: 1.5rem;
        -webkit-user-select: none; /* Safari */
        -ms-user-select: none; /* IE 10 and IE 11 */
        user-select: none; /* Standard syntax */
    }
</style>
