const PID = require('node-pid-controller');

// PID-Regler initialisieren
const ctr = new PID({
    k_p: 1.0,    // proportional
    k_i: 0.1,    // integral
    k_d: 0.01    // differential
});

// Beispiel-Regelintervall
export async function regulatePIDPower(
    setpoint: number,
    measured: number,
    maxCurrent: number
): Promise<number> {
    // PID-Regler berechnen (Fehler = Soll - Ist)
    let control = ctr.update(setpoint - measured);
    // Begrenzen auf zulässigen Bereich
    control = Math.max(0, Math.min(control, maxCurrent))
    return control;
}
