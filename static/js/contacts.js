// Global variables
let currentPage = 1;
let totalPages = 1;
let selectedContacts = [];
let allContacts = [];
let attachments = [];

// Load contacts
function loadContacts(page = 1) {
    const search = document.getElementById('searchInput').value;
    const url = `/api/contacts/list?page=${page}&per_page=50&search=${encodeURIComponent(search)}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            allContacts = data.contacts || [];
            totalPages = data.total_pages || 1;
            currentPage = page;
            
            renderContacts(data.contacts || []);
            renderPagination();
            updateSelectedCount();
        })
        .catch(error => {
            console.error('Error loading contacts:', error);
            alert('Failed to load contacts');
        });
}

// Render contacts table
function renderContacts(contacts) {
    const tbody = document.getElementById('contactsBody');
    
    if (contacts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No contacts found</td></tr>`;
        return;
    }
    
    tbody.innerHTML = contacts.map((contact, index) => `
        <tr>
            <td><input type="checkbox" class="contact-select" value="${contact.id}" onchange="updateSelectedCount()"></td>
            <td>${(currentPage - 1) * 50 + index + 1}</td>
            <td>${escapeHtml(contact.name || '')}</td>
            <td>${escapeHtml(contact.email || '')}</td>
            <td>${escapeHtml(contact.phone || '')}</td>
            <td>${escapeHtml(contact.company || '')}</td>
            <td>${escapeHtml(contact.position || '')}</td>
            <td>
                <button onclick="sendToContact(${contact.id})" class="btn-sm btn-primary">Send</button>
                <button onclick="deleteContact(${contact.id})" class="btn-sm btn-danger">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Render pagination
function renderPagination() {
    const container = document.getElementById('pagination');
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination-controls">';
    html += `<button onclick="loadContacts(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        html += `<button onclick="loadContacts(${i})" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
    }
    
    html += `<button onclick="loadContacts(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`;
    html += '</div>';
    container.innerHTML = html;
}

// Update selected count
function updateSelectedCount() {
    const checkboxes = document.querySelectorAll('.contact-select:checked');
    document.getElementById('selectedCount').textContent = checkboxes.length;
}

// Toggle all checkboxes
function toggleAll() {
    const checked = document.getElementById('selectAll').checked;
    document.querySelectorAll('.contact-select').forEach(cb => cb.checked = checked);
    updateSelectedCount();
}

// Search contacts
function searchContacts() {
    loadContacts(1);
}

// Show upload modal
function showUploadModal() {
    document.getElementById('uploadModal').style.display = 'block';
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
}

// Preview file
function previewFile() {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files || !fileInput.files[0]) {
        alert('Please select a file');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    fetch('/api/contacts/preview', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'block';
        
        // Show column mapping
        showColumnMapping(data.columns, data.preview);
    })
    .catch(error => {
        alert('Error previewing file: ' + error);
    });
}

// Show column mapping
function showColumnMapping(columns, preview) {
    const container = document.getElementById('columnMapping');
    
    let html = `
        <div class="mapping-grid">
            <table class="mapping-table">
                <thead>
                    <tr>
                        <th>Select</th>
                        <th>Column Name</th>
                        <th>Map To</th>
                        <th>Preview</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    columns.forEach(col => {
        const previewValue = preview.length > 0 ? (preview[0][col] || '') : '';
        const isStandard = ['name', 'email', 'phone', 'company', 'position', 'website'].includes(col.toLowerCase());
        const isChecked = isStandard || ['name', 'email'].includes(col.toLowerCase());
        
        html += `
            <tr>
                <td>
                    <input type="checkbox" class="col-select" value="${col}" ${isChecked ? 'checked' : ''}>
                </td>
                <td><strong>${escapeHtml(col)}</strong></td>
                <td>
                    <select class="field-mapping">
                        <option value="display">Display Column</option>
                        <option value="name" ${col.toLowerCase() === 'name' ? 'selected' : ''}>Name</option>
                        <option value="email" ${col.toLowerCase() === 'email' ? 'selected' : ''}>Email</option>
                        <option value="phone" ${col.toLowerCase() === 'phone' ? 'selected' : ''}>Phone</option>
                        <option value="company" ${col.toLowerCase() === 'company' ? 'selected' : ''}>Company</option>
                        <option value="position" ${col.toLowerCase() === 'position' ? 'selected' : ''}>Position</option>
                        <option value="website" ${col.toLowerCase() === 'website' ? 'selected' : ''}>Website</option>
                        <option value="custom">Custom Field</option>
                    </select>
                </td>
                <td>${escapeHtml(previewValue)}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <p>Selected: <span id="selectedColumnsCount">0</span> columns (recommend 5-6)</p>
    `;
    
    container.innerHTML = html;
    
    // Update count when checkboxes change
    document.querySelectorAll('.col-select').forEach(cb => {
        cb.addEventListener('change', updateColumnCount);
    });
    updateColumnCount();
}

// Update column count
function updateColumnCount() {
    const count = document.querySelectorAll('.col-select:checked').length;
    document.getElementById('selectedColumnsCount').textContent = count;
}

// Confirm mapping and import
function confirmMapping() {
    const mapping = {
        display_columns: [],
        name: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        website: ''
    };
    
    document.querySelectorAll('.mapping-grid tbody tr').forEach(row => {
        const checkbox = row.querySelector('.col-select');
        const mappingSelect = row.querySelector('.field-mapping');
        const colName = checkbox.value;
        
        if (checkbox.checked) {
            mapping.display_columns.push(colName);
        }
        
        const mapTo = mappingSelect.value;
        if (['name', 'email', 'phone', 'company', 'position', 'website'].includes(mapTo)) {
            mapping[mapTo] = colName;
        }
    });
    
    // Validate
    if (!mapping.email) {
        alert('Please map an email column');
        return;
    }
    
    if (mapping.display_columns.length < 1) {
        alert('Please select at least 1 column to display');
        return;
    }
    
    // Upload with mapping
    const fileInput = document.getElementById('fileInput');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('mapping', JSON.stringify(mapping));
    
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
    
    fetch('/api/contacts/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('importStatus').textContent = `✅ ${data.message}`;
            document.getElementById('progressBar').style.width = '100%';
            setTimeout(() => {
                closeModal('uploadModal');
                loadContacts();
            }, 1500);
        } else {
            alert('Upload failed: ' + data.error);
        }
    })
    .catch(error => {
        alert('Upload failed: ' + error);
    });
}

// Send to single contact
function sendToContact(contactId) {
    fetch(`/api/contacts/list?page=1&per_page=1000`)
        .then(response => response.json())
        .then(data => {
            const contact = data.contacts.find(c => c.id === contactId);
            if (contact) {
                openEmailComposer([contactId], 1);
            }
        });
}

// Send selected contacts
function sendSelected() {
    const checkboxes = document.querySelectorAll('.contact-select:checked');
    if (checkboxes.length === 0) {
        alert('Please select at least one contact');
        return;
    }
    
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
    openEmailComposer(ids, ids.length);
}

// Open email composer
function openEmailComposer(contactIds, count) {
    document.getElementById('contactIds').value = JSON.stringify(contactIds);
    document.getElementById('recipientCount').textContent = count;
    document.getElementById('emailModal').style.display = 'block';
    document.getElementById('emailSubject').value = '';
    document.getElementById('emailBody').value = '';
    document.getElementById('templateName').value = '';
    document.getElementById('attachmentList').innerHTML = '';
    attachments = [];
}

// Send emails
function sendEmails() {
    const contactIds = JSON.parse(document.getElementById('contactIds').value);
    const subject = document.getElementById('emailSubject').value;
    const body = document.getElementById('emailBody').value;
    const templateName = document.getElementById('templateName').value;
    
    if (!subject || !body) {
        alert('Please fill in subject and body');
        return;
    }
    
    // Show loading
    const btn = document.querySelector('#emailModal .btn-success');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    btn.disabled = true;
    
    const payload = {
        contact_ids: contactIds,
        subject: subject,
        body: body
    };
    
    // Save template if name provided
    if (templateName) {
        fetch('/api/emails/templates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: templateName,
                subject: subject,
                body: body
            })
        });
    }
    
    fetch('/api/emails/send-bulk', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        if (data.success) {
            const message = `✅ Sent to ${data.sent} contacts`;
            if (data.failed && data.failed.length > 0) {
                alert(message + `\nFailed: ${data.failed.length} contacts`);
            } else {
                alert(message);
            }
            closeModal('emailModal');
        } else {
            alert('Failed to send: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        alert('Error: ' + error);
    });
}

// Delete contact
function deleteContact(contactId) {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    fetch(`/api/contacts/delete/${contactId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadContacts(currentPage);
        } else {
            alert('Delete failed');
        }
    });
}

// Refresh contacts
function refreshContacts() {
    loadContacts(currentPage);
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Go back in upload
function goBack() {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
}

// Utility: Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modals on outside click
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
// static/js/contacts.js

function sendSelected() {
    const selected = document.querySelectorAll('.contact-select:checked');
    const count = selected.length;
    
    if (count === 0) {
        alert('Please select at least one contact');
        return;
    }
    
    const contactIds = Array.from(selected).map(cb => cb.value);
    
    // Open email composer modal
    openEmailComposer(contactIds, count);
}

function openEmailComposer(contactIds, count) {
    // Show modal with email fields
    const modal = document.getElementById('emailComposerModal');
    modal.style.display = 'block';
    
    document.getElementById('recipientCount').textContent = count;
    document.getElementById('contactIds').value = JSON.stringify(contactIds);
}

function sendEmails() {
    const contactIds = JSON.parse(document.getElementById('contactIds').value);
    const subject = document.getElementById('emailSubject').value;
    const body = document.getElementById('emailBody').value;
    
    fetch('/api/emails/send-bulk', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contact_ids: contactIds,
            subject: subject,
            body: body
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Emails sent to ${data.sent} contacts`);
            closeModal();
        }
    });
}


}
