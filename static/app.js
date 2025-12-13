/**
 * ============================================================================
 * FACADE REPORT GENERATOR - MAIN APPLICATION SCRIPT
 * Last Updated: December 10, 2025
 * ============================================================================
 * 
 * TABLE OF CONTENTS:
 * 1. Theme Management
 * 2. Tab Navigation System
 * 3. Configuration & Constants (Profile Fields, Placeholders)
 * 4. Dynamic Form Field Management
 * 5. Dynamic List Management
 * 6. YAML Operations (Import, Generate, Download)
 * 7. Report Generation
 * 8. Figure Status Checker
 * 9. Input Helper Modal
 * 10. Initialization
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // ========================================================================
    // 1. THEME MANAGEMENT
    // ========================================================================
    
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    const body = document.body;

    /**
     * Set theme and persist to localStorage
     * @param {string} theme - 'light' or 'dark'
     */
    function setTheme(theme) {
        const isDark = theme === 'dark';
        body.classList.toggle('dark-theme', isDark);
        if (sunIcon && moonIcon) {
            sunIcon.classList.toggle('hidden', !isDark);
            moonIcon.classList.toggle('hidden', isDark);
        }
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    // Initialize theme from localStorage or default to 'light'
    const currentTheme = localStorage.getItem('theme') || 'light';
    setTheme(currentTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const nextTheme = body.classList.contains('dark-theme') ? 'light' : 'dark';
            setTheme(nextTheme);
        });
    }

    
    // ========================================================================
    // 2. TAB NAVIGATION SYSTEM
    // ========================================================================
    
    const tabs = document.querySelectorAll('.tab_btn');
    const all_content = document.querySelectorAll('.content');
    const line = document.querySelector('.line');

    // Initialize active tab indicator
    const activeTab = document.querySelector('.tab_btn.active');
    if (activeTab && line) {
        line.style.width = `${activeTab.offsetWidth}px`;
        line.style.left = `${activeTab.offsetLeft}px`;
    }

    // Tab click handlers
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', (e) => {
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update indicator line
            if (line) {
                line.style.width = `${e.target.offsetWidth}px`;
                line.style.left = `${e.target.offsetLeft}px`;
            }

            // Show corresponding content
            all_content.forEach(content => content.classList.remove('active'));
            if (all_content[index]) {
                all_content[index].classList.add('active');
            }
        });
    });

    // ========================================================================
    // 3. CONFIGURATION & CONSTANTS
    // ========================================================================
    
    // --- Aluminum Profile Configuration ---
    const alumFields = {
        'Manual': [
            'profile_name', 'web_length', 'flange_length', 'web_thk', 'flange_thk', 'tor_constant',
            'area', 'I_xx', 'I_yy', 'Y', 'X', 'plastic_x', 'plastic_y', 'F_y', 'Mn_yield', 'Mn_lb'
        ],
        'Pre-defined': ['profile_name'],
        'Stick': ['profile_name', 'web_length', 'flange_length', 'web_thk', 'flange_thk', 'F_y']
    };

    const alumProfileOptions = [
        'M 125x60x2.5',
        'M 125x60x3',
        'M 140x60x2.5',
        'M 135x67x4',
        'M 145x67x2.5',
        'M 145x67x3',
        'M 145x67x3.5',
        'M 145x80x3',
        'M 150x80x3',
        'M 160x80x8',
        'M 240x80x12',
        'M 145x90x3',
        'M 185x90x3',
        'M 200x72x3',
        'T 125x60x2.5',
        'T 135x67x2.5',
        'T 145x67x2',
        'T 125x80x2.5',
        'T 125x90x2.5',
        'T 65x72x3'
    ];

    const alumFieldPlaceholders = {
        'profile_name': 'Profile Name (e.g. M or St. M 125x60x2.5)',
        'web_length': 'Web Length (mm)',
        'flange_length': 'Flange Length (mm)',
        'web_thk': 'Web Thickness (mm)',
        'flange_thk': 'Flange Thickness (mm)',
        'tor_constant': 'Torsional Constant (mm⁴)',
        'area': 'Area (mm²)',
        'I_xx': 'Moment of Inertia about Major Axis, Ixx (mm⁴)',
        'I_yy': 'Moment of Inertia about Minor Axis, Iyy (mm⁴)',
        'Y': 'Extreme Fibre Distance, Y (mm)',
        'X': 'Extreme Fibre Distance, X (mm)',
        'plastic_x': 'Upper Region Centroid Distance, Plastic X',
        'plastic_y': 'Lower Region Centroid Distance, Plastic Y',
        'F_y': 'Yield Strength, Fy (MPa)',
        'Mn_yield': 'Moment Capacity by Yielding, Mn (kNm)',
        'Mn_lb': 'Moment Capacity by Local Buckling, Mn (kNm)',
    };


    // --- Glass Unit Configuration ---
    const glassFields = {
        'sgu': ['length', 'width', 'thickness', 'grade', 'wind_load', 'support_type', 'nfl', 'gtf', 'load_x_area2', 'def'],
        'dgu': [
            'length', 'width', 'thickness1', 'gap', 'thickness2', 'grade1', 'grade2', 'wind_load', 'support_type', 
            'nfl1', 'nfl2', 'gtf1', 'gtf2', 'load1_x_area2', 'load2_x_area2', 'def1', 'def2'
        ],
        'lgu': [
            'length', 'width', 'thickness1', 'thickness_inner', 'thickness2', 'chart_thickness', 'grade', 'wind_load',
            'support_type', 'nfl', 'gtf', 'load_x_area2', 'def'
        ],
        'ldgu': [
            'length', 'width', 'thickness1_1', 'thickness_inner', 'thickness1_2', 'chart_thickness', 'gap', 'thickness2',
            'grade1', 'grade2', 'wind_load', 'support_type', 'nfl1', 'nfl2', 'gtf1', 'gtf2', 'load1_x_area2', 'load2_x_area2', 'def1', 'def2'
        ]
    };

    const glassGradeOptions = ['FT', 'HS', 'AN'];
    const supportTypeOptions = ['Four Edges', 'Three Edges', 'Two Edges', 'One Edge', 'Point Fixed'];

    const glassFieldPlaceholders = {
        'length': 'Glass Length (mm)',
        'width': 'Glass Width (mm)',
        'thickness': 'Thickness (mm)',
        'thickness1': 'Outer Panel Thickness (mm)',
        'thickness2': 'Inner Panel Thickness (mm)',
        'thickness1_1': '1st Lite Thickness of Outer panel (mm)',
        'thickness1_2': '2nd Lite Thickness of Outer panel (mm)',
        'thickness_inner': 'Interlayer Thickness (mm)',
        'chart_thickness': 'Chart Thickness (mm)',
        'wind_load': 'Wind Load (kPa)',
        'gap': 'Gap Between Panels (mm)',
        'nfl': 'Non-factored Load, NFL (kPa)',
        'nfl1': 'Non-factored Load of Outer Panel, NFL1 (kPa)',
        'nfl2': 'Non-factored Load of Inner Panel, NFL2 (kPa)',
        'gtf': 'Glass Type Factor, GTF',
        'gtf1': 'Glass Type Factor of Outer Panel, GTF1',
        'gtf2': 'Glass Type Factor of Inner Panel, GTF2',
        'load_x_area2': 'Load × Area², 0.7Pz x A² (kNm²)',
        'load1_x_area2': 'Load × Area², 0.7q1 x A² (kNm²)',
        'load2_x_area2': 'Load × Area², 0.7q2 x A² (kNm²)',
        'def': 'Deflection (mm)',
        'def1': 'Outer Panel Deflection (mm)',
        'def2': 'Inner Panel Deflection (mm)'
    };
    
    // --- Frame Configuration ---
    const frameFields = {
        'Aluminum Only': [
            'length', 'width', 'tran_spacing', 'glass_thk', 'wind_pos', 'wind_neg',
            'mullion', 'mul_mu', 'mul_vu', 'mul_def', 'mul_phi_Mn',
            'transom', 'tran_mu', 'tran_vu', 'tran_def_wind', 'tran_def_dead', 'tran_phi_Mn'
        ],
        'Aluminum + Steel': [
            'length', 'width', 'tran_spacing', 'glass_thk', 'wind_pos', 'wind_neg',
            'mullion', 'I_xa', 'I_xs', 'mul_mu', 'mul_vu', 'mul_def', 'mul_phi_Mn_a', 'mul_phi_Mn_s',
            'transom', 'tran_mu', 'tran_vu', 'tran_def_wind', 'tran_def_dead', 'tran_phi_Mn'
        ]
    };

    const frameFieldPlaceholders = {
        'length': 'Mullion Length (mm)',
        'width': 'Transom Length (mm)',
        'tran_spacing': 'Transom Spacing (mm)',
        'glass_thk': 'Glass Thickness (mm)',
        'wind_pos': 'Wind Load (+ve) (kPa)',
        'wind_neg': 'Wind Load (-ve) (kPa)',
        'mullion': 'Mullion Name (e.g. M 125x60x2.5 or [+RHS 3])',
        'I_xa': 'Moment of Inertia of Aluminum, Ixa (mm⁴)',
        'I_xs': 'Moment of Inertia of Steel, Ixs (mm⁴)',
        'mul_mu': 'Mullion Max. Moment, Mu (kNm)',
        'mul_vu': 'Mullion Max. Shear, Vu (kN)',
        'mul_def': 'Mullion Max. Deflection, δ (mm)',
        'mul_phi_Mn': 'Mullion Moment Capacity, φMn (kNm)',
        'mul_phi_Mn_a': 'Mullion (Aluminum) Moment Capacity, φMna (kNm)',
        'mul_phi_Mn_s': 'Mullion (Steel) Moment Capacity, φMns (kNm)',
        'transom': 'Transom Name (e.g. T 125x60x2.5)',
        'tran_mu': 'Transom Max. Moment, Mu (kNm)',
        'tran_vu': 'Transom Max. Shear, Vu (kN)',
        'tran_def_wind': 'Transom Max. Deflection (wind), δw (mm)',
        'tran_def_dead': 'Transom Max. Deflection (dead), δd (mm)',
        'tran_phi_Mn': 'Transom Moment Capacity, φMn (kNm)'
    };

    // --- Anchorage Configuration ---
    const anchorageFields = {
        'Box Clump': [
            'reaction_Ry', 'reaction_Rz','anchor_nos', 'anchor_dia', 'embed_depth',
            'C_a1', 'h_a', 'bp_length_N', 'bp_width_B', 'bp_thk', 'bp_b'
        ],
        'U Clump': [
            'reaction_Ry', 'reaction_Rz','anchor_nos', 'anchor_dia', 'embed_depth', 'C_a1', 
            'thr_bolt_dia', 'fin_thk', 'fin_e', 'bp_length_N', 'bp_width_B', 'bp_thk', 'bp_d'
        ],
        'L Clump Top': [
            'reaction_Ry', 'reaction_Rz', 'anchor_nos', 'anchor_dia', 'embed_depth',
            'C_a1', 'h_a', 'bp_length_N', 'bp_width_B', 'bp_thk'
        ],
        'L Clump Front': [
            'anchor_nos', 'anchor_dia', 'embed_depth', 'C_a1', 'thr_bolt_dia', 'fin_thk',
            'fin_e', 'bp_length_N', 'bp_width_B', 'bp_thk', 'bp_d'
        ]
    };

    const anchorageFieldPlaceholders = {
        'reaction_Ry': 'Horizontal Reaction, Ry (kN)',
        'reaction_Rz': 'Vertical Reaction, Rz (kN)',
        'anchor_nos': 'No. of Anchor bolt, n',
        'anchor_dia': 'Diameter of Anchor bolt, da (mm)',
        'embed_depth': 'Embed. Depth of Anchor, hef (mm)',
        'C_a1': 'Edge Distance, Ca1 (mm)',
        'h_a': 'Depth of Concrete Member, ha (mm)',
        'thr_bolt_dia': 'Diameter of Through bolt, db (mm)',
        'fin_thk': 'Thickness of Fin Plate (mm)',
        'fin_e': 'Eccentricity, e (mm)',
        'bp_length_N': 'Length of Base Plate, N (mm)',
        'bp_width_B': 'Width of Base Plate, B (mm)',
        'bp_thk': 'Thickness of Base Plate, t (mm)',
        'bp_d': 'Fin-to-fin distance, d (mm)',
        'bp_b': 'Width of flange, b'
    };
    
    
    // ========================================================================
    // 4. DYNAMIC FORM FIELD MANAGEMENT
    // ========================================================================
    
    /**
     * Update aluminum profile fields based on selected type
     * @param {HTMLElement} alumItem - The aluminum profile item container
     */
    function updateAlumFields(alumItem) {
        const typeSelect = alumItem.querySelector('select[name="profile_type"]');
        const fieldsContainer = alumItem.querySelector('.item-fields');
        const selectedType = typeSelect.value;
        
        let requiredFields = alumFields[selectedType] || [];
        
        fieldsContainer.innerHTML = '';

        requiredFields.forEach(fieldName => {
            let type = 'number';
            if (fieldName.match(/(profile_name)/i)) {
                type = 'text';
            }
            
            let input;
            
            // Create dropdown for pre-defined profiles
            if (selectedType === 'Pre-defined' && fieldName === 'profile_name') {
                input = document.createElement('select');
                input.name = fieldName;
                alumProfileOptions.forEach(option => {
                    const opt = document.createElement('option');
                    opt.value = option;
                    opt.textContent = option;
                    input.appendChild(opt);
                });
            }
            // Create text or number input for other fields
            else {
                input = document.createElement('input');
                input.type = type;
                input.step = '0.1';
                input.name = fieldName;
                input.placeholder = alumFieldPlaceholders[fieldName] || fieldName;
            }
            
            fieldsContainer.appendChild(input);
        });
    }
    
    /**
     * Update glass unit fields based on selected glass type
     * @param {HTMLElement} glassItem - The glass unit item container
     */
    function updateGlassFields(glassItem) {
        const typeSelect = glassItem.querySelector('select[name="glass_type"]');
        const fieldsContainer = glassItem.querySelector('.item-fields');
        const selectedType = typeSelect.value;
        
        let requiredFields = glassFields[selectedType] || [];
        
        fieldsContainer.innerHTML = '';

        requiredFields.forEach(fieldName => {
            let type = 'text'; 
            if (fieldName.match(/(thickness|def|load|gap|nfl|gtf)/i)) {
                type = 'number';
            }
            
            let input;
            
            // Create dropdown for glass grade
            if (fieldName.match(/^grade/i)) {
                input = document.createElement('select');
                input.name = fieldName;
                glassGradeOptions.forEach(option => {
                    const opt = document.createElement('option');
                    opt.value = option;
                    opt.textContent = option;
                    input.appendChild(opt);
                });
            }
            // Create dropdown for support type
            else if (fieldName === 'support_type') {
                input = document.createElement('select');
                input.name = fieldName;
                supportTypeOptions.forEach(option => {
                    const opt = document.createElement('option');
                    opt.value = option;
                    opt.textContent = option;
                    input.appendChild(opt);
                });
            }
            // Create text or number input for other fields
            else {
                input = document.createElement('input');
                input.type = type;
                input.step = '0.1';
                input.name = fieldName;
                input.placeholder = glassFieldPlaceholders[fieldName] || fieldName;
            }
            
            fieldsContainer.appendChild(input);
        });
    }
    
    /**
     * Update frame fields based on selected mullion type
     * @param {HTMLElement} frameItem - The frame item container
     */
    function updateFrameFields(frameItem) {
        const typeSelect = frameItem.querySelector('select[name="mullion_type"]');
        const fieldsContainer = frameItem.querySelector('.item-fields');
        const selectedType = typeSelect.value;
        
        let requiredFields = frameFields[selectedType] || [];
        
        fieldsContainer.innerHTML = '';

        requiredFields.forEach(fieldName => {
            let type = 'number'; 
            if (fieldName.match(/(_type|zone|mullion|transom)/i)) {
                type = 'text';
            }
            
            const input = document.createElement('input');
            input.type = type;
            input.step = '0.1';
            input.name = fieldName;
            input.placeholder = frameFieldPlaceholders[fieldName] || fieldName;
            
            fieldsContainer.appendChild(input);
        });
    }

    /**
     * Update anchorage fields based on selected clump type
     * @param {HTMLElement} anchorageItem - The anchorage item container
     */
    function updateAnchorageFields(anchorageItem) {
        // Target the SELECT element
        const typeSelect = anchorageItem.querySelector('select[name="clump_type"]');
        const fieldsContainer = anchorageItem.querySelector('.item-fields');
        const selectedType = typeSelect.value;
        
        let requiredFields = anchorageFields[selectedType] || [];
        
        fieldsContainer.innerHTML = ''; 

        requiredFields.forEach(fieldName => {
            let type = 'number'; 
            // Broad matching for number types in structural/clump fields
            if (fieldName.match(/(clump_type)/i)) {
                type = 'text';
            }

            const input = document.createElement('input');
            input.type = type;
            input.step = '0.1';
            input.name = fieldName;
            input.placeholder = anchorageFieldPlaceholders[fieldName] || fieldName;
            
            fieldsContainer.appendChild(input);
        });
    }


    // ========================================================================
    // 5. DYNAMIC LIST MANAGEMENT
    // ========================================================================

    /**
     * Setup event handlers for nested add buttons within a category
     * @param {HTMLElement} newElement - The newly created category element
     */
    function setupNestedHandlers(newElement) {
        const nestedAddBtns = newElement.querySelectorAll('.add-btn.sub-add-btn');
        nestedAddBtns.forEach(btn => {
            const listName = btn.getAttribute('data-sub-list-name'); 
            const subTemplateId = btn.getAttribute('data-template');
            
            const subListElement = newElement.querySelector(`.dynamic-list[data-list-name="${listName}"]`);
            
            btn.addEventListener('click', () => {
                if (subListElement && subTemplateId) {
                    addItem(subListElement, subTemplateId);
                } else {
                    console.error('Could not find sub-list element or template ID for list:', listName, 'Template:', subTemplateId);
                }
            });
        });
    }

    /**
     * Add a new item to a dynamic list from a template
     * @param {HTMLElement} listElement - The list container element
     * @param {string} templateId - ID of the template to clone
     */
    function addItem(listElement, templateId) {
        const template = document.getElementById(templateId);
        if (!template) return;

        const newElement = template.content.cloneNode(true).firstElementChild;
        
        // Attach remove button listener
        const removeBtn = newElement.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.target.closest('.dynamic-item').remove();
            });
        }
        
        // Handle type-specific field updates
        if (templateId === 'alum-profile-template') {
            const alumItem = newElement;
            const typeSelect = alumItem.querySelector('select[name="profile_type"]');
            
            updateAlumFields(alumItem);
            typeSelect.addEventListener('change', () => updateAlumFields(alumItem));
        }
        
        // Handle glass type changes
        if (templateId === 'glass-unit-template') {
            const glassItem = newElement;
            const typeSelect = glassItem.querySelector('select[name="glass_type"]');
            
            updateGlassFields(glassItem);
            typeSelect.addEventListener('change', () => updateGlassFields(glassItem));
        }
        
        // Handle frame/mullion type changes
        if (templateId === 'frame-template') {
            const frameItem = newElement;
            const typeSelect = frameItem.querySelector('select[name="mullion_type"]');
            
            updateFrameFields(frameItem);
            typeSelect.addEventListener('change', () => updateFrameFields(frameItem));
        }

        // Handle anchorage/clump type changes
        if (templateId === 'anchorage-template') {
        const anchorageItem = newElement;
            const typeSelect = anchorageItem.querySelector('select[name="clump_type"]');
            
            updateAnchorageFields(anchorageItem);
            typeSelect.addEventListener('change', () => updateAnchorageFields(anchorageItem));
        }

        // Initialize nested handlers for category templates
        if (templateId === 'category-template') {
            setupNestedHandlers(newElement);
        }

        // Attach any top-level add buttons inside the template clone so those buttons work when cloned
        const innerAddBtns = newElement.querySelectorAll('.add-btn[data-list]');
        innerAddBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const listId = btn.getAttribute('data-list');
                const subTemplateId = btn.getAttribute('data-template');
                const targetListElement = document.getElementById(listId);
                if (targetListElement && subTemplateId) {
                    addItem(targetListElement, subTemplateId);
                } else {
                    console.error('Could not find target list or template for inner add button:', listId, subTemplateId);
                }
            });
        });

        // Append the new item to the list
        listElement.appendChild(newElement);
    }
    
    // Attach event listeners to all top-level 'Add' buttons
    document.querySelectorAll('.add-btn[data-list]').forEach(button => {
        button.addEventListener('click', () => {
            const listId = button.getAttribute('data-list');
            const templateId = button.getAttribute('data-template');
            const listElement = document.getElementById(listId);

            if (listElement && templateId) {
                addItem(listElement, templateId);
            }
        });
    });

    
    // ========================================================================
    // 6. YAML OPERATIONS (IMPORT, GENERATE, DOWNLOAD)
    // ========================================================================
    
    // --- Initialization & DOM References ---
    const form = document.getElementById('yaml-form');
    
    // Initialize with default items
    addItem(document.getElementById('alum-profiles-list'), 'alum-profile-template');
    addItem(document.getElementById('steel-profiles-list'), 'steel-profile-template');
    addItem(document.getElementById('categories-list'), 'category-template');
    
    // Initialize the nested items of the first category
    const initialCategory = document.querySelector('.category-item');
    if (initialCategory) {
        const categorySubLists = [
            { listName: 'glass_units', template: 'glass-unit-template' },
            { listName: 'frames', template: 'frame-template' },
            { listName: 'connections', template: 'connection-template' }, 
            { listName: 'anchorage', template: 'anchorage-template' }
        ];

        categorySubLists.forEach(sub => {
            const listElement = initialCategory.querySelector(`.dynamic-list[data-list-name="${sub.listName}"]`);
            if (listElement) {
                addItem(listElement, sub.template);
            }
        });
    }

    // Button references
    const loadBtn = document.getElementById('load-yaml-btn');
    const yamlFileInput = document.getElementById('yaml-file-input');
    const generateBtn = document.getElementById('generate-yaml-btn');
    const downloadBtn = document.getElementById('download-yaml-btn');
    const reportBtn = document.getElementById('generate-report-btn');
    const yamlOutputDisplay = document.getElementById('yaml-output-display');
    const statusEl = document.getElementById('status-notification');

    /**
     * Set status notification with appropriate styling
     * @param {string} text - Status message to display
     * @param {string} cls - CSS class for styling ('processing', 'success', 'error')
     */
    function setStatus(text, cls = '') {
        if (!statusEl) return;
        statusEl.textContent = text;
        statusEl.className = 'status' + (cls ? ' ' + cls : '');
    }


    // --- YAML Import & Form Population ---
    function parseYamlOrJson(rawText) {
        // Prefer YAML parsing; fallback to JSON if the library is missing
        if (window.jsyaml && typeof window.jsyaml.load === 'function') {
            return window.jsyaml.load(rawText);
        }
        return JSON.parse(rawText);
    }

    function setSimpleGroupValues(groupData, prefix) {
        if (!groupData) return;
        Object.entries(groupData).forEach(([key, value]) => {
            const field = form.querySelector(`[name="${prefix}.${key}"]`);
            if (field) {
                if (value === null || value === undefined) {
                    field.value = '';
                    return;
                }
                
                // For select elements, try to match the value with available options
                if (field.tagName === 'SELECT') {
                    const stringValue = String(value);
                    const options = Array.from(field.options).map(o => o.value);
                    
                    // Try exact match first
                    if (options.includes(stringValue)) {
                        field.value = stringValue;
                    } else {
                        // Try numeric comparison for numeric values
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                            const matchingOption = options.find(opt => parseFloat(opt) === numValue);
                            if (matchingOption) {
                                field.value = matchingOption;
                            }
                        }
                    }
                } else {
                    field.value = String(value);
                }
            }
        });
    }

    function fillFields(container, values = {}, skipKeys = new Set()) {
        Object.entries(values).forEach(([name, value]) => {
            if (skipKeys.has(name)) return;
            const input = container.querySelector(`[name="${name}"]`);
            if (input) {
                input.value = value ?? '';
            }
        });
    }

    function populateProfileList(listId, templateId, items = [], typeFieldName = null) {
        const list = document.getElementById(listId);
        if (!list) return;
        list.innerHTML = '';

        const payload = items.length ? items : [{}];
        payload.forEach(itemData => {
            addItem(list, templateId);
            const newItem = list.lastElementChild;
            if (!newItem) return;

            // Set type first so dependent fields render before filling values
            if (typeFieldName && itemData[typeFieldName]) {
                const typeSelect = newItem.querySelector(`[name="${typeFieldName}"]`);
                if (typeSelect) {
                    typeSelect.value = itemData[typeFieldName];
                    typeSelect.dispatchEvent(new Event('change'));
                }
            }

            const skipKeys = new Set(typeFieldName ? [typeFieldName] : []);
            fillFields(newItem, itemData, skipKeys);
        });
    }

    function hydrateGlassItem(glassItem, data = {}) {
        const typeSelect = glassItem.querySelector('select[name="glass_type"]');
        if (typeSelect) {
            if (data.glass_type) {
                typeSelect.value = data.glass_type;
            }
            typeSelect.dispatchEvent(new Event('change'));
        }
        fillFields(glassItem, data, new Set(['glass_type']));
    }

    function hydrateFrameItem(frameItem, data = {}) {
        const typeSelect = frameItem.querySelector('select[name="mullion_type"]');
        if (typeSelect) {
            if (data.mullion_type) {
                typeSelect.value = data.mullion_type;
            }
            typeSelect.dispatchEvent(new Event('change'));
        }
        fillFields(frameItem, data, new Set(['mullion_type']));
    }

    function hydrateAnchorageItem(anchorageItem, data = {}) {
        const typeSelect = anchorageItem.querySelector('select[name="clump_type"]');
        if (typeSelect) {
            if (data.clump_type) {
                typeSelect.value = data.clump_type;
            }
            typeSelect.dispatchEvent(new Event('change'));
        }
        fillFields(anchorageItem, data, new Set(['clump_type']));
    }

    function populateCategorySublist(categoryElement, listName, templateId, items, hydrateFn = null) {
        const subList = categoryElement.querySelector(`.dynamic-list[data-list-name="${listName}"]`);
        if (!subList) return;

        subList.innerHTML = '';
        const payload = items && items.length ? items : [{}];

        payload.forEach(itemData => {
            addItem(subList, templateId);
            const newItem = subList.lastElementChild;
            if (!newItem) return;

            if (hydrateFn) {
                hydrateFn(newItem, itemData || {});
            } else {
                fillFields(newItem, itemData || {});
            }
        });
    }

    function populateCategories(categories = []) {
        const list = document.getElementById('categories-list');
        if (!list) return;

        list.innerHTML = '';
        const payload = categories.length ? categories : [{}];

        payload.forEach(catData => {
            addItem(list, 'category-template');
            const categoryElement = list.lastElementChild;
            if (!categoryElement) return;

            const nameInput = categoryElement.querySelector('input[name="category_name"]');
            if (nameInput) {
                nameInput.value = (catData && catData.category_name) || nameInput.value || '';
            }

            populateCategorySublist(categoryElement, 'glass_units', 'glass-unit-template', catData.glass_units, hydrateGlassItem);
            populateCategorySublist(categoryElement, 'frames', 'frame-template', catData.frames, hydrateFrameItem);
            populateCategorySublist(categoryElement, 'connections', 'connection-template', catData.connections);
            populateCategorySublist(categoryElement, 'anchorage', 'anchorage-template', catData.anchorage, hydrateAnchorageItem);
        });
    }

    function populateFormFromData(data = {}) {
        setSimpleGroupValues(data.project_info || {}, 'project_info');
        setSimpleGroupValues(data.wind || {}, 'wind');

        populateProfileList('alum-profiles-list', 'alum-profile-template', data.alum_profiles || [], 'profile_type');
        populateProfileList('steel-profiles-list', 'steel-profile-template', data.steel_profiles || []);

        populateCategories(data.categories || []);
    }

    if (loadBtn && yamlFileInput) {
        loadBtn.addEventListener('click', () => yamlFileInput.click());

        yamlFileInput.addEventListener('change', (event) => {
            const file = event.target.files && event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const parsed = parseYamlOrJson(reader.result) || {};
                    populateFormFromData(parsed);
                    setStatus('YAML loaded into form', 'success');
                } catch (err) {
                    console.error('Failed to parse YAML:', err);
                    setStatus('Failed to load file: ' + err.message, 'error');
                } finally {
                    yamlFileInput.value = '';
                }
            };
            reader.onerror = () => {
                setStatus('Could not read the file.', 'error');
            };
            reader.readAsText(file);
        });
    }


    // --- YAML Generation & Export ---
    
    /**
     * Extract all form data into a structured object
     * @param {HTMLFormElement} form - The form element
     * @returns {Object} Structured form data
     */
    function getFormData(form) {
        const data = {};
    
        // Helper function to process simple inputs (e.g., project_info, wind, glass, connection, anchorage)
        const processSimpleInputs = (selector, rootKey) => {
            const inputs = form.querySelectorAll(selector);
            inputs.forEach(input => {
                const path = input.name.split('.'); 
                let current = data;
                for (let i = 0; i < path.length - 1; i++) {
                    const key = path[i];
                    if (!current[key]) {
                        current[key] = {};
                    }
                    current = current[key];
                }
    
                // Directly assign the input value without formatting
                current[path[path.length - 1]] = input.value;
            });
        };
    
        // 1. Get Project Info (Will remain as strings)
        processSimpleInputs('[name^="project_info."]', 'project_info');
    
        // 2. Get Profiles
        function getProfileData(listId, keyName) {
            const list = document.getElementById(listId);
            const items = list.querySelectorAll('.dynamic-item');
            data[keyName] = Array.from(items).map(item => {
                const profile = {};
                item.querySelectorAll('input, select, textarea').forEach(input => {
                    // Directly assign the input value without formatting
                    profile[input.name] = input.value;
                });
                return profile;
            });
        }
        getProfileData('alum-profiles-list', 'alum_profiles')
        getProfileData('steel-profiles-list', 'steel_profiles');
    
        // 3. Get Wind Parameters
        processSimpleInputs('[name^="wind."]', 'wind');
    
        // 4. Get Categories
        const categoriesList = document.getElementById('categories-list');
        const categoryItems = categoriesList.querySelectorAll('.category-item');
        data.categories = Array.from(categoryItems).map(categoryItem => {
            const category = {};
    
            const nameInput = categoryItem.querySelector('input[name="category_name"]');
            category.category_name = nameInput ? nameInput.value : 'Unnamed Category';
    
            function getNestedListData(parentElement, listName) {
                const nestedList = parentElement.querySelector(`.dynamic-list[data-list-name="${listName}"]`);
                if (!nestedList) return [];
    
                const nestedItems = nestedList.querySelectorAll('.dynamic-item');
                return Array.from(nestedItems).map(item => {
                    const itemData = {};
                    item.querySelectorAll('input, select, textarea').forEach(input => {
                        // Directly assign the input value without formatting
                        itemData[input.name] = input.value;
                    });
                    return itemData;
                });
            }
    
            category.glass_units = getNestedListData(categoryItem, 'glass_units');
            category.frames = getNestedListData(categoryItem, 'frames');
            category.connections = getNestedListData(categoryItem, 'connections');
            category.anchorage = getNestedListData(categoryItem, 'anchorage');
    
            return category;
        });
    
        return data;
    }

    /**
     * Convert JavaScript object to YAML string format
     * @param {Object} obj - Object to convert
     * @param {number} indent - Current indentation level
     * @returns {string} YAML formatted string
     */
    function toYamlString(obj, indent = 0) {
        let yaml = '';
        const spaces = '  '.repeat(indent);

        for (const key in obj) {
            if (!obj.hasOwnProperty(key)) continue;

            const value = obj[key];
            if (Array.isArray(value)) {
                yaml += `${spaces}${key}:\n`;
                value.forEach(item => {
                    // Check if item is a non-empty object
                    if (typeof item === 'object' && item !== null && Object.keys(item).length > 0) {
                        yaml += `${spaces}- ${toYamlString(item, indent + 1).trimStart()}\n`;
                    } else {
                        yaml += `${spaces}- {}\n`;
                    }
                });
            } else if (typeof value === 'object' && value !== null) {
                // Check if the object is non-empty before adding the colon
                if (Object.keys(value).length > 0) {
                    yaml += `${spaces}${key}:\n${toYamlString(value, indent + 1)}`;
                } else {
                    yaml += `${spaces}${key}: {}\n`;
                }
            } else {
                let formattedValue = value;
                if (typeof value === 'string') {
                    // Handle multi-line strings or strings with specific characters (like <br> in your wind note)
                    if (value.includes('\n') || value.includes(': ') || value.includes('<br>')) {
                        // Use the YAML literal block scalar | and clean up <br> to newlines for display
                        const cleanValue = value.replace(/<br>/g, '\n').split('\n').map(line => `${'  '.repeat(indent + 1)}${line}`).join('\n');
                        formattedValue = `|-\n${cleanValue}`;
                    } else if (value.length > 50 || value.match(/[^a-zA-Z0-9.\s]/)) {
                        formattedValue = `'${value.replace(/'/g, "''")}'`;
                    }
                }
                yaml += `${spaces}${key}: ${formattedValue}\n`;
            }
        }
        return yaml;
    }

    /**
     * Handles the client-side download of the YAML content.
     * @param {string} yamlContent The YAML string to download.
     * @param {string} filename The desired name for the downloaded file.
     */
    function downloadYaml(yamlContent, filename = 'data.yaml') {
        const blob = new Blob([yamlContent], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Event: Generate YAML button
    generateBtn.addEventListener('click', () => {
        const formData = getFormData(form);
        const yamlOutput = toYamlString(formData);
        
        yamlOutputDisplay.textContent = yamlOutput;
        
        // Enable download button only when content is generated
        if (yamlOutput.trim()) {
            downloadBtn.disabled = false;
            // Store the content for the download listener to use
            downloadBtn.setAttribute('data-yaml-content', yamlOutput);
        } else {
            downloadBtn.disabled = true;
            downloadBtn.removeAttribute('data-yaml-content');
        }
    });

    
    // ========================================================================
    // 7. REPORT GENERATION
    // ========================================================================
    
    // Event: Generate Report button
    reportBtn.addEventListener('click', () => {
        const formData = getFormData(form);
        const yamlContent = toYamlString(formData);

        // Display the generated YAML for user feedback
        yamlOutputDisplay.textContent = yamlContent;

        // Update UI: show processing and disable buttons
        setStatus('Processing...', 'processing');
        generateBtn.disabled = true;
        reportBtn.disabled = true;

        // Execute report generation and handle status updates in the async function
        callPythonToGenerateReport(yamlContent)
            .then(() => {
                setStatus('Report generated successfully!', 'success');
            })
            .catch((err) => {
                setStatus('Failed: ' + (err && err.message ? err.message : err), 'error');
            })
            .finally(() => {
                // Re-enable after a short delay so user sees the result
                setTimeout(() => {
                    generateBtn.disabled = false;
                    reportBtn.disabled = false;
                }, 900);
            });
    });

    /**
     * Call backend API to generate PDF report from YAML content
     * @param {string} yamlContent - YAML formatted string
     * @returns {Promise} Promise that resolves when report is downloaded
     */
    function callPythonToGenerateReport(yamlContent) {
        // Return the fetch promise so the caller can await/chain
        return fetch('/generate_report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ yaml_content: yamlContent })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errJson => {
                    const msg = errJson && errJson.error ? errJson.error : `Server responded with ${response.status}`;
                    throw new Error(msg);
                }).catch(() => {
                    throw new Error(`Server responded with ${response.status}`);
                });
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Try to set filename from YAML project name (optional)
            let suggestedName = 'report.pdf';
            try {
                const firstPart = yamlContent.split('\n').find(line => line.trim().startsWith('project_info.project_name:'));
                if (firstPart) {
                    suggestedName = firstPart.split(':').slice(1).join(':').trim().replace(/\s+/g, '_') || suggestedName;
                    if (!suggestedName.toLowerCase().endsWith('.pdf')) suggestedName += '_report.pdf';
                }
            } catch (e) { /* ignore */ }

            a.download = suggestedName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error during report generation:', error);
            // Re-throw to be handled by the caller for UI update
            throw error;
        });
    }
    
    // Event: Download YAML button
    downloadBtn.addEventListener('click', () => {
        const yamlContent = downloadBtn.getAttribute('data-yaml-content');
        if (yamlContent) {
            downloadYaml(yamlContent, 'input.yaml');
        }
    });
});


// ============================================================================
// 8. FIGURE STATUS CHECKER
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('yaml-form');
    const checkFiguresBtn = document.getElementById('check-figures-btn');
    const refreshFiguresBtn = document.getElementById('refresh-figures-btn');
    const figureStatusList = document.getElementById('figure-status-list');
    const figureStatusSummary = document.getElementById('figure-status-summary');
    const figureCheckingStatus = document.getElementById('figure-checking-status');

    /**
     * Extract form data (duplicate of main function for isolated scope)
     * @param {HTMLFormElement} form - The form element
     * @returns {Object} Structured form data
     */
    function getFormData(form) {
        const data = {};
    
        // Helper function to process simple inputs (e.g., project_info, wind, glass, connection, anchorage)
        const processSimpleInputs = (selector, rootKey) => {
            const inputs = form.querySelectorAll(selector);
            inputs.forEach(input => {
                const path = input.name.split('.'); 
                let current = data;
                for (let i = 0; i < path.length - 1; i++) {
                    const key = path[i];
                    if (!current[key]) {
                        current[key] = {};
                    }
                    current = current[key];
                }
                current[path[path.length - 1]] = input.value;
            });
        };
    
        // 1. Get Project Info
        processSimpleInputs('[name^="project_info."]', 'project_info');
    
        // 2. Get Profiles
        function getProfileData(listId, keyName) {
            const list = document.getElementById(listId);
            if (!list) return;
            const items = list.querySelectorAll('.dynamic-item');
            data[keyName] = Array.from(items).map(item => {
                const profile = {};
                item.querySelectorAll('input, select, textarea').forEach(input => {
                    profile[input.name] = input.value;
                });
                return profile;
            });
        }
        getProfileData('alum-profiles-list', 'alum_profiles');
        getProfileData('steel-profiles-list', 'steel_profiles');
    
        // 3. Get Wind Parameters
        processSimpleInputs('[name^="wind."]', 'wind');
    
        // 4. Get Categories
        const categoriesList = document.getElementById('categories-list');
        if (!categoriesList) return data;
        
        const categoryItems = categoriesList.querySelectorAll('.category-item');
        data.categories = Array.from(categoryItems).map(categoryItem => {
            const category = {};
    
            const nameInput = categoryItem.querySelector('input[name="category_name"]');
            category.category_name = nameInput ? nameInput.value : 'Unnamed Category';
    
            function getNestedListData(parentElement, listName) {
                const nestedList = parentElement.querySelector(`.dynamic-list[data-list-name="${listName}"]`);
                if (!nestedList) return [];
    
                const nestedItems = nestedList.querySelectorAll('.dynamic-item');
                return Array.from(nestedItems).map(item => {
                    const itemData = {};
                    item.querySelectorAll('input, select, textarea').forEach(input => {
                        itemData[input.name] = input.value;
                    });
                    return itemData;
                });
            }
    
            category.glass_units = getNestedListData(categoryItem, 'glass_units');
            category.frames = getNestedListData(categoryItem, 'frames');
            category.connections = getNestedListData(categoryItem, 'connections');
            category.anchorage = getNestedListData(categoryItem, 'anchorage');
    
            return category;
        });
    
        return data;
    }

    /**
     * Convert data to YAML string using js-yaml library
     * @param {Object} data - Data object to convert
     * @returns {string} YAML formatted string
     */
    function toYamlString(data) {
        try {
            if (window.jsyaml && typeof window.jsyaml.dump === 'function') {
                return jsyaml.dump(data, {
                    indent: 2,
                    lineWidth: -1,
                    noRefs: true,
                    sortKeys: false
                });
            } else {
                console.error('js-yaml library not loaded');
                return '';
            }
        } catch (error) {
            console.error('Error converting to YAML:', error);
            return '';
        }
    }

    /**
     * Check figures against form data via backend API
     */
    function checkFigures() {
        const formData = getFormData(form);
        const yamlContent = toYamlString(formData);

        if (!yamlContent) {
            figureStatusList.innerHTML = '<li style="font-size: 0.85rem; padding: 1rem; color: #ef4444;">Error: Could not generate YAML from form data</li>';
            figureStatusSummary.innerHTML = '';
            if (figureCheckingStatus) figureCheckingStatus.style.display = 'none';
            return;
        }

        const checkStartTime = Date.now();
        if (figureCheckingStatus) figureCheckingStatus.style.display = 'inline';
        // Don't clear the list - keep existing content visible during refresh

        fetch('/check_figures', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ yaml_content: yamlContent })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to check figures');
            }
            return response.json();
        })
        .then(result => {
            const elapsed = Date.now() - checkStartTime;
            const minDisplayTime = 600; // Keep visible for at least 0.6 second
            const remainingTime = Math.max(0, minDisplayTime - elapsed);
            
            setTimeout(() => {
                if (figureCheckingStatus) figureCheckingStatus.style.display = 'none';
                if (result.success && result.figures) {
                    displayFigureStatus(result.figures);
                } else {
                    throw new Error(result.error || 'Unknown error');
                }
            }, remainingTime);
        })
        .catch(error => {
            const elapsed = Date.now() - checkStartTime;
            const minDisplayTime = 1000;
            const remainingTime = Math.max(0, minDisplayTime - elapsed);
            
            setTimeout(() => {
                if (figureCheckingStatus) figureCheckingStatus.style.display = 'none';
                console.error('Error checking figures:', error);
                figureStatusList.innerHTML = `<li style="padding: 1rem; color: #ef4444;">Error checking figures: ${error.message}</li>`;
                figureStatusSummary.innerHTML = '';
            }, remainingTime);
        });
    }

    /**
     * Display figure status results in the UI
     * @param {Array} figures - Array of figure objects with status
     */
    function displayFigureStatus(figures) {
        figureStatusList.innerHTML = '';
        
        const existingCount = figures.filter(f => f.exists).length;
        const missingCount = figures.filter(f => !f.exists).length;
        const totalCount = figures.length;

        // Display summary
        figureStatusSummary.innerHTML = `
            <div class="status-summary-item">
                ${totalCount}
            </div>
            <div class="status-summary-item">
                <span class="label">Found:</span>
                <span class="value success">${existingCount}</span>
            </div>
            <div class="status-summary-item">
                <span class="label">Missing:</span>
                <span class="value error">${missingCount}</span>
            </div>
        `;

        // Group by category
        const grouped = {};
        figures.forEach(fig => {
            if (!grouped[fig.category]) {
                grouped[fig.category] = [];
            }
            grouped[fig.category].push(fig);
        });

        // Define custom category order
        const categoryOrder = ['Wind', 'Profiles', 'Categories'];
        const sortedCategories = categoryOrder.filter(cat => grouped[cat]);
        
        // Add any categories not in the predefined order at the end
        Object.keys(grouped).forEach(cat => {
            if (!categoryOrder.includes(cat)) {
                sortedCategories.push(cat);
            }
        });

        // Display figures grouped by category in custom order
        sortedCategories.forEach(category => {
            const categoryHeader = document.createElement('li');
            categoryHeader.style.cssText = 'font-weight: bold; margin-top: 0.75rem; margin-bottom: 0.25rem; color: var(--text-primary); font-size: 0.85rem;';
            categoryHeader.textContent = category;
            figureStatusList.appendChild(categoryHeader);

            grouped[category].forEach(fig => {
                const li = document.createElement('li');
                li.className = 'figure-status-item';
                
                const icon = fig.exists ? 
                    '<svg class="figure-status-icon exists" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>' :
                    '<svg class="figure-status-icon missing" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                
                li.innerHTML = `
                    ${icon}
                    <span class="figure-status-name">${fig.name}</span>
                `;
                
                figureStatusList.appendChild(li);
            });
        });

        if (figures.length === 0) {
            figureStatusList.innerHTML = '<li style="padding: 1rem; text-align: center; color: var(--text-secondary);">No figures required</li>';
        }
    }

    // Event listeners for figure checking buttons
    if (checkFiguresBtn) {
        checkFiguresBtn.addEventListener('click', checkFigures);
    }

    if (refreshFiguresBtn) {
        refreshFiguresBtn.addEventListener('click', checkFigures);
    }

    // Auto-check figures on page load
    setTimeout(() => {
        if (figureStatusList && form) {
            checkFigures();
        }
    }, 1000);

    // Auto-refresh figures every 10 seconds
    let autoRefreshInterval = null;
    
    function startAutoRefresh() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
        }
        autoRefreshInterval = setInterval(() => {
            if (form && figureStatusList) {
                checkFigures();
            }
        }, 10000); // Refresh every 10 seconds
    }
    
    function stopAutoRefresh() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
    }
    
    // Start auto-refresh after initial load
    setTimeout(() => {
        startAutoRefresh();
    }, 2000);


    // ========================================================================
    // 9. INPUT HELPER MODAL
    // ========================================================================
    
    const addFiguresBtn = document.getElementById('add-figures-btn');
    const inputHelperModal = document.getElementById('input-helper-modal');
    const closeInputHelper = document.getElementById('close-input-helper');
    const inputHelperContent = document.getElementById('input-helper-content');

    /**
     * Load input-helper.txt content from server
     */
    async function loadInputHelperContent() {
        try {
            const response = await fetch('/input-helper.txt');
            if (response.ok) {
                const text = await response.text();
                inputHelperContent.textContent = text;
            } else {
                inputHelperContent.textContent = 'Error loading input helper guide.';
            }
        } catch (error) {
            inputHelperContent.textContent = 'Error: Unable to fetch input helper guide.';
            console.error('Error loading input-helper.txt:', error);
        }
    }

    /**
     * Show input helper modal
     */
    function showInputHelperModal() {
        if (inputHelperModal) {
            inputHelperModal.classList.add('show');
            loadInputHelperContent();
        }
    }

    /**
     * Hide input helper modal
     */
    function hideInputHelperModal() {
        if (inputHelperModal) {
            inputHelperModal.classList.remove('show');
        }
    }

    // Event listeners for modal
    if (addFiguresBtn) {
        addFiguresBtn.addEventListener('click', showInputHelperModal);
    }

    if (closeInputHelper) {
        closeInputHelper.addEventListener('click', hideInputHelperModal);
    }

    // Close modal when clicking outside
    if (inputHelperModal) {
        inputHelperModal.addEventListener('click', (e) => {
            if (e.target === inputHelperModal) {
                hideInputHelperModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && inputHelperModal && inputHelperModal.classList.contains('show')) {
            hideInputHelperModal();
        }
    });

    // ========================================================================
    // 11. INPUTS DIRECTORY SELECTION
    // ========================================================================

    const selectInputsDirBtn = document.getElementById('select-inputs-dir-btn');
    const inputsDirPathDisplay = document.getElementById('inputs-dir-path-display');

    /**
     * Update the displayed inputs directory path
     */
    function updateInputsDirDisplay(dirPath) {
        if (inputsDirPathDisplay) {
            inputsDirPathDisplay.textContent = dirPath;
            inputsDirPathDisplay.title = dirPath;  // Show full path on hover
        }
    }

    if (selectInputsDirBtn) {
        selectInputsDirBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                const response = await fetch('/open_folder_picker');
                const data = await response.json();

                if (data.success) {
                    // Always fetch the current directory from backend to ensure we have the latest
                    const dirResponse = await fetch('/get_inputs_dir');
                    const dirData = await dirResponse.json();
                    
                    if (dirData.success && dirData.directory) {
                        updateInputsDirDisplay(dirData.directory);
                        showNotification(`✓ Inputs directory set`, 'success');
                    }
                } else if (data.error) {
                    showNotification(`✗ Error: ${data.error}`, 'error');
                }
            } catch (error) {
                showNotification(`✗ Failed to open folder picker: ${error.message}`, 'error');
            }
        });
    }

    // Load current inputs directory on page load
    async function loadCurrentInputsDir() {
        try {
            const response = await fetch('/get_inputs_dir');
            const data = await response.json();
            
            if (data.success) {
                updateInputsDirDisplay(data.directory);
                if (!data.is_default) {
                    showNotification(`Using inputs directory: ${data.directory}`, 'info');
                }
            }
        } catch (error) {
            console.log('Could not load inputs directory:', error);
        }
    }

    loadCurrentInputsDir();
});
