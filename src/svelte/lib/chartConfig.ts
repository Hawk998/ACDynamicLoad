import Chart from 'chart.js/auto';

export interface ChartData {
    timeLabels: string[];
    voltageData: number[];
    currentData: number[];
    powerData: number[]; // Power in kW (measured/present power)
    setpointData: number[]; // Setpoint power in kW
    sinkPowerData: number[]; // Sink power in kW
    maxPowerLimit: number | null;
}

// Helper function to calculate power from voltage and current
export function calcPower(voltage: number[], current: number[]): number[] {
    return voltage.map((v, i) => (v * (current[i] || 0)) / 1000); // kW
}

// Create and configure the chart
export function createPowerChart(canvas: HTMLCanvasElement, data: ChartData): Chart {
    const maxPowerLine = data.maxPowerLimit !== null ? Array(data.timeLabels.length).fill(data.maxPowerLimit) : [];
    
    return new Chart(canvas, {
        type: 'line',
        data: {
            labels: data.timeLabels,
            datasets: [
                {
                    yAxisID: 'voltage',
                    data: data.voltageData,
                    label: 'Voltage',
                    borderColor: '#3e95cd',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    pointRadius: 0,
                },
                {
                    yAxisID: 'current',
                    data: data.currentData,
                    label: 'Current',
                    borderColor: '#FF0000',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    pointRadius: 0,
                },
                {
                    yAxisID: 'power',
                    data: data.powerData,
                    label: 'Present Power',
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    pointRadius: 0,
                },
                {
                    yAxisID: 'power',
                    data: data.setpointData,
                    label: 'Setpoint Power',
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                    borderDash: [3, 3],
                },
                {
                    yAxisID: 'power',
                    data: data.sinkPowerData,
                    label: 'Sink Power',
                    borderColor: '#1e3a8a',
                    backgroundColor: 'rgba(30, 58, 138, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                },
                {
                    yAxisID: 'power',
                    data: maxPowerLine,
                    label: `Max Power: ${data.maxPowerLimit || 0} kW`,
                    borderColor: '#006400',
                    borderWidth: 3,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: window.devicePixelRatio || 2, // Höhere Auflösung
            animation: {
                duration: 0 // Deaktiviert für bessere Performance
            },
            elements: {
                line: {
                    tension: 0.1 // Glatte Linien
                },
                point: {
                    radius: 0 // Keine Punkte für bessere Performance
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        maxTicksLimit: 10,
                        color: '#666'
                    }
                },
                voltage: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Voltage (V)',
                        color: '#3e95cd',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false // Nur eine Grid-Linie anzeigen
                    },
                    ticks: {
                        color: '#3e95cd',
                        callback: function(value: any) {
                            return value;
                        }
                    }
                },
                current: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Current (A)',
                        color: '#FF0000',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#FF0000',
                        callback: function(value: any) {
                            return value;
                        }
                    },
                    // Separate Positionierung
                    offset: true
                },
                power: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Power (kW)',
                        color: '#28a745',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#28a745',
                        callback: function(value: any) {
                            return value;
                        }
                    },
                    // Separate Positionierung
                    offset: true
                },
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        font: {
                            size: 12
                        },
                        color: '#333'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        },
    });
}

// Update chart data with new values
export function updateChartData(chart: Chart, data: ChartData): void {
    if (!chart) return;

    chart.data.labels = data.timeLabels;

    // Update voltage dataset
    chart.data.datasets[0].data = data.voltageData;
    if (data.voltageData[data.voltageData.length - 1] != undefined) {
        chart.data.datasets[0].label = 'Voltage: ' + data.voltageData[data.voltageData.length - 1].toFixed(1) + ' V';
    } else {
        chart.data.datasets[0].label = 'Voltage';
    }

    // Update current dataset
    chart.data.datasets[1].data = data.currentData;
    if (data.currentData[data.currentData.length - 1] != undefined) {
        chart.data.datasets[1].label = 'Current: ' + data.currentData[data.currentData.length - 1].toFixed(1) + ' A';
    } else {
        chart.data.datasets[1].label = 'Current';
    }

    // Update present power dataset
    chart.data.datasets[2].data = data.powerData;
    if (data.powerData[data.powerData.length - 1] != undefined) {
        chart.data.datasets[2].label = 'Present Power: ' + data.powerData[data.powerData.length - 1].toFixed(1) + ' kW';
    } else {
        chart.data.datasets[2].label = 'Present Power';
    }

    // Update setpoint power dataset
    chart.data.datasets[3].data = data.setpointData;
    if (data.setpointData[data.setpointData.length - 1] != undefined) {
        chart.data.datasets[3].label = 'Setpoint Power: ' + data.setpointData[data.setpointData.length - 1].toFixed(1) + ' kW';
    } else {
        chart.data.datasets[3].label = 'Setpoint Power';
    }

    // Update sink power dataset
    chart.data.datasets[4].data = data.sinkPowerData;
    if (data.sinkPowerData[data.sinkPowerData.length - 1] != undefined) {
        chart.data.datasets[4].label = 'Sink Power: ' + data.sinkPowerData[data.sinkPowerData.length - 1].toFixed(1) + ' kW';
    } else {
        chart.data.datasets[4].label = 'Sink Power';
    }

    // Update max power line
    const maxPowerLine = data.maxPowerLimit !== null ? Array(data.timeLabels.length).fill(data.maxPowerLimit) : [];
    chart.data.datasets[5].data = maxPowerLine;
    chart.data.datasets[5].label = `Max Power: ${data.maxPowerLimit || 0} kW`;

    chart.update('none'); // 'none' für bessere Performance
}

// Update only the max power limit line
export function updateMaxPowerLine(chart: Chart, maxPowerLimit: number | null, timeLabelsLength: number): void {
    if (!chart) return;

    const maxPowerLine = maxPowerLimit !== null ? Array(timeLabelsLength).fill(maxPowerLimit) : [];
    chart.data.datasets[5].data = maxPowerLine;
    chart.data.datasets[5].label = `Max Power: ${maxPowerLimit || 0} kW`;
    chart.update();
}
