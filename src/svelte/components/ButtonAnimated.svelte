<script lang="ts">
    export let buttonName = "Name";
    export let color = "white";
    export let isActive = true;
    export let background = "black";
    export let backgroundDisabled = "gray";
    export let icon = "fa-yin-yang";
    export let onClickFunction;
</script>

<button
    disabled={!isActive}
    style="--color: {color}; --background: {background}; --backgroundDisabled: {backgroundDisabled}"
    on:click={onClickFunction}
    type="button"
    class="iconButton"
>
    <i class="fas {icon}"></i>
    {buttonName}
</button>

<style>
    .iconButton {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        width: 150px;
        height: 150px;
        background-color: var(--background);
        border: none;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition:
            transform 0.2s,
            box-shadow 0.2s;
        font-size: 16px;
        color: var(--color);
        text-align: center;
        padding: 10px;
    }

    .iconButton i {
        font-size: 40px;
        margin-bottom: 10px;
        color: var(--color);
    }

    .iconButton:hover:enabled {
        transform: translateY(-5px);
        box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
        background-color: #4caf50;
        color: white;
    }

    .iconButton:hover:disabled {
        box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
        background-color: red;
        color: white;
    }

    .iconButton:active {
        transform: translateY(0);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .iconButton:disabled {
        transform: translateY(0);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        background-color: var(--backgroundDisabled);
    }
</style>
