<!--
RemotePage.svelte
Displays remote web frontends for voltage and current priority sinks.
Automatically opens browser windows for configured IPs and provides manual launch buttons.
-->
<script lang="ts">
    // Import state management and lifecycle hooks
    import { splitScreenActive } from "../store/store";
    import { onMount } from "svelte";
    
    export const title = "Remote Frontend";
    let scale = 1.0; // UI scale factor for responsive design
    let width = 1900; // Current client width
    
    // Configuration values loaded from backend
    let voltageHostIP = ""; // IP for voltage priority sink
    let currentHostIP = ""; // IP for current priority sink
    let configLoaded = false; // True if config loaded successfully
    let configError = false; // True if config loading failed

    // Update scale when width changes
    $: if (width) withChanged();

    // Subscribe to split screen state (for future use)
    splitScreenActive.subscribe((value) => {
        console.log("splitScreen", value);
    });

    // Load configuration and open browser windows on mount
    onMount(async () => {
        try {
            const config = await globalThis.api.invoke('getConfigFromFile');
            voltageHostIP = config.voltagehostIP || "";
            currentHostIP = config.currenthostIP || "";
            configLoaded = true;
            console.log("Remote config loaded:", { voltageHostIP, currentHostIP });
            
            // Automatically open browser windows for configured IPs
            if (voltageHostIP) {
                setTimeout(() => openVoltageInNewTab(), 500);
            }
            if (currentHostIP) {
                setTimeout(() => openCurrentInNewTab(), 1000);
            }
        } catch (err) {
            console.error("Error loading config for remote page:", err);
            configError = true;
        }
    });

    // Adjust scale based on client width
    function withChanged() {
        if (width < 1280) scale = width / 1280;
        else scale = 1;
        console.log("withChanged", width, scale);
    }
    
    // Open voltage sink web frontend in new browser tab
    function openVoltageInNewTab() {
        window.open(`http://${voltageHostIP}/`, '_blank');
    }
    
    // Open current sink web frontend in new browser tab
    function openCurrentInNewTab() {
        window.open(`http://${currentHostIP}/`, '_blank');
    }
</script>

<!--
Main UI container for displaying remote sink web frontends.
Shows loading, error, or browser launch info for each configured IP.
-->
<div bind:clientWidth={width} class="container">
    {#if !configLoaded && !configError}
        <!-- Show loading message while configuration is loading -->
        <h1 class="responsive-headline">Loading Configuration...</h1>
    {:else if configError}
        <!-- Show error message if configuration failed -->
        <h1 class="responsive-headline error">Error loading configuration</h1>
    {:else}
        <div class="dual-iframe-container">
            <!-- Voltage Priority Sink Section -->
            <div class="iframe-section">
                <h2 class="iframe-title">Voltage Priority Sink ({voltageHostIP})</h2>
                {#if !voltageHostIP}
                    <div class="no-ip-message">No IP configured for voltage sink</div>
                {:else}
                    <div class="browser-launch-info">
                        <div class="auto-launch-notice">
                            <h3>🚀 Browser window opens automatically</h3>
                            <p>The web frontend will open in a separate browser window.</p>
                        </div>
                        <!-- Manual launch button for voltage sink -->
                        <button class="open-external-btn" on:click={openVoltageInNewTab}>
                            <i class="fa fa-external-link"></i> Open again
                        </button>
                        <div class="url-info">URL: http://{voltageHostIP}/</div>
                    </div>
                {/if}
            </div>
            
            <!-- Current Priority Sink Section -->
            <div class="iframe-section">
                <h2 class="iframe-title">Current Priority Sink ({currentHostIP})</h2>
                {#if !currentHostIP}
                    <div class="no-ip-message">No IP configured for current sink</div>
                {:else}
                    <div class="browser-launch-info">
                        <div class="auto-launch-notice">
                            <h3>🚀 Browser window opens automatically</h3>
                            <p>The web frontend will open in a separate browser window.</p>
                        </div>
                        <!-- Manual launch button for current sink -->
                        <button class="open-external-btn" on:click={openCurrentInNewTab}>
                            <i class="fa fa-external-link"></i> Open again
                        </button>
                        <div class="url-info">URL: http://{currentHostIP}/</div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<!--
CSS styles for layout, browser launch info, error messages, and responsive design.
-->
<style lang="scss">
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
    
    .container {
        color: black;
        text-align: center;
        position: relative;
        width: 100%;
        height: 100vh;
        overflow: hidden;
        padding: 20px;
        box-sizing: border-box;
    }
    
    .dual-iframe-container {
        display: flex;
        gap: 20px;
        height: 100%;
        width: 100%;
    }
    
    .iframe-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        position: relative;
        border: 2px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        background: #f9f9f9;
    }
    
    .iframe-title {
        background: #007bff;
        color: white;
        margin: 0;
        padding: 10px;
        font-size: 1.1em;
        font-weight: bold;
        text-align: center;
    }
    
    .no-ip-message {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        font-size: 1.2em;
        color: #666;
        background: #f0f0f0;
        border: 2px dashed #ccc;
        margin: 10px;
        border-radius: 8px;
    }
    
    .browser-launch-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        padding: 20px;
        text-align: center;
        background: #d4edda;
        border: 2px solid #c3e6cb;
        margin: 10px;
        border-radius: 8px;
        color: #155724;
    }
    
    .auto-launch-notice h3 {
        margin: 0 0 10px 0;
        font-size: 1.2em;
        color: #155724;
    }
    
    .auto-launch-notice p {
        margin: 0 0 15px 0;
        font-size: 1em;
    }
    
    .open-external-btn {
        background: #007bff;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1em;
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        transition: background-color 0.2s;
    }
    
    .open-external-btn:hover {
        background: #0056b3;
    }
    
    .url-info {
        font-family: monospace;
        font-size: 0.9em;
        background: #e9ecef;
        padding: 5px 10px;
        border-radius: 4px;
        border: 1px solid #ced4da;
        color: #495057;
    }
    
    .responsive-headline {
        font-size: 2em;
        margin-top: 40%;
        color: #333;
    }
    
    .error {
        color: #dc3545;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
        .dual-iframe-container {
            flex-direction: column;
            gap: 10px;
        }
        
        .iframe-section {
            min-height: 300px;
        }
        
        .container {
            padding: 10px;
        }
    }
</style>
