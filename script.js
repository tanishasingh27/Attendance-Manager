// Data models
let student = { name: "", course: "", required: 75 };
let subjects = []; // {id, name, total, attended} 

// Helpers
const qs = id => document.getElementById(id);

// Init
window.addEventListener('load', () => {
    loadAll();
    renderAll();

    // Verify elements exist (helps avoid runtime errors in partial DOMs)
    ['addSubjectBtn','required','studentName','course','subjectsTable','clearDataBtn'].forEach(id=>{
        if(!qs(id)) console.warn('Missing element:', id);
    });

    // Wire up UI (guarded)
    let el;
    el = qs('addSubjectBtn'); if(el) el.addEventListener('click', addSubject);
    el = qs('required'); if(el) el.addEventListener('input', () => { student.required = Number(qs('required').value || 0); saveAll(); renderAll(); });
    el = qs('studentName'); if(el) el.addEventListener('input', () => { student.name = qs('studentName').value; saveAll(); });
    el = qs('course'); if(el) el.addEventListener('input', () => { student.course = qs('course').value; saveAll(); });
    el = qs('clearDataBtn'); if(el) el.addEventListener('click', clearAllData);
});

function today() {
    let d = new Date();
    return d.toISOString().slice(0,10);
}

// Persistence
function saveAll() {
    localStorage.setItem('attendance_student', JSON.stringify(student));
    localStorage.setItem('attendance_subjects', JSON.stringify(subjects));
}

function loadAll() {
    let s = localStorage.getItem('attendance_student');
    if (s) student = JSON.parse(s);

    let subs = localStorage.getItem('attendance_subjects');
    if (subs) subjects = JSON.parse(subs);

    // populate inputs
    qs('studentName').value = student.name || '';
    qs('course').value = student.course || '';
    qs('required').value = student.required || 0;


}

// Subjects
function addSubject() {
    let name = qs('subjectName').value.trim();
    if (!name) return alert('Enter a subject name');

    let id = Date.now().toString();
    subjects.push({ id, name, total: 0, attended: 0 });
    qs('subjectName').value = '';
    saveAll();
    renderAll();
}

function deleteSubject(id) {
    if (!confirm('Delete this subject?')) return;
    subjects = subjects.filter(s => s.id !== id);
    saveAll();
    renderAll();
}

function editSubject(id) {
    let s = subjects.find(x => x.id === id);
    if (!s) return;
    let name = prompt('Rename subject:', s.name);
    if (name && name.trim()) {
        s.name = name.trim();
        saveAll();
        renderAll();
    }
}



function classesNeeded(attended, total, requiredPct) {
    let R = requiredPct / 100;
    if (R >= 1) {
        if (attended === total) return 0;
        return Infinity;
    }
    let numerator = R * total - attended;
    if (numerator <= 0) return 0;
    let denom = 1 - R;
    return Math.ceil(numerator / denom);
}



// Render summary
function renderSubjectsTable() {
    let tbody = qs('subjectsTable');
    tbody.innerHTML = '';
    let req = Number(qs('required').value || 0);

    subjects.forEach(s => {
        let total = s.total || 0;
        let attended = s.attended || 0;
        let pct = total === 0 ? 0 : (attended / total) * 100;
        let needed = classesNeeded(attended, total, req);

        // display logic: if no classes yet, show '-' for percentage and status
        let pctText = total === 0 ? '-' : pct.toFixed(2) + '%';
        let statusText = total === 0 ? '-' : (pct >= req ? 'Above' : 'Below');
        let statusClass = total === 0 ? 'muted' : (pct >= req ? 'ok' : 'low');

        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(s.name)}</td>
            <td>${total}</td>
            <td>${attended}</td>
            <td>${pctText}</td>
            <td class="${statusClass}">${statusText}</td>
            <td>${needed === Infinity ? 'Impossible (100%)' : (needed === 0 ? '-' : needed)}</td>
            <td>
                <button class="btn small present" data-act="present" data-id="${s.id}">✓</button>
                <button class="btn small absent" data-act="absent" data-id="${s.id}">✗</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // actions
    tbody.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', (e) => {
            let id = b.dataset.id;
            if (b.dataset.act === 'present') markPresent(id);
            if (b.dataset.act === 'absent') markAbsent(id);
        });
    });
} 

function renderAll() {
    renderSubjectsTable();
}

function markPresent(id) {
    let s = subjects.find(x => x.id === id);
    if (!s) return;
    s.total = (s.total || 0) + 1;
    s.attended = (s.attended || 0) + 1;
    saveAll();
    renderAll();
}

function markAbsent(id) {
    let s = subjects.find(x => x.id === id);
    if (!s) return;
    s.total = (s.total || 0) + 1;
    saveAll();
    renderAll();
}

function clearAllData() {
    if (!confirm('Clear all saved student data? This cannot be undone.')) return;
    localStorage.removeItem('attendance_student');
    localStorage.removeItem('attendance_subjects');
    student = { name: '', course: '', required: 75 };
    subjects = [];
    saveAll();

    // Update visible inputs immediately and re-render table
    if (qs('studentName')) qs('studentName').value = student.name;
    if (qs('course')) qs('course').value = student.course;
    if (qs('required')) qs('required').value = student.required;
    renderAll();
}

 



// Utility
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

