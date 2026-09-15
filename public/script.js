const pages = document.querySelectorAll(".page");
const PSGC_BASE = "https://psgc.gitlab.io/api";
const HTC_EMAIL_SUFFIX = "@online.htcgsc.edu.ph";
const PAGE_SIZE = 8;
const API_BASE = "/api";

// Departments whose program runs a 5th year. Edit this list to change
// which departments show the "5th Year" option during registration.
const FIVE_YEAR_DEPARTMENTS = ["CETE"];

const showPage = id => {
    pages.forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
};

const escapeHtml = str => String(str ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

const fullName = s => [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ");
const addressText = s => [s.barangay, s.city, (s.province && s.province !== "N/A") ? s.province : null, s.region, s.zip]
    .filter(Boolean).join(", ");
const clearanceOf = s => s.clearance || {};

const showWarning = (el, msg) => { if (el) { el.textContent = msg; el.classList.add("show"); } };
const hideWarning = el => { if (el) { el.textContent = ""; el.classList.remove("show"); } };
const clearAllWarnings = () => document.querySelectorAll(".field-warning").forEach(hideWarning);

const navTargets = {
    departmentButton: "departmentPage",
    studentButton: "studentPage",
    adminButton: "adminPage",
    registerButton: "registerPage",
    departmentBack: "homePage",
    studentBack: "homePage",
    adminBack: "homePage",
    registerBack: "studentPage",
    adminLogout: "homePage",
    departmentLogout: "homePage",
    studentLogout: "homePage",
    studentInfoLogout: "homePage"
};

Object.entries(navTargets).forEach(([btnId, pageId]) => {
    document.getElementById(btnId).onclick = () => showPage(pageId);
});

/* =========================================================
   API HELPERS — every call to the MySQL-backed server goes
   through one of these. Each throws an Error with a friendly
   message on failure so callers can just show it in an alert.
   ========================================================= */

async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    return data;
}

async function apiPatch(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    return data;
}

async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`);
    if (res.status === 404) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not reach the server.");
    return data;
}

const apiRegister = payload => apiPost("/register", payload);
const apiLoginStudent = (id, password) => apiPost("/login/student", { id, password });
const apiLoginAdmin = (email, password) => apiPost("/login/admin", { email, password });
const apiLoginDepartment = (department, id, password) => apiPost("/login/department", { department, id, password });
const apiGetStudents = department => apiGet(department ? `/students?department=${encodeURIComponent(department)}` : "/students");
const apiGetStudent = id => apiGet(`/students/${encodeURIComponent(id)}`);
const apiToggleClearance = (id, office) => apiPatch(`/students/${encodeURIComponent(id)}/clearance`, { office });

/* =========================================================
   REGISTRATION — field references
   ========================================================= */

const regFirstName = document.getElementById("regFirstName");
const regFirstNameWarning = document.getElementById("regFirstNameWarning");
const regMiddleName = document.getElementById("regMiddleName");
const regMiddleNameWarning = document.getElementById("regMiddleNameWarning");
const regLastName = document.getElementById("regLastName");
const regLastNameWarning = document.getElementById("regLastNameWarning");

const regId = document.getElementById("regId");
const regIdWarning = document.getElementById("regIdWarning");

const regDepartment = document.getElementById("regDepartment");
const regYearLevel = document.getElementById("regYearLevel");

let regRegion = document.getElementById("regRegion");
const regRegionWarning = document.getElementById("regRegionWarning");
let regProvince = document.getElementById("regProvince");
const regProvinceWarning = document.getElementById("regProvinceWarning");
let regCity = document.getElementById("regCity");
const regCityWarning = document.getElementById("regCityWarning");
let regBarangay = document.getElementById("regBarangay");
const regBarangayWarning = document.getElementById("regBarangayWarning");

const regZip = document.getElementById("regZip");
const regZipWarning = document.getElementById("regZipWarning");

const regContact = document.getElementById("regContact");
const regContactWarning = document.getElementById("regContactWarning");

const regEmail = document.getElementById("regEmail");
const regEmailWarning = document.getElementById("regEmailWarning");
const emailCheckBtn = document.getElementById("emailCheckBtn");
const emailVerifyBox = document.getElementById("emailVerifyBox");
const emailVerifyMessage = document.getElementById("emailVerifyMessage");
const emailImMeBtn = document.getElementById("emailImMeBtn");
let emailVerified = false;

const passwordInput = document.getElementById("password");
const passwordWarning = document.getElementById("passwordWarning");
const confirmPasswordInput = document.getElementById("confirmPassword");
const confirmPasswordWarning = document.getElementById("confirmPasswordWarning");

/* =========================================================
   NAME FIELDS — letters and spaces only
   ========================================================= */

const NAME_DISALLOWED = /[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g;

function wireNameField(input, warningEl) {
    input.addEventListener("input", () => {
        const raw = input.value;
        const cleaned = raw.replace(NAME_DISALLOWED, "");
        if (cleaned !== raw) {
            input.value = cleaned;
            showWarning(warningEl, "Numbers and special characters (like - or _) are not allowed in a name.");
        } else {
            hideWarning(warningEl);
        }
    });
}
wireNameField(regFirstName, regFirstNameWarning);
wireNameField(regMiddleName, regMiddleNameWarning);
wireNameField(regLastName, regLastNameWarning);

/* =========================================================
   STUDENT ID — numbers only
   ========================================================= */

regId.addEventListener("input", () => {
    const raw = regId.value;
    const cleaned = raw.replace(/[^0-9]/g, "");
    if (cleaned !== raw) {
        regId.value = cleaned;
        showWarning(regIdWarning, "Student ID must contain numbers only.");
    } else {
        hideWarning(regIdWarning);
    }
});

/* =========================================================
   YEAR LEVEL — 5th Year option only appears for departments
   listed in FIVE_YEAR_DEPARTMENTS above.
   ========================================================= */

function updateYearLevelOptions() {
    const dept = regDepartment.value;
    const shouldHaveFifth = FIVE_YEAR_DEPARTMENTS.includes(dept);
    const fifthOption = regYearLevel.querySelector('option[value="5th Year"]');

    if (shouldHaveFifth && !fifthOption) {
        const opt = document.createElement("option");
        opt.value = "5th Year";
        opt.textContent = "5th Year";
        regYearLevel.appendChild(opt);
    } else if (!shouldHaveFifth && fifthOption) {
        if (regYearLevel.value === "5th Year") regYearLevel.value = "";
        fifthOption.remove();
    }
}

regDepartment.addEventListener("change", updateYearLevelOptions);

/* =========================================================
   ZIP CODE — numbers only, 4 digits
   ========================================================= */

regZip.addEventListener("input", () => {
    const raw = regZip.value;
    const hadLetters = /[^0-9]/.test(raw);
    const digits = raw.replace(/[^0-9]/g, "").slice(0, 4);
    regZip.value = digits;
    if (hadLetters) {
        showWarning(regZipWarning, "Zip code must contain numbers only.");
    } else if (digits.length > 0 && digits.length < 4) {
        showWarning(regZipWarning, "Zip code must be 4 digits.");
    } else {
        hideWarning(regZipWarning);
    }
});

/* =========================================================
   CONTACT NUMBER — numbers only, exactly 11 digits
   ========================================================= */

regContact.addEventListener("input", () => {
    const raw = regContact.value;
    const hadLetters = /[^0-9]/.test(raw);
    const digits = raw.replace(/[^0-9]/g, "").slice(0, 11);
    regContact.value = digits;
    if (hadLetters) {
        showWarning(regContactWarning, "Contact number must contain numbers only.");
    } else if (digits.length > 0 && digits.length < 11) {
        showWarning(regContactWarning, "Contact number must be exactly 11 digits.");
    } else {
        hideWarning(regContactWarning);
    }
});

/* =========================================================
   ADDRESS — Region > Province > City/Municipality > Barangay
   Data source: PSGC public API (live Philippine geographic data)
   ========================================================= */

function fillSelect(select, items, placeholder) {
    select.innerHTML = `<option value="">${placeholder}</option>` +
        items.map(it => `<option value="${it.code}">${escapeHtml(it.name)}</option>`).join("");
}

function lockSelect(select, placeholder) {
    if (select.tagName === "SELECT") {
        select.innerHTML = `<option value="">${placeholder}</option>`;
        select.disabled = true;
    }
}

async function loadRegions() {
    try {
        const res = await fetch(`${PSGC_BASE}/regions/`);
        if (!res.ok) throw new Error("bad response");
        const data = await res.json();
        data.sort((a, b) => a.name.localeCompare(b.name));
        fillSelect(regRegion, data, "Select Region");
    } catch (err) {
        regRegion.innerHTML = '<option value="">Could not load — check your internet connection</option>';
        showWarning(regRegionWarning, "The region list failed to load. Please check your internet connection and reload the page.");
    }
}

regRegion.addEventListener("change", async () => {
    lockSelect(regProvince, "Select Region First");
    lockSelect(regCity, "Select Province First");
    lockSelect(regBarangay, "Select City/Municipality First");
    hideWarning(regProvinceWarning);
    hideWarning(regCityWarning);
    hideWarning(regBarangayWarning);

    const code = regRegion.value;
    if (!code) return;

    regProvince.innerHTML = '<option value="">Loading provinces…</option>';
    try {
        const res = await fetch(`${PSGC_BASE}/regions/${code}/provinces/`);
        if (!res.ok) throw new Error("bad response");
        const provinces = await res.json();

        if (provinces.length) {
            provinces.sort((a, b) => a.name.localeCompare(b.name));
            fillSelect(regProvince, provinces, "Select Province");
            regProvince.disabled = false;
        } else {
            // Regions like NCR have no provinces — cities/municipalities sit directly under the region.
            regProvince.innerHTML = '<option value="N/A" selected>N/A — this region has no provinces</option>';
            if (regCity.tagName === "SELECT") {
                regCity.innerHTML = '<option value="">Loading cities/municipalities…</option>';
                const cityRes = await fetch(`${PSGC_BASE}/regions/${code}/cities-municipalities/`);
                const cities = await cityRes.json();
                cities.sort((a, b) => a.name.localeCompare(b.name));
                fillSelect(regCity, cities, "Select City/Municipality");
                regCity.disabled = false;
            }
        }
    } catch (err) {
        regProvince.innerHTML = '<option value="">Could not load — check your connection</option>';
        showWarning(regProvinceWarning, "The province list failed to load. Please check your internet connection.");
    }
});

regProvince.addEventListener("change", async () => {
    lockSelect(regCity, "Select Province First");
    lockSelect(regBarangay, "Select City/Municipality First");
    hideWarning(regCityWarning);
    hideWarning(regBarangayWarning);

    const code = regProvince.value;
    if (!code || code === "N/A" || regCity.tagName !== "SELECT") return;

    regCity.innerHTML = '<option value="">Loading cities/municipalities…</option>';
    try {
        const res = await fetch(`${PSGC_BASE}/provinces/${code}/cities-municipalities/`);
        if (!res.ok) throw new Error("bad response");
        const cities = await res.json();
        cities.sort((a, b) => a.name.localeCompare(b.name));
        fillSelect(regCity, cities, "Select City/Municipality");
        regCity.disabled = false;
    } catch (err) {
        regCity.innerHTML = '<option value="">Could not load — check your connection</option>';
        showWarning(regCityWarning, "The city/municipality list failed to load. Please check your internet connection, or type it in manually below.");
    }
});

regCity.addEventListener("change", async () => {
    if (regBarangay.tagName !== "SELECT") return;
    lockSelect(regBarangay, "Select City/Municipality First");
    hideWarning(regBarangayWarning);

    const code = regCity.value;
    if (!code) return;

    regBarangay.innerHTML = '<option value="">Loading barangays…</option>';
    try {
        const res = await fetch(`${PSGC_BASE}/cities-municipalities/${code}/barangays/`);
        if (!res.ok) throw new Error("bad response");
        const barangays = await res.json();
        barangays.sort((a, b) => a.name.localeCompare(b.name));
        fillSelect(regBarangay, barangays, "Select Barangay");
        regBarangay.disabled = false;
    } catch (err) {
        regBarangay.innerHTML = '<option value="">Could not load — check your connection</option>';
        showWarning(regBarangayWarning, "The barangay list failed to load. Please check your internet connection, or type it in manually below.");
    }
});

document.getElementById("cityManualToggle").addEventListener("click", function () {
    const manual = document.createElement("input");
    manual.type = "text";
    manual.id = "regCity";
    manual.placeholder = "Type your City / Municipality";
    regCity.replaceWith(manual);
    regCity = manual;
    this.remove();
    // Once the city is typed manually, the barangay list can no longer be looked up either.
    const barangayToggle = document.getElementById("barangayManualToggle");
    if (barangayToggle) barangayToggle.click();
});

document.getElementById("barangayManualToggle").addEventListener("click", function () {
    const manual = document.createElement("input");
    manual.type = "text";
    manual.id = "regBarangay";
    manual.placeholder = "Type your Barangay";
    regBarangay.replaceWith(manual);
    regBarangay = manual;
    this.remove();
});

function resetAddressCascade() {
    if (regRegion.tagName === "SELECT") regRegion.value = "";
    if (regProvince.tagName === "SELECT") lockSelect(regProvince, "Select Region First");
    if (regCity.tagName === "SELECT") lockSelect(regCity, "Select Province First"); else regCity.value = "";
    if (regBarangay.tagName === "SELECT") lockSelect(regBarangay, "Select City/Municipality First"); else regBarangay.value = "";
}

loadRegions();

/* =========================================================
   EMAIL — must end with @online.htcgsc.edu.ph, plus a demo
   "verify it's you" step before the form can be submitted
   ========================================================= */

function isValidHtcEmail(email) {
    const basicShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return basicShape && email.toLowerCase().endsWith(HTC_EMAIL_SUFFIX);
}

regEmail.addEventListener("input", () => {
    emailVerified = false;
    emailVerifyBox.classList.add("hidden");
    if (regEmail.value && !isValidHtcEmail(regEmail.value)) {
        showWarning(regEmailWarning, `That email looks invalid. It must end with ${HTC_EMAIL_SUFFIX}`);
    } else {
        hideWarning(regEmailWarning);
    }
});

emailCheckBtn.addEventListener("click", () => {
    if (!isValidHtcEmail(regEmail.value)) {
        showWarning(regEmailWarning, `That email looks invalid. It must end with ${HTC_EMAIL_SUFFIX}`);
        return;
    }
    hideWarning(regEmailWarning);
    emailVerifyBox.classList.remove("hidden");
    emailImMeBtn.classList.remove("hidden");
    emailVerifyMessage.textContent = `A verification notice was sent for ${regEmail.value}. (Demo only — no real email is sent.) Click below to confirm it's you.`;
});

emailImMeBtn.addEventListener("click", () => {
    emailVerified = true;
    emailVerifyMessage.textContent = "✅ Email verified. You may continue registering.";
    emailImMeBtn.classList.add("hidden");
});

/* =========================================================
   PASSWORD — needs 1 uppercase, 1 lowercase, 1 number;
   special characters are allowed but not required
   ========================================================= */

function passwordIssues(pw) {
    const missing = [];
    if (!/[A-Z]/.test(pw)) missing.push("1 uppercase letter");
    if (!/[a-z]/.test(pw)) missing.push("1 lowercase letter");
    if (!/[0-9]/.test(pw)) missing.push("1 number");
    return missing;
}

passwordInput.addEventListener("input", () => {
    if (!passwordInput.value) { hideWarning(passwordWarning); return; }
    const missing = passwordIssues(passwordInput.value);
    if (missing.length) {
        showWarning(passwordWarning, "Password must contain at least " + missing.join(" and ") + ".");
    } else {
        hideWarning(passwordWarning);
    }
    if (confirmPasswordInput.value) confirmPasswordInput.dispatchEvent(new Event("input"));
});

confirmPasswordInput.addEventListener("input", () => {
    if (confirmPasswordInput.value && confirmPasswordInput.value !== passwordInput.value) {
        showWarning(confirmPasswordWarning, "Passwords do not match.");
    } else {
        hideWarning(confirmPasswordWarning);
    }
});

/* =========================================================
   REGISTER SUBMIT — now posts to /api/register instead of
   writing straight into localStorage.
   ========================================================= */

document.getElementById("registerForm").addEventListener("submit", async e => {
    e.preventDefault();

    const firstName = regFirstName.value.trim();
    const middleName = regMiddleName.value.trim();
    const lastName = regLastName.value.trim();
    const id = regId.value.trim();
    const department = regDepartment.value;
    const yearLevel = regYearLevel.value;

    const regionText = regRegion.value ? regRegion.options[regRegion.selectedIndex].text : "";
    const provinceText = regProvince.value === "N/A" ? "N/A" : (regProvince.value ? regProvince.options[regProvince.selectedIndex].text : "");
    const cityText = regCity.tagName === "INPUT" ? regCity.value.trim() : (regCity.value ? regCity.options[regCity.selectedIndex].text : "");
    const barangayText = regBarangay.tagName === "INPUT" ? regBarangay.value.trim() : (regBarangay.value ? regBarangay.options[regBarangay.selectedIndex].text : "");

    const zip = regZip.value.trim();
    const contact = regContact.value.trim();
    const email = regEmail.value.trim();
    const password = passwordInput.value;
    const confirmPw = confirmPasswordInput.value;

    const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
    let error = null;

    if (!firstName || !NAME_RE.test(firstName)) error = error || "Please enter a valid first name.";
    if (!error && (!lastName || !NAME_RE.test(lastName))) error = error || "Please enter a valid last name.";
    if (!error && middleName && !NAME_RE.test(middleName)) error = error || "Please enter a valid middle name.";
    if (!error && !/^[0-9]+$/.test(id)) error = error || "Student ID must contain numbers only.";
    if (!error && !department) error = error || "Please select a department / program.";
    if (!error && !yearLevel) error = error || "Please select a year level.";
    if (!error && !regionText) error = error || "Please select a region.";
    if (!error && !provinceText) error = error || "Please select a province.";
    if (!error && !cityText) error = error || "Please select or type a city/municipality.";
    if (!error && !barangayText) error = error || "Please select or type a barangay.";
    if (!error && !/^[0-9]{4}$/.test(zip)) error = error || "Zip code must be exactly 4 digits.";
    if (!error && !/^[0-9]{11}$/.test(contact)) error = error || "Contact number must be exactly 11 digits.";
    if (!error && !isValidHtcEmail(email)) error = error || `Email must end with ${HTC_EMAIL_SUFFIX}`;
    if (!error && !emailVerified) error = error || "Please click Check, then \"It's me, continue\" to verify your email.";
    if (!error && passwordIssues(password).length) error = error || "Password must contain at least 1 uppercase letter, 1 lowercase letter and 1 number.";
    if (!error && password !== confirmPw) error = error || "Passwords do not match.";

    if (error) return alert(error);

    try {
        await apiRegister({
            firstName, middleName, lastName, id, department, yearLevel,
            region: regionText, province: provinceText, city: cityText, barangay: barangayText, zip,
            contact, email, password
        });
    } catch (err) {
        return alert(err.message);
    }

    alert("Student registration submitted. You can now log in.");
    e.target.reset();
    resetAddressCascade();
    updateYearLevelOptions();
    clearAllWarnings();
    emailVerified = false;
    emailVerifyBox.classList.add("hidden");
    emailImMeBtn.classList.remove("hidden");
    showPage("studentPage");
});

/* =========================================================
   STUDENT LOGIN + DASHBOARD
   ========================================================= */

let currentStudentId = "";

document.getElementById("studentForm").onsubmit = async e => {
    e.preventDefault();
    const id = document.getElementById("studentLoginId").value.trim();
    const password = document.getElementById("studentLoginPassword").value;

    let student;
    try {
        student = await apiLoginStudent(id, password);
    } catch (err) {
        return alert(err.message);
    }

    currentStudentId = student.id;
    renderStudentDashboard(student);
    e.target.reset();
    showPage("studentDashboardPage");
};

function renderClearanceList(ul, clearance) {
    const offices = Object.keys(clearance);
    ul.innerHTML = offices.map(office => {
        const status = clearance[office];
        const cls = status === "Approved" ? "approved" : "";
        return `<li><span>${escapeHtml(office)}</span><span class="status-pill ${cls}">${escapeHtml(status)}</span></li>`;
    }).join("") || '<li><span>No clearance record found for this account.</span></li>';
}

function updateProgress(clearance) {
    const values = Object.values(clearance);
    const done = values.filter(v => v === "Approved").length;
    const total = values.length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    document.getElementById("clearanceProgressFill").style.width = pct + "%";
    document.getElementById("clearanceProgressLabel").textContent =
        total ? `${done} of ${total} offices cleared (${pct}%)` : "No clearance record found for this account.";
}

function renderStudentInfo(student) {
    const info = document.getElementById("studentInfoList");
    info.innerHTML = "";
    [
        ["Name", fullName(student)],
        ["Student ID", student.id],
        ["Department", student.department],
        ["Year Level", student.yearLevel],
        ["Address", addressText(student)],
        ["Contact Number", student.contact],
        ["Email", student.email]
    ].forEach(([label, value]) => {
        info.insertAdjacentHTML("beforeend", `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`);
    });
}

function renderStudentDashboard(student) {
    renderStudentInfo(student);

    const clearance = clearanceOf(student);
    renderClearanceList(document.getElementById("clearanceList"), clearance);
    updateProgress(clearance);
}

document.getElementById("myInfoButton").onclick = async () => {
    // Re-read from the DB in case a staff member updated something since login.
    let student;
    try {
        student = await apiGetStudent(currentStudentId);
    } catch (err) {
        return alert(err.message);
    }
    if (student) renderStudentInfo(student);
    showPage("studentInfoPage");
};

document.getElementById("studentInfoBack").onclick = async () => {
    let student;
    try {
        student = await apiGetStudent(currentStudentId);
    } catch (err) {
        return alert(err.message);
    }
    if (student) renderStudentDashboard(student);
    showPage("studentDashboardPage");
};

/* =========================================================
   SHARED: search/filter helpers, stat cards, pagination
   ========================================================= */

function renderStats(container, students) {
    const total = students.length;
    const fullyCleared = students.filter(s => {
        const vals = Object.values(clearanceOf(s));
        return vals.length && vals.every(v => v === "Approved");
    }).length;
    container.innerHTML = `
        <div class="stat-card"><div class="stat-icon">👥</div><div><div class="stat-value">${total}</div><div class="stat-label">Registered Students</div></div></div>
        <div class="stat-card"><div class="stat-icon">✅</div><div><div class="stat-value">${fullyCleared}</div><div class="stat-label">Fully Cleared</div></div></div>
        <div class="stat-card"><div class="stat-icon">🕒</div><div><div class="stat-value">${total - fullyCleared}</div><div class="stat-label">Pending Clearance</div></div></div>
    `;
}

function clearanceSummaryText(clearance) {
    const values = Object.values(clearance);
    if (!values.length) return '<span class="mini-progress">—</span>';
    const done = values.filter(v => v === "Approved").length;
    return `<span class="mini-progress">${done}/${values.length} cleared</span>`;
}

// Slices a list to the given page and renders prev/next + "X–Y of Z" controls
// into the given container. onChange receives the newly requested page number.
function renderPaginationControls(container, total, page, pageSize, onChange) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startItem = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const endItem = Math.min(total, safePage * pageSize);

    container.innerHTML = `
        <button type="button" class="page-btn" id="${container.id}-prev" ${safePage <= 1 ? "disabled" : ""} aria-label="Previous page">‹</button>
        <span class="page-info">${startItem}–${endItem} of ${total}</span>
        <button type="button" class="page-btn" id="${container.id}-next" ${safePage >= totalPages ? "disabled" : ""} aria-label="Next page">›</button>
    `;

    document.getElementById(`${container.id}-prev`).onclick = () => onChange(safePage - 1);
    document.getElementById(`${container.id}-next`).onclick = () => onChange(safePage + 1);

    return safePage;
}

/* =========================================================
   SHARED DETAIL MODAL (used by Admin + Department "View")
   ========================================================= */

const detailModal = document.getElementById("detailModal");

async function openDetailModal(id, editable) {
    let student;
    try {
        student = await apiGetStudent(id);
    } catch (err) {
        return alert(err.message);
    }
    if (!student) return;

    const info = document.getElementById("modalInfoList");
    info.innerHTML = "";
    [
        ["Name", fullName(student)],
        ["Student ID", student.id],
        ["Department", student.department],
        ["Year Level", student.yearLevel],
        ["Address", addressText(student)],
        ["Contact Number", student.contact],
        ["Email", student.email]
    ].forEach(([label, value]) => {
        info.insertAdjacentHTML("beforeend", `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`);
    });

    const clearance = clearanceOf(student);
    const list = document.getElementById("modalClearanceList");
    const offices = Object.keys(clearance);

    list.innerHTML = offices.map(office => {
        const status = clearance[office];
        const cls = status === "Approved" ? "approved" : "";
        if (editable) {
            return `<li><span>${escapeHtml(office)}</span>
                <button type="button" class="status-pill ${cls} toggle-status" style="border:0;cursor:pointer;"
                    data-office="${escapeHtml(office)}" data-id="${escapeHtml(student.id)}">${escapeHtml(status)}</button></li>`;
        }
        return `<li><span>${escapeHtml(office)}</span><span class="status-pill ${cls}">${escapeHtml(status)}</span></li>`;
    }).join("") || '<li><span>No clearance record found for this account.</span></li>';

    if (editable) {
        list.querySelectorAll(".toggle-status").forEach(btn => {
            btn.onclick = async () => {
                const office = btn.getAttribute("data-office");
                const studentId = btn.getAttribute("data-id");
                try {
                    await apiToggleClearance(studentId, office);
                } catch (err) {
                    return alert(err.message);
                }
                await openDetailModal(id, editable);
                if (document.getElementById("adminDashboardPage").classList.contains("active")) renderAdminTable();
                if (document.getElementById("departmentDashboardPage").classList.contains("active")) renderDepartmentTable();
            };
        });
    }

    detailModal.classList.remove("hidden");
}

document.getElementById("detailModalClose").onclick = () => detailModal.classList.add("hidden");
detailModal.addEventListener("click", e => { if (e.target === detailModal) detailModal.classList.add("hidden"); });

/* =========================================================
   ADMIN LOGIN + DASHBOARD
   ========================================================= */

let adminPage = 1;

document.getElementById("adminForm").onsubmit = async e => {
    e.preventDefault();
    const email = document.getElementById("adminEmail").value.trim().toLowerCase();
    const password = document.getElementById("adminPasswordInput").value;

    try {
        await apiLoginAdmin(email, password);
    } catch (err) {
        return alert(err.message);
    }

    document.getElementById("adminSearch").value = "";
    document.getElementById("adminDeptFilter").value = "";
    adminPage = 1;
    await renderAdminTable();
    e.target.reset();
    showPage("adminDashboardPage");
};

async function renderAdminTable() {
    const tbody = document.querySelector("#adminStudentTable tbody");
    let students;
    try {
        students = await apiGetStudents();
    } catch (err) {
        tbody.innerHTML = "";
        const empty = document.getElementById("adminEmptyState");
        empty.textContent = "Could not load students — check that the server and MySQL are running.";
        empty.classList.add("show");
        return;
    }

    const search = document.getElementById("adminSearch").value.trim().toLowerCase();
    const dept = document.getElementById("adminDeptFilter").value;

    const filtered = students.filter(s => {
        const matchesSearch = !search || fullName(s).toLowerCase().includes(search) || s.id.toLowerCase().includes(search);
        const matchesDept = !dept || s.department === dept;
        return matchesSearch && matchesDept;
    });

    renderStats(document.getElementById("adminStats"), students);

    adminPage = renderPaginationControls(
        document.getElementById("adminPagination"),
        filtered.length,
        adminPage,
        PAGE_SIZE,
        newPage => { adminPage = newPage; renderAdminTable(); }
    );
    const pageItems = filtered.slice((adminPage - 1) * PAGE_SIZE, adminPage * PAGE_SIZE);

    tbody.innerHTML = "";
    document.getElementById("adminEmptyState").textContent = "No students have registered yet.";
    document.getElementById("adminEmptyState").classList.toggle("show", filtered.length === 0);

    pageItems.forEach(s => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(fullName(s))}</td>
            <td>${escapeHtml(s.id)}</td>
            <td>${escapeHtml(s.department)}</td>
            <td>${escapeHtml(s.yearLevel)}</td>
            <td>${escapeHtml(s.contact)}</td>
            <td>${escapeHtml(s.email)}</td>
            <td>${clearanceSummaryText(clearanceOf(s))}</td>
            <td><button type="button" class="view-btn" data-id="${escapeHtml(s.id)}">View</button></td>
        `;
        tbody.appendChild(row);
    });

    tbody.querySelectorAll(".view-btn").forEach(btn => {
        btn.onclick = () => openDetailModal(btn.getAttribute("data-id"), true);
    });
}

document.getElementById("adminSearch").addEventListener("input", () => { adminPage = 1; renderAdminTable(); });
document.getElementById("adminDeptFilter").addEventListener("change", () => { adminPage = 1; renderAdminTable(); });

/* =========================================================
   DEPARTMENT LOGIN + DASHBOARD
   ========================================================= */

let currentDepartment = "";
let departmentPage = 1;

document.getElementById("departmentForm").onsubmit = async e => {
    e.preventDefault();
    const department = document.getElementById("departmentSelect").value;
    const id = document.getElementById("departmentId").value.trim().toLowerCase();
    const password = document.getElementById("departmentPassword").value;

    if (!department) return alert("Please select your department / office.");

    try {
        await apiLoginDepartment(department, id, password);
    } catch (err) {
        return alert(err.message);
    }

    document.getElementById("departmentDashName").textContent = department + " Dashboard";
    currentDepartment = department;
    document.getElementById("departmentSearch").value = "";
    departmentPage = 1;
    await renderDepartmentTable();
    e.target.reset();
    showPage("departmentDashboardPage");
};

async function renderDepartmentTable() {
    const tbody = document.querySelector("#departmentStudentTable tbody");
    let students;
    try {
        students = await apiGetStudents(currentDepartment);
    } catch (err) {
        tbody.innerHTML = "";
        const empty = document.getElementById("departmentEmptyState");
        empty.textContent = "Could not load students — check that the server and MySQL are running.";
        empty.classList.add("show");
        return;
    }

    const search = document.getElementById("departmentSearch").value.trim().toLowerCase();
    const filtered = students.filter(s => !search || fullName(s).toLowerCase().includes(search) || s.id.toLowerCase().includes(search));

    renderStats(document.getElementById("departmentStats"), students);

    departmentPage = renderPaginationControls(
        document.getElementById("departmentPagination"),
        filtered.length,
        departmentPage,
        PAGE_SIZE,
        newPage => { departmentPage = newPage; renderDepartmentTable(); }
    );
    const pageItems = filtered.slice((departmentPage - 1) * PAGE_SIZE, departmentPage * PAGE_SIZE);

    tbody.innerHTML = "";
    document.getElementById("departmentEmptyState").textContent = "No students registered under this department yet.";
    document.getElementById("departmentEmptyState").classList.toggle("show", filtered.length === 0);

    pageItems.forEach(s => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(fullName(s))}</td>
            <td>${escapeHtml(s.id)}</td>
            <td>${escapeHtml(s.yearLevel)}</td>
            <td>${escapeHtml(s.contact)}</td>
            <td>${escapeHtml(s.email)}</td>
            <td>${clearanceSummaryText(clearanceOf(s))}</td>
            <td><button type="button" class="view-btn" data-id="${escapeHtml(s.id)}">View</button></td>
        `;
        tbody.appendChild(row);
    });

    tbody.querySelectorAll(".view-btn").forEach(btn => {
        btn.onclick = () => openDetailModal(btn.getAttribute("data-id"), false);
    });
}

document.getElementById("departmentSearch").addEventListener("input", () => { departmentPage = 1; renderDepartmentTable(); });