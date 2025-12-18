/**
 * Smokeless App Logic
 * Handles state management, local storage, UI updates, and Statistics.
 */

// Storage Keys
const STORAGE_KEY_SETTINGS = 'smokeless_settings';
const STORAGE_KEY_LOG = 'smokeless_log';
const STORAGE_KEY_HISTORY = 'smokeless_history'; // New key for array based history

// Default Settings
const defaultSettings = {
    currency: '$',
    pricePerPack: 10.00,
    pricePerPack: 10.00,
    cigsPerPack: 20,
    baselineCigs: 20, // New: User's pre-quit habit
    theme: 'system' // 'system', 'light', 'dark'
};

// State
let currentState = {
    settings: { ...defaultSettings },
    history: [], // Array of { date: "YYYY-MM-DD", count: 0, cost: 0.00 }
    lastSmokeTimestamp: null // timestamp of last cigarette
};

// DOM Elements
const els = {
    splash: document.getElementById('splash-screen'),
    appContent: document.getElementById('app-content'),
    dateDisplay: document.getElementById('date-display'),
    dailyCost: document.getElementById('daily-cost'),
    dailyCount: document.getElementById('daily-count'),
    smokeBtn: document.getElementById('smoke-btn'),
    // Settings
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    resetBtn: document.getElementById('reset-btn'),
    inputs: {
        currency: document.getElementById('currency-symbol'),
        price: document.getElementById('pack-price'),
        size: document.getElementById('pack-size'),
        baseline: document.getElementById('baseline-cigs'),
        theme: document.getElementById('theme-select')
    },
    // Stats
    statsBtn: document.getElementById('stats-btn'),
    statsModal: document.getElementById('stats-modal'),
    closeStatsBtn: document.getElementById('close-stats-btn'),
    statValues: {
        totalCigs: document.getElementById('stat-total-cigs'),
        totalMoney: document.getElementById('stat-total-money'),
        weeklyAvg: document.getElementById('stat-weekly-avg'),
        weeklyAvg: document.getElementById('stat-weekly-avg'),
        lifeLost: document.getElementById('stat-life-lost'),
        // New
        weeklyChart: document.getElementById('weekly-chart'),
        chartLabels: document.getElementById('chart-labels'),
        savedMoney: document.getElementById('stat-saved-money'),
        projectedYear: document.getElementById('stat-projected-year')
    },
    // Encouragement
    encouragement: document.getElementById('encouragement-display'),
    // Debug
    debugSlider: document.getElementById('debug-streak-slider'),
    debugVal: document.getElementById('debug-streak-val'),
    // Popup
    popup: document.getElementById('disappointment-popup'),
    // Timer
    smokeFreeTimer: document.getElementById('smoke-free-timer'),
    // Breathing
    breatheBtn: document.getElementById('breathe-btn'),
    breathingOverlay: document.getElementById('breathing-overlay'),
    breathingCircle: document.querySelector('.breathing-circle'),
    breathingText: document.getElementById('breathing-text'),
    stopBreathingBtn: document.getElementById('stop-breathing-btn'),
    // Health
    healthBtn: document.getElementById('health-btn'),
    healthModal: document.getElementById('health-modal'),
    closeHealthBtn: document.getElementById('close-health-btn'),
    healthTimeline: document.getElementById('health-timeline')
};

const encouragementMessages = [
    "One less is a victory.",
    "Your health is your wealth.",
    "Breathe easy.",
    "You are stronger than the urge.",
    "Think of the savings.",
    "Stay focused, stay clear.",
    "Control your future.",
    "Every hour counts.",
    "Small steps, big changes."
];

const disappointmentMessages = [
    "Oh no...",
    "Resetting streak...",
    "Back to square one.",
    "Don't give up.",
    "Try again tomorrow.",
    "Stay strong next time.",
    "A minor setback.",
    "It happens.",
    "Keep fighting."
];

// --- Initialization ---

function init() {
    loadData();
    ensureTodayExists();
    updateUI();
    applyTheme();
    displayEncouragement();
    setupEventListeners();
    setupDebugListeners();

    // Timer Init
    updateSmokeFreeTimer();
    setInterval(updateSmokeFreeTimer, 1000 * 60); // Update every minute

    // Sync Slider to Real Data
    if (els.debugSlider) {
        const currentStreak = getDaysSinceLastSmoke();
        els.debugSlider.value = currentStreak;
        els.debugVal.textContent = currentStreak;
    }

    // Splash Screen Timer
    setTimeout(() => {
        els.splash.classList.add('fade-out');
        setTimeout(() => {
            els.splash.style.display = 'none';
            els.appContent.classList.remove('hidden');
            els.appContent.classList.add('visible');
        }, 500);
    }, 2000);
}

function setupEventListeners() {
    els.smokeBtn.addEventListener('click', handleSmoke);

    // Settings
    els.settingsBtn.addEventListener('click', openSettings);
    els.saveSettingsBtn.addEventListener('click', saveSettings);
    els.resetBtn.addEventListener('click', handleReset);
    els.settingsModal.addEventListener('click', (e) => {
        if (e.target === els.settingsModal) closeSettings();
    });

    // Stats
    els.statsBtn.addEventListener('click', openStats);
    els.closeStatsBtn.addEventListener('click', closeStats);
    els.statsModal.addEventListener('click', (e) => {
        if (e.target === els.statsModal) closeStats();
    });

    // Breathing
    els.breatheBtn.addEventListener('click', startBreathing);
    els.stopBreathingBtn.addEventListener('click', stopBreathing);

    // Health
    els.healthBtn.addEventListener('click', openHealth);
    els.closeHealthBtn.addEventListener('click', closeHealth);
    els.healthModal.addEventListener('click', (e) => {
        if (e.target === els.healthModal) closeHealth();
    });
}

function handleReset() {
    if (confirm("Reset ALL data? This cannot be undone.")) {
        localStorage.clear();
        location.reload();
    }
}

// --- Breathing Logic ---

let breathingInterval;
let breatheTimer;

function startBreathing() {
    els.breathingOverlay.classList.remove('hidden');
    // Ensure transition
    setTimeout(() => {
        els.breathingOverlay.classList.add('visible');
        els.breathingCircle.classList.add('active');
    }, 10);

    // Initial Text
    els.breathingText.textContent = "Inhale...";
    els.breathingText.style.opacity = 1;

    let isExhaling = false;

    // Cycle text to match CSS animation (4s total: 2s In, 2s Out)
    // CSS Keyframes: 0% start, 50% max (2s), 100% start (4s)

    // We update text every 2s
    breathingInterval = setInterval(() => {
        isExhaling = !isExhaling;
        els.breathingText.textContent = isExhaling ? "Exhale..." : "Inhale...";
    }, 2000);

    // Auto stop after 60s
    breatheTimer = setTimeout(stopBreathing, 60000);
}

function stopBreathing() {
    clearInterval(breathingInterval);
    clearTimeout(breatheTimer);

    els.breathingOverlay.classList.remove('visible');
    els.breathingCircle.classList.remove('active');

    setTimeout(() => {
        els.breathingOverlay.classList.add('hidden');
    }, 500);
}

// --- Health Logic ---

const healthMilestones = [
    { mins: 20, title: "Blood Pressure", desc: "Pulse and BP return to normal." },
    { mins: 480, title: "Oxygen Levels", desc: "Oxygen levels return to normal." }, // 8 hours
    { mins: 1440, title: "Carbon Monoxide", desc: "CO removed from body." }, // 24 hours
    { mins: 2880, title: "Taste & Smell", desc: "Senses begin to improve." }, // 48 hours
    { mins: 4320, title: "Nicotine Free", desc: "Most nicotine is out of the body." }, // 72 hours
    { mins: 10080, title: "Energy Boost", desc: "Bronchial tubes relax." }, // 7 days
    { mins: 20160, title: "Circulation", desc: "Circulation improves." }, // 14 days
    { mins: 43200, title: "Lung Function", desc: "Lung function increases up to 30%." } // 30 days
];

function openHealth() {
    updateHealthTimeline();
    els.healthModal.classList.remove('hidden');
}

function closeHealth() {
    els.healthModal.classList.add('hidden');
}

function updateHealthTimeline() {
    // 1. Calculate minutes since last smoke
    // Using simple logic from getDaysSinceLastSmoke but with minutes resolution
    const sorted = [...currentState.history].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastSmokeEntry = sorted.find(entry => entry.count > 0);

    let lastTime;
    if (lastSmokeEntry) {
        // We only store DATE unfortunately, not timestamp of last smoke.
        // We will assume "End of Day" or "Now" if it was today?
        // Limitation: App only tracks DATE. 
        // Workaround: If last smoke was TODAY, assume 0 minutes (unless we start tracking timestamps).
        // Better: Assume Noon of that day? Or just use Days * 1440.
        // Let's use DaysDiff * 1440.
        lastTime = new Date(lastSmokeEntry.date);
    } else {
        if (sorted.length === 0) {
            // New user, effectively 0 stats
            lastTime = new Date();
        } else {
            // Started tracking X days ago and never smoked.
            lastTime = new Date(sorted[sorted.length - 1].date);
        }
    }

    // Days since *Midnight* of that day.
    const today = new Date(getTodayDateString());
    const diffTime = Math.abs(today - lastTime); // ms
    const diffMins = Math.ceil(diffTime / (1000 * 60));

    // Clear list
    els.healthTimeline.innerHTML = '';

    healthMilestones.forEach(m => {
        const isUnlocked = diffMins >= m.mins;
        const li = document.createElement('li');
        li.className = `timeline-item ${isUnlocked ? 'unlocked' : ''}`;

        let timeStr;
        if (m.mins < 60) timeStr = `${m.mins}m`;
        else if (m.mins < 1440) timeStr = `${m.mins / 60}h`;
        else timeStr = `${m.mins / 1440}d`;

        li.innerHTML = `
            <div class="timeline-time">${timeStr}</div>
            <div class="timeline-title">${m.title} ${isUnlocked ? '✅' : '🔒'}</div>
            <div style="font-size: 0.9rem; margin-top: 4px;">${m.desc}</div>
        `;
        els.healthTimeline.appendChild(li);
    });
}

function loadData() {
    // Load Settings
    const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (savedSettings) {
        currentState.settings = JSON.parse(savedSettings);
    }

    // Load Timestamp
    const savedTimestamp = localStorage.getItem('smokeless_last_smoke');
    if (savedTimestamp) {
        currentState.lastSmokeTimestamp = parseInt(savedTimestamp);
    }

    // Load History
    const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (savedHistory) {
        currentState.history = JSON.parse(savedHistory);
    } else {
        // Migration Check: Check for old single-day log
        const oldLog = localStorage.getItem(STORAGE_KEY_LOG);
        if (oldLog) {
            const parsedLog = JSON.parse(oldLog);
            // Push old log to history
            currentState.history.push(parsedLog);
            // Delete old key to finish migration
            localStorage.removeItem(STORAGE_KEY_LOG);
            saveData();
        }
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(currentState.settings));
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(currentState.history));
    if (currentState.lastSmokeTimestamp) {
        localStorage.setItem('smokeless_last_smoke', currentState.lastSmokeTimestamp);
    }
}

function getTodayDateString() {
    const today = new Date();
    // Use local time for date string to avoid timezone issues
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function ensureTodayExists() {
    const today = getTodayDateString();
    const existingEntry = currentState.history.find(entry => entry.date === today);

    if (!existingEntry) {
        currentState.history.push({
            date: today,
            count: 0,
            cost: 0.00
        });
        saveData();
    }
}

function getTodayEntry() {
    const today = getTodayDateString();
    return currentState.history.find(entry => entry.date === today);
}

// --- Core Logic ---

function handleSmoke() {
    ensureTodayExists();
    const todayEntry = getTodayEntry();

    todayEntry.count++;

    const pricePerCig = currentState.settings.pricePerPack / currentState.settings.cigsPerPack;
    todayEntry.cost = pricePerCig * todayEntry.count;

    currentState.lastSmokeTimestamp = Date.now();

    saveData();
    updateUI();
    showDisappointment();
}

// --- Stats Logic ---

function calculateStats() {
    const stats = {
        totalCigs: 0,
        totalMoney: 0,
        daysTracked: 0,
        weeklyAvg: 0,
        lifeLostMins: 0
    };

    // Total Stats
    currentState.history.forEach(entry => {
        stats.totalCigs += entry.count;
        stats.totalMoney += entry.cost;
    });

    stats.daysTracked = currentState.history.length;

    // Weekly Average (Last 7 Days)
    // Sort logic not strictly needed if we just assume history matches, 
    // but distinct dates is better. For now simple average of last 7 entries.
    const sortedHistory = [...currentState.history].sort((a, b) => new Date(b.date) - new Date(a.date));
    const last7Days = sortedHistory.slice(0, 7);

    let sum7Days = 0;
    last7Days.forEach(e => sum7Days += e.count);
    // If less than 7 days, div by number of days tracked, else 7.
    const divBy = last7Days.length > 0 ? last7Days.length : 1;
    stats.weeklyAvg = (sum7Days / divBy).toFixed(1);

    // Life Lost: 11 mins per cig
    stats.lifeLostMins = stats.totalCigs * 11;

    // Potential Savings: "Days Count" * "Cost Per Day (Baseline)" - "Actual Cost"
    // Baseline Cost Per Day = (PricePerPack / CigsPerPack) * BaselineCigs
    const costPerPack = currentState.settings.pricePerPack;
    const pricePerCig = costPerPack / currentState.settings.cigsPerPack;
    const baselineCostPerDay = pricePerCig * currentState.settings.baselineCigs;

    // We strictly use "Days Tracked" for the potential timeline.
    // Potential Cost = DaysTracked * BaselineCostPerDay
    const potentialCost = stats.daysTracked * baselineCostPerDay;

    stats.savedMoney = Math.max(0, potentialCost - stats.totalMoney);

    // Projected Yearly Cost
    // Based on Weekly Avg * 52 * CostPerCig ?? Or Daily Avg * 365?
    // Let's use Daily Avg from Weekly Avg data
    const dailyAvg = parseFloat(stats.weeklyAvg);
    const costPerCig = currentState.settings.pricePerPack / currentState.settings.cigsPerPack;
    stats.projectedYearlyCost = dailyAvg * 365 * costPerCig;

    // Chart Data (Last 7 Days)
    stats.last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dStr = getDateString(d); // Helper needed

        const entry = currentState.history.find(e => e.date === dStr);
        const count = entry ? entry.count : 0;

        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
        stats.last7Days.push({ label: dayLabel, value: count, isToday: i === 0 });
    }

    return stats;
}

function getDateString(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDuration(minutes) {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return `${hours}h ${mins}m`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
}


// --- UI Updates ---

function updateUI() {
    // Date
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    els.dateDisplay.textContent = new Date().toLocaleDateString('en-US', dateOptions);

    // Current Day Stats
    const todayEntry = getTodayEntry();
    if (todayEntry) {
        els.dailyCount.textContent = todayEntry.count + ' cigs';
        els.dailyCost.textContent = formatCurrency(todayEntry.cost);
    }

    // Normal update (no overrides)
    updateButtonSize();
}

function updateButtonSize(simulatedStreak = null) {
    const streak = simulatedStreak !== null ? simulatedStreak : getDaysSinceLastSmoke();

    // Base: 220px, Min: 100px.
    // Shrink 15px per day.
    const baseSize = 220;
    const minSize = 100;
    const shrinkPerDay = 15;

    const newSize = Math.max(minSize, baseSize - (streak * shrinkPerDay));

    els.smokeBtn.style.width = `${newSize}px`;
    els.smokeBtn.style.height = `${newSize}px`;

    // Adjust ripple if needed, or visual variations
}

function setupDebugListeners() {
    if (els.debugSlider) {
        els.debugSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            els.debugVal.textContent = val;
            updateButtonSize(val);
            // Also update health timeline if visible or for background state
            // If modal is open, we want live feedback
            updateHealthTimeline(val);
        });
    }
}


function getDaysSinceLastSmoke() {
    // 1. Find last date with count > 0
    // Sort history by date descending
    const sorted = [...currentState.history].sort((a, b) => new Date(b.date) - new Date(a.date));

    const lastSmokeEntry = sorted.find(entry => entry.count > 0);

    const today = new Date(getTodayDateString()); // Normalized to midnight UTCish by string parsing

    let lastDate;

    if (lastSmokeEntry) {
        lastDate = new Date(lastSmokeEntry.date);
    } else {
        // No smoke ever recorded. 
        // If history is empty, streak is 0.
        // If history exists but all 0, streak is days since Start of Tracking.
        if (sorted.length === 0) return 0;
        lastDate = new Date(sorted[sorted.length - 1].date);
        // Actually, if I started tracking 5 days ago and never smoked, streak is 5.
        // So we use the oldest entry.
    }

    // Difference in time
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Edge case: If last smoke was TODAY, diffDays is 0.
    // If last smoke was YESTERDAY, diffDays is 1.

    // If we assume "No smoke ever", and we used "Oldest Entry" as start date.
    // Example: Oldest Jan 1. Today Jan 5. Diff is 4. Streak 4. Correct.

    return diffDays;
}

function updateSmokeFreeTimer() {
    let lastTime = currentState.lastSmokeTimestamp;

    if (!lastTime) {
        // Fallback for legacy data
        const days = getDaysSinceLastSmoke();
        if (days > 0) {
            els.smokeFreeTimer.textContent = `> ${days}d`;
            return;
        } else {
            // No history or smoked today but no timestamp?
            // If smoked today (count > 0) and no timestamp, we probably just migrated.
            // Let's assume "0m" or just wait for next smoke.
            // Or roughly set it to "Now" if count > 0 today?
            // Safer: "--"
            els.smokeFreeTimer.textContent = "--";
            return;
        }
    }

    const now = Date.now();
    const diffMs = now - lastTime;

    if (diffMs < 0) {
        els.smokeFreeTimer.textContent = "0m";
        return;
    }

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours < 24) {
        els.smokeFreeTimer.textContent = `${hours}h ${mins}m`;
    } else {
        const days = Math.floor(hours / 24);
        const remHours = hours % 24;
        els.smokeFreeTimer.textContent = `${days}d ${remHours}h`;
    }
}

function displayEncouragement() {
    const randomMsg = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
    els.encouragement.textContent = randomMsg;
}

function formatCurrency(amount) {
    return currentState.settings.currency + amount.toFixed(2);
}

// --- Modals ---

function openSettings() {
    els.inputs.currency.value = currentState.settings.currency;
    els.inputs.price.value = currentState.settings.pricePerPack;
    els.inputs.size.value = currentState.settings.cigsPerPack;
    els.inputs.baseline.value = currentState.settings.baselineCigs || 20;
    els.inputs.theme.value = currentState.settings.theme || 'system';
    els.settingsModal.classList.remove('hidden');
}

function closeSettings() {
    els.settingsModal.classList.add('hidden');
}

function saveSettings() {
    const newCurrency = els.inputs.currency.value || '$';
    const newPrice = parseFloat(els.inputs.price.value);
    const newSize = parseInt(els.inputs.size.value);
    const newBaseline = parseInt(els.inputs.baseline.value);
    const newTheme = els.inputs.theme.value;

    if (isNaN(newPrice) || newPrice < 0) { alert("Invalid price."); return; }
    if (isNaN(newSize) || newSize <= 0) { alert("Invalid size."); return; }
    if (isNaN(newBaseline) || newBaseline < 0) { alert("Invalid baseline."); return; }

    currentState.settings.currency = newCurrency;
    currentState.settings.pricePerPack = newPrice;
    currentState.settings.cigsPerPack = newSize;
    currentState.settings.baselineCigs = newBaseline;
    currentState.settings.theme = newTheme;

    const todayEntry = getTodayEntry();
    if (todayEntry) {
        const pricePerCig = newPrice / newSize;
        todayEntry.cost = pricePerCig * todayEntry.count;
    }

    saveData();
    applyTheme();
    updateUI();
    closeSettings();
}

function applyTheme() {
    let mode = currentState.settings.theme;

    if (currentState.settings.hasOwnProperty('isLightMode')) {
        mode = currentState.settings.isLightMode ? 'light' : 'dark';
        currentState.settings.theme = mode;
        delete currentState.settings.isLightMode;
        saveData();
    }

    if (!mode) mode = 'system';

    if (mode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        toggleLightMode(!prefersDark);

        window.matchMedia('(prefers-color-scheme: dark)').onchange = (e) => {
            if (currentState.settings.theme === 'system') {
                toggleLightMode(!e.matches);
            }
        };
    } else if (mode === 'light') {
        toggleLightMode(true);
    } else {
        toggleLightMode(false);
    }
}

function toggleLightMode(isLight) {
    if (isLight) {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
}

function openStats() {
    const stats = calculateStats();

    els.statValues.totalCigs.textContent = stats.totalCigs;
    els.statValues.totalMoney.textContent = formatCurrency(stats.totalMoney);
    els.statValues.weeklyAvg.textContent = stats.weeklyAvg;
    els.statValues.weeklyAvg.textContent = stats.weeklyAvg;
    els.statValues.lifeLost.textContent = formatDuration(stats.lifeLostMins);

    // New Stats
    els.statValues.savedMoney.textContent = formatCurrency(stats.savedMoney);
    els.statValues.projectedYear.textContent = formatCurrency(stats.projectedYearlyCost);

    renderChart(stats.last7Days);

    els.statsModal.classList.remove('hidden');
}

function renderChart(data) {
    els.statValues.weeklyChart.innerHTML = '';
    els.statValues.chartLabels.innerHTML = '';

    // Find max for scaling (min 10 for visuals)
    const maxVal = Math.max(10, ...data.map(d => d.value));

    data.forEach(d => {
        // Bar
        const bar = document.createElement('div');
        bar.className = 'chart-bar' + (d.isToday ? ' today' : '');
        const heightPct = (d.value / maxVal) * 100;
        bar.style.height = `${heightPct}%`;
        bar.dataset.value = d.value; // for tooltip

        els.statValues.weeklyChart.appendChild(bar);

        // Label
        const label = document.createElement('div');
        label.className = 'chart-label';
        label.textContent = d.label;
        els.statValues.chartLabels.appendChild(label);
    });
}

function closeStats() {
    els.statsModal.classList.add('hidden');
}

function handleReset() {
    if (confirm("Are you sure? This will delete ALL data permanently.")) {
        localStorage.clear();
        location.reload();
    }
}

function showDisappointment() {
    const randomMsg = disappointmentMessages[Math.floor(Math.random() * disappointmentMessages.length)];
    els.popup.textContent = randomMsg;

    els.popup.classList.remove('hidden');
    // Minimal delay to ensure transition works if it was display:none
    requestAnimationFrame(() => {
        els.popup.classList.add('show');
    });

    setTimeout(() => {
        els.popup.classList.remove('show');
        setTimeout(() => {
            els.popup.classList.add('hidden');
        }, 300); // Match transition duration
    }, 2500);
}

// Start
init();
