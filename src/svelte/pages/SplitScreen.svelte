<script lang="ts">
    export let page1;
    export let page2;
</script>

<div class="page1">
    <svelte:component this={page1.component} title={page1.title}
    ></svelte:component>
</div>

<div class="page2">
    <svelte:component this={page2.component} title={page2.title}
    ></svelte:component>
</div>

<style>
    .page1 {
        float: left;
        width: 50%;
        border-right: solid 3px black;
        height: 95%;
    }

    .page2 {
        float: left;
        width: 50%;
        height: 95%;
    }
</style>
