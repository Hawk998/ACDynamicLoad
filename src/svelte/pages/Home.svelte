<!--
Home.svelte
Main landing page for the AC dynamic load management application.
Displays navigation buttons for all major pages and handles tab opening logic.
-->
<script lang="ts">
    // Import tab navigation and state management utilities
    import { openTab } from "../lib/tab";
    import { navigation, showAppContent } from "../store/store";
    import Tab from "./Tab.svelte";
    import RemotePage from "./RemotePage.svelte";
    import MenuButton from "../components/ButtonAnimated.svelte";
    import ConfigPage from "./ConfigPage.svelte";
    import LoadSession from "./LoadSession.svelte";

    // Define available pages for navigation
    // Each page has a name, component, active state, and icon
    const pages = [
        { name: "Load Session", component: LoadSession, isActive: true, icon: "fa-tools" },
        { name: "Config", component: ConfigPage, isActive: true, icon: "fa-user-cog" },
        { name: "Sink Webfrontend", component: RemotePage, isActive: true, icon: "fa-desktop" },
    ];
</script>

<!--
Main button area for navigation between application pages.
Displays animated buttons for each available page.
-->
<div class="buttonArea">
    {#key $showAppContent}
        {#if $showAppContent}
            {#each pages as page}
                <!-- Render a navigation button for each page -->
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
            <!-- Show loading message if app content is not ready -->
            <p>Load content ...</p>
        {/if}
    {/key}
</div>

<!--
CSS styles for the button area layout and appearance.
-->
<style>
    .buttonArea {
        margin-top: 20%; /* Center vertically on page */
        width: 70%;
        margin-left: 15%; /* Center horizontally */
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 20px;
        padding: 20px;
        background-color: rgba(0, 0, 0, 0.4); /* Semi-transparent background */
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
</style>
