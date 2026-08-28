const pages = document.querySelectorAll(".page");

function showPage(id) {
    pages.forEach(page => page.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

document.getElementById("departmentButton").onclick = () =>
    showPage("departmentPage");

document.getElementById("studentButton").onclick = () =>
    showPage("studentPage");

document.getElementById("adminButton").onclick = () =>
    showPage("adminPage");

document.getElementById("registerButton").onclick = () =>
    showPage("registerPage");

document.getElementById("departmentBack").onclick = () =>
    showPage("homePage");

document.getElementById("studentBack").onclick = () =>
    showPage("homePage");

document.getElementById("adminBack").onclick = () =>
    showPage("homePage");

document.getElementById("registerBack").onclick = () =>
    showPage("studentPage");

document.getElementById("departmentForm").onsubmit = e => {
    e.preventDefault();
    alert("Department / Office Login");
};

document.getElementById("studentForm").onsubmit = e => {
    e.preventDefault();
    alert("Student Login");
};

document.getElementById("adminForm").onsubmit = e => {
    e.preventDefault();
    alert("Administrator Login");
};

document.getElementById("registerForm").onsubmit = e => {
    e.preventDefault();

    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirmPassword").value;

    if (password !== confirm) {
        alert("Passwords do not match.");
        return;
    }

    alert("Student registration submitted.");
};