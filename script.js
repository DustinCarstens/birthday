// =====================================================
// STATE MANAGEMENT
// =====================================================

let appState = {
    currentSection: 'intro',
    guests: [],
    photoImage: null
};

const API_URL = 'http://localhost:5000/api';

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎉 Birthday Party Website Loaded');
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    updateConfirmedCount();
    navigateTo('intro');
    loadGuests();  // Load from Flask backend
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
// GUEST MANAGEMENT - ASYNC API CALLS
// =====================================================

async function addGuest() {
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

    try {
        const response = await fetch(`${API_URL}/guests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                status: 'pending'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showNotification(data.message || 'Error adding guest', 'error');
            return;
        }

        showNotification(`✓ ${name} added successfully`, 'success');
        input.value = '';
        input.focus();
        
        await loadGuests();  // Refresh list from server
        console.log(`👤 Guest added: ${name}`);

    } catch (error) {
        console.error('Error:', error);
        showNotification('Failed to add guest', 'error');
    }
}

async function loadGuests() {
    try {
        const response = await fetch(`${API_URL}/guests`);
        const data = await response.json();

        if (data.success) {
            appState.guests = data.guests;
            renderGuestList();
            updateConfirmedCount();
            console.log('✅ Guests loaded from server');
        }

    } catch (error) {
        console.error('Error loading guests:', error);
        showNotification('Error loading guests', 'error');
    }
}

async function updateGuestStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_URL}/guests/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showNotification(data.message || 'Error updating status', 'error');
            return;
        }

        await loadGuests();  // Refresh from server
        console.log(`📝 Guest status updated to: ${newStatus}`);

    } catch (error) {
        console.error('Error:', error);
        showNotification('Failed to update status', 'error');
    }
}

async function removeGuest(id) {
    if (!confirm('Remove this guest?')) return;

    try {
        const response = await fetch(`${API_URL}/guests/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!response.ok) {
            showNotification(data.message || 'Error removing guest', 'error');
            return;
        }

        showNotification('✓ Guest removed', 'success');
        await loadGuests();  // Refresh from server
        console.log('🗑️ Guest removed');

    } catch (error) {
        console.error('Error:', error);
        showNotification('Failed to remove guest', 'error');
    }
}

// =====================================================
// RENDER FUNCTIONS
// =====================================================

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

// =====================================================
// CONSOLE UTILITIES (For Debugging)
// =====================================================

async function getStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const data = await response.json();
        console.log('📈 Guest Statistics:', data);
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}

async function exportGuests() {
    try {
        const response = await fetch(`${API_URL}/export`);
        const data = await response.json();
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = `guests-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('Guest list exported', 'success');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Export failed', 'error');
    }
}

// =====================================================
// MAKE FUNCTIONS AVAILABLE IN CONSOLE
// =====================================================

window.getStats = getStats;
window.exportGuests = exportGuests;
window.removePhoto = removePhoto;

console.log('✅ All functions loaded and ready');
console.log('💡 Console commands available:');
console.log('   - getStats()      : View guest statistics');
console.log('   - exportGuests()  : Download guest list as JSON');
console.log('   - removePhoto()   : Remove uploaded photo');