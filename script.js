// =====================================================
// STATE MANAGEMENT
// =====================================================

let appState = {
    currentSection: 'intro',
    guests: [
        { id: 1, name: 'Sample Guest', status: 'pending' }
    ],
    photoImage: null
};

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎉 Birthday Party Website Loaded');
    initializeApp();
    loadFromLocalStorage();
    renderGuestList();
    setupEventListeners();
});

function initializeApp() {
    updateConfirmedCount();
    navigateTo('intro');
}

function setupEventListeners() {
    // Photo upload
    const photoUpload = document.getElementById('photoUpload');
    if (photoUpload) {
        photoUpload.addEventListener('change', handlePhotoUpload);
    }

    // Enter key on guest input
    const guestInput = document.getElementById('guestInput');
    if (guestInput) {
        guestInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addGuest();
            }
        });
    }

    // Save data before page unload
    window.addEventListener('beforeunload', function() {
        saveToLocalStorage();
    });

    // Auto-save on visibility change
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            saveToLocalStorage();
        }
    });
}

// =====================================================
// PHOTO MANAGEMENT
// =====================================================

function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            appState.photoImage = event.target.result;
            displayPhoto();
            saveToLocalStorage();
            showNotification('Photo uploaded successfully', 'success');
            console.log('📸 Photo uploaded');
        };
        reader.onerror = function() {
            showNotification('Error reading file', 'error');
        };
        reader.readAsDataURL(file);
    }
}

function displayPhoto() {
    if (appState.photoImage) {
        const photoBanner = document.getElementById('photoBanner');
        const photoBannerContainer = document.getElementById('photoBannerContainer');
        if (photoBanner && photoBannerContainer) {
            photoBanner.src = appState.photoImage;
            photoBannerContainer.classList.remove('hidden');
            console.log('✅ Photo displayed');
        }
    }
}

function removePhoto() {
    if (confirm('Remove the uploaded photo?')) {
        appState.photoImage = null;
        const photoBannerContainer = document.getElementById('photoBannerContainer');
        if (photoBannerContainer) {
            photoBannerContainer.classList.add('hidden');
        }
        saveToLocalStorage();
        showNotification('Photo removed', 'success');
        console.log('🗑️ Photo removed');
    }
}

// =====================================================
// NAVIGATION
// =====================================================

function navigateTo(section) {
    // Validate section
    const validSections = ['intro', 'location', 'rsvp'];
    if (!validSections.includes(section)) {
        console.error(`Invalid section: ${section}`);
        return;
    }

    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(s => s.classList.add('hidden'));

    // Show selected section
    const targetSection = document.getElementById(section);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        appState.currentSection = section;
        updateNavigation(section);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        console.log(`📄 Navigated to: ${section}`);
    }
}

function updateNavigation(activeSection) {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sectionNames = ['intro', 'location', 'rsvp'];

    navBtns.forEach((btn, index) => {
        const btnSection = sectionNames[index];
        if (btnSection === activeSection) {
            btn.classList.add('active');
            const underline = btn.querySelector('.nav-underline');
            if (underline) underline.style.width = '100%';
        } else {
            btn.classList.remove('active');
            const underline = btn.querySelector('.nav-underline');
            if (underline) underline.style.width = '0';
        }
    });
}

// =====================================================
// GUEST MANAGEMENT
// =====================================================

function addGuest() {
    const input = document.getElementById('guestInput');
    const name = input.value.trim();

    // Validation
    if (name === '') {
        showNotification('Please enter a name', 'error');
        input.focus();
        return;
    }

    if (name.length > 50) {
        showNotification('Name is too long (max 50 characters)', 'error');
        return;
    }

    // Check for duplicates
    if (appState.guests.some(guest => guest.name.toLowerCase() === name.toLowerCase())) {
        showNotification('This guest has already been added', 'warning');
        input.value = '';
        input.focus();
        return;
    }

    // Add guest
    const newGuest = {
        id: Date.now(),
        name: escapeHtml(name),
        status: 'pending'
    };

    appState.guests.push(newGuest);
    input.value = '';
    input.focus();

    renderGuestList();
    updateConfirmedCount();
    saveToLocalStorage();

    showNotification(`✓ ${name} added successfully`, 'success');
    console.log(`👤 Guest added: ${name}`);
}

function updateGuestStatus(id, newStatus) {
    const guest = appState.guests.find(g => g.id === id);
    if (guest) {
        const oldStatus = guest.status;
        guest.status = newStatus;
        
        updateConfirmedCount();
        saveToLocalStorage();
        
        console.log(`📝 Guest status updated: ${guest.name} - ${oldStatus} → ${newStatus}`);
    }
}

function removeGuest(id) {
    const guest = appState.guests.find(g => g.id === id);
    if (guest) {
        const guestName = guest.name;
        appState.guests = appState.guests.filter(g => g.id !== id);
        
        renderGuestList();
        updateConfirmedCount();
        saveToLocalStorage();
        
        showNotification(`✓ ${guestName} removed`, 'success');
        console.log(`🗑️ Guest removed: ${guestName}`);
    }
}

function renderGuestList() {
    const guestList = document.getElementById('guestList');
    if (!guestList) return;

    guestList.innerHTML = '';

    if (appState.guests.length === 0) {
        guestList.innerHTML = '<p class="text-gray-500 text-center py-8">No guests yet. Add one to get started!</p>';
        return;
    }

    appState.guests.forEach((guest, index) => {
        const guestItem = createGuestElement(guest, index + 1);
        guestList.appendChild(guestItem);
    });
}

function createGuestElement(guest, index) {
    const div = document.createElement('div');
    div.className = 'guest-item flex items-center justify-between p-5 bg-gradient-to-r from-gray-900 to-black rounded-lg border-2 border-gray-800 hover:border-gray-600 transition-all duration-300 group hover:shadow-lg hover:shadow-black/50';

    const statusClass = getStatusClass(guest.status);

    div.innerHTML = `
        <div class="flex items-center gap-4">
            <span class="text-gray-600 font-black text-lg group-hover:text-gray-500 transition-colors">${String(index).padStart(2, '0')}</span>
            <span class="font-bold text-gray-200 text-lg group-hover:text-white transition-colors">${guest.name}</span>
        </div>
        <div class="flex items-center gap-3">
            <select 
                onchange="updateGuestStatus(${guest.id}, this.value)"
                class="status-badge px-4 py-2 rounded-md font-bold text-xs cursor-pointer border-2 transition-all duration-300 uppercase tracking-wide ${statusClass}"
            >
                <option value="pending">Pending</option>
                <option value="confirmed">✓ Confirmed</option>
                <option value="declined">✗ Declined</option>
            </select>
            <button 
                onclick="removeGuest(${guest.id})"
                class="text-gray-600 hover:text-white transition-all duration-300 font-bold text-lg hover:scale-125 active:scale-95"
            >
                ✕
            </button>
        </div>
    `;

    // Set the current status value
    div.querySelector('select').value = guest.status;
    
    return div;
}

function getStatusClass(status) {
    switch(status) {
        case 'confirmed':
            return 'bg-black text-white border-black hover:bg-gray-900';
        case 'declined':
            return 'bg-gray-600 text-white border-gray-600 hover:bg-gray-700';
        default:
            return 'bg-gray-400 text-black border-gray-400 hover:bg-gray-500';
    }
}

function updateConfirmedCount() {
    const confirmedCount = appState.guests.filter(g => g.status === 'confirmed').length;
    const countElement = document.getElementById('confirmedCount');
    if (countElement) {
        countElement.textContent = confirmedCount;
    }
}

// =====================================================
// NOTIFICATIONS
// =====================================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-8 right-8 px-6 py-4 rounded-lg font-bold uppercase tracking-wide text-sm z-50 animate-fade-in ${getNotificationClass(type)}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        notification.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2500);
}

function getNotificationClass(type) {
    switch(type) {
        case 'success':
            return 'bg-black text-white border-2 border-white';
        case 'error':
            return 'bg-red-900 text-white border-2 border-red-700';
        case 'warning':
            return 'bg-yellow-900 text-yellow-50 border-2 border-yellow-700';
        default:
            return 'bg-gray-800 text-white border-2 border-gray-600';
    }
}

// =====================================================
// DATA PERSISTENCE
// =====================================================

function saveToLocalStorage() {
    try {
        const dataToSave = {
            guests: appState.guests,
            photoImage: appState.photoImage,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('birthdayAppState', JSON.stringify(dataToSave));
        console.log('💾 Data saved to local storage');
    } catch (error) {
        console.error('Local storage error:', error);
        showNotification('Error saving data', 'error');
    }
}

function loadFromLocalStorage() {
    try {
        const savedState = localStorage.getItem('birthdayAppState');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            appState.guests = parsed.guests || appState.guests;
            appState.photoImage = parsed.photoImage || appState.photoImage;

            // Restore photo
            if (appState.photoImage) {
                displayPhoto();
            }

            renderGuestList();
            updateConfirmedCount();
            console.log('📂 Data loaded from local storage');
        }
    } catch (error) {
        console.error('Local storage load error:', error);
    }
}

function clearLocalStorage() {
    if (confirm('Are you sure you want to clear all data?')) {
        localStorage.removeItem('birthdayAppState');
        appState.guests = [];
        appState.photoImage = null;
        renderGuestList();
        updateConfirmedCount();
        const photoBannerContainer = document.getElementById('photoBannerContainer');
        if (photoBannerContainer) {
            photoBannerContainer.classList.add('hidden');
        }
        showNotification('All data cleared', 'success');
        console.log('🗑️ Local storage cleared');
    }
}

// =====================================================
// IMPORT/EXPORT
// =====================================================

function exportGuestList() {
    try {
        const exportData = {
            guests: appState.guests,
            exportDate: new Date().toLocaleString(),
            totalGuests: appState.guests.length,
            confirmedGuests: appState.guests.filter(g => g.status === 'confirmed').length
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = `guest-list-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification('Guest list exported successfully', 'success');
        console.log('📥 Guest list exported');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Error exporting guest list', 'error');
    }
}

function importGuestList(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            
            if (Array.isArray(imported.guests)) {
                appState.guests = imported.guests;
            } else if (Array.isArray(imported)) {
                appState.guests = imported;
            } else {
                throw new Error('Invalid file format');
            }

            renderGuestList();
            updateConfirmedCount();
            saveToLocalStorage();
            showNotification('Guest list imported successfully', 'success');
            console.log('📤 Guest list imported');
        } catch (error) {
            showNotification('Error reading file', 'error');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function getGuestStats() {
    return {
        total: appState.guests.length,
        confirmed: appState.guests.filter(g => g.status === 'confirmed').length,
        pending: appState.guests.filter(g => g.status === 'pending').length,
        declined: appState.guests.filter(g => g.status === 'declined').length
    };
}

// =====================================================
// CONSOLE UTILITIES (for debugging)
// =====================================================

function showAppState() {
    console.log('📊 Current App State:', appState);
    console.log('📈 Guest Stats:', getGuestStats());
}

// Make functions available in console
window.showAppState = showAppState;
window.exportGuestList = exportGuestList;
window.clearLocalStorage = clearLocalStorage;
window.getGuestStats = getGuestStats;
window.removePhoto = removePhoto;

console.log('✅ All functions loaded and ready');
console.log('💡 Tip: Use showAppState() to view current state in console');