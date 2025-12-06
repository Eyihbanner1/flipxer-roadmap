// Crypto OTC Roadmap - Interactive Features
/* eslint-env browser */
/* eslint-disable no-unused-vars */

// ============================================
// PASSWORD PROTECTION
// ============================================
const AUTH_KEY = 'flipxer-roadmap-auth';

function checkAuth() {
    const auth = sessionStorage.getItem(AUTH_KEY);
    return auth === 'authenticated';
}

function setupPasswordGate() {
    const gate = document.getElementById('password-gate');
    const form = document.getElementById('password-form');
    const errorEl = document.getElementById('password-error');
    
    if (!gate || !form) return;
    
    // If already authenticated, hide the gate
    if (checkAuth()) {
        gate.classList.add('hidden');
        document.body.style.overflow = '';
        return;
    }
    
    // Block scrolling when gate is visible
    document.body.style.overflow = 'hidden';
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('site-password').value;
        errorEl.textContent = '';
        
        try {
            // In production, verify against server
            const isProduction = window.location.hostname !== 'localhost';
            
            if (isProduction) {
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                
                if (response.ok) {
                    sessionStorage.setItem(AUTH_KEY, 'authenticated');
                    gate.classList.add('hidden');
                    document.body.style.overflow = '';
                } else {
                    errorEl.textContent = 'Invalid password. Please try again.';
                }
            } else {
                // Local development - use hardcoded password
                if (password === 'FLIPXER2025') {
                    sessionStorage.setItem(AUTH_KEY, 'authenticated');
                    gate.classList.add('hidden');
                    document.body.style.overflow = '';
                } else {
                    errorEl.textContent = 'Invalid password. Please try again.';
                }
            }
        } catch (error) {
            errorEl.textContent = 'Connection error. Please try again.';
        }
    });
}

// Run password check immediately
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordGate();
});

// ============================================
// CLOUD SYNC CONFIGURATION
// ============================================
// Uses secure server proxy in production, direct API in development
const CLOUD_CONFIG = {
    enabled: true,
    // Production: uses /api/sync proxy (API key hidden on server)
    // Development: uses direct JSONBin API (for local testing only)
    useProxy: window.location.hostname !== 'localhost',
    proxyUrl: '/api/sync',
    // Direct API config (only used in development)
    binId: '69340984ae596e708f87360f',
    apiKey: '$2a$10$wIin6NgSxmdtE6TuJIVaIePxfGSW5wcl2gYwkuLqxgTsj/Yxh9WIq',
    baseUrl: 'https://api.jsonbin.io/v3/b'
};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the roadmap
    initializeRoadmap();
    loadProgress();
    updateLastUpdated();
    setupEventListeners();
    setupSaveButton();
    setupScrollAnimations();
    setupLiveEffects();
    setupExportPDF();
    initializeTimeline();
    
    // Setup cloud sync if enabled
    if (CLOUD_CONFIG.enabled) {
        setupCloudSync();
    }
});

// Storage key for localStorage
const STORAGE_KEY = 'crypto-otc-roadmap-progress';

// ============================================
// PROJECT TIMELINE CONFIGURATION
// ============================================
const PROJECT_CONFIG = {
    // Project start date - adjust this to your actual start date
    startDate: new Date('2025-12-06'),
    
    // Phase definitions with duration in days
    phases: {
        1: { name: 'Immediate Priority', durationDays: 14 },      // 0-2 weeks
        2: { name: 'Pre-Launch', durationDays: 14 },              // 2-4 weeks  
        3: { name: 'Launch', durationDays: 30 },                  // Month 1
        4: { name: 'Post-Launch & Growth', durationDays: 60 }     // Month 2+
    }
};

// Calculate phase dates based on project start date
function calculatePhaseDates() {
    const { startDate, phases } = PROJECT_CONFIG;
    const phaseDates = {};
    let currentDate = new Date(startDate);
    
    for (let i = 1; i <= 4; i++) {
        const phase = phases[i];
        const phaseStart = new Date(currentDate);
        const phaseEnd = new Date(currentDate);
        phaseEnd.setDate(phaseEnd.getDate() + phase.durationDays - 1);
        
        phaseDates[i] = {
            name: phase.name,
            startDate: phaseStart,
            endDate: phaseEnd,
            durationDays: phase.durationDays
        };
        
        // Next phase starts the day after this one ends
        currentDate = new Date(phaseEnd);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return phaseDates;
}

// Get schedule status for a phase
function getPhaseStatus(phaseNum) {
    const phaseDates = calculatePhaseDates();
    const phase = phaseDates[phaseNum];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const phaseCard = document.querySelector(`.phase-${phaseNum}`);
    if (!phaseCard) return 'not-started';
    
    const tasks = phaseCard.querySelectorAll('.task-item');
    const completedTasks = phaseCard.querySelectorAll('.task-item.completed');
    const completionPercent = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
    
    // Calculate expected progress based on current date
    if (today < phase.startDate) {
        return 'upcoming';
    } else if (today > phase.endDate) {
        return completionPercent === 100 ? 'completed' : 'overdue';
    } else {
        // We're in this phase - calculate expected vs actual progress
        const totalDays = phase.durationDays;
        const daysElapsed = Math.floor((today - phase.startDate) / (1000 * 60 * 60 * 24)) + 1;
        const expectedProgress = (daysElapsed / totalDays) * 100;
        
        if (completionPercent >= 100) {
            return 'completed-early';
        } else if (completionPercent >= expectedProgress - 10) {
            return 'on-track';
        } else {
            return 'behind';
        }
    }
}

// Format date for display
function formatDate(date, format = 'short') {
    const options = format === 'short' 
        ? { month: 'short', day: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Calculate days remaining or overdue for a phase
function getDaysRemaining(phaseNum) {
    const phaseDates = calculatePhaseDates();
    const phase = phaseDates[phaseNum];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (today < phase.startDate) {
        const daysUntil = Math.ceil((phase.startDate - today) / (1000 * 60 * 60 * 24));
        return { type: 'starts-in', days: daysUntil };
    } else if (today > phase.endDate) {
        const daysOverdue = Math.ceil((today - phase.endDate) / (1000 * 60 * 60 * 24));
        return { type: 'overdue', days: daysOverdue };
    } else {
        const daysRemaining = Math.ceil((phase.endDate - today) / (1000 * 60 * 60 * 24));
        return { type: 'remaining', days: daysRemaining };
    }
}

// Initialize timeline displays
function initializeTimeline() {
    updatePhaseDateDisplays();
    updateMilestoneDates();
    createGanttTimeline();
    updateScheduleIndicators();
    
    // Update schedule indicators when progress changes
    const originalUpdateAll = window.updateAllProgress;
    window.updateAllProgress = function() {
        if (originalUpdateAll) originalUpdateAll();
        updateScheduleIndicators();
    };
}

// Update phase cards with actual dates
function updatePhaseDateDisplays() {
    const phaseDates = calculatePhaseDates();
    
    for (let i = 1; i <= 4; i++) {
        const phase = phaseDates[i];
        const phaseCard = document.querySelector(`.phase-${i}`);
        if (!phaseCard) continue;
        
        const timelineSpan = phaseCard.querySelector('.phase-timeline span:last-child');
        if (timelineSpan) {
            const dateRange = `${formatDate(phase.startDate)} – ${formatDate(phase.endDate)}`;
            timelineSpan.textContent = dateRange;
        }
        
        // Add days indicator
        const daysInfo = getDaysRemaining(i);
        let daysIndicator = phaseCard.querySelector('.days-indicator');
        if (!daysIndicator) {
            daysIndicator = document.createElement('div');
            daysIndicator.className = 'days-indicator';
            const phaseHeader = phaseCard.querySelector('.phase-header');
            if (phaseHeader) {
                phaseHeader.appendChild(daysIndicator);
            }
        }
        
        if (daysInfo.type === 'starts-in') {
            daysIndicator.innerHTML = `<span class="days-badge upcoming">Starts in ${daysInfo.days} day${daysInfo.days !== 1 ? 's' : ''}</span>`;
        } else if (daysInfo.type === 'remaining') {
            daysIndicator.innerHTML = `<span class="days-badge active">${daysInfo.days} day${daysInfo.days !== 1 ? 's' : ''} left</span>`;
        } else if (daysInfo.type === 'overdue') {
            daysIndicator.innerHTML = `<span class="days-badge overdue">${daysInfo.days} day${daysInfo.days !== 1 ? 's' : ''} overdue</span>`;
        }
    }
}

// Update milestone dates
function updateMilestoneDates() {
    const phaseDates = calculatePhaseDates();
    const milestoneWeeks = document.querySelectorAll('.milestone-week');
    
    const milestoneMapping = [
        { phase: 1, label: 'Week 2' },
        { phase: 2, label: 'Week 4' },
        { phase: 3, label: 'Month 1' },
        { phase: 4, label: 'Month 2+' }
    ];
    
    milestoneWeeks.forEach((week, index) => {
        if (milestoneMapping[index]) {
            const phase = phaseDates[milestoneMapping[index].phase];
            week.innerHTML = `
                <span class="milestone-label">${milestoneMapping[index].label}</span>
                <span class="milestone-date">${formatDate(phase.endDate, 'long')}</span>
            `;
        }
    });
}

// Create visual Gantt-style timeline
function createGanttTimeline() {
    const timelineSection = document.querySelector('#timeline .section-header');
    if (!timelineSection) return;
    
    // Check if gantt already exists
    if (document.querySelector('.gantt-timeline')) return;
    
    const phaseDates = calculatePhaseDates();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate total project duration
    const projectStart = phaseDates[1].startDate;
    const projectEnd = phaseDates[4].endDate;
    const totalDays = Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24));
    
    // Create gantt container
    const ganttHTML = `
        <div class="gantt-timeline">
            <div class="gantt-header">
                <div class="gantt-title">
                    <span class="gantt-icon">📊</span>
                    <span>Project Timeline</span>
                </div>
                <div class="gantt-legend">
                    <span class="legend-item"><span class="legend-color completed"></span> Completed</span>
                    <span class="legend-item"><span class="legend-color on-track"></span> On Track</span>
                    <span class="legend-item"><span class="legend-color behind"></span> Behind</span>
                    <span class="legend-item"><span class="legend-color upcoming"></span> Upcoming</span>
                </div>
            </div>
            <div class="gantt-body">
                <div class="gantt-dates">
                    <span>${formatDate(projectStart)}</span>
                    <span>${formatDate(new Date(projectStart.getTime() + (projectEnd - projectStart) / 4))}</span>
                    <span>${formatDate(new Date(projectStart.getTime() + (projectEnd - projectStart) / 2))}</span>
                    <span>${formatDate(new Date(projectStart.getTime() + 3 * (projectEnd - projectStart) / 4))}</span>
                    <span>${formatDate(projectEnd)}</span>
                </div>
                <div class="gantt-tracks">
                    ${[1, 2, 3, 4].map(phaseNum => {
                        const phase = phaseDates[phaseNum];
                        const phaseStart = Math.ceil((phase.startDate - projectStart) / (1000 * 60 * 60 * 24));
                        const phaseWidth = (phase.durationDays / totalDays) * 100;
                        const phaseLeft = (phaseStart / totalDays) * 100;
                        const status = getPhaseStatus(phaseNum);
                        
                        return `
                            <div class="gantt-track">
                                <div class="gantt-label">Phase ${phaseNum}</div>
                                <div class="gantt-bar-container">
                                    <div class="gantt-bar status-${status}" 
                                         style="left: ${phaseLeft}%; width: ${phaseWidth}%"
                                         data-phase="${phaseNum}">
                                        <span class="gantt-bar-text">${phase.name}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="gantt-today-marker" style="left: ${Math.min(Math.max(((today - projectStart) / (projectEnd - projectStart)) * 100, 0), 100)}%">
                    <div class="today-line"></div>
                    <div class="today-label">Today</div>
                </div>
            </div>
        </div>
    `;
    
    timelineSection.insertAdjacentHTML('afterend', ganttHTML);
}

// Update schedule status indicators
function updateScheduleIndicators() {
    for (let i = 1; i <= 4; i++) {
        const status = getPhaseStatus(i);
        const phaseCard = document.querySelector(`.phase-${i}`);
        if (!phaseCard) continue;
        
        // Remove old status classes
        phaseCard.classList.remove('status-upcoming', 'status-on-track', 'status-behind', 'status-overdue', 'status-completed', 'status-completed-early');
        phaseCard.classList.add(`status-${status}`);
        
        // Update gantt bar if exists
        const ganttBar = document.querySelector(`.gantt-bar[data-phase="${i}"]`);
        if (ganttBar) {
            ganttBar.className = `gantt-bar status-${status}`;
        }
        
        // Update days indicator
        updatePhaseDateDisplays();
    }
}

// Track unsaved changes
let hasUnsavedChanges = false;
let isSyncing = false;

// Stakeholder verification code - required for ALL tasks
const STAKEHOLDER_CODE = 'FLIPXER2025';
const VERIFIED_TASKS_KEY = 'flipxer-verified-tasks';

// Store verified tasks (tasks that have been signed off) - persisted in localStorage
const verifiedTasks = new Set(JSON.parse(localStorage.getItem(VERIFIED_TASKS_KEY) || '[]'));

// ============================================
// CLOUD SYNC FUNCTIONS
// ============================================

// Setup cloud sync - poll for updates periodically
function setupCloudSync() {
    // Load from cloud on startup
    loadFromCloud();
    
    // Poll for updates every 30 seconds
    setInterval(() => {
        if (!isSyncing && !hasUnsavedChanges) {
            loadFromCloud(true); // silent mode
        }
    }, 30000);
    
    // Show sync indicator
    showSyncStatus('Cloud sync enabled');
}

// Load progress from cloud
async function loadFromCloud(silent = false) {
    if (!CLOUD_CONFIG.enabled) return;
    
    try {
        isSyncing = true;
        if (!silent) showSyncStatus('Loading from cloud...');
        
        let response;
        if (CLOUD_CONFIG.useProxy) {
            // Production: use secure proxy
            response = await fetch(CLOUD_CONFIG.proxyUrl);
        } else {
            // Development: direct API call
            response = await fetch(`${CLOUD_CONFIG.baseUrl}/${CLOUD_CONFIG.binId}/latest`, {
                headers: {
                    'X-Master-Key': CLOUD_CONFIG.apiKey
                }
            });
        }
        
        if (!response.ok) throw new Error('Failed to fetch from cloud');
        
        const result = await response.json();
        const cloudData = CLOUD_CONFIG.useProxy ? result : result.record;
        
        // Compare timestamps - only update if cloud is newer
        const localData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const cloudTime = new Date(cloudData.lastUpdated || 0).getTime();
        const localTime = new Date(localData.lastUpdated || 0).getTime();
        
        if (cloudTime > localTime) {
            // Cloud is newer - update local
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                tasks: cloudData.tasks || {},
                lastUpdated: cloudData.lastUpdated
            }));
            
            // Update verified tasks
            if (cloudData.verifiedTasks) {
                cloudData.verifiedTasks.forEach(t => verifiedTasks.add(t));
                localStorage.setItem(VERIFIED_TASKS_KEY, JSON.stringify([...verifiedTasks]));
            }
            
            // Refresh UI
            applyProgressToUI(cloudData.tasks || {});
            updateAllProgress();
            
            if (!silent) showSyncStatus('Synced from cloud ✓');
        } else {
            if (!silent) showSyncStatus('Up to date ✓');
        }
    } catch (error) {
        console.error('Cloud sync error:', error);
        if (!silent) showSyncStatus('Sync failed - using local data');
    } finally {
        isSyncing = false;
    }
}

// Save progress to cloud
async function saveToCloud() {
    if (!CLOUD_CONFIG.enabled) return;
    
    try {
        isSyncing = true;
        showSyncStatus('Saving to cloud...');
        
        const tasks = {};
        document.querySelectorAll('.task-item').forEach(task => {
            const taskId = task.dataset.task;
            const checkbox = task.querySelector('input[type="checkbox"]');
            if (checkbox) {
                tasks[taskId] = checkbox.checked;
            }
        });
        
        const data = {
            tasks,
            verifiedTasks: [...verifiedTasks],
            lastUpdated: new Date().toISOString()
        };
        
        let response;
        if (CLOUD_CONFIG.useProxy) {
            // Production: use secure proxy
            response = await fetch(CLOUD_CONFIG.proxyUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } else {
            // Development: direct API call
            response = await fetch(`${CLOUD_CONFIG.baseUrl}/${CLOUD_CONFIG.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': CLOUD_CONFIG.apiKey
                },
                body: JSON.stringify(data)
            });
        }
        
        if (!response.ok) throw new Error('Failed to save to cloud');
        
        showSyncStatus('Saved to cloud ✓');
        return true;
    } catch (error) {
        console.error('Cloud save error:', error);
        showSyncStatus('Cloud save failed - saved locally');
        return false;
    } finally {
        isSyncing = false;
    }
}

// Apply progress data to UI
function applyProgressToUI(tasks) {
    Object.keys(tasks).forEach(taskId => {
        const taskElement = document.querySelector(`[data-task="${taskId}"]`);
        if (taskElement) {
            const checkbox = taskElement.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = tasks[taskId];
                if (tasks[taskId]) {
                    taskElement.classList.add('completed');
                } else {
                    taskElement.classList.remove('completed');
                }
            }
        }
    });
}

// Show sync status notification
function showSyncStatus(message) {
    let statusEl = document.getElementById('cloud-sync-status');
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'cloud-sync-status';
        statusEl.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 1rem;
            background: var(--bg-card, #fff);
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: 8px;
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
            color: var(--text-secondary, #41474d);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 10000;
            transition: opacity 0.3s, transform 0.3s;
            opacity: 0;
            transform: translateY(-10px);
        `;
        document.body.appendChild(statusEl);
    }
    
    statusEl.textContent = message;
    statusEl.style.opacity = '1';
    statusEl.style.transform = 'translateY(0)';
    
    clearTimeout(statusEl.hideTimeout);
    statusEl.hideTimeout = setTimeout(() => {
        statusEl.style.opacity = '0';
        statusEl.style.transform = 'translateY(-10px)';
    }, 3000);
}

// ============================================
// LOCAL STORAGE FUNCTIONS  
// ============================================

// Initialize roadmap data structure
function initializeRoadmap() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
        // Initialize with empty progress
        const initialData = {
            tasks: {},
            milestones: {},
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    }
}

// Load saved progress from localStorage
function loadProgress() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        const data = JSON.parse(savedData);
        
        // Restore task checkboxes
        Object.keys(data.tasks).forEach(taskId => {
            const taskElement = document.querySelector(`[data-task="${taskId}"]`);
            if (taskElement && data.tasks[taskId]) {
                const checkbox = taskElement.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = true;
                    taskElement.classList.add('completed');
                }
            }
        });
        
        // Update all counters and progress
        updateAllProgress();
    }
}

// Save progress to localStorage
function saveProgress() {
    const tasks = {};
    document.querySelectorAll('.task-item').forEach(task => {
        const taskId = task.dataset.task;
        const checkbox = task.querySelector('input[type="checkbox"]');
        if (checkbox) {
            tasks[taskId] = checkbox.checked;
        }
    });
    
    const data = {
        tasks,
        lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateLastUpdated();
}

// Mark that there are unsaved changes
function markUnsavedChanges() {
    hasUnsavedChanges = true;
    const saveBtn = document.getElementById('save-progress-btn');
    if (saveBtn) {
        saveBtn.classList.add('has-changes');
    }
}

// Setup save button functionality
function setupSaveButton() {
    const saveBtn = document.getElementById('save-progress-btn');
    const saveIndicator = document.getElementById('save-indicator');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            performSave();
        });
    }
    
    // Keyboard shortcut Ctrl+S
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            performSave();
        }
    });
    
    // Warn before leaving if unsaved changes
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    });
}

// Perform the save operation
async function performSave() {
    const saveBtn = document.getElementById('save-progress-btn');
    const saveIndicator = document.getElementById('save-indicator');
    
    if (!saveBtn) return;
    
    // Add saving state
    saveBtn.classList.add('saving');
    saveBtn.classList.remove('has-changes');
    
    // Save to localStorage first
    saveProgress();
    
    // Save to cloud if enabled
    if (CLOUD_CONFIG.enabled) {
        await saveToCloud();
    }
    
    // Clear unsaved flag
    hasUnsavedChanges = false;
    
    // Remove saving state
    saveBtn.classList.remove('saving');
    
    // Show saved indicator
    if (saveIndicator) {
        saveIndicator.classList.add('show');
        setTimeout(() => {
            saveIndicator.classList.remove('show');
        }, 2000);
    }
    
    // Show notification
    showNotification('Progress saved successfully!', 'success');
}

// Setup all event listeners
function setupEventListeners() {
    // Task checkbox listeners
    document.querySelectorAll('.task-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function(e) {
            const taskItem = this.closest('.task-item');
            const taskId = taskItem.dataset.task;
            const taskName = taskItem.querySelector('.task-title')?.textContent || 'This task';
            
            // ALL tasks require stakeholder verification to check
            if (this.checked && !verifiedTasks.has(taskId)) {
                // Prevent the checkbox from being checked until verified
                e.preventDefault();
                this.checked = false;
                
                // Show stakeholder verification modal
                showStakeholderModal(taskId, taskName, this);
                return;
            }
            
            if (this.checked) {
                taskItem.classList.add('completed');
                // Trigger celebration effect
                celebrateTaskCompletion(taskItem);
            } else {
                // Prevent unchecking tasks without re-verification
                if (!verifiedTasks.has(taskId + '-uncheck')) {
                    // Show modal to confirm unchecking
                    e.preventDefault();
                    this.checked = true;
                    showUncheckModal(taskId, taskName, this);
                    return;
                }
                taskItem.classList.remove('completed');
                // Remove the verified status so re-checking requires verification again
                verifiedTasks.delete(taskId);
                verifiedTasks.delete(taskId + '-uncheck');
                localStorage.setItem(VERIFIED_TASKS_KEY, JSON.stringify([...verifiedTasks]));
                // Remove stakeholder badge if exists
                const badge = taskItem.querySelector('.stakeholder-badge');
                if (badge) badge.remove();
                updateActivePhase();
            }
            
            markUnsavedChanges();
            updateAllProgress();
        });
    });
    
    // Phase dot click listeners (for navigation)
    document.querySelectorAll('.phase-dot').forEach(dot => {
        dot.addEventListener('click', function() {
            const phaseNum = this.dataset.phase;
            const phaseCard = document.querySelector(`.phase-${phaseNum}`);
            if (phaseCard) {
                phaseCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });
}

// Update all progress indicators
function updateAllProgress() {
    updatePhaseProgress();
    updateOverallProgress();
    updateMilestones();
    updatePhaseIndicators();
}

// Update individual phase progress
function updatePhaseProgress() {
    document.querySelectorAll('.phase-card').forEach(card => {
        const tasks = card.querySelectorAll('.task-item');
        const completedTasks = card.querySelectorAll('.task-item.completed');
        
        const completedCount = card.querySelector('.completed-count');
        const totalCount = card.querySelector('.total-count');
        
        if (completedCount && totalCount) {
            completedCount.textContent = completedTasks.length;
            totalCount.textContent = tasks.length;
        }
    });
}

// Update overall progress bar
function updateOverallProgress() {
    const allTasks = document.querySelectorAll('.task-item');
    const completedTasks = document.querySelectorAll('.task-item.completed');
    
    const percentage = allTasks.length > 0 
        ? Math.round((completedTasks.length / allTasks.length) * 100) 
        : 0;
    
    const progressBar = document.getElementById('overall-progress');
    if (progressBar) {
        progressBar.style.width = `${Math.max(percentage, 5)}%`;
        progressBar.querySelector('.progress-text').textContent = `${percentage}%`;
    }
}

// Update phase indicators (dots)
function updatePhaseIndicators() {
    const phases = [1, 2, 3, 4];
    
    phases.forEach(phaseNum => {
        const phaseCard = document.querySelector(`.phase-${phaseNum}`);
        const phaseDot = document.querySelector(`.phase-dot[data-phase="${phaseNum}"]`);
        
        if (phaseCard && phaseDot) {
            const tasks = phaseCard.querySelectorAll('.task-item');
            const completedTasks = phaseCard.querySelectorAll('.task-item.completed');
            
            phaseDot.classList.remove('active', 'completed');
            
            if (completedTasks.length === tasks.length && tasks.length > 0) {
                phaseDot.classList.add('completed');
            } else if (completedTasks.length > 0) {
                phaseDot.classList.add('active');
            }
        }
    });
    
    // Ensure at least phase 1 is active if nothing is completed
    const anyActive = document.querySelector('.phase-dot.active, .phase-dot.completed');
    if (!anyActive) {
        document.querySelector('.phase-dot[data-phase="1"]').classList.add('active');
    }
}

// Show stakeholder verification modal
function showStakeholderModal(taskId, taskName, checkbox) {
    // Create modal HTML
    const modalHTML = `
        <div class="stakeholder-modal-overlay" id="stakeholder-modal">
            <div class="stakeholder-modal">
                <div class="stakeholder-modal-header">
                    <span class="stakeholder-icon">🔐</span>
                    <h3>Stakeholder Sign-Off Required</h3>
                </div>
                <div class="stakeholder-modal-body">
                    <p>Completing <strong>"${taskName}"</strong> requires stakeholder authorization.</p>
                    <p class="stakeholder-hint">Enter the stakeholder verification code to sign off:</p>
                    <input type="password" id="stakeholder-code" placeholder="Enter verification code" autocomplete="off">
                    <div class="stakeholder-error" id="stakeholder-error"></div>
                </div>
                <div class="stakeholder-modal-actions">
                    <button class="btn-cancel" id="stakeholder-cancel">Cancel</button>
                    <button class="btn-verify" id="stakeholder-verify">Verify & Complete</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('stakeholder-modal');
    const codeInput = document.getElementById('stakeholder-code');
    const errorDiv = document.getElementById('stakeholder-error');
    const cancelBtn = document.getElementById('stakeholder-cancel');
    const verifyBtn = document.getElementById('stakeholder-verify');
    
    // Focus the input
    setTimeout(() => codeInput.focus(), 100);
    
    // Cancel button
    cancelBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Verify button
    verifyBtn.addEventListener('click', () => {
        verifyStakeholderCode(taskId, codeInput.value, checkbox, modal, errorDiv);
    });
    
    // Enter key to submit
    codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyStakeholderCode(taskId, codeInput.value, checkbox, modal, errorDiv);
        }
    });
}

// Show uncheck confirmation modal
function showUncheckModal(taskId, taskName, checkbox) {
    const modalHTML = `
        <div class="stakeholder-modal-overlay" id="stakeholder-modal">
            <div class="stakeholder-modal">
                <div class="stakeholder-modal-header">
                    <span class="stakeholder-icon">⚠️</span>
                    <h3>Confirm Task Removal</h3>
                </div>
                <div class="stakeholder-modal-body">
                    <p>You are about to unmark <strong>"${taskName}"</strong> as complete.</p>
                    <p class="stakeholder-hint">Enter the stakeholder verification code to confirm:</p>
                    <input type="password" id="stakeholder-code" placeholder="Enter verification code" autocomplete="off">
                    <div class="stakeholder-error" id="stakeholder-error"></div>
                </div>
                <div class="stakeholder-modal-actions">
                    <button class="btn-cancel" id="stakeholder-cancel">Cancel</button>
                    <button class="btn-verify btn-warning" id="stakeholder-verify">Verify & Remove</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('stakeholder-modal');
    const codeInput = document.getElementById('stakeholder-code');
    const errorDiv = document.getElementById('stakeholder-error');
    const cancelBtn = document.getElementById('stakeholder-cancel');
    const verifyBtn = document.getElementById('stakeholder-verify');
    
    setTimeout(() => codeInput.focus(), 100);
    
    cancelBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    
    verifyBtn.addEventListener('click', () => {
        if (codeInput.value === STAKEHOLDER_CODE) {
            verifiedTasks.add(taskId + '-uncheck');
            localStorage.setItem(VERIFIED_TASKS_KEY, JSON.stringify([...verifiedTasks]));
            modal.remove();
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event('change'));
            showNotification('Task unmarked. Click Save to persist.', 'info');
        } else {
            errorDiv.textContent = 'Invalid verification code.';
            errorDiv.style.display = 'block';
            codeInput.classList.add('shake');
            setTimeout(() => codeInput.classList.remove('shake'), 500);
        }
    });
    
    codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') verifyBtn.click();
    });
}

// Verify stakeholder code
function verifyStakeholderCode(taskId, code, checkbox, modal, errorDiv) {
    if (code === STAKEHOLDER_CODE) {
        // Verification successful
        verifiedTasks.add(taskId);
        localStorage.setItem(VERIFIED_TASKS_KEY, JSON.stringify([...verifiedTasks]));
        modal.remove();
        
        // Complete the task
        const taskItem = checkbox.closest('.task-item');
        checkbox.checked = true;
        taskItem.classList.add('completed');
        
        // Add stakeholder badge
        if (!taskItem.querySelector('.stakeholder-badge')) {
            const badge = document.createElement('span');
            badge.className = 'stakeholder-badge';
            badge.innerHTML = '✓ Signed Off';
            taskItem.querySelector('.task-content').appendChild(badge);
        }
        
        // Trigger celebration
        celebrateTaskCompletion(taskItem);
        
        markUnsavedChanges();
        updateAllProgress();
        
        showNotification('Task signed off! Click Save to persist.', 'success');
    } else {
        // Verification failed
        errorDiv.textContent = 'Invalid verification code. Please try again.';
        errorDiv.style.display = 'block';
        
        // Shake animation
        const input = document.getElementById('stakeholder-code');
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
        <span class="notification-message">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Update milestone statuses based on task completion
function updateMilestones() {
    const milestoneMapping = {
        1: ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7'], // Week 2 tasks
        2: ['2-1', '2-2', '2-3', '2-4', '2-5'], // Week 4 tasks
        3: ['3-1', '3-2', '3-3', '3-4', '3-5'], // Month 1 tasks
        4: ['4-1', '4-2', '4-3', '4-4', '4-5']  // Month 2+ tasks
    };
    
    Object.keys(milestoneMapping).forEach(milestoneNum => {
        const tasks = milestoneMapping[milestoneNum];
        const completedCount = tasks.filter(taskId => {
            const task = document.querySelector(`[data-task="${taskId}"]`);
            return task && task.classList.contains('completed');
        }).length;
        
        const milestoneStatus = document.querySelector(`.milestone-status[data-milestone="${milestoneNum}"]`);
        if (milestoneStatus) {
            if (completedCount === tasks.length) {
                milestoneStatus.classList.add('completed');
                milestoneStatus.innerHTML = '<span class="status-icon">✅</span><span>Completed</span>';
            } else if (completedCount > 0) {
                milestoneStatus.classList.remove('completed');
                milestoneStatus.innerHTML = `<span class="status-icon">🔄</span><span>In Progress (${completedCount}/${tasks.length})</span>`;
            } else {
                milestoneStatus.classList.remove('completed');
                milestoneStatus.innerHTML = '<span class="status-icon">⏳</span><span>Pending</span>';
            }
        }
    });
}

// Update last updated timestamp
function updateLastUpdated() {
    const lastUpdatedElement = document.getElementById('last-updated');
    if (lastUpdatedElement) {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        lastUpdatedElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

// Export progress as JSON (for backup)
function exportProgress() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'crypto-otc-roadmap-progress.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Import progress from JSON
function importProgress(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        location.reload();
    } catch (e) {
        console.error('Invalid JSON data');
    }
}

// Reset all progress
function resetProgress() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to save (prevent default and show save confirmation)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveProgress();
        showNotification('Progress saved!');
    }
    
    // Ctrl/Cmd + E to export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportProgress();
    }
});

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

// Setup scroll-triggered animations
function setupScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                // Don't unobserve - keep watching for re-entry
            }
        });
    }, observerOptions);
    
    // Observe phase cards
    document.querySelectorAll('.phase-card').forEach(card => {
        observer.observe(card);
    });
    
    // Observe milestone cards
    document.querySelectorAll('.milestone-card').forEach(card => {
        observer.observe(card);
    });
    
    // Observe consideration cards
    document.querySelectorAll('.consideration-card').forEach(card => {
        observer.observe(card);
    });
}

// Setup live effects
function setupLiveEffects() {
    // Update active phase indicator
    updateActivePhase();
    
    // Live timestamp update
    setInterval(() => {
        updateLastUpdated();
    }, 60000); // Update every minute
    
    // Add typing effect to progress percentage
    animateProgressCount();
}

// Update which phase is currently active
function updateActivePhase() {
    const phases = [1, 2, 3, 4];
    let currentActivePhase = 1;
    
    phases.forEach(phaseNum => {
        const phaseCard = document.querySelector(`.phase-${phaseNum}`);
        if (phaseCard) {
            const tasks = phaseCard.querySelectorAll('.task-item');
            const completedTasks = phaseCard.querySelectorAll('.task-item.completed');
            
            phaseCard.classList.remove('phase-active');
            
            // If phase has some but not all tasks completed, it's active
            if (completedTasks.length > 0 && completedTasks.length < tasks.length) {
                currentActivePhase = phaseNum;
            }
            // If all tasks completed, move to next phase
            else if (completedTasks.length === tasks.length && tasks.length > 0) {
                currentActivePhase = Math.min(phaseNum + 1, 4);
            }
        }
    });
    
    // Set the active phase
    const activeCard = document.querySelector(`.phase-${currentActivePhase}`);
    if (activeCard) {
        activeCard.classList.add('phase-active');
    }
}

// Animate progress count
function animateProgressCount() {
    const progressBar = document.getElementById('overall-progress');
    if (!progressBar) return;
    
    const progressText = progressBar.querySelector('.progress-text');
    if (!progressText) return;
    
    const currentText = progressText.textContent;
    const targetValue = parseInt(currentText) || 0;
    
    // Store target for later updates
    progressBar.dataset.target = targetValue;
}

// Enhanced task completion with celebration
function celebrateTaskCompletion(taskItem) {
    taskItem.classList.add('just-completed');
    
    // Create confetti particles
    createConfetti(taskItem);
    
    // Remove celebration class after animation
    setTimeout(() => {
        taskItem.classList.remove('just-completed');
    }, 800);
    
    // Update active phase
    updateActivePhase();
}

// Create confetti effect
function createConfetti(element) {
    const colors = ['#305dc9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const rect = element.getBoundingClientRect();
    
    for (let i = 0; i < 8; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-particle';
        confetti.style.cssText = `
            position: fixed;
            width: 8px;
            height: 8px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            left: ${rect.right - 20}px;
            top: ${rect.top + rect.height / 2}px;
        `;
        
        document.body.appendChild(confetti);
        
        // Animate confetti
        const angle = (Math.random() - 0.5) * Math.PI;
        const velocity = 50 + Math.random() * 100;
        const vx = Math.cos(angle) * velocity;
        const vy = -Math.abs(Math.sin(angle) * velocity) - 50;
        
        let x = 0, y = 0, opacity = 1;
        const gravity = 200;
        let startTime = null;
        
        function animateConfetti(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = (timestamp - startTime) / 1000;
            
            x = vx * elapsed;
            y = vy * elapsed + 0.5 * gravity * elapsed * elapsed;
            opacity = Math.max(0, 1 - elapsed * 1.5);
            
            confetti.style.transform = `translate(${x}px, ${y}px) rotate(${elapsed * 360}deg)`;
            confetti.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animateConfetti);
            } else {
                confetti.remove();
            }
        }
        
        requestAnimationFrame(animateConfetti);
    }
}

// Setup PDF Export functionality
function setupExportPDF() {
    const exportBtn = document.getElementById('export-pdf-btn');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportToPDF();
        });
    }
    
    // Keyboard shortcut Ctrl+P for export
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            exportToPDF();
        }
    });
}

// Export roadmap to PDF as Requirements List
function exportToPDF() {
    const exportBtn = document.getElementById('export-pdf-btn');
    
    if (exportBtn) {
        exportBtn.classList.add('exporting');
        exportBtn.querySelector('span:last-child').textContent = 'Generating...';
    }
    
    // Generate and open the requirements document
    generateRequirementsDocument();
    
    // Restore button state
    setTimeout(() => {
        if (exportBtn) {
            exportBtn.classList.remove('exporting');
            exportBtn.querySelector('span:last-child').textContent = 'Export PDF';
        }
    }, 500);
}

// Generate Requirements Document
function generateRequirementsDocument() {
    const phaseDates = calculatePhaseDates();
    const allTasks = document.querySelectorAll('.task-item');
    const completedTasks = document.querySelectorAll('.task-item.completed');
    const percentage = allTasks.length > 0 
        ? Math.round((completedTasks.length / allTasks.length) * 100) 
        : 0;
    
    // Build requirements data from the roadmap
    const requirements = [];
    let reqNumber = 1;
    
    document.querySelectorAll('.phase-card').forEach((phaseCard, phaseIndex) => {
        const phaseNum = phaseIndex + 1;
        const phaseTitle = phaseCard.querySelector('.phase-title')?.textContent || `Phase ${phaseNum}`;
        const phaseDesc = phaseCard.querySelector('.phase-description')?.textContent || '';
        const phase = phaseDates[phaseNum];
        
        phaseCard.querySelectorAll('.task-item').forEach(task => {
            const taskTitle = task.querySelector('.task-title')?.textContent || 'Untitled';
            const taskDetails = task.querySelector('.task-details')?.textContent || '';
            const priority = task.querySelector('.task-priority')?.textContent || 'Medium';
            const isCompleted = task.classList.contains('completed');
            const isSignedOff = task.querySelector('.stakeholder-badge') !== null;
            
            requirements.push({
                id: `REQ-${String(reqNumber).padStart(3, '0')}`,
                phase: phaseNum,
                phaseTitle: phaseTitle,
                phaseDates: phase ? `${formatDate(phase.startDate)} - ${formatDate(phase.endDate)}` : '',
                title: taskTitle.replace('🔐 ', ''),
                description: taskDetails,
                priority: priority.toUpperCase(),
                status: isCompleted ? (isSignedOff ? 'SIGNED OFF' : 'COMPLETE') : 'PENDING',
                category: phaseDesc
            });
            reqNumber++;
        });
    });
    
    // Generate HTML document
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flipxer - Requirements Specification</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        @page {
            size: A4;
            margin: 1.5cm;
        }
        
        body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1a1c1e;
            background: white;
        }
        
        .document {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* Header */
        .doc-header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 3px solid #305dc9;
            margin-bottom: 30px;
        }
        
        .doc-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            width: 139px;
            height: 36px;
            margin: 0 auto 10px auto;
        }
        
        .doc-logo .logo-icon-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            right: 74.87%;
            bottom: 3.09%;
        }
        
        .doc-logo .logo-icon {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .doc-logo .logo-text-wrapper {
            position: absolute;
            left: 31.29%;
            top: 11.08%;
            right: 0;
            bottom: 0;
        }
        
        .doc-logo .logo-text {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .doc-title {
            font-size: 18pt;
            font-weight: 600;
            color: #41474d;
            margin-bottom: 15px;
        }
        
        .doc-meta {
            display: flex;
            justify-content: center;
            gap: 30px;
            font-size: 9pt;
            color: #718096;
        }
        
        .doc-meta span { display: flex; align-items: center; gap: 5px; }
        
        /* Summary Section */
        .summary-section {
            background: #f7f8fc;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            border-left: 4px solid #305dc9;
        }
        
        .summary-title {
            font-size: 12pt;
            font-weight: 600;
            color: #305dc9;
            margin-bottom: 15px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
        }
        
        .summary-item {
            text-align: center;
            padding: 10px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        
        .summary-item .value {
            font-size: 18pt;
            font-weight: 700;
            color: #305dc9;
        }
        
        .summary-item .label {
            font-size: 8pt;
            color: #718096;
            text-transform: uppercase;
        }
        
        /* Phase Section */
        .phase-section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        
        .phase-header {
            background: linear-gradient(135deg, #305dc9, #1e3a8a);
            color: white;
            padding: 12px 20px;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .phase-header h2 {
            font-size: 12pt;
            font-weight: 600;
        }
        
        .phase-dates {
            font-size: 9pt;
            opacity: 0.9;
        }
        
        /* Requirements Table */
        .req-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
        }
        
        .req-table th {
            background: #f7f8fc;
            padding: 10px 12px;
            text-align: left;
            font-weight: 600;
            color: #41474d;
            border: 1px solid #e2e8f0;
        }
        
        .req-table td {
            padding: 10px 12px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }
        
        .req-table tr:nth-child(even) { background: #fafbfc; }
        
        .req-id {
            font-weight: 600;
            color: #305dc9;
            white-space: nowrap;
        }
        
        .req-title { font-weight: 500; }
        .req-desc { color: #718096; font-size: 8pt; margin-top: 3px; }
        
        /* Priority badges */
        .priority {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 8pt;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .priority.high { background: #fee2e2; color: #dc2626; }
        .priority.medium { background: #fef3c7; color: #d97706; }
        .priority.low { background: #dbeafe; color: #2563eb; }
        
        /* Status badges */
        .status {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 8pt;
            font-weight: 600;
        }
        
        .status.pending { background: #f3f4f6; color: #6b7280; }
        .status.complete { background: #d1fae5; color: #059669; }
        .status.signed-off { background: #dbeafe; color: #2563eb; }
        
        /* Footer */
        .doc-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 8pt;
            color: #718096;
        }
        
        .doc-footer .confidential {
            font-weight: 600;
            color: #dc2626;
            margin-bottom: 5px;
        }
        
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .phase-section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="document">
        <header class="doc-header">
            <div class="doc-logo">
                <div class="logo-icon-wrapper">
                    <img src="https://www.figma.com/api/mcp/asset/5698e4f1-7233-4f5f-9746-0d41663441a4" alt="Flipxer Icon" class="logo-icon">
                </div>
                <div class="logo-text-wrapper">
                    <img src="https://www.figma.com/api/mcp/asset/718e15cc-a8af-4cee-aea1-f74e7fa342fe" alt="Flipxer" class="logo-text">
                </div>
            </div>
            <h1 class="doc-title">Product Requirements Specification</h1>
            <div class="doc-meta">
                <span>📅 Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span>📊 Version: 1.0</span>
                <span>👤 Status: ${percentage === 100 ? 'Complete' : 'In Progress'}</span>
            </div>
        </header>
        
        <section class="summary-section">
            <h2 class="summary-title">📋 Executive Summary</h2>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="value">${requirements.length}</div>
                    <div class="label">Total Requirements</div>
                </div>
                <div class="summary-item">
                    <div class="value">${requirements.filter(r => r.status !== 'PENDING').length}</div>
                    <div class="label">Completed</div>
                </div>
                <div class="summary-item">
                    <div class="value">${requirements.filter(r => r.priority === 'HIGH').length}</div>
                    <div class="label">High Priority</div>
                </div>
                <div class="summary-item">
                    <div class="value">${percentage}%</div>
                    <div class="label">Progress</div>
                </div>
            </div>
        </section>
        
        ${generatePhaseRequirements(requirements, phaseDates)}
        
        <footer class="doc-footer">
            <div class="confidential">⚠️ CONFIDENTIAL - INTERNAL USE ONLY</div>
            <p>Flipxer Product Roadmap • This document contains proprietary information</p>
            <p>All requirements require stakeholder sign-off before marking complete</p>
        </footer>
    </div>
    
    <script>
        // Auto-trigger print dialog
        window.onload = function() {
            setTimeout(() => window.print(), 500);
        };
    </script>
</body>
</html>`;
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    showNotification('Requirements document generated! Use "Save as PDF" in print dialog.', 'success');
}

// Generate phase requirements sections
function generatePhaseRequirements(requirements, phaseDates) {
    const phases = [...new Set(requirements.map(r => r.phase))];
    
    return phases.map(phaseNum => {
        const phaseReqs = requirements.filter(r => r.phase === phaseNum);
        const phase = phaseDates[phaseNum];
        const phaseTitle = phaseReqs[0]?.phaseTitle || `Phase ${phaseNum}`;
        const phaseDateStr = phaseReqs[0]?.phaseDates || '';
        
        return `
        <section class="phase-section">
            <div class="phase-header">
                <h2>Phase ${phaseNum}: ${phaseTitle}</h2>
                <span class="phase-dates">📅 ${phaseDateStr}</span>
            </div>
            <table class="req-table">
                <thead>
                    <tr>
                        <th style="width: 80px;">ID</th>
                        <th>Requirement</th>
                        <th style="width: 70px;">Priority</th>
                        <th style="width: 85px;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${phaseReqs.map(req => `
                    <tr>
                        <td class="req-id">${req.id}</td>
                        <td>
                            <div class="req-title">${req.title}</div>
                            ${req.description ? `<div class="req-desc">${req.description}</div>` : ''}
                        </td>
                        <td><span class="priority ${req.priority.toLowerCase()}">${req.priority}</span></td>
                        <td><span class="status ${req.status.toLowerCase().replace(' ', '-')}">${req.status}</span></td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </section>
        `;
    }).join('');
}

// Console welcome message
console.log('%c🚀 Crypto OTC Roadmap', 'font-size: 20px; font-weight: bold; color: #6366f1;');
console.log('%cKeyboard shortcuts:', 'font-size: 14px; color: #a0aec0;');
console.log('%c  Ctrl/Cmd + S - Save progress', 'font-size: 12px; color: #718096;');
console.log('%c  Ctrl/Cmd + P - Export to PDF', 'font-size: 12px; color: #718096;');
