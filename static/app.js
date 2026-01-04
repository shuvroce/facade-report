document.addEventListener('DOMContentLoaded', () => {
    
    // 1. THEME MANAGEMENT
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

    
    // 2. TAB NAVIGATION SYSTEM
    const tabs = document.querySelectorAll('.tab_btn');
    const all_content = document.querySelectorAll('.content');
    const line = document.querySelector('.line');

    // Initialize active tab indicator
    const activeTab = document.querySelector('.tab_btn.active');
    const positionLine = (targetTab) => {
        if (!line || !targetTab) return;
        const shrink = 12; // tighten the underline a bit inside the tab
        const width = Math.max(targetTab.offsetWidth - shrink, 24);
        line.style.width = `${width}px`;
        line.style.left = `${targetTab.offsetLeft + shrink / 2}px`;
    };

    positionLine(activeTab);

    // Tab click handlers
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', (e) => {
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update indicator line
            positionLine(tab);

            // Show corresponding content
            all_content.forEach(content => content.classList.remove('active'));
            if (all_content[index]) {
                all_content[index].classList.add('active');
            }
        });
    });

    // Keep indicator aligned on resize
    window.addEventListener('resize', () => positionLine(document.querySelector('.tab_btn.active')));

    // 3. CONFIGURATION & CONSTANTS
    // --- Aluminum Profile Configuration ---
    const alumFields = {
        'Manual': [
            'profile_name', 'web_length', 'flange_length', 'web_thk', 'flange_thk', 'tor_constant',
            'area', 'I_xx', 'I_yy', 'Y', 'X', 'plastic_x', 'plastic_y', 'F_y', 'Mn_yield', 'Mn_lb'
        ],
        'Pre-defined': ['profile_name'],
        'Stick': ['profile_name', 'web_length', 'flange_length', 'web_thk', 'flange_thk', 'F_y']
    };

    // Dynamic profile options - will be populated from server
    let alumProfileOptions = [];
    let steelProfileOptions = [];
    let profileDataCache = {}; // Cache for profile data {profile_name: {I_xx, I_yy, phi_Mn, ...}}

    /**
     * Fetch profile names from backend and populate options
     */
    async function initializeProfileOptions() {
        try {
            const response = await fetch('/get_profile_names');
            if (response.ok) {
                const data = await response.json();
                alumProfileOptions = data.alum_profiles || [];
                steelProfileOptions = data.steel_profiles || [];
            } else {
                console.warn('Failed to fetch profile names, using empty arrays');
            }
            
            // Fetch full profile data
            const profileResponse = await fetch('/get_profile_data');
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                
                // Cache aluminum profiles
                if (profileData.alum_profiles_data) {
                    profileData.alum_profiles_data.forEach(profile => {
                        profileDataCache[profile.profile_name] = profile;
                    });
                }
                
                // Cache steel profiles
                if (profileData.steel_profiles_data) {
                    profileData.steel_profiles_data.forEach(profile => {
                        profileDataCache[profile.profile_name] = profile;
                    });
                }
            }
        } catch (error) {
            console.warn('Error fetching profile names:', error);
        }
    }

    // Store the initialization promise so we can await it later
    const profileOptionsPromise = initializeProfileOptions();

    const alumFieldPlaceholders = {
        'profile_name': 'Profile Name',
        'web_length': 'Web Length (mm)',
        'flange_length': 'Flange Length (mm)',
        'web_thk': 'Web Thickness (mm)',
        'flange_thk': 'Flange Thickness (mm)',
        'tor_constant': 'Torsional Constant (mm⁴)',
        'area': 'Area (mm²)',
        'I_xx': 'Major Moment of Inertia, Ixx (mm⁴)',
        'I_yy': 'Minor Moment of Inertia, Iyy (mm⁴)',
        'Y': 'Extreme Fibre Distance, Y (mm)',
        'X': 'Extreme Fibre Distance, X (mm)',
        'plastic_x': 'Upper Region Centroid Distance, Plastic X (mm)',
        'plastic_y': 'Lower Region Centroid Distance, Plastic Y (mm)',
        'F_y': 'Yield Strength, Fy (MPa)',
        'Mn_yield': 'Moment Capacity by Yielding, Mn (kNm)',
        'Mn_lb': 'Moment Capacity by Local Buckling, Mn (kNm)',
    };


    // --- Glass Unit Configuration ---
    const glassFields = {
        'sgu': ['length', 'width', 'thickness', 'grade', 'wind_load', 'support_type', 'nfl', 'load_x_area2', 'def'],
        'dgu': [
            'length', 'width', 'thickness1', 'gap', 'thickness2', 'grade1', 'grade2', 'wind_load', 'support_type', 
            'nfl1', 'nfl2', 'load1_x_area2', 'load2_x_area2', 'def1', 'def2'
        ],
        'lgu': [
            'length', 'width', 'thickness1', 'thickness_inner', 'thickness2', 'chart_thickness', 'grade', 'wind_load',
            'support_type', 'nfl', 'load_x_area2', 'def'
        ],
        'ldgu': [
            'length', 'width', 'thickness1_1', 'thickness_inner', 'thickness1_2', 'chart_thickness', 'gap', 'thickness2',
            'grade1', 'grade2', 'wind_load', 'support_type', 'nfl1', 'nfl2', 'load1_x_area2', 'load2_x_area2', 'def1', 'def2'
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
        'grade': 'Glass Grade',
        'grade1': 'Glass Grade',
        'grade2': 'Glass Grade',
        'wind_load': 'Wind Load (kPa)',
        'support_type': 'Support Type',
        'gap': 'Gap Between Panels (mm)',
        'nfl': 'Non-factored Load, NFL (kPa)',
        'nfl1': 'Non-factored Load of Outer Panel, NFL1 (kPa)',
        'nfl2': 'Non-factored Load of Inner Panel, NFL2 (kPa)',
        'gtf': 'Glass Type Factor, GTF',
        'gtf1': 'Glass Type Factor of Outer Panel, GTF1',
        'gtf2': 'Glass Type Factor of Inner Panel, GTF2',
        'load_x_area2': 'Load × Area² (kNm²)',
        'load1_x_area2': 'Load × Area² (kNm²)',
        'load2_x_area2': 'Load × Area² (kNm²)',
        'def': 'Deflection (mm)',
        'def1': 'Outer Panel Deflection (mm)',
        'def2': 'Inner Panel Deflection (mm)'
    };

    /**
     * Calculate and update value for load_x_area2 fields
     * @param {HTMLElement} glassItem - The glass unit item container
     */
    function updateLoadAreaValue(glassItem) {
        const fieldsContainer = glassItem.querySelector('.item-fields');
        if (!fieldsContainer) return;

        const glassType = glassItem.querySelector('select[name="glass_type"]')?.value;
        const lengthInput = fieldsContainer.querySelector('input[name="length"]');
        const widthInput = fieldsContainer.querySelector('input[name="width"]');
        const windLoadInput = fieldsContainer.querySelector('input[name="wind_load"]');
        const loadAreaInput = fieldsContainer.querySelector('input[name="load_x_area2"]');
        const load1AreaInput = fieldsContainer.querySelector('input[name="load1_x_area2"]');
        const load2AreaInput = fieldsContainer.querySelector('input[name="load2_x_area2"]');

        const length = parseFloat(lengthInput?.value);
        const width = parseFloat(widthInput?.value);
        const windLoad = parseFloat(windLoadInput?.value);

        if (length && width && windLoad) {
            const area = (length * width) / 1000000; // Convert mm² to m²
            
            // For DGU and LDGU, calculate windLoad1 and windLoad2 based on load sharing
            if (glassType === 'dgu' || glassType === 'ldgu') {
                let thickness1, thickness2;
                
                if (glassType === 'dgu') {
                    thickness1 = parseFloat(fieldsContainer.querySelector('input[name="thickness1"]')?.value);
                    thickness2 = parseFloat(fieldsContainer.querySelector('input[name="thickness2"]')?.value);
                } else if (glassType === 'ldgu') {
                    const thickness1_1 = parseFloat(fieldsContainer.querySelector('input[name="thickness1_1"]')?.value) || 0;
                    const thickness1_2 = parseFloat(fieldsContainer.querySelector('input[name="thickness1_2"]')?.value) || 0;
                    thickness1 = thickness1_1 + thickness1_2;
                    thickness2 = parseFloat(fieldsContainer.querySelector('input[name="thickness2"]')?.value);
                }
                
                if (thickness1 && thickness2) {
                    // Calculate load share factors
                    const ls1 = (Math.pow(thickness1, 3) + Math.pow(thickness2, 3)) / Math.pow(thickness1, 3);
                    const ls2 = (Math.pow(thickness1, 3) + Math.pow(thickness2, 3)) / Math.pow(thickness2, 3);
                    
                    // Calculate distributed wind loads
                    const windLoad1 = windLoad / ls1;
                    const windLoad2 = windLoad / ls2;
                    
                    const calculated1 = (0.7 * windLoad1 * Math.pow(area, 2)).toFixed(1);
                    const calculated2 = (0.7 * windLoad2 * Math.pow(area, 2)).toFixed(1);
                    
                    // Update load1_x_area2 and load2_x_area2
                    if (load1AreaInput && !load1AreaInput.value) {
                        load1AreaInput.value = calculated1;
                    }
                    if (load2AreaInput && !load2AreaInput.value) {
                        load2AreaInput.value = calculated2;
                    }
                }
            } else {
                // For SGU and LGU, use simple calculation
                const calculated = (0.7 * windLoad * Math.pow(area, 2)).toFixed(1);
                
                if (loadAreaInput && !loadAreaInput.value) {
                    loadAreaInput.value = calculated;
                }
            }
        }
    }
    
    // --- Frame Configuration ---
    const frameFields = {
        'regular': {
            'Aluminum Only': [
                'mullion', 'transom', 'length', 'width', 'tran_spacing', 'glass_thk', 'wind_pos', 'wind_neg'
            ],
            'Aluminum + Steel': [
                'mullion', 'steel', 'transom', 'length', 'width', 'tran_spacing', 'glass_thk', 'wind_pos', 'wind_neg'
            ]
        },
        'irregular': {
            'Aluminum Only': [
                'mullion', 'transom', 'length', 'width', 'tran_spacing', 'glass_thk', 'wind_pos', 'wind_neg',
                'mul_mu', 'mul_vu', 'mul_def',
                'tran_mu', 'tran_vu', 'tran_def_wind', 'tran_def_dead',
                'joint_fy', 'joint_fz', 'reaction_Ry', 'reaction_Rz'
            ],
            'Aluminum + Steel': [
                'mullion', 'steel', 'transom', 'length', 'width', 'tran_spacing', 'glass_thk', 'wind_pos', 'wind_neg',
                'mul_mu', 'mul_vu', 'mul_def',
                'tran_mu', 'tran_vu', 'tran_def_wind', 'tran_def_dead',
                'joint_fy', 'joint_fz', 'reaction_Ry', 'reaction_Rz'
            ]
        }
    };

    const frameFieldPlaceholders = {
        'length': 'Mullion Length (mm)',
        'width': 'Transom Length (mm)',
        'tran_spacing': 'Transom Spacing (mm)',
        'glass_thk': 'Glass Thickness (mm)',
        'wind_pos': 'Wind Load (+ve) (kPa)',
        'wind_neg': 'Wind Load (-ve) (kPa)',
        'mullion': 'Mullion Name',
        'steel': 'Embedded Steel Tube',
        'I_xa': 'Moment of Inertia of Aluminum, Ixa (mm⁴)',
        'I_xs': 'Moment of Inertia of Steel, Ixs (mm⁴)',
        'mul_mu': 'Mullion Max. Moment, Mu (kNm)',
        'mul_vu': 'Mullion Max. Shear, Vu (kN)',
        'mul_def': 'Mullion Max. Deflection, δ (mm)',
        'mul_phi_Mn': 'Mullion Moment Capacity, φMn (kNm)',
        'mul_phi_Mn_a': 'Mullion (Aluminum) Moment Capacity, φMna (kNm)',
        'mul_phi_Mn_s': 'Mullion (Steel) Moment Capacity, φMns (kNm)',
        'transom': 'Transom Name',
        'tran_mu': 'Transom Max. Moment, Mu (kNm)',
        'tran_vu': 'Transom Max. Shear, Vu (kN)',
        'tran_def_wind': 'Transom Max. Deflection (wind), δw (mm)',
        'tran_def_dead': 'Transom Max. Deflection (dead), δd (mm)',
        'tran_phi_Mn': 'Transom Moment Capacity, φMn (kNm)',
        'joint_fy': 'Horizontal Joint Force, fy (kN)',
        'joint_fz': 'Vertical Joint Force, fz (kN)',
        'reaction_Ry': 'Horizontal Reaction, Ry (kN)',
        'reaction_Rz': 'Vertical Reaction, Rz (kN)'
    };

    // --- Anchorage Configuration ---
    const anchorageFields = {
        'Box Clump': [
            'anchor_nos', 'anchor_dia', 'embed_depth',
            'C_a1', 'h_a', 'bp_thk'
        ],
        'U Clump': [
            'anchor_nos', 'anchor_dia', 'embed_depth', 'C_a1', 
            'thr_bolt_dia', 'fin_thk', 'fin_e', 'bp_thk'
        ],
        'L Clump': [
            'top_anchor_nos', 'anchor_dia', 'embed_depth', 'top_C_a1', 'h_a',
            'top_bp_length_N', 'top_bp_width_B',
            'front_C_a1', 'thr_bolt_dia', 'fin_thk', 'fin_e',
            'front_bp_length_N', 'front_bp_width_B', 'bp_thk'
        ]
    };

    const anchorageFieldPlaceholders = {
        'anchor_nos': 'No. of Anchor bolt, n',
        'top_anchor_nos': 'No. of Top Anchor bolt, n',
        'front_anchor_nos': 'No. of Front Anchor bolt, n',
        'anchor_dia': 'Diameter of Anchor bolt, da (mm)',
        'embed_depth': 'Embed. Depth of Anchor, hef (mm)',
        'C_a1': 'Edge Distance, Ca1 (mm)',
        'top_C_a1': 'Edge Distance of Top Anchor, Ca1 (mm)',
        'front_C_a1': 'Edge Distance for Front Anchor, Ca1 (mm)',
        'h_a': 'Depth of Concrete Member, ha (mm)',
        'thr_bolt_dia': 'Diameter of Through bolt, db (mm)',
        'fin_thk': 'Thickness of Fin Plate (mm)',
        'fin_e': 'Eccentricity, e (mm)',
        'bp_length_N': 'Length of Base Plate, N (mm)',
        'top_bp_length_N': 'Length of Top Base Plate, N (mm)',
        'front_bp_length_N': 'Length of Front Base Plate, N (mm)',
        'bp_width_B': 'Width of Base Plate, B (mm)',
        'top_bp_width_B': 'Width of Top Base Plate, B (mm)',
        'front_bp_width_B': 'Width of Front Base Plate, B (mm)',
        'bp_thk': 'Thickness of Base Plate, t (mm)',
        'bp_d': 'Fin-to-fin distance, d (mm)',
        'bp_b': 'Width of flange, b (mm)'
    };

    // Default values for anchorage fields based on clump type
    const anchorageDefaultValuesByType = {
        'Box Clump': {
            'anchor_nos': 4,
            'anchor_dia': 12,
            'embed_depth': 70,
            'C_a1': 150,
            'h_a': 150,
            'bp_thk': 5
        },
        'U Clump': {
            'anchor_nos': 4,
            'anchor_dia': 12,
            'embed_depth': 70,
            'C_a1': 60,
            'thr_bolt_dia': 10,
            'fin_thk': 5,
            'fin_e': 70,
            'bp_thk': 6
        },
        'L Clump': {
            'top_anchor_nos': 2,
            'front_anchor_nos': 2,
            'anchor_dia': 12,
            'embed_depth': 70,
            'top_C_a1': 150,
            'front_C_a1': 60,
            'h_a': 150,
            'top_bp_length_N': 250,
            'top_bp_width_B': 250,
            'front_bp_length_N': 250,
            'front_bp_width_B': 150,
            'bp_thk': 6,
            'thr_bolt_dia': 10,
            'fin_thk': 5,
            'fin_e': 70
        },
    };
    
    
    // 4. DYNAMIC FORM FIELD MANAGEMENT
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
        fieldsContainer.classList.add('form-section');

        requiredFields.forEach(fieldName => {
            let type = 'number';
            if (fieldName.match(/(profile_name)/i)) {
                type = 'text';
            }
            
            let input;
            
            // Create dropdown for pre-defined profiles
            if (selectedType === 'Pre-defined' && fieldName === 'profile_name') {
                input = document.createElement('select');
                input.id = fieldName;
                input.name = fieldName;
                
                // Add profile options (first one will be default)
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
                input.id = fieldName;
                input.name = fieldName;
            }
            
            // Create form-field wrapper with label and optional unit
            const labelText = alumFieldPlaceholders[fieldName] || fieldName;
            const unit = extractUnitFromPlaceholder(labelText);
            const formField = createFormField(input, labelText, unit);
            
            fieldsContainer.appendChild(formField);
        });
    }
    
    /**
     * Create a form field with input and optional unit suffix
     * @param {HTMLElement} input - The input element
     * @param {string} label - The label text (may include unit like "Glass Length (mm)")
     * @param {string} [unit] - Optional unit suffix (e.g., 'mm', 'kPa')
     * @returns {HTMLElement} The form-field div
     */
    function createFormField(input, label, unit) {
        const formField = document.createElement('div');
        formField.className = 'form-field';
        
        const labelEl = document.createElement('label');
        labelEl.setAttribute('for', input.id);
        
        // Strip unit from label if it exists
        let cleanLabel = label;
        if (unit) {
            cleanLabel = label.replace(/\s*\([^)]*\)\s*$/, '').trim();
        }
        labelEl.textContent = cleanLabel;
        
        formField.appendChild(labelEl);
        
        if (unit && input.type === 'number') {
            // Wrap input with unit in a form-field-input-group
            const inputGroup = document.createElement('div');
            inputGroup.className = 'form-field-input-group';
            
            inputGroup.appendChild(input);
            
            const unitSpan = document.createElement('span');
            unitSpan.className = 'form-field-unit';
            unitSpan.textContent = unit;
            unitSpan.setAttribute('aria-hidden', 'true');
            
            inputGroup.appendChild(unitSpan);
            formField.appendChild(inputGroup);
        } else {
            formField.appendChild(input);
        }
        
        return formField;
    }

    /**
     * Extract unit from placeholder text (e.g., "Glass Length (mm)" -> "mm")
     * @param {string} placeholder - The placeholder text
     * @returns {string|null} The extracted unit or null
     */
    function extractUnitFromPlaceholder(placeholder) {
        if (!placeholder) return null;
        const match = placeholder.match(/\(([^)]+)\)$/);
        return match ? match[1] : null;
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
        fieldsContainer.classList.add('form-section');

        requiredFields.forEach(fieldName => {
            let type = 'text'; 
            if (fieldName.match(/(thickness|def|load|gap|nfl|gtf|length|width)/i)) {
                type = 'number';
            }
            
            let input;
            
            // Create dropdown for glass grade
            if (fieldName.match(/^grade/i)) {
                input = document.createElement('select');
                input.id = fieldName;
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
                input.id = fieldName;
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
                input.id = fieldName;
                input.name = fieldName;
            }
            
            // Create form-field wrapper with label and optional unit
            const labelText = glassFieldPlaceholders[fieldName] || fieldName;
            const unit = extractUnitFromPlaceholder(labelText);
            const formField = createFormField(input, labelText, unit);
            
            fieldsContainer.appendChild(formField);
        });

        // Add listeners to update value for load_x_area2 fields
        const lengthInput = fieldsContainer.querySelector('input[name="length"]');
        const widthInput = fieldsContainer.querySelector('input[name="width"]');
        const windLoadInput = fieldsContainer.querySelector('input[name="wind_load"]');
        const thickness1Input = fieldsContainer.querySelector('input[name="thickness1"]');
        const thickness2Input = fieldsContainer.querySelector('input[name="thickness2"]');
        const thickness1_1Input = fieldsContainer.querySelector('input[name="thickness1_1"]');
        const thickness1_2Input = fieldsContainer.querySelector('input[name="thickness1_2"]');
        
        [lengthInput, widthInput, windLoadInput, thickness1Input, thickness2Input, thickness1_1Input, thickness1_2Input].forEach(input => {
            if (input) {
                input.addEventListener('input', () => updateLoadAreaValue(glassItem));
                input.addEventListener('change', () => updateLoadAreaValue(glassItem));
            }
        });

        // Initial value calculation
        updateLoadAreaValue(glassItem);
    }
    
    /**
     * Populate I_xx, I_yy, phi_Mn fields based on selected profile
     * @param {HTMLElement} selectElement - The profile select element
     * @param {string} profileType - Type of profile ('mullion', 'transom', or 'steel')
     */
    function populateProfileData(selectElement, profileType) {
        const profileName = selectElement.value;
        const frameItem = selectElement.closest('.frame-item');
        if (!frameItem || !profileName) return;
        
        const profileData = profileDataCache[profileName];
        if (!profileData) return;
        
        // Map profile type to field name prefixes
        let prefix = '';
        if (profileType === 'mullion') {
            prefix = 'I_x'; // For mullion: I_xa or I_xx
        } else if (profileType === 'transom') {
            prefix = 'tran_I_x'; // For transom: tran_I_xx, tran_I_yy
        } else if (profileType === 'steel') {
            prefix = 'I_x'; // For steel: I_xs
        }
        
        // Find and populate I_xx field
        const ixxField = frameItem.querySelector(`input[name*="${prefix}"][name*="x"]`);
        if (ixxField && profileData.I_xx) {
            ixxField.value = profileData.I_xx;
        }
        
        // Find and populate I_yy field
        const iyyField = frameItem.querySelector(`input[name*="${prefix}"][name*="y"]`);
        if (iyyField && profileData.I_yy) {
            iyyField.value = profileData.I_yy;
        }
        
        // Find and populate phi_Mn field
        let phiMnFieldName = '';
        if (profileType === 'mullion') {
            phiMnFieldName = 'mul_phi_Mn';
        } else if (profileType === 'transom') {
            phiMnFieldName = 'tran_phi_Mn';
        } else if (profileType === 'steel') {
            phiMnFieldName = 'mul_phi_Mn_s';
        }
        
        const phiMnField = frameItem.querySelector(`input[name="${phiMnFieldName}"]`);
        if (phiMnField && profileData.phi_Mn) {
            phiMnField.value = profileData.phi_Mn;
        }
    }

    /**
     * Populate I_xx, I_yy, phi_Mn fields based on selected profile
     * @param {HTMLElement} selectElement - The profile select element
     * @param {string} profileType - Type of profile ('mullion', 'transom', or 'steel')
     */
    function populateProfileData(selectElement, profileType) {
        const profileName = selectElement.value;
        const frameItem = selectElement.closest('.frame-item');
        if (!frameItem || !profileName) return;
        
        const profileData = profileDataCache[profileName];
        if (!profileData) {
            console.warn(`Profile data not found for: ${profileName}`);
            return;
        }
        
        // Map profile type to field name patterns
        if (profileType === 'mullion') {
            // For mullion: I_xa, I_ya, mul_phi_Mn_a or mul_phi_Mn
            const mullionType = frameItem.querySelector('select[name="mullion_type"]')?.value;
            
            if (mullionType === 'Aluminum + Steel') {
                // Aluminum + Steel: I_xa, I_ya, mul_phi_Mn_a
                const ixxField = frameItem.querySelector('input[name="I_xa"]');
                if (ixxField && profileData.I_xx) {
                    ixxField.value = profileData.I_xx;
                }
                
                const iyyField = frameItem.querySelector('input[name="I_ya"]');
                if (iyyField && profileData.I_yy) {
                    iyyField.value = profileData.I_yy;
                }
                
                const phiMnField = frameItem.querySelector('input[name="mul_phi_Mn_a"]');
                if (phiMnField && profileData.phi_Mn) {
                    phiMnField.value = profileData.phi_Mn;
                }
            } else {
                // Aluminum Only: I_xx, I_yy, mul_phi_Mn
                const ixxField = frameItem.querySelector('input[name="I_xx"]');
                if (ixxField && profileData.I_xx) {
                    ixxField.value = profileData.I_xx;
                }
                
                const iyyField = frameItem.querySelector('input[name="I_yy"]');
                if (iyyField && profileData.I_yy) {
                    iyyField.value = profileData.I_yy;
                }
                
                const phiMnField = frameItem.querySelector('input[name="mul_phi_Mn"]');
                if (phiMnField && profileData.phi_Mn) {
                    phiMnField.value = profileData.phi_Mn;
                }
            }
        } else if (profileType === 'transom') {
            // For transom: tran_I_xx, tran_I_yy, tran_phi_Mn
            const ixxField = frameItem.querySelector('input[name="tran_I_xx"]');
            if (ixxField && profileData.I_xx) {
                ixxField.value = profileData.I_xx;
            }
            
            const iyyField = frameItem.querySelector('input[name="tran_I_yy"]');
            if (iyyField && profileData.I_yy) {
                iyyField.value = profileData.I_yy;
            }
            
            const phiMnField = frameItem.querySelector('input[name="tran_phi_Mn"]');
            if (phiMnField && profileData.phi_Mn) {
                phiMnField.value = profileData.phi_Mn;
            }
        } else if (profileType === 'steel') {
            // For steel: I_xs, I_ys, mul_phi_Mn_s
            const ixxField = frameItem.querySelector('input[name="I_xs"]');
            if (ixxField && profileData.I_xx) {
                ixxField.value = profileData.I_xx;
            }
            
            const iyyField = frameItem.querySelector('input[name="I_ys"]');
            if (iyyField && profileData.I_yy) {
                iyyField.value = profileData.I_yy;
            }
            
            const phiMnField = frameItem.querySelector('input[name="mul_phi_Mn_s"]');
            if (phiMnField && profileData.phi_Mn) {
                phiMnField.value = profileData.phi_Mn;
            }
        }
    }

    /**
     * Update the aluminum profile preview panel with selected profile properties
     * @param {HTMLElement} alumItem - The aluminum profile item container
     */
    function updateAlumProfilePreview(alumItem) {
        const previewContainer = alumItem.querySelector('.profile-preview-content');
        if (!previewContainer) return;

        const profileTypeSelect = alumItem.querySelector('select[name="profile_type"]');
        const profileNameField = alumItem.querySelector('input[name="profile_name"], select[name="profile_name"]');
        
        if (!profileTypeSelect || !profileNameField) {
            previewContainer.innerHTML = '<p class="preview-placeholder">Select a profile</p>';
            return;
        }

        const profileType = profileTypeSelect.value;
        const profileName = profileNameField.value;

        // If no profile name selected or empty, show placeholder
        if (!profileName) {
            previewContainer.innerHTML = '<p class="preview-placeholder">Enter or select a profile</p>';
            return;
        }

        // For pre-defined profiles, use server-rendered preview with cached data
        if (profileType === 'Pre-defined') {
            const profileData = profileDataCache[profileName];
            if (profileData) {
                updatePreview(alumItem, 'alum_profile', (item) => {
                    return profileData;
                }, 'Profile data not found');
            } else {
                previewContainer.innerHTML = '<p class="preview-placeholder">Profile data not found</p>';
            }
        } 
        // For stick profiles, only require basic dimensions
        else if (profileType === 'Stick') {
            updatePreview(alumItem, 'alum_profile', (item) => {
                const fieldsContainer = item.querySelector('.item-fields');
                if (!fieldsContainer) {
                    throw new Error('No fields found');
                }

                const payload = { profile_type: profileType, profile_name: profileName };
                
                // Collect all input values from the fields
                fieldsContainer.querySelectorAll('input, select').forEach(input => {
                    if (input.name) {
                        payload[input.name] = input.value;
                    }
                });

                // Validate required fields for Stick profiles (only basic dimensions)
                const requiredFields = ['web_length', 'flange_length', 'web_thk', 'flange_thk', 'F_y'];
                const missingFields = requiredFields.filter(field => !payload[field] || payload[field] === '');
                
                if (missingFields.length > 0) {
                    throw new Error(`Missing fields: ${missingFields.join(', ')}`);
                }

                return payload;
            }, 'Enter all dimensions and material properties');
        }
        // For manual profiles, require all properties
        else if (profileType === 'Manual') {
            updatePreview(alumItem, 'alum_profile', (item) => {
                const fieldsContainer = item.querySelector('.item-fields');
                if (!fieldsContainer) {
                    throw new Error('No fields found');
                }

                const payload = { profile_type: profileType, profile_name: profileName };
                
                // Collect all input values from the fields
                fieldsContainer.querySelectorAll('input, select').forEach(input => {
                    if (input.name) {
                        payload[input.name] = input.value;
                    }
                });

                // Validate required fields for Manual profiles (all properties)
                const requiredFields = ['web_length', 'flange_length', 'web_thk', 'flange_thk', 'F_y', 'Y', 'X', 'I_xx', 'I_yy', 'area', 'plastic_x', 'plastic_y'];
                const missingFields = requiredFields.filter(field => !payload[field] || payload[field] === '');
                
                if (missingFields.length > 0) {
                    throw new Error(`Missing fields: ${missingFields.join(', ')}`);
                }

                return payload;
            }, 'Enter all profile properties');
        }
    }

    /**
     * Update the steel profile preview panel with Jinja-equivalent calculations
     * Generic preview updater - handles all 5 item types with server-rendered HTML
     * @param {HTMLElement} item - The item container
     * @param {string} itemType - Type: steel_profile, glass_unit, frame, connection, or anchorage
     * @param {Function} payloadBuilder - Function to build payload from item's inputs
     * @param {string} validation - Message to show if validation fails (optional)
     */
    async function updatePreview(item, itemType, payloadBuilder, validation = 'Missing required data') {
        const container = item.querySelector('.profile-preview-content, .sub-item-preview-content');
        if (!container) return;

        let payload;
        try {
            payload = payloadBuilder(item);
        } catch (e) {
            container.innerHTML = `<p class="preview-placeholder">${validation}</p>`;
            return;
        }

        container.innerHTML = '<p class="preview-placeholder">Calculating…</p>';

        try {
            const response = await fetch('/calc_preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_type: itemType, payload })
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                const msg = data && data.error ? data.error : 'Calculation failed';
                container.innerHTML = `<p class="preview-placeholder">${msg}</p>`;
                return;
            }

            // Server returns fully rendered HTML
            container.innerHTML = data.html || '<p class="preview-placeholder">No data</p>';
        } catch (err) {
            container.innerHTML = '<p class="preview-placeholder">Calculation error</p>';
        }
    }

    /**
     * Update steel profile preview
     */
    function updateSteelProfilePreview(steelItem) {
        updatePreview(steelItem, 'steel_profile', (item) => {
            const fieldsContainer = item.querySelector('.item-fields');
            const webLength = fieldsContainer.querySelector('input[name="web_length"]')?.value;
            const flangeLength = fieldsContainer.querySelector('input[name="flange_length"]')?.value;
            const thickness = fieldsContainer.querySelector('input[name="thk"]')?.value;

            if (!webLength || !flangeLength || !thickness) {
                throw new Error('Missing dimensions');
            }

            return {
                web_length: webLength,
                flange_length: flangeLength,
                thk: thickness
            };
        }, 'Enter all dimensions');
    }

    /**
     * Update glass unit preview
     */
    function updateGlassPreview(glassItem) {
        updatePreview(glassItem, 'glass_unit', (item) => {
            const glassType = item.querySelector('select[name="glass_type"]')?.value;
            const fieldsContainer = item.querySelector('.item-fields');
            const payload = { glass_type: glassType };

            fieldsContainer.querySelectorAll('input, select').forEach(input => {
                if (input.name) payload[input.name] = input.value;
            });

            if (!payload.length || !payload.width || !payload.wind_load) {
                throw new Error('Missing core data');
            }

            return payload;
        }, 'Enter all glass parameters');
    }

    /**
     * Update frame preview
     */
    function updateFramePreview(frameItem) {
        updatePreview(frameItem, 'frame', (item) => {
            const frameData = {};
            item.querySelectorAll('input, select').forEach(input => {
                if (input.name && !input.name.includes('zone')) {
                    frameData[input.name] = input.value;
                }
            });

            if (!frameData.width || !frameData.length) {
                throw new Error('Missing frame dimensions');
            }

            // Get glass thickness from sibling glass units
            const categoryItem = item.closest('.dynamic-item');
            let glass_thickness = 0;
            categoryItem.querySelectorAll('[data-type="glass_unit"]').forEach(gi => {
                const type = gi.querySelector('select[name="glass_type"]')?.value;
                let thk = 0;
                if (type === 'sgu') {
                    thk = gi.querySelector('input[name="thickness"]')?.value || 0;
                } else if (type === 'dgu') {
                    const t1 = gi.querySelector('input[name="thickness1"]')?.value || 0;
                    const t2 = gi.querySelector('input[name="thickness2"]')?.value || 0;
                    thk = parseFloat(t1) + parseFloat(t2);
                }
                glass_thickness = Math.max(glass_thickness, parseFloat(thk));
            });

            return { ...frameData, glass_thickness };
        }, 'Enter all frame parameters');
    }

    /**
     * Update connection preview
     */
    function updateConnectionPreview(connectionItem) {
        updatePreview(connectionItem, 'connection', (item) => {
            const connData = {};
            item.querySelectorAll('input, select').forEach(input => {
                if (input.name) connData[input.name] = input.value;
            });

            if (!connData.screw_nos || !connData.screw_dia) {
                throw new Error('Missing screw data');
            }

            // Get frame and glass thickness from parent category
            const categoryItem = item.closest('.category-item');
            if (!categoryItem) {
                throw new Error('Category not found');
            }
            const frameItem = categoryItem.querySelector('[data-type="frame"]');
            const frameData = {};
            if (frameItem) {
                frameItem.querySelectorAll('input, select').forEach(input => {
                    if (input.name && !input.name.includes('zone')) {
                        frameData[input.name] = input.value;
                    }
                });
            }

            let glass_thickness = 0;
            categoryItem.querySelectorAll('[data-type="glass_unit"]').forEach(gi => {
                const type = gi.querySelector('select[name="glass_type"]')?.value;
                let thk = 0;
                if (type === 'sgu') {
                    thk = gi.querySelector('input[name="thickness"]')?.value || 0;
                } else if (type === 'dgu') {
                    const t1 = gi.querySelector('input[name="thickness1"]')?.value || 0;
                    const t2 = gi.querySelector('input[name="thickness2"]')?.value || 0;
                    thk = parseFloat(t1) + parseFloat(t2);
                }
                glass_thickness = Math.max(glass_thickness, parseFloat(thk));
            });

            return { ...connData, frame: frameData, glass_thickness };
        }, 'Enter all screw parameters');
    }

    /**
     * Update anchorage preview
     */
    function updateAnchoragePreview(anchorageItem) {
        updatePreview(anchorageItem, 'anchorage', (item) => {
            const anchorData = {};
            item.querySelectorAll('input, select').forEach(input => {
                if (input.name) anchorData[input.name] = input.value;
            });

            if (!anchorData.anchor_dia || !anchorData.embed_depth) {
                throw new Error('Missing anchor data');
            }

            // Get frame and glass thickness from parent category
            const categoryItem = item.closest('.category-item');
            if (!categoryItem) {
                throw new Error('Category not found');
            }
            const frameItem = categoryItem.querySelector('[data-type="frame"]');
            const frameData = {};
            if (frameItem) {
                frameItem.querySelectorAll('input, select').forEach(input => {
                    if (input.name && !input.name.includes('zone')) {
                        frameData[input.name] = input.value;
                    }
                });
            }

            let glass_thickness = 0;
            categoryItem.querySelectorAll('[data-type="glass_unit"]').forEach(gi => {
                const type = gi.querySelector('select[name="glass_type"]')?.value;
                let thk = 0;
                if (type === 'sgu') {
                    thk = gi.querySelector('input[name="thickness"]')?.value || 0;
                } else if (type === 'dgu') {
                    const t1 = gi.querySelector('input[name="thickness1"]')?.value || 0;
                    const t2 = gi.querySelector('input[name="thickness2"]')?.value || 0;
                    thk = parseFloat(t1) + parseFloat(t2);
                }
                glass_thickness = Math.max(glass_thickness, parseFloat(thk));
            });

            return { ...anchorData, frame: frameData, glass_thickness };
        }, 'Enter all anchor parameters');
    }



    /**
     * Get defined aluminum profiles from the Profiles tab
     * @returns {Array} Array of aluminum profile names
     */
    function getDefinedAlumProfiles() {
        const profiles = [];
        const alumList = document.getElementById('alum-profiles-list');
        if (alumList) {
            // Look for both input and select elements (Pre-defined uses select, others use input)
            alumList.querySelectorAll('.dynamic-item input[name="profile_name"], .dynamic-item select[name="profile_name"]').forEach(element => {
                const name = element.value.trim();
                if (name) profiles.push(name);
            });
        }
        return profiles;
    }

    /**
     * Get defined steel profiles from the Profiles tab
     * @returns {Array} Array of steel profile names
     */
    function getDefinedSteelProfiles() {
        const profiles = [];
        const steelList = document.getElementById('steel-profiles-list');
        if (steelList) {
            steelList.querySelectorAll('.dynamic-item input[name="profile_name"]').forEach(input => {
                const name = input.value.trim();
                if (name) profiles.push(name);
            });
        }
        return profiles;
    }

    /**
     * Refresh mullion, transom, and steel dropdowns in all frame items
     * Called whenever profiles are added/modified/removed
     */
    function refreshFrameProfileDropdowns() {
        // Get current profiles
        const alumProfiles = getDefinedAlumProfiles();
        const mullionProfiles = alumProfiles.filter(name => !name.startsWith('T'));
        const transomProfiles = alumProfiles.filter(name => name.startsWith('T'));
        const steelProfiles = getDefinedSteelProfiles();
        
        // Update all frame items
        document.querySelectorAll('.frame-item').forEach(frameItem => {
            // Update mullion dropdown
            const mullionSelect = frameItem.querySelector('select[name="mullion"]');
            if (mullionSelect) {
                const currentValue = mullionSelect.value;
                mullionSelect.innerHTML = '';
                mullionProfiles.forEach(profileName => {
                    const option = document.createElement('option');
                    option.value = profileName;
                    option.textContent = profileName;
                    mullionSelect.appendChild(option);
                });
                // Restore previous selection if it still exists
                if (currentValue && Array.from(mullionSelect.options).some(opt => opt.value === currentValue)) {
                    mullionSelect.value = currentValue;
                }
            }
            
            // Update transom dropdown
            const transomSelect = frameItem.querySelector('select[name="transom"]');
            if (transomSelect) {
                const currentValue = transomSelect.value;
                transomSelect.innerHTML = '';
                transomProfiles.forEach(profileName => {
                    const option = document.createElement('option');
                    option.value = profileName;
                    option.textContent = profileName;
                    transomSelect.appendChild(option);
                });
                // Restore previous selection if it still exists
                if (currentValue && Array.from(transomSelect.options).some(opt => opt.value === currentValue)) {
                    transomSelect.value = currentValue;
                }
            }
            
            // Update steel dropdown
            const steelSelect = frameItem.querySelector('select[name="steel"]');
            if (steelSelect) {
                const currentValue = steelSelect.value;
                steelSelect.innerHTML = '';
                steelProfiles.forEach(profileName => {
                    const option = document.createElement('option');
                    option.value = profileName;
                    option.textContent = profileName;
                    steelSelect.appendChild(option);
                });
                // Restore previous selection if it still exists
                if (currentValue && Array.from(steelSelect.options).some(opt => opt.value === currentValue)) {
                    steelSelect.value = currentValue;
                }
            }
        });
    }

    /**
     * Update frame fields based on selected geometry and mullion type
     * @param {HTMLElement} frameItem - The frame item container
     */
    function updateFrameFields(frameItem) {
        const geometrySelect = frameItem.querySelector('select[name="geometry"]');
        const typeSelect = frameItem.querySelector('select[name="mullion_type"]');
        const fieldsContainer = frameItem.querySelector('.item-fields');
        const selectedGeometry = geometrySelect.value;
        const selectedType = typeSelect.value;
        
        let requiredFields = (frameFields[selectedGeometry] && frameFields[selectedGeometry][selectedType]) || [];
        
        fieldsContainer.innerHTML = '';
        fieldsContainer.classList.add('form-section');

        requiredFields.forEach(fieldName => {
            let input;
            
            // Create dropdown for mullion (aluminum profiles without 'T' prefix)
            if (fieldName === 'mullion') {
                input = document.createElement('select');
                input.id = fieldName;
                input.name = fieldName;
                input.dataset.profileField = 'mullion'; // Mark as profile field
                
                const alumProfiles = getDefinedAlumProfiles().filter(name => !name.startsWith('T'));
                alumProfiles.forEach(profileName => {
                    const option = document.createElement('option');
                    option.value = profileName;
                    option.textContent = profileName;
                    input.appendChild(option);
                });
                
                // Add change listener to auto-populate I_xx, I_yy, phi_Mn
                input.addEventListener('change', (e) => populateProfileData(e.target, 'mullion'));
            }
            // Create dropdown for transom (aluminum profiles with 'T' prefix)
            else if (fieldName === 'transom') {
                input = document.createElement('select');
                input.id = fieldName;
                input.name = fieldName;
                input.dataset.profileField = 'transom'; // Mark as profile field
                
                const transomProfiles = getDefinedAlumProfiles().filter(name => name.startsWith('T'));
                transomProfiles.forEach(profileName => {
                    const option = document.createElement('option');
                    option.value = profileName;
                    option.textContent = profileName;
                    input.appendChild(option);
                });
                
                // Add change listener to auto-populate I_xx, I_yy, phi_Mn
                input.addEventListener('change', (e) => populateProfileData(e.target, 'transom'));
            }
            // Create dropdown for steel (steel profiles from steel-profiles-list)
            else if (fieldName === 'steel') {
                input = document.createElement('select');
                input.id = fieldName;
                input.name = fieldName;
                input.dataset.profileField = 'steel'; // Mark as profile field
                
                const steelProfiles = getDefinedSteelProfiles();
                steelProfiles.forEach(profileName => {
                    const option = document.createElement('option');
                    option.value = profileName;
                    option.textContent = profileName;
                    input.appendChild(option);
                });
                
                // Add change listener to auto-populate I_xx, I_yy, phi_Mn
                input.addEventListener('change', (e) => populateProfileData(e.target, 'steel'));
            }
            // Create number or text input for other fields
            else {
                let type = 'number';
                if (fieldName.match(/(_type|zone)/i)) {
                    type = 'text';
                }
                
                input = document.createElement('input');
                input.type = type;
                input.step = '0.1';
                input.id = fieldName;
                input.name = fieldName;
            }
            
            // Create form-field wrapper with label and optional unit
            const labelText = frameFieldPlaceholders[fieldName] || fieldName;
            const unit = extractUnitFromPlaceholder(labelText);
            const formField = createFormField(input, labelText, unit);
            
            fieldsContainer.appendChild(formField);
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
        fieldsContainer.classList.add('form-section');

        // Get default values for this clump type
        const defaultValues = anchorageDefaultValuesByType[selectedType] || {};

        requiredFields.forEach(fieldName => {
            let type = 'number'; 
            // Broad matching for number types in structural/clump fields
            if (fieldName.match(/(clump_type)/i)) {
                type = 'text';
            }

            const input = document.createElement('input');
            input.type = type;
            input.step = '0.1';
            input.id = fieldName;
            input.name = fieldName;
            
            // Set default value if available for this clump type
            if (defaultValues[fieldName]) {
                input.value = defaultValues[fieldName];
            }
            
            // Create form-field wrapper with label and optional unit
            const labelText = anchorageFieldPlaceholders[fieldName] || fieldName;
            const unit = extractUnitFromPlaceholder(labelText);
            const formField = createFormField(input, labelText, unit);
            
            fieldsContainer.appendChild(formField);
        });
    }


    // 5. DYNAMIC LIST MANAGEMENT
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
                
                // Refresh frame dropdowns if a profile was removed
                if (templateId === 'alum-profile-template' || templateId === 'steel-profile-template') {
                    refreshFrameProfileDropdowns();
                }
            });
        }
        
        // Handle type-specific field updates
        if (templateId === 'alum-profile-template') {
            const alumItem = newElement;
            const typeSelect = alumItem.querySelector('select[name="profile_type"]');
            
            updateAlumFields(alumItem);
            updateAlumProfilePreview(alumItem);  // Initial preview update
            
            typeSelect.addEventListener('change', () => {
                updateAlumFields(alumItem);
                updateAlumProfilePreview(alumItem);  // Update preview when type changes
                // Also refresh frame dropdowns when type changes
                setTimeout(() => refreshFrameProfileDropdowns(), 100);
            });
            
            // Use event delegation to catch changes in both input and select for profile_name
            const fieldsContainer = alumItem.querySelector('.item-fields');
            if (fieldsContainer) {
                fieldsContainer.addEventListener('change', (e) => {
                    if (e.target.name === 'profile_name') {
                        updateAlumProfilePreview(alumItem);  // Update preview when profile name changes
                        refreshFrameProfileDropdowns();
                    }
                    // Also update preview when any field value changes (for manual/stick profiles)
                    updateAlumProfilePreview(alumItem);
                });
                fieldsContainer.addEventListener('blur', (e) => {
                    if (e.target.name === 'profile_name') {
                        updateAlumProfilePreview(alumItem);  // Update preview on blur
                        refreshFrameProfileDropdowns();
                    }
                    updateAlumProfilePreview(alumItem);
                }, true);
                fieldsContainer.addEventListener('input', (e) => {
                    // Update preview in real-time as user types
                    updateAlumProfilePreview(alumItem);
                }, true);
            }
        }
        
        // Handle steel profiles - also refresh frame dropdowns when profile name changes
        if (templateId === 'steel-profile-template') {
            const steelItem = newElement;
            
            updateSteelProfilePreview(steelItem);  // Initial preview update
            
            // Add listener to profile name input to refresh frame dropdowns and update preview
            const profileNameInput = steelItem.querySelector('input[name="profile_name"]');
            if (profileNameInput) {
                profileNameInput.addEventListener('change', () => {
                    updateSteelProfilePreview(steelItem);
                    refreshFrameProfileDropdowns();
                });
                profileNameInput.addEventListener('blur', () => {
                    updateSteelProfilePreview(steelItem);
                    refreshFrameProfileDropdowns();
                });
            }
            
            // Add listeners to property inputs to update preview in real-time
            const fieldsContainer = steelItem.querySelector('.item-fields');
            if (fieldsContainer) {
                fieldsContainer.addEventListener('change', () => {
                    updateSteelProfilePreview(steelItem);
                });
                fieldsContainer.addEventListener('input', () => {
                    updateSteelProfilePreview(steelItem);
                }, true);
            }
        }
        
        // Handle glass type changes
        if (templateId === 'glass-unit-template') {
            const glassItem = newElement;
            const typeSelect = glassItem.querySelector('select[name="glass_type"]');
            
            updateGlassFields(glassItem);
            updateGlassPreview(glassItem);  // Initial preview update
            
            typeSelect.addEventListener('change', () => {
                updateGlassFields(glassItem);
                updateGlassPreview(glassItem);  // Update preview on type change
            });
            
            // Update preview on field changes
            const fieldsContainer = glassItem.querySelector('.item-fields');
            if (fieldsContainer) {
                fieldsContainer.addEventListener('change', () => {
                    updateGlassPreview(glassItem);
                });
                fieldsContainer.addEventListener('input', () => {
                    updateGlassPreview(glassItem);
                }, true);
            }
        }
        
        // Handle frame/mullion type changes
        if (templateId === 'frame-template') {
            const frameItem = newElement;
            const typeSelect = frameItem.querySelector('select[name="mullion_type"]');
            const geometrySelect = frameItem.querySelector('select[name="geometry"]');
            
            updateFrameFields(frameItem);
            updateFramePreview(frameItem);  // Initial preview update
            
            typeSelect.addEventListener('change', () => {
                updateFrameFields(frameItem);
                updateFramePreview(frameItem);  // Update preview on type change
            });
            
            geometrySelect.addEventListener('change', () => {
                updateFrameFields(frameItem);
                updateFramePreview(frameItem);  // Update preview on geometry change
            });
            
            // Update preview on field changes
            const fieldsContainer = frameItem.querySelector('.item-fields');
            if (fieldsContainer) {
                fieldsContainer.addEventListener('change', () => {
                    updateFramePreview(frameItem);
                });
                fieldsContainer.addEventListener('input', () => {
                    updateFramePreview(frameItem);
                }, true);
            }
            
            // Also update on select changes
            frameItem.querySelectorAll('select').forEach(select => {
                select.addEventListener('change', () => {
                    updateFramePreview(frameItem);
                });
            });
        }

        // Handle connection items
        if (templateId === 'connection-template') {
            const connectionItem = newElement;
            
            updateConnectionPreview(connectionItem);  // Initial preview update
            
            // Update preview on field changes
            const allInputs = connectionItem.querySelectorAll('input');
            allInputs.forEach(input => {
                input.addEventListener('change', () => {
                    updateConnectionPreview(connectionItem);
                });
                input.addEventListener('input', () => {
                    updateConnectionPreview(connectionItem);
                }, true);
            });
        }

        // Handle anchorage/clump type changes
        if (templateId === 'anchorage-template') {
            const anchorageItem = newElement;
            const typeSelect = anchorageItem.querySelector('select[name="clump_type"]');
            
            updateAnchorageFields(anchorageItem);
            updateAnchoragePreview(anchorageItem);  // Initial preview update
            
            typeSelect.addEventListener('change', () => {
                updateAnchorageFields(anchorageItem);
                updateAnchoragePreview(anchorageItem);  // Update preview on type change
            });
            
            // Update preview on field changes
            const fieldsContainer = anchorageItem.querySelector('.item-fields');
            if (fieldsContainer) {
                fieldsContainer.addEventListener('change', () => {
                    updateAnchoragePreview(anchorageItem);
                });
                fieldsContainer.addEventListener('input', () => {
                    updateAnchoragePreview(anchorageItem);
                }, true);
            }
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

    
    // 6. YAML OPERATIONS (IMPORT, GENERATE, DOWNLOAD)
    // --- Initialization & DOM References ---
    const form = document.getElementById('yaml-form');
    
    // Initialize with default items - wait for profile options to load first
    profileOptionsPromise.then(() => {
        // Add two pre-defined aluminum profiles by default (one mullion, one transom)
        const alumProfilesListEl = document.getElementById('alum-profiles-list');
        
        // Add first profile (Mullion - profile starting with 'M')
        addItem(alumProfilesListEl, 'alum-profile-template');
        const mullionItem = alumProfilesListEl.lastElementChild;
        if (mullionItem) {
            const typeSelect = mullionItem.querySelector('select[name="profile_type"]');
            if (typeSelect) {
                typeSelect.value = 'Pre-defined';
                typeSelect.dispatchEvent(new Event('change'));
                
                // Set to first available mullion profile (starting with 'M')
                setTimeout(() => {
                    const profileSelect = mullionItem.querySelector('select[name="profile_name"]');
                    if (profileSelect) {
                        const mullionProfile = Array.from(profileSelect.options).find(opt => opt.value.startsWith('M'));
                        if (mullionProfile) {
                            profileSelect.value = mullionProfile.value;
                            profileSelect.dispatchEvent(new Event('change'));
                        }
                    }
                }, 10);
            }
        }
        
        // Add second profile (Transom - profile starting with 'T')
        addItem(alumProfilesListEl, 'alum-profile-template');
        const transomItem = alumProfilesListEl.lastElementChild;
        if (transomItem) {
            const typeSelect = transomItem.querySelector('select[name="profile_type"]');
            if (typeSelect) {
                typeSelect.value = 'Pre-defined';
                typeSelect.dispatchEvent(new Event('change'));
                
                // Set to first available transom profile (starting with 'T')
                setTimeout(() => {
                    const profileSelect = transomItem.querySelector('select[name="profile_name"]');
                    if (profileSelect) {
                        const transomProfile = Array.from(profileSelect.options).find(opt => opt.value.startsWith('T'));
                        if (transomProfile) {
                            profileSelect.value = transomProfile.value;
                            profileSelect.dispatchEvent(new Event('change'));
                        }
                    }
                }, 10);
            }
        }
        
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
    });

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
                // Handle checkboxes (expecting 'yes'/'no' or booleans)
                if (field.type === 'checkbox') {
                    const v = typeof value === 'string' ? value.toLowerCase() : value;
                    field.checked = v === 'yes' || v === true || v === 'true' || v === 1 || v === '1';
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
        
        // Trigger profile data population for mullion, transom, and steel selections
        const mullionSelect = frameItem.querySelector('select[name="mullion"]');
        if (mullionSelect && mullionSelect.value) {
            populateProfileData(mullionSelect, 'mullion');
        }
        
        const transomSelect = frameItem.querySelector('select[name="transom"]');
        if (transomSelect && transomSelect.value) {
            populateProfileData(transomSelect, 'transom');
        }
        
        const steelSelect = frameItem.querySelector('select[name="steel"]');
        if (steelSelect && steelSelect.value) {
            populateProfileData(steelSelect, 'steel');
        }
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

    function triggerAllPreviews() {
        // Trigger preview updates for all items after form population
        document.querySelectorAll('[data-type="alum_profile"]').forEach(item => {
            updateAlumProfilePreview(item);
        });
        document.querySelectorAll('[data-type="steel_profile"]').forEach(item => {
            updateSteelProfilePreview(item);
        });
        document.querySelectorAll('[data-type="glass_unit"]').forEach(item => {
            updateGlassPreview(item);
        });
        document.querySelectorAll('[data-type="frame"]').forEach(item => {
            updateFramePreview(item);
        });
        document.querySelectorAll('[data-type="connection"]').forEach(item => {
            updateConnectionPreview(item);
        });
        document.querySelectorAll('[data-type="anchorage"]').forEach(item => {
            updateAnchoragePreview(item);
        });
    }

    function populateFormFromData(data = {}) {
        setSimpleGroupValues(data.project_info || {}, 'project_info');
        setSimpleGroupValues(data.include || {}, 'include');
        setSimpleGroupValues(data.wind || {}, 'wind');

        populateProfileList('alum-profiles-list', 'alum-profile-template', data.alum_profiles || [], 'profile_type');
        populateProfileList('steel-profiles-list', 'steel-profile-template', data.steel_profiles || []);

        populateCategories(data.categories || []);
        
        // Trigger preview calculations after form is populated
        // Use a small delay to ensure all profile data is fully populated
        setTimeout(() => {
            triggerAllPreviews();
        }, 100);
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
    
                const isCheckbox = input.type === 'checkbox';
                const value = isCheckbox ? (input.checked ? 'yes' : 'no') : input.value;
                current[path[path.length - 1]] = value;
            });
        };
        
        // 1. Include flags (checkboxes → 'yes'/'no')
        processSimpleInputs('[name^="include."]', 'include');
        
        // 2. Get Project Info (Will remain as strings)
        processSimpleInputs('[name^="project_info."]', 'project_info');
        
        // 3. Get Profiles
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
    
        // 4. Get Wind Parameters
        processSimpleInputs('[name^="wind."]', 'wind');
    
        // 5. Get Categories
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
                // Extra spacing between top-level blocks
                if (indent === 0) yaml += `\n`;
            } else {
                let formattedValue = value;
                if (typeof value === 'string') {
                    // Handle multi-line strings or strings with specific characters (like <br> in wind note)
                    if (value.includes('\n') || value.includes(': ') || value.includes('<br>')) {
                        // Use the YAML literal block scalar | and clean up <br> to newlines for display
                        const cleanValue = value.replace(/<br>/g, '\n').split('\n').map(line => `${'  '.repeat(indent + 1)}${line}`).join('\n');
                        formattedValue = `|-\n${cleanValue}`;
                    } else if (value.length > 50 || value.match(/[^a-zA-Z0-9.\s]/)) {
                        formattedValue = `'${value.replace(/'/g, "''")}'`;
                    }
                }
                yaml += `${spaces}${key}: ${formattedValue}\n`;
                // For top-level scalars, keep default spacing (no extra blank line)
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

    
    // 7. REPORT GENERATION    
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


// 8. FIGURE STATUS CHECKER
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
                const isCheckbox = input.type === 'checkbox';
                const value = isCheckbox ? (input.checked ? 'yes' : 'no') : input.value;
                current[path[path.length - 1]] = value;
            });
        };
    
        // 1. Get Project Info
        processSimpleInputs('[name^="project_info."]', 'project_info');
        // 1.1 Include flags (checkboxes → 'yes'/'no')
        processSimpleInputs('[name^="include."]', 'include');
    
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
                figureStatusList.innerHTML = `<li style="padding: 1rem; color: #ef4444; font-size: 0.8rem;">Error checking figures: ${error.message}</li>`;
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


    // 9. INPUT HELPER MODAL    
    const addFiguresBtn = document.getElementById('add-figures-btn');
    const inputHelperModal = document.getElementById('input-helper-modal');
    const closeInputHelper = document.getElementById('close-input-helper');
    const inputHelperContent = document.getElementById('input-helper-content');

    /**
     * Load input-helper.html content from server
     */
    async function loadInputHelperContent() {
        try {
            const response = await fetch('/input-helper');
            if (response.ok) {
                const html = await response.text();
                inputHelperContent.innerHTML = html;
            } else {
                inputHelperContent.textContent = 'Error loading input helper guide.';
            }
        } catch (error) {
            inputHelperContent.textContent = 'Error: Unable to fetch input helper guide.';
            console.error('Error loading input-helper.html:', error);
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
        if (e.key === 'Escape') {
            if (inputHelperModal && inputHelperModal.classList.contains('show')) {
                hideInputHelperModal();
            }
        }
    });

    // 10. PREVIEW MODAL
    const previewBtn = document.getElementById('preview-btn');
    const previewModal = document.getElementById('preview-modal');
    const closePreview = document.getElementById('close-preview');
    const previewContent = document.getElementById('preview-content');

    async function showPreviewModal() {
        if (!previewModal || !previewContent) return;
        previewContent.innerHTML = 'Loading...';
        previewModal.classList.add('show');
        try {
            // Reuse existing form and YAML generation
            const form = document.getElementById('yaml-form');
            const formData = getFormData(form);
            const yamlContent = toYamlString(formData);
            const response = await fetch('/preview_summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ yaml_content: yamlContent })
            });
            if (!response.ok) {
                const err = await response.text();
                throw new Error(err || 'Failed to load summary');
            }
            const html = await response.text();
            previewContent.innerHTML = html;
        } catch (err) {
            previewContent.innerHTML = `<div style="padding:1rem;color:#ef4444;">Error loading summary: ${err.message}</div>`;
        }
    }

    function hidePreviewModal() {
        if (!previewModal) return;
        previewModal.classList.remove('show');
    }

    if (previewBtn) {
        previewBtn.addEventListener('click', showPreviewModal);
    }
    if (closePreview) {
        closePreview.addEventListener('click', hidePreviewModal);
    }
    if (previewModal) {
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                hidePreviewModal();
            }
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (previewModal && previewModal.classList.contains('show')) {
                hidePreviewModal();
            }
        }
    });

    // 11. INPUTS DIRECTORY SELECTION
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
