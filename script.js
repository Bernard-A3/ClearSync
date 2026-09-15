const pages = document.querySelectorAll(".page");
const STORAGE_KEY = "clearsync_students";

const CLEARANCE_OFFICES = [
    "Student Affairs & Development Office (SADO)",
    "Sports Development Director/Coordinator",
    "College Health Services Office (CHSO)",
    "Social Orientation & Community Involvement (SOCI)",
    "Guidance Counselor",
    "Librarian",
    "Program Dean/Head",
    "VP for Academics",
    "VP for Finance",
    "Registrar"
];

const showPage = id => {
    pages.forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
};

const getStudents = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
const saveStudents = list => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

const fillRow = (parent, values) => {
    const row = document.createElement("tr");
    values.forEach(v => {
        const td = document.createElement("td");
        td.textContent = v;
        row.appendChild(td);
    });
    parent.appendChild(row);
};

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
    studentLogout: "homePage"
};

Object.entries(navTargets).forEach(([btnId, pageId]) => {
    document.getElementById(btnId).onclick = () => showPage(pageId);
});

document.getElementById("registerForm").onsubmit = e => {
    e.preventDefault();

    const name = document.getElementById("regName").value.trim();
    const id = document.getElementById("regId").value.trim();
    const department = document.getElementById("regDepartment").value;
    const address = document.getElementById("regAddress").value.trim();
    const contact = document.getElementById("regContact").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirmPassword").value;

    if (!department) return alert("Please select a department / program.");
    if (password !== confirm) return alert("Passwords do not match.");

    const students = getStudents();
    if (students.some(s => s.id.toLowerCase() === id.toLowerCase()))
        return alert("A student with that Student ID is already registered.");

    students.push({ name, id, department, address, contact, email, password });
    saveStudents(students);

    alert("Student registration submitted. You can now log in.");
    e.target.reset();
    showPage("studentPage");
};

document.getElementById("studentForm").onsubmit = e => {
    e.preventDefault();
    const id = document.getElementById("studentLoginId").value.trim();
    const password = document.getElementById("studentLoginPassword").value;

    const student = getStudents().find(
        s => s.id.toLowerCase() === id.toLowerCase() && s.password === password
    );
    if (!student) return alert("Invalid Student ID or password.");

    const info = document.getElementById("studentInfoList");
    info.innerHTML = "";
    [
        ["Name", student.name],
        ["Student ID", student.id],
        ["Department", student.department],
        ["Address", student.address],
        ["Contact Number", student.contact],
        ["Email", student.email]
    ].forEach(([label, value]) => {
        info.insertAdjacentHTML("beforeend", `<dt>${label}</dt><dd>${value}</dd>`);
    });

    document.getElementById("clearanceList").innerHTML = CLEARANCE_OFFICES
        .map(o => `<li><span>${o}</span><span class="status-pill">Pending</span></li>`)
        .join("");

    e.target.reset();
    showPage("studentDashboardPage");
};

document.getElementById("adminForm").onsubmit = e => {
    e.preventDefault();
    const email = document.getElementById("adminEmail").value.trim().toLowerCase();
    const password = document.getElementById("adminPasswordInput").value;

    if (email !== "admin" || password !== "admin")
        return alert("Invalid administrator credentials.");

    const students = getStudents();
    const tbody = document.querySelector("#adminStudentTable tbody");
    tbody.innerHTML = "";
    document.getElementById("adminEmptyState").classList.toggle("show", students.length === 0);
    students.forEach(s => fillRow(tbody, [s.name, s.id, s.department, s.contact, s.email, s.address]));

    e.target.reset();
    showPage("adminDashboardPage");
};

document.getElementById("departmentForm").onsubmit = e => {
    e.preventDefault();
    const department = document.getElementById("departmentSelect").value;
    const id = document.getElementById("departmentId").value.trim().toLowerCase();
    const password = document.getElementById("departmentPassword").value;

    if (!department) return alert("Please select your department / office.");
    if (id !== "department" || password !== "department")
        return alert("Invalid Department / Office ID or password.");

    document.getElementById("departmentDashName").textContent = department + " Dashboard";

    const students = getStudents().filter(s => s.department === department);
    const tbody = document.querySelector("#departmentStudentTable tbody");
    tbody.innerHTML = "";
    document.getElementById("departmentEmptyState").classList.toggle("show", students.length === 0);
    students.forEach(s => fillRow(tbody, [s.name, s.id, s.contact, s.email, s.address]));

    e.target.reset();
    showPage("departmentDashboardPage");
};