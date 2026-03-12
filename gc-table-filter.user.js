// ==UserScript==
// @name         Geocaching Table Filter
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Adds inline filtering to Geocaching.com tables (search results and unpublished cache dashboard)
// @copyright    2026, ChristianGK (https://github.com/ChristianGK-GC)
// @author       ChristianGK
// @license      GNU General Public License v3.0
// @match        https://www.geocaching.com/play/results*
// @match        https://www.geocaching.com/play/owner/unpublished*
// @icon         https://www.geocaching.com/favicon.ico
// @homepageURL  https://github.com/ChristianGK-GC/gc-table-filter
// @supportURL   https://github.com/ChristianGK-GC/gc-table-filter/issues
// @updateURL    https://github.com/ChristianGK-GC/gc-table-filter/raw/main/gc-table-filter.user.js
// @downloadURL  https://github.com/ChristianGK-GC/gc-table-filter/raw/main/gc-table-filter.user.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // Field configuration
    const FIELDS = [
        { key: 'name', placeholder: 'Name', gridSize: '2fr', dataKey: 'name' },
        { key: 'type', placeholder: 'Typ', gridSize: '1fr', dataKey: 'typeName' },
        { key: 'owner', placeholder: 'Owner', gridSize: '1fr', dataKey: 'owner' },
        { key: 'code', placeholder: 'Code', gridSize: '0.8fr', dataKey: 'code' },
        { key: 'location', placeholder: 'Location', gridSize: '1fr', dataKey: 'location' }
    ];

    // Available fields
    const availableFields = {};
    FIELDS.forEach(f => availableFields[f.key] = false);

    // CSS
    const styles = `
        .gc-filter-row {
            background: #f5f5f5;
            padding: 12px;
            border: 1px solid #e1e1e1;
            border-radius: 4px;
            margin-bottom: 12px;
        }
        .gc-filter-inputs {
            display: grid;
            gap: 8px;
            margin-bottom: 8px;
        }
        .gc-filter-input {
            padding: 6px 8px;
            border: 1px solid #c7c7c7;
            border-radius: 3px;
            font-size: 13px;
            width: 100%;
            box-sizing: border-box;
        }
        .gc-filter-input:focus {
            outline: none;
            border-color: #007d46;
        }
        .gc-filter-input::placeholder {
            color: #9b9b9b;
            font-size: 12px;
        }
        .gc-filter-stats {
            font-size: 12px;
            color: #4a4a4a;
            margin-top: 4px;
        }
        .gc-hidden-cache {
            display: none !important;
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    function matchesFilter(value, filter) {
        if (!filter) return true;
        
        const strValue = String(value).toLowerCase();
        const strFilter = filter.trim().toLowerCase();
        
        return strValue.includes(strFilter);
    }

    function extractCacheData(item, gcCode) {
        const nameElement = item.querySelector('a[href*="/geocache/"]');
        const text = item.textContent;
        
        return {
            name: nameElement?.textContent?.trim() || '',
            typeName: extractType(item, text),
            owner: extractOwner(item, text),
            code: gcCode,
            location: extractLocation(item)
        };
    }

    // Type detection
    function extractType(item, text) {
        // data-testid attribute
        const testIdElement = item.querySelector('[data-testid^="geocache-icon-"]');
        if (testIdElement) {
            const testId = testIdElement.getAttribute('data-testid');
            const typeMatch = testId.match(/geocache-icon-(.+)/);
            if (typeMatch) {
                const typeName = typeMatch[1];
                // Type mapping
                const typeMap = {
                    'ape': 'Project APE Cache',
                    'block-party': 'Geocaching HQ Block Party',
                    'blockparty': 'Geocaching HQ Block Party',
                    'celebration': 'Geocaching HQ Celebration',
                    'cito': 'Cache In Trash Out Event',
                    'community': 'Community Celebration Event',
                    'earth': 'EarthCache',
                    'earthcache': 'EarthCache',
                    'event': 'Event Cache',
                    'giga': 'Giga-Event',
                    'gigaevent': 'Giga-Event',
                    'gps': 'GPS Adventures Exhibit',
                    'gpsadventure': 'GPS Adventures Exhibit',
                    'hq': 'Geocaching HQ',
                    'letterbox': 'Letterbox Hybrid',
                    'locationless': 'Locationless (Reverse) Cache',
                    'mega': 'Mega-Event',
                    'megaevent': 'Mega-Event',
                    'multi': 'Multi-Cache',
                    'mystery': 'Mystery Cache',
                    'reverse': 'Locationless (Reverse) Cache',
                    'traditional': 'Traditional Cache',
                    'unknown': 'Mystery Cache',
                    'virtual': 'Virtual Cache',
                    'webcam': 'Webcam Cache',
                    'wherigo': 'Wherigo Cache'
                };
                return typeMap[typeName.toLowerCase()] || typeName;
            }
        }
        
        // Regex fallback
        const typePatterns = [
            /CITO/i,
            /Cache In Trash Out® Event/i,
            /Community Celebration Event/i,
            /EarthCache/i,
            /Event Cache/i,
            /GPS Adventures Exhibit/i,
            /Geocaching HQ Block Party/i,
            /Geocaching HQ Cache/i,
            /Geocaching HQ Celebration/i,
            /Giga-Event Cache/i,
            /Letterbox Hybrid/i,
            /Locationless \(Reverse\) Cache/i,
            /Mega-Event Cache/i,
            /Multi-Cache/i,
            /Mystery Cache/i,
            /NGS Benchmark/i,
            /Project APE Cache/i,
            /Traditional Cache/i,
            /Virtual Cache/i,
            /Webcam Cache/i,
            /Wherigo Cache/i
        ];
        
        for (const pattern of typePatterns) {
            const match = text.match(pattern);
            if (match) return match[0];
        }
        
        return '';
    }

    function extractOwner(item, text) {
        const ownerMatch = text.match(/by\s+([^\s,\n]+)/i);
        return ownerMatch ? ownerMatch[1] : '';
    }

    function extractLocation(item) {
        const locationElement = item.querySelector('.location-display');
        return locationElement?.textContent?.trim() || '';
    }

    // Find container
    function getParentContainer(link) {
        let parent = link.closest('li');
        if (!parent) parent = link.closest('tr');
        if (!parent) parent = link.closest('[class*="geocache"]');
        if (!parent) parent = link.closest('[class*="cache"]');
        if (!parent) parent = link.closest('div[class*="item"]');
        if (!parent) parent = link.closest('article');
        
        if (!parent) {
            let current = link.parentElement;
            let depth = 0;
            while (current && depth < 10) {
                if (current.children.length > 3 && current.offsetHeight > 30) {
                    parent = current;
                    break;
                }
                current = current.parentElement;
                depth++;
            }
        }
        
        return (parent && parent !== document.body) ? parent : null;
    }

    function detectAvailableFields() {
        const cacheLinks = document.querySelectorAll('a[href*="/geocache/"]');
        if (cacheLinks.length === 0) return;

        const isUnpublishedPage = window.location.href.includes('/play/owner/unpublished');
        
        // Page
        if (isUnpublishedPage) {
            availableFields.name = true;
            availableFields.type = true;
            availableFields.code = true;
            availableFields.owner = false;
            availableFields.location = false;
        } else {
            const samplesToCheck = Math.min(5, cacheLinks.length);
            
            for (let i = 0; i < samplesToCheck; i++) {
                const link = cacheLinks[i];
                const parent = getParentContainer(link);
                if (!parent) continue;
                
                const text = parent.textContent;
                
                if (link.textContent.trim()) availableFields.name = true;
                if (link.href.match(/\/geocache\/(GC[A-Z0-9]+)/i)) availableFields.code = true;
                if (text.match(/by\s+\w+/i)) availableFields.owner = true;
                if (parent.querySelector('.location-display')) availableFields.location = true;
                
                availableFields.type = true;
            }
        }
    }

    // Create filter UI
    function createFilterRow() {
        const activeFields = FIELDS.filter(f => availableFields[f.key]);
        if (activeFields.length === 0) return null;

        const row = document.createElement('div');
        row.className = 'gc-filter-row';
        
        const inputsContainer = document.createElement('div');
        inputsContainer.className = 'gc-filter-inputs';
        inputsContainer.style.gridTemplateColumns = activeFields.map(f => f.gridSize).join(' ');

        activeFields.forEach(field => {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'gc-filter-input';
            input.id = `gc-filter-${field.key}`;
            input.placeholder = field.placeholder;
            inputsContainer.appendChild(input);
        });

        row.appendChild(inputsContainer);

        const statsDiv = document.createElement('div');
        statsDiv.className = 'gc-filter-stats';
        statsDiv.id = 'gc-filter-stats';
        row.appendChild(statsDiv);

        return row;
    }

    // Apply filters
    function filterCaches() {
        const filters = {};
        FIELDS.forEach(field => {
            const input = document.getElementById(`gc-filter-${field.key}`);
            filters[field.key] = input?.value || '';
        });

        const cacheLinks = document.querySelectorAll('a[href*="/geocache/"]');
        if (cacheLinks.length === 0) return;

        // Collect cache items
        const cacheItems = new Set();
        cacheLinks.forEach(link => {
            const parent = getParentContainer(link);
            if (parent && !parent.querySelector('.gc-filter-row')) {
                cacheItems.add(parent);
            }
        });

        const itemsArray = Array.from(cacheItems);
        let total = itemsArray.length;
        let visible = 0;

        itemsArray.forEach(item => {
            const nameElement = item.querySelector('a[href*="/geocache/"]');
            const hrefMatch = nameElement?.href.match(/\/geocache\/(GC[A-Z0-9]+)/i);
            const gcCode = hrefMatch ? hrefMatch[1].toUpperCase() : '';

            const cacheData = extractCacheData(item, gcCode);
            let matches = true;
            
            FIELDS.forEach(field => {
                if (!availableFields[field.key] || !filters[field.key]) return;
                
                const value = cacheData[field.dataKey || field.key];
                if (!matchesFilter(value, filters[field.key])) {
                    matches = false;
                }
            });

            item.classList.toggle('gc-hidden-cache', !matches);
            if (matches) visible++;
        });

        const statsEl = document.getElementById('gc-filter-stats');
        if (statsEl) {
            statsEl.textContent = `Zeige ${visible} von ${total} Geocaches`;
        }
    }

    function initFilter() {
        detectAvailableFields();

        if (!Object.values(availableFields).some(v => v)) {
            return;
        }

        const filterRow = createFilterRow();
        
        if (!filterRow) {
            return;
        }
        
        const insertionPoints = [
            { selector: '.view-controls'     , method: 'after' },
            { selector: '.front-matter'      , method: 'prepend' },
            { selector: '.section-content'   , method: 'prepend' },
            { selector: 'section.cache-table', method: 'prepend' },
            { selector: '.page-container'   , method: 'prepend' }
        ];

        let inserted = false;
        for (const { selector, method } of insertionPoints) {
            const point = document.querySelector(selector);
            if (point) {
                if (method === 'after' && point.parentNode) {
                    point.parentNode.insertBefore(filterRow, point.nextSibling);
                } else if (method === 'prepend') {
                    point.insertBefore(filterRow, point.firstChild);
                }
                
                inserted = true;
                break;
            }
        }

        if (!inserted) {
            document.body.insertBefore(filterRow, document.body.firstChild);
        }

        // Event listeners
        FIELDS.forEach(field => {
            if (availableFields[field.key]) {
                const input = document.getElementById(`gc-filter-${field.key}`);
                input?.addEventListener('input', filterCaches);
            }
        });

        setTimeout(filterCaches, 500);
    }

    // Wait for DOM
    function waitForCaches() {
        const selectors = [
            '.section-content',
            'section.cache-table',
            '.page-container',
            'main'
        ];
        
        let contentArea = null;
        for (const selector of selectors) {
            contentArea = document.querySelector(selector);
            if (contentArea) {
                break;
            }
        }
        
        if (!contentArea) {
            setTimeout(waitForCaches, 500);
            return;
        }

        let items = document.querySelectorAll('a[href*="/geocache/"]');
        
        if (items.length === 0) {
            setTimeout(waitForCaches, 500);
            return;
        }

        initFilter();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(waitForCaches, 1000));
    } else {
        setTimeout(waitForCaches, 1000);
    }

})();
