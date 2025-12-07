document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Tab Switching Logic ---
    const tabs = document.querySelectorAll('.tab_btn');
    const all_content = document.querySelectorAll('.content');
    const line = document.querySelector('.line');

    const activeTab = document.querySelector('.tab_btn.active');
    if (activeTab) {
        line.style.width = activeTab.offsetWidth + "px";
        line.style.left = activeTab.offsetLeft + "px";
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => { t.classList.remove('active') });
            tab.classList.add('active');

            line.style.width = e.target.offsetWidth + "px";
            line.style.left = e.target.offsetLeft + "px";

            all_content.forEach(content => { content.classList.remove('active') });
            all_content[index].classList.add('active');
        });
    });

    // --- 2. Dynamic Input Field Logic ---
    // Define the required fields for each Aluminum profiles
    const alumFields = {
        'Manual': [
            'profile_name', 'web_length', 'flange_length', 'web_thk', 'flange_thk', 'tor_constant',
            'area', 'I_xx', 'I_yy', 'Y', 'X', 'plastic_x', 'plastic_y', 'F_y', 'Mn_yield', 'Mn_lb'
        ],
        'Pre-defined': ['profile_name']
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
        'profile_name': 'Profile Name (e.g. M 125x60x2.5)',
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


    // Define the required fields for each Glass Type
    const glassFields = {
        'sgu': ['length', 'width', 'thickness', 'grade', 'wind_load', 'support_type', 'nfl', 'gtf', 'load_x_area2', 'def'],
        'dgu': [
            'length', 'width', 'thickness1', 'gap', 'thickness2', 'grade1', 'grade2', 'wind_load', 'support_type', 
            'nfl1', 'nfl2', 'gtf1', 'gtf2', 'load_x_area2', 'def1', 'def2'
        ],
        'lgu': [
            'length', 'width', 'thickness1', 'thickness_inner', 'thickness2', 'chart_thickness', 'grade', 'wind_load',
            'support_type', 'nfl', 'gtf', 'load_x_area2', 'def'
        ],
        'ldgu': [
            'length', 'width', 'thickness1_1', 'thickness_inner', 'thickness1_2', 'chart_thickness', 'gap', 'thickness2',
            'grade1', 'grade2', 'wind_load', 'support_type', 'nfl1', 'nfl2', 'gtf1', 'gtf2', 'load_x_area2', 'def1', 'def2'
        ]
    };

    const glassGradeOptions = ['FT', 'HS', 'AN'];
    const supportTypeOptions = ['Four Edges', 'Three Edges', 'Two Edges', 'One Edge'];

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
        'load_x_area2': 'Load × Area² (kNm²)',
        'def': 'Deflection (mm)',
        'def1': 'Outer Panel Deflection (mm)',
        'def2': 'Inner Panel Deflection (mm)'
    };
    
    // Define the required fields for each Mullion Type
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
        'mullion': 'Mullion Profile Name (e.g. M 125x60x2.5 or [+RHS 85x50x3])',
        'I_xa': 'Moment of Inertia of Aluminum, Ixa (mm⁴)',
        'I_xs': 'Moment of Inertia of Steel, Ixs (mm⁴)',
        'mul_mu': 'Mullion Max. Moment, Mu (kNm)',
        'mul_vu': 'Mullion Max. Shear, Vu (kN)',
        'mul_def': 'Mullion Max. Deflection, δ (mm)',
        'mul_phi_Mn': 'Mullion Moment Capacity, φMn (kNm)',
        'mul_phi_Mn_a': 'Mullion (Aluminum) Moment Capacity, φMna (kNm)',
        'mul_phi_Mn_s': 'Mullion (Steel) Moment Capacity, φMns (kNm)',
        'transom': 'Transom Profile Name (e.g. T 125x60x2.5)',
        'tran_mu': 'Transom Max. Moment, Mu (kNm)',
        'tran_vu': 'Transom Max. Shear, Vu (kN)',
        'tran_def_wind': 'Transom Max. Deflection (wind), δw (mm)',
        'tran_def_dead': 'Transom Max. Deflection (dead), δd (mm)',
        'tran_phi_Mn': 'Transom Moment Capacity, φMn (kNm)'
    };

    // Define the fields unique to Anchorage Types based on user's YAML
    const anchorageFields = {
        'Box Clump': [
            'reaction_Ry', 'reaction_Rz', 'design_Ry', 'design_Rz', 'V_ua', 'V_ug', 
            'anchor_nos', 'anchor_dia', 'embed_depth', 'A_NC', 'A_VC', 'C_a1', 'h_a', 
            'bp_length_N', 'bp_width_B', 'bp_thk', 'bp_d', 'bp_b'
        ],
        'U Clump': [
            'reaction_Ry', 'reaction_Rz', 'design_Ry', 'design_Rz', 'N_ua', 'N_ug', 'V_ua', 'V_ug', 
            'anchor_nos', 'anchor_dia', 'embed_depth', 'A_NC', 'A_VC', 'C_a1', 
            'thr_bolt_nos', 'thr_bolt_dia', 'thr_bolt_length', 'thr_bearing_lc', 
            'fin_length', 'fin_width', 'fin_thk', 'fin_e', 'fin_bgv', 'fin_bnt', 
            'bp_length_N', 'bp_width_B', 'bp_thk', 'bp_d', 'bp_b', 'bp_x', 'bp_Beff'
        ],
        'L Clump Top': [
            'reaction_Ry', 'reaction_Rz', 'design_Ry', 'design_Rz', 'V_ua', 'V_ug', 
            'anchor_nos', 'anchor_dia', 'embed_depth', 'A_NC', 'A_VC', 'C_a1', 'h_a', 
            'bp_length_N', 'bp_width_B', 'bp_thk'
        ],
        'L Clump Front': [
            'reaction_Ry', 'reaction_Rz', 'design_Ry', 'design_Rz', 'N_ua', 'N_ug', 'V_ua', 'V_ug', 
            'anchor_nos', 'anchor_dia', 'embed_depth', 'A_NC', 'A_VC', 'C_a1', 
            'thr_bolt_nos', 'thr_bolt_dia', 'thr_bolt_length', 'thr_bearing_lc', 
            'fin_length', 'fin_width', 'fin_thk', 'fin_e', 'fin_bgv', 'fin_bnt', 
            'bp_length_N', 'bp_width_B', 'bp_thk', 'bp_d', 'bp_b', 'bp_x', 'bp_Beff'
        ]
    };

    const anchorageFieldPlaceholders = {
        'reaction_Ry': 'Horizontal Reaction, Ry (kN)',
        'reaction_Rz': 'Vertical Reaction, Rz (kN)',
        'design_Ry': 'Design Horizontal Reaction, Ry (kN)',
        'design_Rz': 'Design Vertical Reaction, Rz (kN)',
        'N_ua': 'Tensile force in single anchor, Nua (kN)',
        'N_ug': 'Tensile force in group of anchors, Nug (kN)',
        'V_ua': 'Shear force in single anchor, Vua (kN)',
        'V_ug': 'Shear force in group of anchors, Vug (kN)',
        'anchor_nos': 'No. of Anchor bolt, n',
        'anchor_dia': 'Diameter of Anchor bolt, da (mm)',
        'embed_depth': 'Effective Embedment Depth of Anchor, hef (mm)',
        'A_NC': 'Concrete failure area for anchor group in tension, ANC (mm²)',
        'A_VC': 'Concrete failure area for anchor group in shear, AVC (mm²)',
        'C_a1': 'Edge Distance, Ca1 (mm)',
        'h_a': 'Depth of Concrete Member, ha (mm)',
        'thr_bolt_nos': 'No. of Fin Through bolt, nb',
        'thr_bolt_dia': 'Diameter of Through bolt, db (mm)',
        'thr_bolt_length': 'Length of Through bolt (mm)',
        'thr_bearing_lc': 'Clear distance, in the direction of the force, lc (mm)',
        'fin_length': 'Length of Fin Plate (mm)',
        'fin_width': 'Width of Fin Plate (mm)',
        'fin_thk': 'Thickness of Fin Plate (mm)',
        'fin_e': 'Eccentricity, e (mm)',
        'fin_bgv': 'Block Shear length, bgv (mm)',
        'fin_bnt': 'Block Shear width, bnt (mm)',
        'bp_length_N': 'Length of Base Plate, N (mm)',
        'bp_width_B': 'Width of Base Plate, B (mm)',
        'bp_thk': 'Thickness of Base Plate, t (mm)',
        'bp_d': 'Depth of Profile / Fin-to-fin distance, d (mm)',
        'bp_b': 'Width of flange / Fin plate, b',
        'bp_x': 'Anchor center to flange distance, x (mm)',
        'bp_Beff': 'Effective plate width, Beff (mm)'
    };
    
    // Function to update manual aluminum profile fields
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
    
    // Function to update glass fields
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
    
    // Function to update frame fields
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

    // Function to update anchorage fields
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


    // --- 3. Dynamic List Management Logic ---

    // Function to attach handlers for nested buttons within a new category item
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

    // Core function to add a new item
    function addItem(listElement, templateId) {
        const template = document.getElementById(templateId);
        if (!template) return;

        const newElement = template.content.cloneNode(true).firstElementChild;
        
        // 3.1. Attach Remove Listener
        const removeBtn = newElement.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.target.closest('.dynamic-item').remove();
            });
        }
        
        // 3.2. Handle Alum Profile Type Change 
        if (templateId === 'alum-profile-template') {
            const alumItem = newElement;
            const typeSelect = alumItem.querySelector('select[name="profile_type"]');
            
            updateAlumFields(alumItem);
            typeSelect.addEventListener('change', () => updateAlumFields(alumItem));
        }
        
        // 3.2. Handle Glass Type Change 
        if (templateId === 'glass-unit-template') {
            const glassItem = newElement;
            const typeSelect = glassItem.querySelector('select[name="glass_type"]');
            
            updateGlassFields(glassItem);
            typeSelect.addEventListener('change', () => updateGlassFields(glassItem));
        }
        
        // 3.3. Handle Mullion (frame) Type Change 
        if (templateId === 'frame-template') {
            const frameItem = newElement;
            const typeSelect = frameItem.querySelector('select[name="mullion_type"]');
            
            updateFrameFields(frameItem);
            typeSelect.addEventListener('change', () => updateFrameFields(frameItem));
        }

        // 3.4. Handle Anchorage Type Change
        if (templateId === 'anchorage-template') {
            const anchorageItem = newElement;
            // Target the SELECT element
            const typeSelect = anchorageItem.querySelector('select[name="clump_type"]');
            
            // Initial call to set fields based on default value
            updateAnchorageFields(anchorageItem);
            // Set listener to update fields on CHANGE event
            typeSelect.addEventListener('change', () => updateAnchorageFields(anchorageItem));
        }

        // 3.5. If it's a Category, initialize its nested buttons.
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

        // 3.6. Append the new item
        listElement.appendChild(newElement);
    }
    
    // Attach event listeners to all top-level 'Add' buttons (Aluminum, Steel, Categories)
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

    // --- Initialization ---
    const form = document.getElementById('yaml-form');
    
    // Add one of each top-level item on load
    addItem(document.getElementById('alum-profiles-list'), 'alum-profile-template');
    addItem(document.getElementById('steel-profiles-list'), 'steel-profile-template');
    
    // Add the starting Category item
    addItem(document.getElementById('categories-list'), 'category-template');
    
    // Initialize the nested items of the first category item (Category)
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

    // --- 4. YAML Generation & Download Logic (Updated) ---
    const generateBtn = document.getElementById('generate-yaml-btn');
    const downloadBtn = document.getElementById('download-yaml-btn');
    const reportBtn = document.getElementById('generate-report-btn'); // NEW: Get the report button
    const yamlOutputDisplay = document.getElementById('yaml-output-display');

    // for notifications
    const statusEl = document.getElementById('status-notification');

    function setStatus(text, cls = '') {
        if (!statusEl) return;
        statusEl.textContent = text;
        // reset classes and add base + state class
        statusEl.className = 'status' + (cls ? ' ' + cls : '');
    }


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
    
    // Listener for Generate YAML button (updated)
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

    // NEW: Listener for Generate Report button
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
                setStatus('Generation failed: ' + (err && err.message ? err.message : err), 'error');
            })
            .finally(() => {
                // Re-enable after a short delay so user sees the result
                setTimeout(() => {
                    generateBtn.disabled = false;
                    reportBtn.disabled = false;
                }, 900);
            });
    });

    // Helper to call the Python environment to create input.yaml and run report.py
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
    
    // Listener for Download YAML button (new)
    downloadBtn.addEventListener('click', () => {
        const yamlContent = downloadBtn.getAttribute('data-yaml-content');
        if (yamlContent) {
            downloadYaml(yamlContent, 'input.yaml');
        }
    });
});