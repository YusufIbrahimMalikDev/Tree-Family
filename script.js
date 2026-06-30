
    // ========== DATA MODEL ==========
    let people = [];       
    let nextId = 1;
    let nextMemberNumber = 1;
    let relations = [];    
    let showButtons = true;
    let currentZoom = 1;
    let controlsVisible = true;
    let pendingEditId = null;
    
    let relationLineColor = "#2e7d64";
    let isTransparent = false;

    // ========== STORAGE KEY ==========
    const STORAGE_KEY = 'family_tree_data';

    // ========== SAVE & LOAD ==========
    function saveDataToStorage() {
        const data = {
            people: people,
            relations: relations,
            nextId: nextId,
            nextMemberNumber: nextMemberNumber,
            relationLineColor: relationLineColor,
            isTransparent: isTransparent
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch(e) {
            console.warn('Gagal menyimpan ke localStorage:', e);
        }
    }

    function loadDataFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            if (!data.people || !Array.isArray(data.people)) return false;
            
            people = data.people;
            relations = data.relations || [];
            nextId = data.nextId || 1;
            nextMemberNumber = data.nextMemberNumber || 1;
            relationLineColor = data.relationLineColor || "#2e7d64";
            isTransparent = data.isTransparent || false;
            
            // Pastikan setiap person punya childrenIds
            people.forEach(p => {
                if (!p.childrenIds) p.childrenIds = [];
                // Pastikan memberNumber ada
                if (!p.memberNumber) p.memberNumber = people.indexOf(p) + 1;
            });
            
            return true;
        } catch(e) {
            console.warn('Gagal memuat data dari localStorage:', e);
            return false;
        }
    }

    function clearAllData() {
        if (!confirm('⚠️ Hapus SEMUA data keluarga? Ini tidak bisa dibatalkan!')) return;
        localStorage.removeItem(STORAGE_KEY);
        people = [];
        relations = [];
        nextId = 1;
        nextMemberNumber = 1;
        relationLineColor = "#2e7d64";
        isTransparent = false;
        renderTree();
        closeJsonModal();
        showJsonStatus('✅ Semua data telah dihapus', 'success');
    }

    // ========== FUNGSI JSON ==========
    function openJsonModal() {
        const textarea = document.getElementById('jsonTextArea');
        const data = {
            people: people,
            relations: relations,
            nextId: nextId,
            nextMemberNumber: nextMemberNumber,
            relationLineColor: relationLineColor,
            isTransparent: isTransparent
        };
        textarea.value = JSON.stringify(data, null, 2);
        document.getElementById('jsonStatus').style.display = 'none';
        document.getElementById('jsonModal').style.display = 'flex';
    }

    function closeJsonModal() {
        document.getElementById('jsonModal').style.display = 'none';
    }

    function exportJson() {
        const data = {
            people: people,
            relations: relations,
            nextId: nextId,
            nextMemberNumber: nextMemberNumber,
            relationLineColor: relationLineColor,
            isTransparent: isTransparent
        };
        const json = JSON.stringify(data, null, 2);
        document.getElementById('jsonTextArea').value = json;
        saveDataToStorage();
        showJsonStatus('✅ Data berhasil disimpan ke localStorage!', 'success');
        
        // Download file
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `family_tree_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function importJson() {
        const textarea = document.getElementById('jsonTextArea');
        const raw = textarea.value.trim();
        if (!raw) {
            showJsonStatus('❌ Tidak ada data untuk diimpor', 'error');
            return;
        }
        try {
            const data = JSON.parse(raw);
            if (!data.people || !Array.isArray(data.people)) {
                showJsonStatus('❌ Format JSON tidak valid: tidak ada array "people"', 'error');
                return;
            }
            
            people = data.people;
            relations = data.relations || [];
            nextId = data.nextId || 1;
            nextMemberNumber = data.nextMemberNumber || 1;
            relationLineColor = data.relationLineColor || "#2e7d64";
            isTransparent = data.isTransparent || false;
            
            people.forEach(p => {
                if (!p.childrenIds) p.childrenIds = [];
                if (!p.memberNumber) p.memberNumber = people.indexOf(p) + 1;
            });
            
            saveDataToStorage();
            renderTree();
            showJsonStatus('✅ Data berhasil diimpor!', 'success');
        } catch(e) {
            showJsonStatus('❌ Error parsing JSON: ' + e.message, 'error');
        }
    }

    function copyJson() {
        const textarea = document.getElementById('jsonTextArea');
        navigator.clipboard.writeText(textarea.value).then(() => {
            showJsonStatus('✅ JSON berhasil disalin ke clipboard!', 'success');
        }).catch(() => {
            textarea.select();
            document.execCommand('copy');
            showJsonStatus('✅ JSON berhasil disalin!', 'success');
        });
    }

    function showJsonStatus(message, type) {
        const status = document.getElementById('jsonStatus');
        status.textContent = message;
        status.className = 'json-status ' + type;
        status.style.display = 'block';
        setTimeout(() => {
            status.style.display = 'none';
        }, 4000);
    }

    // ========== FUNGSI UTAMA ==========
    function createPerson(name, gender, fatherId = null, motherId = null) {
        return { id: nextId++, name, gender, fatherId, motherId, childrenIds: [], memberNumber: nextMemberNumber++ };
    }

    function getPersonById(id) { return people.find(p => p.id === id); }

    function renumberAllMembers() {
        let counter = 1;
        people.forEach(p => { p.memberNumber = counter++; });
        nextMemberNumber = counter;
    }

    function resetToDemo() {
        people = [];
        relations = [];
        nextId = 1;
        nextMemberNumber = 1;
        
        const father = createPerson("Bapak Ahmad", "male");
        const mother = createPerson("Ibu Siti", "female");
        const child1 = createPerson("Ali", "male", father.id, mother.id);
        const child2 = createPerson("Nina", "female", father.id, mother.id);
        const child3 = createPerson("Budi", "male", father.id, mother.id);
        const freeNode = createPerson("Joko (bebas)", "male");
        
        // Update childrenIds
        father.childrenIds = [child1.id, child2.id, child3.id];
        mother.childrenIds = [child1.id, child2.id, child3.id];
        
        relations.push({ fromId: child1.id, toId: child2.id, label: "Saudara" });
        relations.push({ fromId: freeNode.id, toId: child1.id, label: "Teman" });
        
        renumberAllMembers();
        saveDataToStorage();
        renderTree();
    }
    
    function buildForest() {
        const nodeMap = new Map();
        const roots = [];
        people.forEach(p => { nodeMap.set(p.id, { person: p, children: [] }); });
        
        people.forEach(p => {
            if (p.fatherId !== null) {
                const fatherNode = nodeMap.get(p.fatherId);
                if (fatherNode && !fatherNode.children.includes(p.id)) fatherNode.children.push(p.id);
            } 
            else if (p.motherId !== null && p.fatherId === null) {
                const motherNode = nodeMap.get(p.motherId);
                if (motherNode && !motherNode.children.includes(p.id)) motherNode.children.push(p.id);
            }
        });
        
        const isChild = new Set();
        for (let node of nodeMap.values()) {
            for (let childId of node.children) isChild.add(childId);
        }
        for (let person of people) {
            if (!isChild.has(person.id)) roots.push(person.id);
        }
        return { nodeMap, roots };
    }
    
    function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])); }
    
    function renderTree() {
        const container = document.getElementById('familyTree');
        if (!people.length) {
            container.innerHTML = `<div class="empty-state"><h2>🌱 Kosong</h2><button onclick="resetToDemo()">Muat Contoh Keluarga (Ayah+Ibu + Node Bebas)</button></div>`;
            updateModalSelects();
            drawRelations();
            return;
        }
        const { nodeMap, roots } = buildForest();
        
        function hasParentInTree(personId) {
            const p = getPersonById(personId);
            if (!p) return false;
            if (p.fatherId !== null) return true;
            if (p.motherId !== null) return true;
            return false;
        }
        
        function renderNode(personId, visited = new Set()) {
            if (visited.has(personId)) return '';
            visited.add(personId);
            const person = getPersonById(personId);
            if (!person) return '';
            const childrenIds = nodeMap.get(personId)?.children || [];
            const genderIcon = person.gender === 'male' ? '👨' : '👩';
            const hasChildren = childrenIds.length > 0;
            const hasParent = hasParentInTree(personId);
            const liClass = hasParent ? 'tree-node-item has-parent-line' : 'tree-node-item';
            
            let html = `<li data-person-id="${person.id}" class="${liClass}">
                <a href="#" onclick="return false;">
                    <span class="member-number">${person.memberNumber}</span>
                    <i>${genderIcon}</i> 
                    ${escapeHtml(person.name)}
                </a>`;
            if (showButtons) {
                html += `<div class="action-buttons">
                    <button onclick="openEditModal(${person.id})">✏️ Edit</button>
                    <button class="delete" onclick="deletePerson(${person.id})">🗑️ Hapus</button>
                </div>`;
            }
            if (hasChildren) {
                html += `<ul>`;
                for (let childId of childrenIds) {
                    html += renderNode(childId, visited);
                }
                html += `</ul>`;
            }
            html += `</li>`;
            return html;
        }
        
        let forestHtml = `<ul class="forest-root">`;
        for (let rootId of roots) {
            forestHtml += renderNode(rootId);
        }
        forestHtml += `</ul>`;
        container.innerHTML = forestHtml;
        updateModalSelects();
        applyZoom();
        drawRelations();
    }
    
    function drawRelations() {
        const svgLayer = document.getElementById('relationSvgLayer');
        const treeContainer = document.querySelector('.tree');
        const relativeWrap = document.getElementById('treeRelativeContainer');
        if (!treeContainer || !people.length) { svgLayer.innerHTML = ''; return; }
        const containerRect = relativeWrap.getBoundingClientRect();
        
        const nodeElements = document.querySelectorAll('.tree-node-item');
        const coordMap = new Map();
        nodeElements.forEach(el => {
            const personId = parseInt(el.getAttribute('data-person-id'));
            if (isNaN(personId)) return;
            const link = el.querySelector('a');
            if (!link) return;
            const rect = link.getBoundingClientRect();
            const centerX = rect.left + rect.width/2 - containerRect.left;
            const centerY = rect.top + rect.height/2 - containerRect.top;
            coordMap.set(personId, { x: centerX, y: centerY });
        });
        
        let effectiveColor = relationLineColor;
        let strokeOpacity = 1;
        let textOpacity = 1;
        if (isTransparent) {
            strokeOpacity = 0.3;
            textOpacity = 0.5;
        }
        
        let svgContent = `<svg width="100%" height="100%" style="position: absolute; top:0; left:0;">`;
        // Garis tambahan dari anak ke ibu (jika anak punya ayah & ibu)
        for (let person of people) {
            if (person.motherId !== null && person.fatherId !== null) {
                const childCoord = coordMap.get(person.id);
                const motherCoord = coordMap.get(person.motherId);
                if (childCoord && motherCoord) {
                    let x1 = childCoord.x, y1 = childCoord.y;
                    let x2 = motherCoord.x, y2 = motherCoord.y;
                    let midX = (x1 + x2) / 2;
                    let midY = (y1 + y2) / 2 - 15;
                    svgContent += `<path d="M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}" class="relation-line" fill="none" stroke="${effectiveColor}" stroke-opacity="${strokeOpacity}" stroke-width="3" stroke-dasharray="6 4" />`;
                    svgContent += `<text x="${midX}" y="${midY - 6}" text-anchor="middle" font-size="10" fill="${effectiveColor}" fill-opacity="${textOpacity}" font-weight="bold">👩 Ibu</text>`;
                }
            }
        }
        // Relasi custom user
        for (let rel of relations) {
            const fromCoord = coordMap.get(rel.fromId);
            const toCoord = coordMap.get(rel.toId);
            if (fromCoord && toCoord) {
                let x1 = fromCoord.x, y1 = fromCoord.y;
                let x2 = toCoord.x, y2 = toCoord.y;
                let midX = (x1 + x2) / 2;
                let midY = (y1 + y2) / 2 - 12;
                svgContent += `<path d="M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}" class="relation-line" fill="none" stroke="${effectiveColor}" stroke-opacity="${strokeOpacity}" stroke-width="3.5" stroke-dasharray="7 5" />`;
                if (rel.label) {
                    svgContent += `<text x="${midX}" y="${midY - 8}" text-anchor="middle" font-size="11" fill="${effectiveColor}" fill-opacity="${textOpacity}" font-weight="bold">${escapeHtml(rel.label)}</text>`;
                } else {
                    svgContent += `<circle cx="${midX}" cy="${midY-2}" r="3" fill="${effectiveColor}" fill-opacity="${textOpacity}" />`;
                }
            }
        }
        svgContent += `</svg>`;
        svgLayer.innerHTML = svgContent;
    }
    
    // ========== FUNGSI MODAL WARNA ==========
    function openColorModal() {
        const picker = document.getElementById('relationColorPicker');
        const preview = document.getElementById('colorPreviewBox');
        const hexLabel = document.getElementById('hexColorLabel');
        const transparentChk = document.getElementById('transparentCheckbox');
        if(picker) picker.value = relationLineColor;
        if(preview) {
            preview.style.background = isTransparent ? 'repeating-conic-gradient(#e0e0e0 0% 25%, white 0% 50%) 50% / 12px 12px' : relationLineColor;
            preview.classList.toggle('transparent', isTransparent);
        }
        if(hexLabel) hexLabel.textContent = isTransparent ? 'transparan' : relationLineColor;
        if(transparentChk) transparentChk.checked = isTransparent;
        document.getElementById('colorModal').style.display = 'flex';
    }
    function closeColorModal() {
        document.getElementById('colorModal').style.display = 'none';
    }
    function applyRelationColor() {
        const picker = document.getElementById('relationColorPicker');
        const transparentChk = document.getElementById('transparentCheckbox');
        if(picker) relationLineColor = picker.value;
        isTransparent = transparentChk ? transparentChk.checked : false;
        saveDataToStorage();
        drawRelations();
        closeColorModal();
    }
    function resetRelationColor() {
        relationLineColor = "#2e7d64";
        isTransparent = false;
        const picker = document.getElementById('relationColorPicker');
        const preview = document.getElementById('colorPreviewBox');
        const hexLabel = document.getElementById('hexColorLabel');
        const transparentChk = document.getElementById('transparentCheckbox');
        if(picker) picker.value = relationLineColor;
        if(preview) {
            preview.style.background = relationLineColor;
            preview.classList.remove('transparent');
        }
        if(hexLabel) hexLabel.textContent = relationLineColor;
        if(transparentChk) transparentChk.checked = false;
        saveDataToStorage();
        drawRelations();
        closeColorModal();
    }
    
    // Live preview saat memilih warna & checkbox
    document.addEventListener('input', function(e) {
        if(e.target && e.target.id === 'relationColorPicker') {
            const preview = document.getElementById('colorPreviewBox');
            const hexLabel = document.getElementById('hexColorLabel');
            const transparentChk = document.getElementById('transparentCheckbox');
            if(preview && !transparentChk.checked) {
                preview.style.background = e.target.value;
                preview.classList.remove('transparent');
            }
            if(hexLabel) hexLabel.textContent = e.target.value;
        }
        if(e.target && e.target.id === 'transparentCheckbox') {
            const preview = document.getElementById('colorPreviewBox');
            const hexLabel = document.getElementById('hexColorLabel');
            if(preview) {
                if(e.target.checked) {
                    preview.style.background = 'repeating-conic-gradient(#e0e0e0 0% 25%, white 0% 50%) 50% / 12px 12px';
                    preview.classList.add('transparent');
                    if(hexLabel) hexLabel.textContent = 'transparan';
                } else {
                    const picker = document.getElementById('relationColorPicker');
                    if(picker) {
                        preview.style.background = picker.value;
                        preview.classList.remove('transparent');
                        if(hexLabel) hexLabel.textContent = picker.value;
                    }
                }
            }
        }
    });
    
    // ========== FUNGSI LAINNYA ==========
    function addMemberWithParents() {
        const name = document.getElementById('modalNameInput').value.trim();
        const gender = document.getElementById('modalGenderSelect').value;
        const fatherId = parseInt(document.getElementById('modalFatherSelect').value) || null;
        const motherId = parseInt(document.getElementById('modalMotherSelect').value) || null;
        if (!name) { alert('Masukkan nama!'); return; }
        if (fatherId === motherId && fatherId !== null) { alert('Ayah dan Ibu tidak boleh sama'); return; }
        const newPerson = createPerson(name, gender, fatherId, motherId);
        
        if (fatherId) {
            const father = getPersonById(fatherId);
            if (father && !father.childrenIds.includes(newPerson.id)) father.childrenIds.push(newPerson.id);
        }
        if (motherId) {
            const mother = getPersonById(motherId);
            if (mother && !mother.childrenIds.includes(newPerson.id)) mother.childrenIds.push(newPerson.id);
        }
        people.push(newPerson);
        renumberAllMembers();
        saveDataToStorage();
        closeAddMemberModal();
        renderTree();
    }
    
    function deletePerson(id) {
        const person = getPersonById(id);
        if (!person) return;
        if (confirm(`Hapus "${person.name}" dan semua relasinya?`)) {
            if (person.fatherId) { let f = getPersonById(person.fatherId); if(f) f.childrenIds = f.childrenIds.filter(cid => cid !== id); }
            if (person.motherId) { let m = getPersonById(person.motherId); if(m) m.childrenIds = m.childrenIds.filter(cid => cid !== id); }
            people = people.filter(p => p.id !== id);
            relations = relations.filter(r => r.fromId !== id && r.toId !== id);
            renumberAllMembers();
            saveDataToStorage();
            renderTree();
        }
    }
    
    function openEditModal(id) { pendingEditId = id; const p = getPersonById(id); if(p){ document.getElementById('editNameInput').value = p.name; document.getElementById('editGenderSelect').value = p.gender; document.getElementById('editModal').style.display='flex';} }
    function saveEdit() { 
        const newName = document.getElementById('editNameInput').value.trim(); 
        const newGender = document.getElementById('editGenderSelect').value;
        if(!newName) return;
        const person = getPersonById(pendingEditId);
        if(person){ person.name = newName; person.gender = newGender; saveDataToStorage(); renderTree(); }
        closeEditModal();
    }
    
    function updateModalSelects() {
        const fatherSelect = document.getElementById('modalFatherSelect');
        const motherSelect = document.getElementById('modalMotherSelect');
        if (fatherSelect && motherSelect) {
            let opts = '<option value="">-- Tidak pilih (akar bebas) --</option>';
            people.forEach(p => { opts += `<option value="${p.id}">#${p.memberNumber} ${p.name} (${p.gender === 'male' ? 'Laki' : 'Perempuan'})</option>`; });
            fatherSelect.innerHTML = opts;
            motherSelect.innerHTML = opts;
        }
        const relSelect1 = document.getElementById('relationMember1Select');
        const relSelect2 = document.getElementById('relationMember2Select');
        if(relSelect1){
            let optsRel = '<option value="">-- Pilih Anggota --</option>';
            people.forEach(p => { optsRel += `<option value="${p.id}">#${p.memberNumber} ${p.name}</option>`; });
            relSelect1.innerHTML = optsRel;
            relSelect2.innerHTML = optsRel;
        }
    }
    
    function openRelationModal() { updateModalSelects(); document.getElementById('relationModal').style.display='flex'; }
    function closeRelationModal() { document.getElementById('relationModal').style.display='none'; }
    function saveRelation() {
        const fromId = parseInt(document.getElementById('relationMember1Select').value);
        const toId = parseInt(document.getElementById('relationMember2Select').value);
        const label = document.getElementById('relationLabelInput').value.trim();
        if(isNaN(fromId) || isNaN(toId) || fromId===toId) { alert("Pilih dua anggota berbeda"); return; }
        if(relations.some(r => (r.fromId===fromId && r.toId===toId) || (r.fromId===toId && r.toId===fromId))) { alert("Relasi sudah ada"); return; }
        relations.push({ fromId, toId, label });
        saveDataToStorage();
        closeRelationModal();
        drawRelations();
    }
    function openDeleteRelationModal() {
        const container = document.getElementById('relationListContainer');
        if(relations.length===0) container.innerHTML = '<div style="padding:20px">Tidak ada relasi</div>';
        else {
            let html = '';
            relations.forEach((rel,idx)=>{
                const p1 = getPersonById(rel.fromId)?.name || "?";
                const p2 = getPersonById(rel.toId)?.name || "?";
                html += `<div class="relation-item"><span>🔗 ${p1} ↔ ${p2} ${rel.label ? `(${rel.label})` : ''}</span><button onclick="deleteSingleRelation(${idx})">Hapus</button></div>`;
            });
            container.innerHTML = html;
        }
        document.getElementById('deleteRelationModal').style.display='flex';
    }
    function deleteSingleRelation(idx){ relations.splice(idx,1); saveDataToStorage(); openDeleteRelationModal(); drawRelations(); }
    function closeDeleteRelationModal(){ document.getElementById('deleteRelationModal').style.display='none'; }
    
    function toggleActionButtons(){ showButtons=document.getElementById('showButtonsCheckbox').checked; renderTree(); }
    function applyZoom(){ const treeEl=document.querySelector('.tree'); if(treeEl) treeEl.style.transform=`scale(${currentZoom})`; setTimeout(()=>drawRelations(),30); }
    function zoomIn(){ currentZoom=Math.min(currentZoom+0.1,2.5); applyZoom(); }
    function zoomOut(){ currentZoom=Math.max(currentZoom-0.1,0.4); applyZoom(); }
    function resetZoom(){ currentZoom=1; applyZoom(); }
    function printTree(){ window.print(); }
    function toggleDarkMode(){ document.body.classList.toggle('dark-mode'); setTimeout(drawRelations,40); }
    function toggleFloatingControls() { controlsVisible = !controlsVisible; const ctrl=document.getElementById('floatingControls'); ctrl.classList.toggle('hidden'); document.getElementById('toggleControlsBtn').innerHTML = controlsVisible ? '🎮 Sembunyikan Kontrol' : '🎮 Tampilkan Kontrol'; }
    function closeAddMemberModal(){ document.getElementById('addMemberModal').style.display='none'; }
    function closeEditModal(){ document.getElementById('editModal').style.display='none'; pendingEditId=null; }
    
    const dragContainer = document.getElementById('dragContainer');
    let isDragging=false, startX, startY, scrollLeft, scrollTop;
    dragContainer.addEventListener('mousedown',(e)=>{ if(e.target.closest('button')||e.target.closest('input')) return; isDragging=true; dragContainer.classList.add('dragging'); startX=e.pageX-dragContainer.offsetLeft; startY=e.pageY-dragContainer.offsetTop; scrollLeft=dragContainer.scrollLeft; scrollTop=dragContainer.scrollTop; e.preventDefault(); });
    window.addEventListener('mousemove',(e)=>{ if(!isDragging) return; const x=e.pageX-dragContainer.offsetLeft; const y=e.pageY-dragContainer.offsetTop; dragContainer.scrollLeft=scrollLeft-((x-startX)*1.2); dragContainer.scrollTop=scrollTop-((y-startY)*1.2); });
    window.addEventListener('mouseup',()=>{ isDragging=false; dragContainer.classList.remove('dragging'); });
    
    window.onclick = function(e) { if(e.target===document.getElementById('addMemberModal')) closeAddMemberModal(); if(e.target===document.getElementById('editModal')) closeEditModal(); if(e.target===document.getElementById('relationModal')) closeRelationModal(); if(e.target===document.getElementById('deleteRelationModal')) closeDeleteRelationModal(); if(e.target===document.getElementById('colorModal')) closeColorModal(); if(e.target===document.getElementById('jsonModal')) closeJsonModal(); };
    
    // ========== INISIALISASI ==========
    const hasSavedData = loadDataFromStorage();
    if (hasSavedData && people.length > 0) {
        renderTree();
    } else {
        resetToDemo();
    }
    
    // expose functions
    window.openAddMemberModal = () => { updateModalSelects(); document.getElementById('addMemberModal').style.display='flex'; };
    window.openEditModal = openEditModal; window.saveEdit = saveEdit; window.deletePerson = deletePerson;
    window.toggleActionButtons = toggleActionButtons; window.toggleFloatingControls = toggleFloatingControls; window.zoomIn = zoomIn; window.zoomOut = zoomOut; window.resetZoom = resetZoom; window.printTree = printTree; window.toggleDarkMode = toggleDarkMode; window.openRelationModal = openRelationModal; window.closeRelationModal = closeRelationModal; window.saveRelation = saveRelation; window.openDeleteRelationModal = openDeleteRelationModal; window.deleteSingleRelation = deleteSingleRelation; window.addMemberWithParents = addMemberWithParents; window.closeAddMemberModal = closeAddMemberModal; window.closeEditModal = closeEditModal; window.resetToDemo = resetToDemo;
    window.openColorModal = openColorModal; window.closeColorModal = closeColorModal; window.applyRelationColor = applyRelationColor; window.resetRelationColor = resetRelationColor;
    window.openJsonModal = openJsonModal; window.closeJsonModal = closeJsonModal; window.exportJson = exportJson; window.importJson = importJson; window.copyJson = copyJson; window.clearAllData = clearAllData;
