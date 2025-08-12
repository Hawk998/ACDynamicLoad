<script lang="ts">
    import { foo } from "../lib/test";

    export let title = "Tab";
    const name: string = "this is a template using svelte and electron";
    let version: string = "0.0.0";

    globalThis.api.send("get:version");
    globalThis.api.receive("get:version", (resp) => {
        console.log("get:version", resp);
        version = resp;
    });

    foo("test");
</script>

<div>
    <h1>{title}!</h1>
    <p>{name}</p>
    {#if version != "0.0.0"}
        <p>Got version via IPC communication from backend: v{version}</p>
    {/if}
</div>

<style>
    h1 {
        color: #ff3e00;
        text-transform: uppercase;
        font-size: 4em;
        font-weight: 100;
    }

    div {
        padding-top: 10px;
        padding-bottom: 10px;
        text-align: center;
        background-color: rgba(255, 255, 255, 0.5);
    }
</style>
