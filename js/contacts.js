// ============================================
// GB MAILER - FRONTEND CONTACTS
// ============================================

// ✅ YOUR BACKEND URL (UPDATE THIS)
const API_URL = 'https://gb-mailer-backend.onrender.com';

let currentPage = 1;
let totalPages = 1;
let selectedContacts = [];
let currentContacts = [];

// ============================================
// LOAD CONTACTS
// ============================================
function loadContacts(page = 1) {
    const search = document.getElementById('searchInput')?.value || '';
    const url = `${API_URL}/api/contacts?page=${page}&limit=50&search=${encodeURIComponent(search)}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error:', data.error);
                document.getElementById('contactsBody').innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align:center;padding:40px;color:#dc3545;">
                            ❌ ${data.error}
                        </td>
                    </tr>
                `;
                return;
            }
            
            currentContacts = data.data || [];
            totalPages = data.total_pages || 1;
            currentPage = page;
            
            renderContacts(currentContacts);
            renderPagination(page, totalPages);
            updateSelectedCount();
        })
        .catch(error => {
            console.error('Error loading contacts:', error);
            document.getElementById('contactsBody').innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center;padding:40px;color:#dc3545;">
                        ❌ Failed to load contacts. Is the backend running?
                    </td>
                </tr>
            `;
        });
}

// ============================================
// RENDER CONTACTS
// ============================================
function renderContacts(contacts) {
    const tbody = document.getElementById('contactsBody');
    
    if (!contacts || contacts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;">
                    <i class="fas fa-inbox" style="font-size:48px;color:#ccc;display:block;"></i>
                    No contacts found. Upload your first contact list!
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = contacts.map((contact, index) => {
        const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown';
        
        return `
            <tr>
                <td><input type="checkbox" class="contact-select" value="${contact.id}" onchange="updateSelectedCount()"></td>
                <td>${(currentPage - 1) * 50 + index + 1}</td>
                <td>${escapeHtml(fullName)}</td>
                <td>${escapeHtml(contact.email || '')}</td>
                <td>${escapeHtml(contact.phone || '')}</td>
                <td>${escapeHtml(contact.company || '')}</td>
                <td>
                    <button onclick="sendToContact('${contact.id}')" class="btn-sm btn-primary">
                        <i class="fas fa-envelope"></i>
                    </button>
                    <button onclick="deleteContact('${contact.id}')" class="btn-sm btn-danger">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// RENDER PAGINATION
// ============================================
function renderPagination(page, total) {
    const container = document.getElementById('pagination');
    if (total <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination-controls">';
    html += `<button onclick="loadContacts(${page - 1})" ${page === 1 ? 'disabled' : ''}>Previous</button>`;
    
    for (let i = 1; i <= Math.min(total, 10); i++) {
        html += `<button onclick="loadContacts(${i})" class="${i === page ? 'active' : ''}">${i}</button>`;
    }
    
    if (total > 10) {
        html += `<span>...</span>`;
        html += `<button onclick="loadContacts(${total})">${total}</button>`;
    }
    
    html += `<button onclick="loadContacts(${page + 1})" ${page === total ? 'disabled' : ''}>Next</button>`;
    html += '</div>';
    container.innerHTML = html;
}

// ============================================
// UPDATE SELECTED COUNT
// ============================================
function updateSelectedCount() {
    const checkboxes = document.querySelectorAll('.contact-select:checked');
    const count = checkboxes.length;
    document.getElementById('selectedCount').textContent = count;
}

// ============================================
// TOGGLE ALL CHECKBOXES
// ============================================
function toggleAll() {
    const checked = document.getElementById('selectAll').checked;
    document.querySelectorAll('.contact-select').forEach(cb => cb.checked = checked);
    updateSelectedCount();
}

// ============================================
// SEARCH CONTACTS
// ============================================
function searchContacts() {
    loadContacts(1);
}

// ============================================
// SEND TO SINGLE CONTACT
// ============================================
function sendToContact(contactId) {
    openEmailComposer([contactId], 1);
}

// ============================================
// SEND SELECTED
// ============================================
function sendSelected() {
    const checkboxes = document.querySelectorAll('.contact-select:checked');
    if (checkboxes.length === 0) {
        alert('Please select at least one contact');
        return;
    }
    
    const ids = Array.from(checkboxes).map(cb => cb.value);
    openEmailComposer(ids, ids.length);
}

// ============================================
// OPEN EMAIL COMPOSER
// ============================================
function openEmailComposer(contactIds, count) {
    document.getElementById('contactIds').value = JSON.stringify(contactIds);
    document.getElementById('recipientCount').textContent = count;
    document.getElementById('emailModal').style.display = 'block';
    document.getElementById('emailSubject').value = '';
    document.getElementById('emailBody').value = '';
    document.getElementById('templateName').value = '';
    document.getElementById('attachmentList').innerHTML = '';
}

// ============================================
// SEND EMAILS
// ============================================
function sendEmails() {
    const contactIds = JSON.parse(document.getElementById('contactIds').value);
    const subject = document.getElementById('emailSubject').value.trim();
    const body = document.getElementById('emailBody').value.trim();
    const templateName = document.getElementById('templateName').value.trim();
    
    if (!subject || !body) {
        alert('Please fill in subject and body');
        return;
    }
    
    const btn = document.querySelector('#emailModal .btn-success');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    btn.disabled = true;
    
    // Save template if name provided
    if (templateName) {
        fetch(`${API_URL}/api/emails/templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: templateName,
                subject: subject,
                body: body
            })
        }).catch(() => {});
    }
    
    fetch(`${API_URL}/api/emails/send-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contact_ids: contactIds,
            subject: subject,
            body: body
        })
    })
    .then(response => response.json())
    .then(data => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        if (data.success) {
            alert(`✅ Sent to ${data.sent || 0} contacts`);
            closeModal('emailModal');
            loadContacts();
        } else {
            alert('❌ Failed to send: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        alert('❌ Error: ' + error);
    });
}

// ============================================
// DELETE CONTACT
// ============================================
function deleteContact(contactId) {
    if (!confirm('Delete this contact?')) return;
    
    fetch(`${API_URL}/api/contacts/${contactId}`, {
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

// ============================================
// SHOW UPLOAD MODAL
// ============================================
function showUploadModal() {
    document.getElementById('uploadModal').style.display = 'block';
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    document.getElementById('fileInput').value = '';
    document.getElementById('columnMapping').innerHTML = '';
}

// ============================================
// PREVIEW FILE
// ============================================
function previewFile() {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files || !fileInput.files[0]) {
        alert('Please select a file');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    fetch(`${API_URL}/api/contacts/preview`, {
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
        
        showColumnMapping(data.columns, data.preview);
    })
    .catch(error => {
        alert('Error previewing file: ' + error);
    });
}

// ============================================
// SHOW COLUMN MAPPING
// ============================================
function showColumnMapping(columns, preview) {
    const container = document.getElementById('columnMapping');
    
    let html = `
        <div class="mapping-grid">
            <table class="mapping-table">
                <thead>
                    <tr>
                        <th>Display</th>
                        <th>Column Name</th>
                        <th>Map To</th>
                        <th>Preview</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    const defaultFields = ['first_name', 'last_name', 'email', 'phone', 'company', 'job_title'];
    
    columns.forEach(col => {
        const colLower = col.toLowerCase();
        let defaultMap = 'custom';
        let defaultDisplay = false;
        
        for (const field of defaultFields) {
            if (colLower.includes(field.replace('_', '')) || field.includes(colLower)) {
                defaultMap = field;
                defaultDisplay = ['first_name', 'last_name', 'email', 'phone', 'company'].includes(field);
                break;
            }
        }
        
        const previewValue = preview && preview.length > 0 ? (preview[0][col] || '') : '';
        
        html += `
            <tr>
                <td>
                    <input type="checkbox" class="col-select" value="${col}" ${defaultDisplay ? 'checked' : ''}>
                </td>
                <td><strong>${escapeHtml(col)}</strong></td>
                <td>
                    <select class="field-mapping" data-column="${col}">
                        <option value="custom" ${defaultMap === 'custom' ? 'selected' : ''}>Custom Field</option>
                        <option value="first_name" ${defaultMap === 'first_name' ? 'selected' : ''}>First Name</option>
                        <option value="last_name" ${defaultMap === 'last_name' ? 'selected' : ''}>Last Name</option>
                        <option value="email" ${defaultMap === 'email' ? 'selected' : ''}>Email</option>
                        <option value="phone" ${defaultMap === 'phone' ? 'selected' : ''}>Phone</option>
                        <option value="company" ${defaultMap === 'company' ? 'selected' : ''}>Company</option>
                        <option value="job_title" ${defaultMap === 'job_title' ? 'selected' : ''}>Job Title</option>
                    </select>
                </td>
                <td>${escapeHtml(String(previewValue).substring(0, 50))}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <p>Selected: <span id="selectedColumnsCount">0</span> columns to display</p>
    `;
    
    container.innerHTML = html;
    
    document.querySelectorAll('.col-select').forEach(cb => {
        cb.addEventListener('change', updateColumnCount);
    });
    updateColumnCount();
}

function updateColumnCount() {
    const count = document.querySelectorAll('.col-select:checked').length;
    document.getElementById('selectedColumnsCount').textContent = count;
}

// ============================================
// CONFIRM MAPPING & UPLOAD
// ============================================
function confirmMapping() {
    const mapping = {
        display_columns: [],
        first_name: null,
        last_name: null,
        email: null,
        phone: null,
        company: null,
        job_title: null
    };
    
    document.querySelectorAll('.mapping-table tbody tr').forEach(row => {
        const checkbox = row.querySelector('.col-select');
        const mappingSelect = row.querySelector('.field-mapping');
        const colName = checkbox.value;
        
        if (checkbox.checked) {
            mapping.display_columns.push(colName);
        }
        
        const mapTo = mappingSelect.value;
        if (['first_name', 'last_name', 'email', 'phone', 'company', 'job_title'].includes(mapTo)) {
            mapping[mapTo] = colName;
        }
    });
    
    if (!mapping.email) {
        alert('Please map an email column');
        return;
    }
    
    if (mapping.display_columns.length < 1) {
        alert('Please select at least 1 column to display');
        return;
    }
    
    const fileInput = document.getElementById('fileInput');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('mapping', JSON.stringify(mapping));
    
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('importStatus').textContent = 'Processing...';
    
    fetch(`${API_URL}/api/contacts/upload`, {
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

function goBack() {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modals on outside click
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    loadContacts();
});
