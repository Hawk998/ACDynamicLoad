<script lang="ts">
  import { onMount, tick } from 'svelte';


  let isProcessing = false;

  // Eingabewerte
  let voltagehostIP: string = "";
  let currenthostIP: string = "";
  let voltageLimit: number | null = null;
  let currentLimit: number | null = null;
  let maxkWValue: number | null = null;
  let cdsIP: string = "";

  // Ausgabewerte (berechnet)
  $: outputVoltageLimit = voltageLimit !== null ? Number(voltageLimit) + 10 : 230;
  $: outputCurrentLimit = currentLimit !== null ? Number(currentLimit) : 2;

  // IP-Validierung
  let isIpValid: boolean | null = null;
  let isIpValidCurrent: boolean | null = null;
  $: isIpValid = validateIp(voltagehostIP);
  $: isIpValidCurrent = validateIp(currenthostIP);

  function validateIp(ip: string): boolean {
    const regex =
      /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
    return regex.test(ip);
  }

  $: formValid =
    isIpValid === true &&
    isIpValidCurrent === true &&
    voltageLimit !== null &&
    currentLimit !== null &&
    !isNaN(Number(voltageLimit)) &&
    !isNaN(Number(currentLimit));

  // Feedback-Nachrichten
  let successMessage: string = "";
  let errorMessage: string = "";

  // SCPI-Daten senden
  async function handleSend() {
    if (!formValid) return;
    try {
      successMessage = "";
      errorMessage = "";
      isProcessing = true;  
      await globalThis.api.invoke('saveConfiginConfigFile', {
        voltagehostIP,
        currenthostIP,
        voltageLimit,
        currentLimit,
        maxkWValue,
        cdsIP
      });
      successMessage = "✅ Config successfully saved.";
      isProcessing = false;
    } catch (err) {
      console.error("Fail to save Config.", err);
      errorMessage = "❌ Fail to save Config.";
      throw err;
    }
  }
 
  async function GetConfig() {
  try {
    const config = await globalThis.api.invoke('getConfigFromFile');
    if (config) {
      voltagehostIP = config.voltagehostIP ?? "";
      currenthostIP = config.currenthostIP ?? "";
      voltageLimit = config.voltageLimit ?? null;
      currentLimit = config.currentLimit ?? null;
      maxkWValue = config.maxkWValue ?? null;
      cdsIP = config.cdsIP ?? "";
    } 
  } catch (err) {
    throw err 
  }  
}
 
 onMount(() => {
    // Initiale Konfiguration laden
    GetConfig();
  });
</script>

<!-- Layout -->
<div class="config-container">
  <!-- CDS und Max Power oben nebeneinander -->
  <div class="config-row">
    <div class="config-box">
      <label class="section-title" for="cds-ip-box">CDS</label>
      <select id="cds-ip-box" class="cds-select" bind:value={cdsIP}>
        {#each Array(8).fill(0).map((_,i) => `192.168.100.${10 + i*10}`) as ip}
          <option value={ip}>{ip}</option>
        {/each}
      </select>
    </div>
    <div class="config-box">
      <label class="section-title" for="max-power-kW">Max Power (kW)</label>
      <input id="max-power-kW" class="cds-input" placeholder="z. B. 22" type="number" bind:value={maxkWValue} />
    </div>
  </div>

  <!-- Voltage Priority und Current Priority untereinander, Einstellungen nebeneinander -->
  <div class="priority-section">
    <div class="priority-row">
      <div class="priority-col">
        <h2>Voltage Priority</h2>
        <div class="form-group">
          <label for="voltage-host-ip">Host IP-Adresse</label>
          <input id="voltage-host-ip" type="text" bind:value={voltagehostIP} placeholder="z. B. 192.168.100.180" class:is-valid={isIpValid === true} class:is-invalid={isIpValid === false} />
          {#if isIpValid === false}
            <span class="error">Incorrect format</span>
          {/if}
        </div>
        <div class="form-group">
          <label for="voltage-limit-cv">Voltage Limit (V)</label>
          <input id="voltage-limit-cv" type="number" bind:value={voltageLimit} />
        </div>
        <div class="form-group">
          <label for="current-limit-cv">Current Limit (A)</label>
          <input id="current-limit-cv" type="number" bind:value={currentLimit} />
        </div>
      </div>
      <div class="priority-col">
        <h2>Current Priority</h2>
        <div class="form-group">
          <label for="current-host-ip">Host IP-Adresse</label>
          <input id="current-host-ip" type="text" bind:value={currenthostIP} placeholder="z. B. 192.168.100.182" class:is-valid={isIpValidCurrent === true} class:is-invalid={isIpValidCurrent === false} />
          {#if isIpValidCurrent === false}
            <span class="error">Incorrect format</span>
          {/if}
        </div>
        <div class="form-group">
          <label>Voltage Limit (V)</label>
          <div class="readonly-output"><span style="margin-right:0.5em;">🔒</span>{outputVoltageLimit}</div>
        </div>
        <div class="form-group">
          <label>Current Limit (A)</label>
          <div class="readonly-output"><span style="margin-right:0.5em;">🔒</span>{outputCurrentLimit}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Confirm Button und Feedback bleiben wie gehabt -->
  <div class="config-actions">
    <button class="setConfig" on:click={handleSend} disabled={!formValid || isProcessing}>Save Configuration</button>
    {#if !formValid}
      <p class="hint">Please fill up all necessary config fields.</p>
    {/if}
    {#if successMessage}
      <p class="success-message">{successMessage}</p>
    {/if}
    {#if errorMessage}
      <p class="error-message">{errorMessage}</p>
    {/if}
  </div>
</div>


<style>
.config-container {
  max-width: 1100px;
  margin: 2em auto;
  padding: 2em;
  background: rgba(255,255,255,0.45); /* halbtransparentes Weiß */
  border-radius: 12px;
  box-shadow: 0 2px 16px #0002;
}
.config-row {
  display: flex;
  gap: 2em;
  margin-bottom: 2em;
  justify-content: flex-start;
}
.config-box {
  background: #f5f5f5;
  padding: 1.2em 2em;
  border-radius: 6px;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.section-title {
  font-weight: bold;
  font-size: 1.1em;
  margin-bottom: 0.5em;
}
.priority-section {
  margin-bottom: 2em;
}
.priority-row {
  display: flex;
  gap: 2em;
  flex-wrap: wrap;
}
.priority-col {
  flex: 1 1 300px;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 1.5em;
  min-width: 280px;
  display: flex;
  flex-direction: column;
}


.form-group {
  margin-bottom: 1.2em;
  display: flex;
  flex-direction: column;
}
.readonly-output {
  background: #eee;
  padding: 0.4em 1em;
  border-radius: 4px;
  margin-top: 0.2em;
  font-family: monospace;
}
.config-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2em;
}
.setConfig {
  padding: 0.75em 2em;
  font-size: 1.1em;
  background-color: #0077cc;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 1em;
}
.setConfig:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  color: #666;
  border: 1px solid #999;
}
.success-message {
  color: green;
  font-weight: bold;
}
.error-message {
  color: red;
  font-weight: bold;
}
.hint {
  color: #b00;
  text-align: center;
  margin-top: 0.5em;
  font-size: 0.95em;
}
@media (max-width: 900px) {
  .config-row, .priority-row {
    flex-direction: column;
    gap: 1em;
  }
  .config-box, .priority-col {
    min-width: unset;
    width: 100%;
  }
}
</style>


