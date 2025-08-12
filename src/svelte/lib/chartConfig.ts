// chartConfig.ts
// Chart.js configuration and update utilities for AC dynamic load management application.
// Provides chart creation, data updating, and power calculation helpers.

import Chart from 'chart.js/auto';

/**
 * ChartData interface defines the structure of all data arrays used for chart visualization.
 * - timeLabels: Array of time strings for the x-axis
 * - voltageData: Array of voltage values (V)
 * - currentData: Array of current values (A)
 * - powerData: Array of measured power values (kW)
 * - setpointData: Array of setpoint power values (kW)
 * - sinkPowerData: Array of sink power values (kW)
 * - maxPowerLimit: Maximum allowed power (kW) for reference line
 */
export interface ChartData {
    timeLabels: string[];
    voltageData: number[];
    currentData: number[];
    powerData: number[]; // Power in kW (measured/present power)
    setpointData: number[]; // Setpoint power in kW
    sinkPowerData: number[]; // Sink power in kW
    maxPowerLimit: number | null;
}

/**
 * Calculates power values (kW) from voltage and current arrays.
 * @param voltage Array of voltage values (V)
 * @param current Array of current values (A)
 * @returns Array of calculated power values (kW)
 */
export function calcPower(voltage: number[], current: number[]): number[] {
    return voltage.map((v, i) => (v * (current[i] || 0)) / 1000); // kW
}

/**
 * Creates and configures a Chart.js line chart for power, voltage, and current visualization.
 * @param canvas HTMLCanvasElement to render the chart
 * @param data ChartData object containing all data arrays
 * @returns Chart.js instance
 */
export function createPowerChart(canvas: HTMLCanvasElement, data: ChartData): Chart {
    const maxPowerLine = data.maxPowerLimit !== null ? Array(data.timeLabels.length).fill(data.maxPowerLimit) : [];
    
    return new Chart(canvas, {
        type: 'line',
        data: {
            labels: data.timeLabels,
            datasets: [
                // Voltage dataset
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
                // Current dataset
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
                // Present power dataset
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
                // Setpoint power dataset
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
                // Sink power dataset
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
                // Max power reference line
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
            devicePixelRatio: window.devicePixelRatio || 2, // High resolution for better quality
            animation: {
                duration: 0 // Disabled for better performance
            },
            elements: {
                line: {
                    tension: 0.1 // Smooth lines
                },
                point: {
                    radius: 0 // No points for better performance
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
                        display: false // Only one grid line
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
                    offset: true // Separate positioning
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
                    offset: true // Separate positioning
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

/**
 * Updates chart data and labels with new values.
 * @param chart Chart.js instance
 * @param data ChartData object containing updated data arrays
 */
export function updateChartData(chart: Chart, data: ChartData): void {
    if (!chart) return;

    chart.data.labels = data.timeLabels;

    // Update voltage dataset and label
    chart.data.datasets[0].data = data.voltageData;
    if (data.voltageData[data.voltageData.length - 1] != undefined) {
        chart.data.datasets[0].label = 'Voltage: ' + data.voltageData[data.voltageData.length - 1].toFixed(1) + ' V';
    } else {
        chart.data.datasets[0].label = 'Voltage';
    }

    // Update current dataset and label
    chart.data.datasets[1].data = data.currentData;
    if (data.currentData[data.currentData.length - 1] != undefined) {
        chart.data.datasets[1].label = 'Current: ' + data.currentData[data.currentData.length - 1].toFixed(1) + ' A';
    } else {
        chart.data.datasets[1].label = 'Current';
    }

    // Update present power dataset and label
    chart.data.datasets[2].data = data.powerData;
    if (data.powerData[data.powerData.length - 1] != undefined) {
        chart.data.datasets[2].label = 'Present Power: ' + data.powerData[data.powerData.length - 1].toFixed(1) + ' kW';
    } else {
        chart.data.datasets[2].label = 'Present Power';
    }

    // Update setpoint power dataset and label
    chart.data.datasets[3].data = data.setpointData;
    if (data.setpointData[data.setpointData.length - 1] != undefined) {
        chart.data.datasets[3].label = 'Setpoint Power: ' + data.setpointData[data.setpointData.length - 1].toFixed(1) + ' kW';
    } else {
        chart.data.datasets[3].label = 'Setpoint Power';
    }

    // Update sink power dataset and label
    chart.data.datasets[4].data = data.sinkPowerData;
    if (data.sinkPowerData[data.sinkPowerData.length - 1] != undefined) {
        chart.data.datasets[4].label = 'Sink Power: ' + data.sinkPowerData[data.sinkPowerData.length - 1].toFixed(1) + ' kW';
    } else {
        chart.data.datasets[4].label = 'Sink Power';
    }

    // Update max power reference line and label
    const maxPowerLine = data.maxPowerLimit !== null ? Array(data.timeLabels.length).fill(data.maxPowerLimit) : [];
    chart.data.datasets[5].data = maxPowerLine;
    chart.data.datasets[5].label = `Max Power: ${data.maxPowerLimit || 0} kW`;

    chart.update('none'); // 'none' for better performance
}

/**
 * Updates only the max power reference line in the chart.
 * @param chart Chart.js instance
 * @param maxPowerLimit New max power value (kW)
 * @param timeLabelsLength Number of time labels (for line length)
 */
export function updateMaxPowerLine(chart: Chart, maxPowerLimit: number | null, timeLabelsLength: number): void {
    if (!chart) return;

    const maxPowerLine = maxPowerLimit !== null ? Array(timeLabelsLength).fill(maxPowerLimit) : [];
    chart.data.datasets[5].data = maxPowerLine;
    chart.data.datasets[5].label = `Max Power: ${maxPowerLimit || 0} kW`;
    chart.update();
}
