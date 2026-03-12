let calculatedPrices = { p91: 0, p95: 0, p97: 0, dsl: 0 };
let chartInstance = null;
let forecastDataCache = [];

const fuelConfig = [
    { key: 'p91', name: '91 RON (Xtra Advance / FuelSave / Silver)', color: '#10b981' },
    { key: 'p95', name: '95 RON (XCS / V-Power / Platinum)', color: '#3b82f6' },
    { key: 'p97', name: '97+ RON (Blaze 100 / Racing)', color: '#8b5cf6' },
    { key: 'dsl', name: 'Diesel (Turbo / Max / Power)', color: '#ef4444' }
];

async function initializeSystem() {
    let currentBrent = 82.50; 
    let currentFx = 56.10;   
    const FRED_API_KEY = "INSERT_YOUR_FRED_API_KEY_HERE";

    try {
        const fxResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const fxData = await fxResponse.json();
        currentFx = fxData.rates.PHP;
    } catch (e) {
        console.warn("Live API fetch failed. Reverting to static baseline.");
    }

    const baseline = { p91: 72.35, p95: 74.50, p97: 82.30, dsl: 75.10 };
    const brentDelta = currentBrent - 82.50;
    const fxDelta = currentFx - 56.10;

    calculatedPrices = {
        p91: baseline.p91 + (brentDelta * 0.45) + (fxDelta * 0.80),
        p95: baseline.p95 + (brentDelta * 0.48) + (fxDelta * 0.85),
        p97: baseline.p97 + (brentDelta * 0.55) + (fxDelta * 0.90),
        dsl: baseline.dsl + (brentDelta * 0.50) + (fxDelta * 0.75)
    };

    document.getElementById('timestamp').innerHTML = `<span class="pulse-dot"></span> As of ${new Date().toLocaleString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})} | ${new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})} PST`;
    
    document.getElementById('val-91').innerText = `₱${calculatedPrices.p91.toFixed(2)}`;
    document.getElementById('val-95').innerText = `₱${calculatedPrices.p95.toFixed(2)}`;
    document.getElementById('val-97').innerText = `₱${calculatedPrices.p97.toFixed(2)}`;
    document.getElementById('val-dsl').innerText = `₱${calculatedPrices.dsl.toFixed(2)}`;
    
    updateForecast();
}

function updateForecast() {
    const days = parseInt(document.getElementById('forecast-period').value);
    document.getElementById('chart-title').innerText = `Price Trend Prediction (${days} Days)`;
    
    const checkboxes = document.querySelectorAll('.cb-container input');
    const selectedIndices = Array.from(checkboxes).filter(cb => cb.checked).map(cb => parseInt(cb.value));

    const labels = [];
    forecastDataCache = [];

    for (let i = 1; i <= days; i++) {
        let d = new Date();
        d.setDate(d.getDate() + i);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));

        forecastDataCache.push({
            p91: calculatedPrices.p91 * (1 + (Math.random() * 0.015 - 0.005)),
            p95: calculatedPrices.p95 * (1 + (Math.random() * 0.015 - 0.005)),
            p97: calculatedPrices.p97 * (1 + (Math.random() * 0.015 - 0.005)),
            dsl: calculatedPrices.dsl * (1 + (Math.random() * 0.015 - 0.005))
        });
    }

    const datasets = selectedIndices.map(idx => {
        const conf = fuelConfig[idx];
        return {
            label: conf.name,
            data: forecastDataCache.map(d => d[conf.key]),
            borderColor: conf.color,
            backgroundColor: conf.color,
            tension: 0.1,
            pointRadius: 3
        };
    });

    if (chartInstance) chartInstance.destroy();
    
    chartInstance = new Chart(document.getElementById('forecastChart').getContext('2d'), {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    grid: { color: 'rgba(250,250,250,0.1)' }, 
                    ticks: { color: '#a1a1aa' },
                    title: { display: true, text: 'Estimated Price (₱/L)', color: '#a1a1aa' }
                },
                x: { 
                    grid: { display: false }, 
                    ticks: { color: '#a1a1aa' },
                    title: { display: true, text: 'Date', color: '#a1a1aa' }
                }
            },
            plugins: { 
                legend: { 
                    position: 'bottom',
                    labels: { color: '#fafafa', boxWidth: 12 }
                }
            }
        }
    });

    renderTable(labels, selectedIndices);
}

function renderTable(labels, selectedIndices) {
    const thead = document.getElementById('table-headers');
    const tbody = document.getElementById('table-body');
    
    thead.innerHTML = '<th>Date</th>';
    selectedIndices.forEach(idx => {
        thead.innerHTML += `<th>${fuelConfig[idx].name}</th>`;
    });

    tbody.innerHTML = '';
    labels.forEach((dateLabel, i) => {
        let row = `<tr><td>${dateLabel}</td>`;
        selectedIndices.forEach(idx => {
            row += `<td>${forecastDataCache[i][fuelConfig[idx].key].toFixed(2)}</td>`;
        });
        row += '</tr>';
        tbody.innerHTML += row;
    });
}

document.getElementById('forecast-period').addEventListener('change', updateForecast);
document.querySelectorAll('.cb-container input').forEach(cb => {
    cb.addEventListener('change', updateForecast);
});

document.querySelectorAll('.cb-container').forEach((container, idx) => {
    container.style.color = fuelConfig[idx].color;
    container.style.backgroundColor = `rgba(${idx===0?'16,185,129':idx===1?'59,130,246':idx===2?'139,92,246':'239,68,68'}, 0.1)`;
});

initializeSystem();
