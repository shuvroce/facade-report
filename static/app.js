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
        'grade': 'Glass Grade (e.g. FT, HS, AN)',
        'grade1': 'Outer Panel Grade (e.g. FT, HS, AN)',
        'grade2': 'Inner Panel Grade (e.g. FT, HS, AN)',
        'wind_load': 'Wind Load (kPa)',
        'support_type': 'Support Type (e.g. Four Edges)',
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
        'reaction_Rz': 'Vertical Reaction, Ry (kN)',
        'design_Ry': 'Design Horizontal Reaction, Ry (kN)',
        'design_Rz': 'Design Vertical Reaction, Ry (kN)',
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
            
            const label = document.createElement('label');
            
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
            
            fieldsContainer.appendChild(label);
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
            
            const label = document.createElement('label');
            
            const input = document.createElement('input');
            input.type = type;
            input.step = '0.1';
            input.name = fieldName;
            input.placeholder = frameFieldPlaceholders[fieldName] || fieldName;
            
            fieldsContainer.appendChild(label);
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

            const label = document.createElement('label');
            
            const input = document.createElement('input');
            input.type = type;
            input.step = '0.1';
            input.name = fieldName;
            input.placeholder = anchorageFieldPlaceholders[fieldName] || fieldName;
            
            fieldsContainer.appendChild(label);
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


    function getFormData(form) {
        const data = {};
        
        // Helper function to process simple inputs (e.g., project_info, wind)
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
                
                const value = input.value;
                let parsedValue = value;

                // NEW LOGIC: Only apply numerical parsing to 'wind' values
                // Keep 'project_info' values as strings to preserve date format (YYYY-MM-DD)
                if (rootKey === 'wind') {
                    // Use parseFloat for all numerical inputs, but handle non-numerical or empty input gracefully
                    parsedValue = isNaN(parseFloat(value)) || value === '' ? value : parseFloat(value);
                } else if (value === '') {
                    // Treat empty project info fields as empty strings
                    parsedValue = '';
                }
                
                current[path[path.length - 1]] = parsedValue;
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
                    const value = input.value;
                    const parsedValue = isNaN(parseFloat(value)) || value === '' ? value : parseFloat(value);
                    profile[input.name] = parsedValue;
                });
                return profile;
            });
        }
        getProfileData('alum-profiles-list', 'alum_profiles');
        getProfileData('steel-profiles-list', 'steel_profiles');
        
        // 3. Get Wind Parameters (Will be parsed as numbers where possible)
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
                        const value = input.value;
                        const parsedValue = isNaN(parseFloat(value)) || value === '' ? value : parseFloat(value);
                        itemData[input.name] = parsedValue;
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
        
        // 1. Display the generated YAML for user feedback
        yamlOutputDisplay.textContent = yamlContent;
        
        // 2. Execute the Python script with the generated YAML content
        callPythonToGenerateReport(yamlContent);
    });

    // Helper to call the Python environment to create input.yaml and run report.py
    function callPythonToGenerateReport(yamlContent) {
        // In a real application, this function would send the YAML content 
        // to a server endpoint (e.g., using fetch or XMLHttpRequest) that 
        // handles file writing and Python execution (e.g., a Flask/Django route).

        alert('Sending YAML data to the server for report generation (input.yaml will be created and report.py executed).');
        console.log('Generated YAML content:\n', yamlContent);
        console.log('--- Simulating report.py execution with this data ---');

        // Example: Using fetch to send data to a theoretical '/generate_report' endpoint
        fetch('/generate_report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ yaml_data: yamlContent })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Trigger PDF download from the server response
                window.location.href = data.pdf_url; 
            } else {
                alert('Report generation failed: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error during report generation:', error);
            alert('A network error occurred during report generation.');
        });
    }
    
    // Listener for Download YAML button (new)
    downloadBtn.addEventListener('click', () => {
        const yamlContent = downloadBtn.getAttribute('data-yaml-content');
        if (yamlContent) {
            // Get the project name for a custom filename
            const projectNameInput = form.querySelector('input[name="project_info.project_name"]');
            const projectName = projectNameInput ? projectNameInput.value : 'project_data';
            
            // Clean the project name to create a safe filename
            const cleanProjectName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            
            downloadYaml(yamlContent, `${cleanProjectName}.yaml`);
        }
    });
});