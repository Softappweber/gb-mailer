// Utility Functions for GB Mailer
class GBUtils {
    // Format date
    static formatDate(date, format = 'short') {
        if (!date) return '';
        const d = new Date(date);
        
        switch (format) {
            case 'short':
                return d.toLocaleDateString();
            case 'long':
                return d.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            case 'time':
                return d.toLocaleTimeString();
            case 'datetime':
                return d.toLocaleString();
            case 'relative':
                return this.timeAgo(date);
            default:
                return d.toLocaleDateString();
        }
    }
    
    // Time ago function
    static timeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + ' years ago';
        
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + ' months ago';
        
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + ' days ago';
        
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + ' hours ago';
        
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + ' minutes ago';
        
        return 'Just now';
    }
    
    // Generate random ID
    static generateId(prefix = '') {
        return prefix + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Validate email
    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Sanitize HTML
    static sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
    
    // Parse CSV
    static parseCSV(csvText) {
        const lines = csvText.split('\n');
        const result = [];
        const headers = lines[0].split(',');
        
        for (let i = 1; i < lines.length; i++) {
            const obj = {};
            const currentLine = lines[i].split(',');
            
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j].trim()] = currentLine[j]?.trim() || '';
            }
            
            if (Object.values(obj).some(value => value !== '')) {
                result.push(obj);
            }
        }
        
        return result;
    }
    
    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // Number formatting
    static formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    // Percentage calculation
    static calculatePercentage(part, whole) {
        if (whole === 0) return 0;
        return ((part / whole) * 100).toFixed(1);
    }
    
    // Color palette for charts
    static chartColors = [
        '#e94560', '#0f3460', '#16213e', '#533483',
        '#00b4d8', '#0077b6', '#90e0ef', '#caf0f8',
        '#fb8500', '#ffb703', '#023047', '#219ebc'
    ];
    
    // Get chart color
    static getChartColor(index) {
        return this.chartColors[index % this.chartColors.length];
    }
    
    // Export to CSV
    static exportToCSV(data, filename) {
        if (!data.length) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                let cell = row[header] || '';
                if (typeof cell === 'string' && cell.includes(',')) {
                    cell = `"${cell}"`;
                }
                return cell;
            }).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Copy to clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy:', error);
            return false;
        }
    }
    
    // Truncate text
    static truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    // Parse URL parameters
    static getUrlParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        const pairs = queryString.split('&');
        
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) params[key] = decodeURIComponent(value || '');
        });
        
        return params;
    }
    
    // Local storage helpers
    static setLocalStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
    
    static getLocalStorage(key) {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    }
    
    static removeLocalStorage(key) {
        localStorage.removeItem(key);
    }
}

// Export for use in modules
window.GBUtils = GBUtils;
