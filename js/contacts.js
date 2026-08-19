// js/contacts.js
const API_URL = 'https://gb-mailer-backend.onrender.com';
let currentPage = 1;
let totalPages = 1;
let selectedContacts = new Set();
let allContacts = [];
let searchTimeout;
let uploadedFileData = null;
let columnMappings = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadContacts();
    initializeEventListeners();
});

function initializeEventListeners() {
    // Add Contact Form
    document.getElementById('addContactForm').addEventListener('submit', addContact);
    
    // Edit Contact Form
    document.getElementById('editContactForm').addEventListener('submit', updateContact);
    
    // Attachment input
    document.getElementById('attachmentInput').addEventListener('change', handleAttachments);
}

// Authentication check
function checkAuth() {
    const token = localStorage.getItem('gbMailerToken');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    const userData = JSON.parse(localStorage.getItem('gbMailerUser') || '{}');
    const userNameElement = document.getElementById('userName');
    if (userNameElement && userData.name) {
        userNameElement.textContent = userData.name;
    }
}

function getAuthHeaders() {
    const token = localStorage.getItem('gbMailerToken');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Load contacts from API
async function loadContacts(page = 1) {
    currentPage = page;
    const searchTerm = document.getElementById('searchInput')?.value || '';
    
    try {
        const response = await fetch(
            `${API_URL}/api/contacts?page=${page}&limit=10&search=${encodeURIComponent(searchTerm)}`,
            { headers: getAuthHeaders() }
        );
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const data = await response.json();
        
        if (response.ok) {
            allContacts = data.contacts || [];
            totalPages = data.totalPages || 1;
            renderContacts();
            renderPagination();
        } else {
            showAlert('error', data.message || 'Failed to load contacts');
        }
    } catch (error) {
        showAlert('error', 'Connection error. Please try again.');
    }
}

// Render contacts table
function renderContacts() {
    const tbody = document.getElementById('contactsBody');
    
    if (allContacts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; padding:40px;">
                    <i class="fas fa-users" style="font-size:48px;color:#ccc;"></i>
                    <p>No contacts found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = allContacts.map((contact, index) => {
        const rowNumber = (currentPage - 1) * 10 + index + 1;
        const isSelected = selectedContacts.has(contact.id);
        
        return `
            <tr class="${isSelected ? 'selected' : ''}">
                <td>
                    <input type="checkbox" 
                           class="contact-checkbox" 
                           value="${contact.id}" 
                           ${isSelected ? 'checked' : ''} 
                           onchange="toggleContact('${contact.id}')">
                </td>
                <td>${rowNumber}</td>
                <td>
                    <div class="contact-name">
                        <i class="fas fa-user-circle"></i>
                        ${contact.name || 'N/A'}
                    </div>
                </td>
                <td>${contact.email}</td>
                <td>${contact.phone || 'N/A'}</td>
                <td>${contact.company || 'N/A'}</td>
                <td>${contact.job_title || 'N/A'}</td>
                <td>${formatDate(contact.created_at)}</td>
                <td>
                    <button onclick="editContact('${contact.id}')" class="btn-icon" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteContact('${contact.id}')" class="btn-icon danger" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Render pagination
function renderPagination() {
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination-controls">';
    
    // Previous button
    html += `<button onclick="loadContacts(${currentPage - 1})" 
                     class="page-btn" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="page-btn active">${i}</button>`;
        } else {
            html += `<button onclick="loadContacts(${i})" class="page-btn">${i}</button>`;
        }
    }
    
    // Next button
    html += `<button onclick="loadContacts(${currentPage + 1})" 
                     class="page-btn" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>`;
    
    html += '</div>';
    pagination.innerHTML = html;
}

// Toggle contact selection
function toggleContact(contactId) {
    if (selectedContacts.has(contactId)) {
        selectedContacts.delete(contactId);
    } else {
        selectedContacts.add(contactId);
    }
    updateSelectionUI();
}

// Toggle all contacts
function toggleAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.contact-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
        if (selectAllCheckbox.checked) {
            selectedContacts.add(checkbox.value);
        } else {
            selectedContacts.delete(checkbox.value);
        }
    });
    
    updateSelectionUI();
}

// Update selection UI
function updateSelectionUI() {
    const count = selectedContacts.size;
    document.getElementById('selectedCount').textContent = count;
    
    document.getElementById('sendSelectedBtn').disabled = count === 0;
    document.getElementById('deleteSelectedBtn').disabled = count === 0;
    
    // Update row highlighting
    document.querySelectorAll('.contact-checkbox').forEach(checkbox => {
        const row = checkbox.closest('tr');
        if (row) {
            row.classList.toggle('selected', checkbox.checked);
        }
    });
}

// Debounced search
function debounceSearch() {
    clearTimeout(searchTimeout);
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClearBtn');
    
    if (searchInput.value) {
        clearBtn.style.display = 'block';
    } else {
        clearBtn.style.display = 'none';
    }
    
    searchTimeout = setTimeout(() => {
        loadContacts(1);
    }, 500);
}

// Clear search
function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchClearBtn').style.display = 'none';
    loadContacts(1);
}

// Add contact
async function addContact(event) {
    event.preventDefault();
    
    const contactData = {
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactEmail').value,
        phone: document.getElementById('contactPhone').value,
        company: document.getElementById('contactCompany').value,
        job_title: document.getElementById('contactJobTitle').value
    };
    
    try {
        const response = await fetch(`${API_URL}/api/contacts`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(contactData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('success', 'Contact added successfully');
            closeModal('addContactModal');
            document.getElementById('addContactForm').reset();
            loadContacts(currentPage);
        } else {
            showAlert('error', data.message || 'Failed to add contact');
        }
    } catch (error) {
        showAlert('error', 'Connection error. Please try again.');
    }
}

// Edit contact
function editContact(contactId) {
    const contact = allContacts.find(c => c.id === contactId);
    if (!contact) return;
    
    document.getElementById('editContactId').value = contact.id;
    document.getElementById('editContactName').value = contact.name || '';
    document.getElementById('editContactEmail').value = contact.email || '';
    document.getElementById('editContactPhone').value = contact.phone || '';
    document.getElementById('editContactCompany').value = contact.company || '';
    document.getElementById('editContactJobTitle').value = contact.job_title || '';
    
    showModal('editContactModal');
}

// Update contact
async function updateContact(event) {
    event.preventDefault();
    
    const contactId = document.getElementById('editContactId').value;
    const contactData = {
        name: document.getElementById('editContactName').value,
        email: document.getElementById('editContactEmail').value,
        phone: document.getElementById('editContactPhone').value,
        company: document.getElementById('editContactCompany').value,
        job_title: document.getElementById('editContactJobTitle').value
    };
    
    try {
        const response = await fetch(`${API_URL}/api/contacts/${contactId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(contactData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('success', 'Contact updated successfully');
            closeModal('editContactModal');
            loadContacts(currentPage);
        } else {
            showAlert('error', data.message || 'Failed to update contact');
        }
    } catch (error) {
        showAlert('error', 'Connection error. Please try again.');
    }
}

// Delete single contact
async function deleteContact(contactId) {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/contacts/${contactId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showAlert('success', 'Contact deleted successfully');
            selectedContacts.delete(contactId);
            updateSelectionUI();
            loadContacts(currentPage);
        } else {
            const data = await response.json();
            showAlert('error', data.message || 'Failed to delete contact');
        }
    } catch (error) {
        showAlert('error', 'Connection error. Please try again.');
    }
}

// Delete selected contacts
async function deleteSelected() {
    if (selectedContacts.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedContacts.size} contacts?`)) return;
    
    try {
        const response = await fetch(`${API_URL}/api/contacts/bulk-delete`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ ids: Array.from(selectedContacts) })
        });
        
        if (response.ok) {
            showAlert('success', `${selectedContacts.size} contacts deleted successfully`);
            selectedContacts.clear();
            updateSelectionUI();
            loadContacts(currentPage);
        } else {
            const data = await response.json();
            showAlert('error', data.message || 'Failed to delete contacts');
        }
    } catch (error) {
        showAlert('error', 'Connection error. Please try again.');
    }
}

// Send email to selected contacts
function sendSelected() {
    if (selectedContacts.size === 0) return;
    
    document.getElementById('recipientCount').textContent = selectedContacts.size;
    document.getElementById('contactIds').value = JSON.stringify(Array.from(selectedContacts));
    
    showModal('emailModal');
}

// Send emails
async function sendEmails() {
    const contactIds = JSON.parse(document.getElementById('contactIds').value);
    const subject = document.getElementById('emailSubject').value;
    const body = document.getElementById('emailBody').value;
    const templateName = document.getElementById('templateName').value;
    
    if (!subject || !body) {
        showAlert('error', 'Subject and body are required');
        return;
    }
    
    // Show loading state
    const sendButton = document.querySelector('#emailModal .btn-success');
    const originalText = sendButton.innerHTML;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    sendButton.disabled = true;
    
    try {
        // Handle attachments
        const attachments = await prepareAttachments();
        
        const emailData = {
            contactIds,
            subject,
            body,
            attachments,
            templateName: templateName || null
        };
        
        const response = await fetch(`${API_URL}/api/emails/send`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(emailData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('success', `Emails sent successfully to ${contactIds.length} contacts`);
            closeModal('emailModal');
            document.getElementById('emailForm').reset();
            selectedContacts.clear();
            updateSelectionUI();
        } else {
            showAlert('error', data.message || 'Failed to send emails');
        }
    } catch (error) {
        showAlert('error', 'Connection error. Please try again.');
    } finally {
        sendButton.innerHTML = originalText;
        sendButton.disabled = false;
    }
}

// Handle attachments
function handleAttachments(event) {
    const files = event.target.files;
    const attachmentList = document.getElementById('attachmentList');
    attachmentList.innerHTML = '';
    
    Array.from(files).forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'attachment-item';
        fileItem.innerHTML = `
            <i class="fas fa-paperclip"></i>
            <span>${file.name} (${formatFileSize(file.size)})</span>
            <button type="button" onclick="removeAttachment(this)" class="btn-icon danger">
                <i class="fas fa-times"></i>
            </button>
        `;
        attachmentList.appendChild(fileItem);
    });
}

async function prepareAttachments() {
    const files = document.getElementById('attachmentInput').files;
    const attachments = [];
    
    for (let file of files) {
        const base64 = await fileToBase64(file);
        attachments.push({
            filename: file.name,
            content: base64,
            contentType: file.type
        });
    }
    
    return attachments;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function removeAttachment(button) {
    button.closest('.attachment-item').remove();
}

// Insert personalization tag
function insertTag(tag) {
    const textarea = document.getElementById('emailBody');
    const cursorPos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, cursorPos);
    const textAfter = textarea.value.substring(cursorPos);
    
    textarea.value = textBefore + tag + textAfter;
    textarea.focus();
    textarea.selectionStart = cursorPos + tag.length;
    textarea.selectionEnd = cursorPos + tag.length;
}

// Show upload modal
function showUploadModal() {
    showModal('uploadModal');
    resetUploadModal();
}

function resetUploadModal() {
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    document.getElementById('fileInput').value = '';
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('importStatus').textContent = '';
}

// Preview file for upload
function previewFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('error', 'Please select a file first');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            if (jsonData.length < 2) {
                showAlert('error', 'File must contain at least a header row and one data row');
                return;
            }
            
            uploadedFileData = {
                headers: jsonData[0],
                rows: jsonData.slice(1),
                fileName: file.name
            };
            
            displayColumnMapping();
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'block';
        } catch (error) {
            showAlert('error', 'Failed to read file. Please ensure it is a valid Excel or CSV file.');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// Display column mapping
function displayColumnMapping() {
    const mappingContainer = document.getElementById('columnMapping');
    const contactFields = [
        { value: 'name', label: 'Name' },
        { value: 'email', label: 'Email' },
        { value: 'phone', label: 'Phone' },
        { value: 'company', label: 'Company' },
        { value: 'job_title', label: 'Job Title' }
    ];
    
    let html = '<div class="mapping-grid">';
    html += '<div class="mapping-header">File Column</div>';
    html += '<div class="mapping-header">Contact Field</div>';
    
    uploadedFileData.headers.forEach((header, index) => {
        html += `<div class="mapping-column">${header}</div>`;
        html += `<select id="mapping_${index}" class="mapping-select">`;
        html += '<option value="">-- Skip --</option>';
        
        contactFields.forEach(field => {
            const isMatch = header.toLowerCase().includes(field.value.toLowerCase()) || 
                           field.value.toLowerCase().includes(header.toLowerCase());
            html += `<option value="${field.value}" ${isMatch ? 'selected' : ''}>${field.label}</option>`;
        });
        
        html += '</select>';
    });
    
    html += '</div>';
    mappingContainer.innerHTML = html;
}

// Confirm mapping and import
async function confirmMapping() {
    const mappings = {};
    uploadedFileData.headers.forEach((header, index) => {
        const select = document.getElementById(`mapping_${index}`);
        if (select.value) {
            mappings[select.value] = header;
        }
    });
    
    if (!mappings.email) {
        showAlert('error', 'Email field mapping is required');
        return;
    }
    
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
    
    const contacts = uploadedFileData.rows.map(row => {
        const contact = {};
        Object.keys(mappings).forEach(field => {
            const headerIndex = uploadedFileData.headers.indexOf(mappings[field]);
            contact[field] = row[headerIndex] || '';
        });
        return contact;
    }).filter(contact => contact.email);
    
    try {
        const batchSize = 50;
        let imported = 0;
        
        for (let i = 0; i < contacts.length; i += batchSize) {
            const batch = contacts.slice(i, i + batchSize);
            
            const response = await fetch(`${API_URL}/api/contacts/bulk-import`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ contacts: batch })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                imported += batch.length;
                const progress = Math.round((imported / contacts.length) * 100);
                document.getElementById('progressBar').style.width = progress + '%';
                document.getElementById('importStatus').textContent = 
                    `Imported ${imported} of ${contacts.length} contacts...`;
            } else {
                throw new Error(data.message || 'Import failed');
            }
        }
        
        document.getElementById('importStatus').textContent = 
            `Successfully imported ${imported} contacts!`;
        
        setTimeout(() => {
            closeModal('uploadModal');
            resetUploadModal();
            loadContacts(1);
            showAlert('success', `${imported} contacts imported successfully`);
        }, 1000);
        
    } catch (error) {
        document.getElementById('importStatus').textContent = 'Import failed: ' + error.message;
        showAlert('error', 'Failed to import contacts: ' + error.message);
    }
}

function goBack() {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
}

// Show add contact modal
function showAddContactModal() {
    document.getElementById('addContactForm').reset();
    showModal('addContactModal');
}

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Show alert
function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
        <button onclick="this.parentElement.remove()" class="alert-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Logout function
function logout() {
    localStorage.removeItem('gbMailerToken');
    localStorage.removeItem('gbMailerUser');
    window.location.href = 'index.html';
}
