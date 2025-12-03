let alumCount = 0;
let steelCount = 0;
let categoryCount = 0;

// -------------------- Utility for renumbering --------------------
function renumber(containerId, prefix, className) {
    const container = document.getElementById(containerId);
    const blocks = container.querySelectorAll(`.${className}`);
    blocks.forEach((block, index) => {
        const num = index + 1;
        const heading = block.querySelector("h4,h3");
        if(heading) heading.textContent = `${prefix} ${num}`;
        Array.from(block.querySelectorAll("input")).forEach(input => {
            const parts = input.name.split("_");
            if(parts.length > 1) {
                parts[parts.length - 2] = num; // Update numbering
                input.name = parts.join("_");
            }
        });
    });

    // Update hidden field for count
    let hidden = container.querySelector(`input[name='${containerId}_count']`);
    if (!hidden) {
        hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = `${containerId}_count`;
        container.appendChild(hidden);
    }
    hidden.value = blocks.length;
}

// -------------------- Aluminum Profiles --------------------
function addAlumProfile() {
    alumCount++;
    const container = document.getElementById("alumProfiles");
    const div = document.createElement("div");
    div.classList.add("alum-block");
    div.innerHTML = `
        <h4>Aluminum Profile</h4>
        <button type="button" onclick="this.parentElement.remove(); renumber('alumProfiles','Aluminum Profile','alum-block')">Remove</button>
        <input type="text" name="alum_${alumCount}_profile_name" placeholder="Profile Name" required>
        <input type="number" step="0.01" name="alum_${alumCount}_web_length" placeholder="Web Length" required>
        <input type="number" step="0.01" name="alum_${alumCount}_flange_length" placeholder="Flange Length" required>
        <input type="number" step="0.01" name="alum_${alumCount}_web_thk" placeholder="Web Thickness" required>
        <input type="number" step="0.01" name="alum_${alumCount}_flange_thk" placeholder="Flange Thickness" required>
    `;
    container.appendChild(div);
    renumber('alumProfiles','Aluminum Profile','alum-block');
}

// -------------------- Steel Profiles --------------------
function addSteelProfile() {
    steelCount++;
    const container = document.getElementById("steelProfiles");
    const div = document.createElement("div");
    div.classList.add("steel-block");
    div.innerHTML = `
        <h4>Steel Profile</h4>
        <button type="button" onclick="this.parentElement.remove(); renumber('steelProfiles','Steel Profile','steel-block')">Remove</button>
        <input type="text" name="steel_${steelCount}_profile_name" placeholder="Profile Name" required>
        <input type="number" step="0.01" name="steel_${steelCount}_web_length" placeholder="Web Length" required>
        <input type="number" step="0.01" name="steel_${steelCount}_flange_length" placeholder="Flange Length" required>
        <input type="number" step="0.01" name="steel_${steelCount}_web_thk" placeholder="Web Thickness" required>
        <input type="number" step="0.01" name="steel_${steelCount}_flange_thk" placeholder="Flange Thickness" required>
    `;
    container.appendChild(div);
    renumber('steelProfiles','Steel Profile','steel-block');
}

// -------------------- Categories --------------------
function addCategory() {
    categoryCount++;
    const container = document.getElementById("categories");
    const div = document.createElement("div");
    div.classList.add("category-block");
    div.innerHTML = `
        <h3>Category</h3>
        <button type="button" onclick="this.parentElement.remove(); renumberCategories()">Remove Category</button>
        <input type="text" name="category_${categoryCount}_name" placeholder="Category Name" required>
        <button type="button" onclick="addGlass(${categoryCount})">Add Glass Unit</button>
        <div id="category_${categoryCount}_glass"></div>
        <button type="button" onclick="addFrame(${categoryCount})">Add Frame</button>
        <div id="category_${categoryCount}_frames"></div>
        <button type="button" onclick="addConnection(${categoryCount})">Add Connection</button>
        <div id="category_${categoryCount}_connections"></div>
        <button type="button" onclick="addAnchorage(${categoryCount})">Add Anchorage</button>
        <div id="category_${categoryCount}_anchorage"></div>
    `;
    container.appendChild(div);
    renumberCategories();
}

function renumberCategories() {
    const container = document.getElementById("categories");
    const categories = container.querySelectorAll(".category-block");
    categories.forEach((cat, index) => {
        const catNum = index + 1;
        cat.querySelector("h3").textContent = `Category ${catNum}`;
        const nameInput = cat.querySelector("input[name^='category_']");
        if(nameInput) nameInput.name = `category_${catNum}_name`;

        // Update nested IDs
        ["glass","frames","connections","anchorage"].forEach(section => {
            const sec = cat.querySelector(`#category_${catNum}_${section}`);
            if(sec) sec.id = `category_${catNum}_${section}`;
        });

        // Update add buttons onclick
        const btnGlass = cat.querySelector("button[onclick^='addGlass']");
        if(btnGlass) btnGlass.setAttribute("onclick", `addGlass(${catNum})`);
        const btnFrame = cat.querySelector("button[onclick^='addFrame']");
        if(btnFrame) btnFrame.setAttribute("onclick", `addFrame(${catNum})`);
        const btnConn = cat.querySelector("button[onclick^='addConnection']");
        if(btnConn) btnConn.setAttribute("onclick", `addConnection(${catNum})`);
        const btnAnchor = cat.querySelector("button[onclick^='addAnchorage']");
        if(btnAnchor) btnAnchor.setAttribute("onclick", `addAnchorage(${catNum})`);

        // Renumber nested items
        renumberGlass(catNum);
        renumberFrame(catNum);
        renumberConnection(catNum);
        renumberAnchorage(catNum);
    });

    // Update hidden count
    let hidden = container.querySelector("input[name='categories_count']");
    if(!hidden){
        hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = "categories_count";
        container.appendChild(hidden);
    }
    hidden.value = categories.length;
}

// -------------------- Nested Sections --------------------
function addGlass(catId) {
    const container = document.getElementById(`category_${catId}_glass`);
    const div = document.createElement("div");
    div.classList.add("glass-block");
    div.innerHTML = `
        <h4>Glass Unit</h4>
        <button type="button" onclick="this.parentElement.remove(); renumberGlass(${catId})">Remove Glass</button>
        <input type="text" placeholder="Glass Type" required>
        <input type="number" step="0.01" placeholder="Length" required>
        <input type="number" step="0.01" placeholder="Width" required>
    `;
    container.appendChild(div);
    renumberGlass(catId);
}
function renumberGlass(catId) {
    const container = document.getElementById(`category_${catId}_glass`);
    const blocks = container.querySelectorAll(".glass-block");
    blocks.forEach((block, index) => {
        const num = index + 1;
        block.querySelector("h4").textContent = `Glass Unit ${num}`;
        Array.from(block.querySelectorAll("input")).forEach((input,i)=>{
            const field = ["glass_type","length","width"][i];
            input.name = `category_${catId}_glass_${num}_${field}`;
        });
    });
    let hidden = container.querySelector(`input[name='category_${catId}_num_glass']`);
    if(!hidden){
        hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = `category_${catId}_num_glass`;
        container.appendChild(hidden);
    }
    hidden.value = blocks.length;
}

function addFrame(catId) {
    const container = document.getElementById(`category_${catId}_frames`);
    const div = document.createElement("div");
    div.classList.add("frame-block");
    div.innerHTML = `
        <h4>Frame</h4>
        <button type="button" onclick="this.parentElement.remove(); renumberFrame(${catId})">Remove Frame</button>
        <input type="text" placeholder="Frame Type" required>
        <input type="number" step="0.01" placeholder="Length" required>
        <input type="number" step="0.01" placeholder="Width" required>
    `;
    container.appendChild(div);
    renumberFrame(catId);
}
function renumberFrame(catId) {
    const container = document.getElementById(`category_${catId}_frames`);
    const blocks = container.querySelectorAll(".frame-block");
    blocks.forEach((block,index)=>{
        const num = index+1;
        block.querySelector("h4").textContent = `Frame ${num}`;
        Array.from(block.querySelectorAll("input")).forEach((input,i)=>{
            const field=["frame_type","length","width"][i];
            input.name = `category_${catId}_frame_${num}_${field}`;
        });
    });
    let hidden = container.querySelector(`input[name='category_${catId}_num_frames']`);
    if(!hidden){
        hidden=document.createElement("input");
        hidden.type="hidden";
        hidden.name=`category_${catId}_num_frames`;
        container.appendChild(hidden);
    }
    hidden.value=blocks.length;
}

function addConnection(catId) {
    const container = document.getElementById(`category_${catId}_connections`);
    const div = document.createElement("div");
    div.classList.add("connection-block");
    div.innerHTML = `
        <h4>Connection</h4>
        <button type="button" onclick="this.parentElement.remove(); renumberConnection(${catId})">Remove Connection</button>
        <input type="number" step="0.01" placeholder="Screw Nos" required>
        <input type="text" placeholder="Cleat Size" required>
    `;
    container.appendChild(div);
    renumberConnection(catId);
}
function renumberConnection(catId) {
    const container = document.getElementById(`category_${catId}_connections`);
    const blocks = container.querySelectorAll(".connection-block");
    blocks.forEach((block,index)=>{
        const num=index+1;
        block.querySelector("h4").textContent=`Connection ${num}`;
        Array.from(block.querySelectorAll("input")).forEach((input,i)=>{
            const field=["screw_nos","cleat_size"][i];
            input.name=`category_${catId}_conn_${num}_${field}`;
        });
    });
    let hidden=container.querySelector(`input[name='category_${catId}_num_connections']`);
    if(!hidden){
        hidden=document.createElement("input");
        hidden.type="hidden";
        hidden.name=`category_${catId}_num_connections`;
        container.appendChild(hidden);
    }
    hidden.value=blocks.length;
}

function addAnchorage(catId) {
    const container = document.getElementById(`category_${catId}_anchorage`);
    const div = document.createElement("div");
    div.classList.add("anchorage-block");
    div.innerHTML = `
        <h4>Anchorage</h4>
        <button type="button" onclick="this.parentElement.remove(); renumberAnchorage(${catId})">Remove Anchorage</button>
        <input type="text" placeholder="Clump Type" required>
        <input type="number" step="0.01" placeholder="Reaction Ry" required>
        <input type="number" step="0.01" placeholder="Reaction Rz" required>
    `;
    container.appendChild(div);
    renumberAnchorage(catId);
}
function renumberAnchorage(catId) {
    const container = document.getElementById(`category_${catId}_anchorage`);
    const blocks = container.querySelectorAll(".anchorage-block");
    blocks.forEach((block,index)=>{
        const num=index+1;
        block.querySelector("h4").textContent=`Anchorage ${num}`;
        Array.from(block.querySelectorAll("input")).forEach((input,i)=>{
            const field=["clump_type","reaction_Ry","reaction_Rz"][i];
            input.name=`category_${catId}_anchor_${num}_${field}`;
        });
    });
    let hidden=container.querySelector(`input[name='category_${catId}_num_anchor']`);
    if(!hidden){
        hidden=document.createElement("input");
        hidden.type="hidden";
        hidden.name=`category_${catId}_num_anchor`;
        container.appendChild(hidden);
    }
    hidden.value=blocks.length;
}


function toggleSection(btn) {
    const content = btn.parentElement.nextElementSibling; // block-content div
    if(content.style.display === "none") {
        content.style.display = "block";
        btn.textContent = "▼";
    } else {
        content.style.display = "none";
        btn.textContent = "►";
    }
}

