<script lang="ts">
    import { openTab } from "../lib/tab";
    import { navigation, showAppContent } from "../store/store";
    import Tab from "./Tab.svelte";
    import RemotePage from "./RemotePage.svelte";
    import MenuButton from "../components/ButtonAnimated.svelte";
    import ConfigPage from "./ConfigPage.svelte";
    import LoadSession from "./LoadSession.svelte";

    const pages = [
        { name: "Load Session",component: LoadSession, isActive: true,icon: "fa-tools"},
        { name: "Config", component: ConfigPage, isActive: true, icon: "fa-user-cog" },
        { name: "Sink Webfrontend", component: RemotePage, isActive: true, icon: "fa-desktop"},
    ];
</script>

<div class="buttonArea">
    {#key $showAppContent}
        {#if $showAppContent}
            {#each pages as page}
                <MenuButton
                    isActive={page.isActive
                        ? !$navigation.some((item) =>
                              item.title.includes(page.name),
                          )
                        : false}
                    buttonName={page.name}
                    icon={page.icon}
                    onClickFunction={(e) => openTab(page.name, page.component)}
                ></MenuButton>
            {/each}
        {:else}
            <p>Load content ...</p>
        {/if}
    {/key}
</div>

<style>
    .buttonArea {
        margin-top: 20%;
        width: 70%;
        margin-left: 15%;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 20px;
        padding: 20px;
        background-color: rgba(0, 0, 0, 0.4);
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
</style>
