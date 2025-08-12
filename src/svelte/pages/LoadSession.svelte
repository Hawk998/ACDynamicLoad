<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import Chart from 'chart.js/auto';
    import { createPowerChart, updateChartData, updateMaxPowerLine, type ChartData } from '../lib/chartConfig';
    import { openTab } from '../lib/tab';
    import ConfigPage from './ConfigPage.svelte';
    
    // Timer type alias for cross-platform compatibility
    type TimerHandle = ReturnType<typeof setTimeout>;
    
    export let title = "Tab";

    // Slider state
    let configError = false;
    let configurationLoaded = false;
    let kwValue: number = 11;
    let lastkWValue: number | null = null;
    let maxCurrentValue: number | null = null;
    let maxCurrentInterval: TimerHandle | null = null;
    let kwValueInterval: TimerHandle | null = null;
    let actualCDSPowerValue: number = 0;
    let actualCDSVoltageValue: number = 0;
    let actualCDSCurrentValue: number = 0; 
    let cdsPowerInterval: TimerHandle | null = null;
    let sinkPowerValue: any = null;
    let sinkPowerInterval: TimerHandle | null = null;

    // Soft start state (removed - no ramping)
    // let softStartRunning = false;
    // let softStartInterval: TimerHandle | null = null;

    let currentHostIp: string = "";
    let voltageHostIP: string = "";
    let voltageLimit: number | null = null;
    let currentLimit: number | null = null;
    let maxkWValue: number | null = null;
    let maxkWValueExternal: number | null = null;
    let cds_ip: string = "";

    let setpointSent = false;
    let started = false;
    let isProcessing = false;

    // Chart data arrays
    let chart: Chart | null = null;
    let chartCanvas: HTMLCanvasElement;
    let timeLabels: string[] = [];
    let voltageHistory: number[] = [];
    let currentHistory: number[] = [];
    let powerHistory: number[] = []; // Power in kW
    let setpointHistory: number[] = []; // Setpoint in kW
    let sinkPowerHistory: number[] = []; // Sink Power in kW


    onMount(async () => {
        
        
        // Initialize chart first (before config loading)
        const initialChartData: ChartData = {
            timeLabels,
            voltageData: voltageHistory,
            currentData: currentHistory,
            powerData: powerHistory,
            setpointData: setpointHistory,
            sinkPowerData: sinkPowerHistory,
            maxPowerLimit: null // Will be updated after config loads
        };
        chart = createPowerChart(chartCanvas, initialChartData);
        
        try {
            const config = await globalThis.api.invoke('getConfigFromFile');
            currentHostIp = config.currenthostIP || "";
            voltageHostIP = config.voltagehostIP || "";        
            voltageLimit = config.voltageLimit ?? null;
            currentLimit = config.currentLimit ?? null;
            maxkWValue = config.maxkWValue ?? null;
            cds_ip = config.cdsIP || "";

            await globalThis.api.invoke("setVoltagePriorityMode", { HostIp: voltageHostIP, OutputVoltageLimitCV: voltageLimit, OutputCurrentLimitCV: currentLimit });
            await globalThis.api.invoke("setCurrentPriorityMode", { HostIp: currentHostIp, OutputCurrentLimitCC: currentLimit !== null ? currentLimit : null, OutputVoltageLimitCC: voltageLimit !== null ? voltageLimit + 10 : null });
            
            configurationLoaded = true;
            configError = false;
            
            // Update chart with loaded config values
            if (chart) {
                updateMaxPowerLine(chart, maxkWValueExternal, timeLabels.length);
            }
            
            await globalThis.api.invoke("setCurrentSetPoint", { HostIp: currentHostIp, CurrentSetPoint: 1 });
            maxCurrentInterval = setInterval(pollMaxCurrentValue, 2000);
            pollMaxCurrentValue(); // Initialer Aufruf

            // Start Backend CDS Polling first
            await globalThis.api.invoke("startPollingCDS", {});
            
            // Single unified CDS polling interval (gets data from backend cache)
            cdsPowerInterval = setInterval(async () => {
                try {
                    // Get all CDS values in one batch
                    const [powerResult, voltageResult, currentResult] = await Promise.all([
                        globalThis.api.invoke("getLastPowerValueCDS"),
                        globalThis.api.invoke("getLastVoltageValueCDS"), 
                        globalThis.api.invoke("getLastCurrentValueCDS")
                    ]);

                    // Debug logging
                    console.log("CDS Raw Results:", {
                        power: powerResult,
                        voltage: voltageResult,
                        current: currentResult,
                        powerType: typeof powerResult,
                        voltageType: typeof voltageResult,
                        currentType: typeof currentResult
                    });

                    // Update power value
                    if (powerResult !== null && powerResult !== undefined && !isNaN(Number(powerResult))) {
                        const newPower = Number(powerResult);
                        if (newPower !== actualCDSPowerValue) {
                            console.log(`Power updated: ${actualCDSPowerValue} → ${newPower}`);
                            actualCDSPowerValue = newPower;
                        }
                    } else {
                        console.log("Power result invalid:", powerResult);
                    }

                    // Update voltage value  
                    if (voltageResult !== null && voltageResult !== undefined && !isNaN(Number(voltageResult))) {
                        const newVoltage = Number(voltageResult);
                        if (newVoltage > 100 && newVoltage !== actualCDSVoltageValue) {
                            console.log(`Voltage updated: ${actualCDSVoltageValue} → ${newVoltage}`);
                            actualCDSVoltageValue = newVoltage;
                        }
                    } else {
                        console.log("Voltage result invalid:", voltageResult);
                    }

                    // Update current value
                    if (currentResult !== null && currentResult !== undefined && !isNaN(Number(currentResult))) {
                        const newCurrent = Number(currentResult);
                        if (newCurrent > 0 && newCurrent !== actualCDSCurrentValue) {
                            console.log(`Current updated: ${actualCDSCurrentValue} → ${newCurrent}`);
                            actualCDSCurrentValue = newCurrent;
                        }
                    } else {
                        console.log("Current result invalid:", currentResult);
                    }

                    // Update chart with all new data
                    const powerKw = actualCDSPowerValue / 1000;
                    const voltage = (actualCDSVoltageValue > 100) ? actualCDSVoltageValue : 0;
                    const current = actualCDSCurrentValue;

                    console.log("Chart Data:", { powerKw, voltage, current });

                    const now = new Date().toLocaleTimeString();
                    
                    // Für Auto Test: Neue Aufzeichnung wird am Anfang geleert
                    // Außerhalb des Auto Tests: Alle Werte speichern (keine Begrenzung auf 50)
                    // Die Begrenzung auf 50 Werte wurde entfernt für kontinuierliche Aufzeichnung
                    
                    timeLabels.push(now);
                    voltageHistory.push(voltage);
                    currentHistory.push(current);
                    powerHistory.push(powerKw);
                    
                    // Add current setpoint to history
                    const currentSetpoint = kwValue || 0;
                    setpointHistory.push(currentSetpoint);
                    
                    // Add sink power to history
                    const currentSinkPower = (sinkPowerValue && sinkPowerValue.successful) 
                        ? Number(sinkPowerValue.msg) / 1000 
                        : 0;
                    sinkPowerHistory.push(currentSinkPower);
                    
                    // Update chart with new data
                    if (chart) {
                        const chartData: ChartData = {
                            timeLabels,
                            voltageData: voltageHistory,
                            currentData: currentHistory,
                            powerData: powerHistory,
                            setpointData: setpointHistory,
                            sinkPowerData: sinkPowerHistory,
                            maxPowerLimit: maxkWValueExternal // Use calculated value from duty cycle
                        };
                        updateChartData(chart, chartData);
                        console.log("Chart updated");
                    } else {
                        console.log("Chart is null");
                    }

                } catch (error) {
                    console.error("CDS polling error:", error);
                    // Don't reset values on error, keep last valid data
                }
            }, 2000); // Erhöht auf 2 Sekunden

            //Sink Power Polling
            await globalThis.api.invoke("startSinkPowerPolling", { ip: currentHostIp, intervalMs: 1000, timeoutMs: 3000 });
            sinkPowerInterval = setInterval(async () => {
            try {
              const result = await globalThis.api.invoke("getLastSinkPowerValue");
              sinkPowerValue = result;
            } catch {
                sinkPowerValue = null;
         }
            }, 2000);
            
        } catch (err) {
            configurationLoaded = false;
            configError = true;
            console.error("Config error:", err);
        }
    })

    onDestroy(() => {
        // Cleanup page visibility listener
        document.removeEventListener('visibilitychange', () => {});
        
        // Stop all intervals first
        if (maxCurrentInterval) {
            clearInterval(maxCurrentInterval);
            maxCurrentInterval = null;
        }
        if (cdsPowerInterval) {
            clearInterval(cdsPowerInterval);
            cdsPowerInterval = null;
        }
        if (sinkPowerInterval) {
            clearInterval(sinkPowerInterval);
            sinkPowerInterval = null;
        }
        if (kwValueInterval) {
            clearInterval(kwValueInterval);
            kwValueInterval = null;
        }

        // Stop backend polling immediately (fire-and-forget)
        globalThis.api.invoke("stopPollingCDS").catch(error => {
            console.error("Error stopping CDS polling:", error);
        });

        globalThis.api.invoke("stopSinkPowerPolling").catch(error => {
            console.error("Error stopping Sink Power polling:", error);
        });

        // Stop soft start if running (removed)
        // if (softStartInterval) {
        //     clearInterval(softStartInterval);
        //     softStartInterval = null;
        // }

        // Destroy chart last
        if (chart) {
            chart.destroy();
            chart = null;
        }
    })

    
    async function pollMaxCurrentValue() {
    try {
        const result = await globalThis.api.invoke("readEvDuty", { ip: cds_ip });
        console.log("MaxCurrent result:", result);
        if (result && !isNaN(Number(result))) {
            maxCurrentValue = Number(Number(result*0.6).toFixed(2));
            maxkWValueExternal = Number(((maxCurrentValue * voltageLimit) / 1000).toFixed(2));
            // Update max power line in chart with calculated value from duty cycle
            if (chart) {
                updateMaxPowerLine(chart, maxkWValueExternal, timeLabels.length);
            }
        } else {
            maxCurrentValue = null;
        }
    } catch (err) {
        console.error("MaxCurrent error:", err);
        maxCurrentValue = null;
    }
}

    

    // Der neue Schalter-Button (ohne Soft Start)
    async function handleToggleOutput() {
        if (isProcessing || !configurationLoaded) return;
        isProcessing = true;
        try {
            if (!started) {
                // Output aktivieren
                await globalThis.api.invoke("setOutput", { HostIp: currentHostIp, OutputState: true });
                await globalThis.api.invoke("setOutput", { HostIp: voltageHostIP, OutputState: true });
                started = true;
                
                // Sofort den gewünschten Setpoint senden (ohne Rampe)
                await handleSendSetpoint();
            } else {
                // Output deaktivieren
                await globalThis.api.invoke("setOutput", { HostIp: currentHostIp, OutputState: false });
                await globalThis.api.invoke("setOutput", { HostIp: voltageHostIP, OutputState: false });
                started = false;
                setpointSent = false;
            }
        } finally {
            isProcessing = false;
        }
    }
 $: if (started) {
       if (!kwValueInterval) {
        kwValueInterval = setInterval(() => {
                        handleSendSetpoint();            
        }, 100); 
      }
   } else {
       if (kwValueInterval) {
           clearInterval(kwValueInterval);
           kwValueInterval = null;
       }
    }    
    
    async function handleSendSetpoint() {
    if (isProcessing || !configurationLoaded) return;
    isProcessing = true;
    try {
        let setpointToSend = kwValue;
        if (maxkWValueExternal !== null && kwValue > maxkWValueExternal) {
            setpointToSend = maxkWValueExternal;
        }
        if (lastkWValue !== setpointToSend) {
            const currentSetPoint = await globalThis.api.invoke("defineVoltageCurrent", { powerInkW: setpointToSend, voltage: voltageLimit });
            await globalThis.api.invoke("setCurrentSetPoint", { HostIp: currentHostIp, CurrentSetPoint: currentSetPoint.current });
            lastkWValue = setpointToSend;
            setpointSent = true;
        }
    } finally {
        isProcessing = false;
    }
}

// Soft Start Functions (removed - no ramping)
// async function startSoftStart() { ... }
 
   
</script>

<div>
    <!--<h1>{title}!</h1>-->
    <div class="slider-container">
    <label for="kw-slider">Power Setpoint (kW)</label>
    <input
        id="kw-slider"
        type="range"
        min="1"
        max={maxkWValue !== null ? maxkWValue : 22}
        step="0.1"
        bind:value={kwValue}
    />
    <span class="kw-value">{kwValue.toFixed(1)} kW</span>
    <div class="button-row">
    <button
        class="toggle-btn {started ? 'deactivate' : ''}"
        title={started ? "Deactivate Output" : "Activate Output"}
        on:click={handleToggleOutput}
        disabled={!configurationLoaded}    >
        {#if started}
            <i class="fa fa-power-off"></i> Deactivate
        {:else}
            <i class="fa fa-bolt"></i> Activate
        {/if}
    </button>
</div>

    {#if !configurationLoaded && !configError}
        <div class="hint">
            
            <strong>Please Wait for Configuration.</strong>
            
        </div>
        <div>
            <i class="fa fa-spinner fa-spin" style="margin-right:0.7em; font-size:2.2em; vertical-align:middle;"></i>
        </div>
    {:else if configError }
        <div class="config-error">
            <div class="error-header">
                <i class="fa fa-exclamation-triangle error-icon"></i>
                <div class="error-text">
                    <h3>Configuration Error</h3>
                    <p>Unable to load system configuration</p>
                </div>
                <button class="config-link-btn" on:click={() => openTab('Config', ConfigPage)}>
                    <i class="fa fa-cog"></i>
                    Fix Configuration
                </button>
            </div>
            <div class="error-details">
                <strong>Please check:</strong>
                <span class="error-items">
                    • Configuration settings • Network connectivity • File integrity
                </span>
            </div>
        </div>
    {/if}
</div>
    <div class="actual-value">
    <table class="value-table centered-table">
        <tr>
            <th>CDS Power Value</th>
            <th>CDS Voltage L1</th>
            <th>Sink Power Value</th>
            <th>Max Current (EVSE)</th>
            <th>Max Power (EVSE)</th>
        </tr>
        <tr>
            <td>
                {#if actualCDSPowerValue > 0}
                    {(actualCDSPowerValue / 1000).toFixed(2)} kW
                {:else}
                0.00 kW
            {/if}
            </td>
            <td>
                {#if actualCDSVoltageValue > 100}
                    {actualCDSVoltageValue.toFixed(1)} V
                {:else}
                0.0 V
            {/if}
            </td>
            <td>
            {#if sinkPowerValue && sinkPowerValue.successful}
                {(Number(sinkPowerValue.msg) / 1000).toFixed(2)} kW
            {:else}
                n/a
            {/if}
        </td>
            <td>
                {maxCurrentValue !== null && maxCurrentValue >= 0 ? maxCurrentValue.toFixed(2) + ' A' : 'null'}
            </td>
            <td>
                {maxkWValueExternal !== null && maxkWValueExternal >= 0 ? maxkWValueExternal.toFixed(2) + ' kW' : 'null'}
            </td>
        </tr>
    </table>
</div>

<div class="power-graph-container" style="margin-top:1.5em;">
    <canvas bind:this={chartCanvas} width="1200" height="450"></canvas>
</div>

</div>


<style>
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

    div {
        padding-top: 10px;
        padding-bottom: 10px;
        text-align: center;
        background-color: rgba(255, 255, 255, 0.5);
    }
   
    .slider-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 30px auto 20px auto;
        width: 350px;
    }

    .slider-container label {
        font-size: 1.2em;
        margin-bottom: 8px;
    }

    #kw-slider {
        width: 100%;
        margin: 10px 0;
    }

    .kw-value {
        font-size: 1.5em;
        font-weight: bold;
        margin-top: 5px;
        color: #333;
    }

    .button-row {
        display: flex;
        gap: 12px;
        margin-top: 18px;
        justify-content: center;
    }   
 
     .hint {
        color: #b00;
        font-weight: bold;
        text-align: center;
        margin-top: 1.2em;
        font-size: 1.15em;
        background: #fff3f3;
        border: 2px solid #b00;
        border-radius: 6px;
        padding: 0.7em 1em;
        box-shadow: 0 0 8px #b00a;
        letter-spacing: 0.5px;
    }   

    .actual-value {
        margin-top: 20px;
        font-size: 1.2em;
        font-weight: 500;
    }
   .toggle-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    font-size: 1.2em;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: #fff;
    font-weight: bold;
    transition: background 0.2s, color 0.2s;
    margin: 0 auto;
    min-width: 180px;
    justify-content: center;
    background-color: #43a047; /* Standard: grün für Activate */
}
.toggle-btn:disabled {
    background-color: #bdbdbd;
    color: #fff;
    cursor: not-allowed;
}
.toggle-btn:hover:enabled {
    filter: brightness(0.95);
}
.toggle-btn.deactivate {
    background-color: #ff0000; /* Rot für Deactivate */
}

.power-graph-container {
    margin: 2em auto 0 auto;
    max-width: 1200px;
    width: 95%;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 12px #0077cc22;
    padding: 1.5em 2em;
    min-height: 500px;
}

.power-graph-container canvas {
    width: 100% !important;
    height: 450px !important;
    max-width: 100%;
}

.value-table {
    border-collapse: collapse;
    margin-bottom: 0.5em;
    width: 100%;
    max-width: 600px;
}
.value-table th, .value-table td {
    border: 1px solid #ddd;
    padding: 0.5em 1em;
    text-align: center;
}
.value-table th {
    background: #f5f5f5;
    font-weight: 600;
}
.centered-table {
    margin-left: auto;
    margin-right: auto;
}

/* Configuration Error Styling */
.config-error {
    background: linear-gradient(135deg, #ffe6e6 0%, #fff5f5 100%);
    border: 2px solid #e74c3c;
    border-radius: 12px;
    padding: 1.5em;
    margin: 1.5em auto;
    max-width: 700px;
    width: 85%;
    box-shadow: 0 4px 20px rgba(231, 76, 60, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.error-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5em;
    margin-bottom: 1em;
    flex-wrap: wrap;
}

.error-icon {
    color: #e74c3c;
    font-size: 2em;
    flex-shrink: 0;
}

.error-text {
    flex: 1;
    min-width: 200px;
    text-align: center;
}

.error-text h3 {
    color: #c0392b;
    margin: 0 0 0.3em 0;
    font-size: 1.4em;
    font-weight: 700;
}

.error-text p {
    color: #666;
    margin: 0;
    font-size: 1em;
}

.config-link-btn {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    color: white;
    border: none;
    padding: 0.7em 1.2em;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9em;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5em;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
    flex-shrink: 0;
    white-space: nowrap;
}

.config-link-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(52, 152, 219, 0.4);
    background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
}

.config-link-btn:active {
    transform: translateY(0);
}

.error-details {
    background: rgba(255, 255, 255, 0.7);
    border-radius: 8px;
    padding: 1em;
    border-left: 4px solid #e74c3c;
    font-size: 0.95em;
    text-align: center;
}

.error-details strong {
    color: #c0392b;
    font-weight: 600;
    display: block;
    margin-bottom: 0.5em;
}

.error-items {
    color: #555;
    line-height: 1.4;
}

@media (max-width: 768px) {
    .config-error {
        max-width: 95%;
        padding: 1.2em;
        margin: 1.2em auto;
    }
    
    .error-header {
        flex-direction: column;
        text-align: center;
        gap: 1em;
    }
    
    .error-text {
        min-width: unset;
    }
    
    .config-link-btn {
        align-self: center;
    }
}

</style>
