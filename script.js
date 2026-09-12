const pages = document.querySelectorAll(".page");

function showPage(id) {
    pages.forEach(page => page.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}


/* PAGE NAVIGATION */

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


/* ==================================================
   TASK 6 - VALIDATION
   ================================================== */

function checkInput(input, message) {

    const error = document.getElementById(input.id + "Error");

    if (input.value.trim() === "") {

        input.classList.add("invalid");
        input.classList.remove("valid");

        if (error) {
            error.textContent = message;
        }

        return false;
    }

    if (!input.checkValidity()) {

        input.classList.add("invalid");
        input.classList.remove("valid");

        if (error) {

            if (input.type === "email") {
                error.textContent =
                    "Please enter a valid email address.";

            } else if (input.type === "tel") {
                error.textContent =
                    "Enter a valid 11-digit number starting with 09.";

            } else if (
                input.minLength > 0 &&
                input.value.length < input.minLength
            ) {
                error.textContent =
                    `Must contain at least ${input.minLength} characters.`;

            } else {
                error.textContent = message;
            }
        }

        return false;
    }

    input.classList.remove("invalid");
    input.classList.add("valid");

    if (error) {
        error.textContent = "";
    }

    return true;
}


/* DEPARTMENT / OFFICE LOGIN */

document.getElementById("departmentForm").onsubmit = e => {

    e.preventDefault();

    const id =
        document.getElementById("departmentId");

    const password =
        document.getElementById("departmentPassword");

    const validID = checkInput(
        id,
        "Department / Office ID is required."
    );

    const validPassword = checkInput(
        password,
        "Password must contain at least 8 characters."
    );

    if (validID && validPassword) {

        document.getElementById("departmentSuccess").textContent =
            "Login information is valid.";

    } else {

        document.getElementById("departmentSuccess").textContent = "";
    }
};


/* STUDENT LOGIN */

document.getElementById("studentForm").onsubmit = e => {

    e.preventDefault();

    const id =
        document.getElementById("studentLoginId");

    const password =
        document.getElementById("studentLoginPassword");

    const validID = checkInput(
        id,
        "Student ID is required."
    );

    const validPassword = checkInput(
        password,
        "Password must contain at least 8 characters."
    );

    if (validID && validPassword) {

        document.getElementById("studentSuccess").textContent =
            "Login information is valid.";

    } else {

        document.getElementById("studentSuccess").textContent = "";
    }
};


/* ADMINISTRATOR LOGIN */

document.getElementById("adminForm").onsubmit = e => {

    e.preventDefault();

    const id =
        document.getElementById("adminId");

    const password =
        document.getElementById("adminPassword");

    const validID = checkInput(
        id,
        "Administrator ID is required."
    );

    const validPassword = checkInput(
        password,
        "Password must contain at least 8 characters."
    );

    if (validID && validPassword) {

        document.getElementById("adminSuccess").textContent =
            "Login information is valid.";

    } else {

        document.getElementById("adminSuccess").textContent = "";
    }
};


/* STUDENT REGISTRATION */

document.getElementById("registerForm").onsubmit = e => {

    e.preventDefault();

    const name =
        document.getElementById("studentName");

    const id =
        document.getElementById("studentId");

    const department =
        document.getElementById("department");

    const address =
        document.getElementById("address");

    const contact =
        document.getElementById("contactNumber");

    const email =
        document.getElementById("email");

    const password =
        document.getElementById("password");

    const confirm =
        document.getElementById("confirmPassword");

    let valid = true;


    valid = checkInput(
        name,
        "Student Name is required."
    ) && valid;


    valid = checkInput(
        id,
        "Student ID is required."
    ) && valid;


    /* DEPARTMENT VALIDATION */

    const departmentError =
        document.getElementById("departmentError");

    if (department.value === "") {

        department.classList.add("invalid");
        department.classList.remove("valid");

        departmentError.textContent =
            "Please select your Department / Program.";

        valid = false;

    } else {

        department.classList.remove("invalid");
        department.classList.add("valid");

        departmentError.textContent = "";
    }


    valid = checkInput(
        address,
        "Address is required."
    ) && valid;


    valid = checkInput(
        contact,
        "Contact Number is required."
    ) && valid;


    valid = checkInput(
        email,
        "Email is required."
    ) && valid;


    valid = checkInput(
        password,
        "Password must contain at least 8 characters."
    ) && valid;


    /* CONFIRM PASSWORD */

    const confirmError =
        document.getElementById("confirmPasswordError");

    if (confirm.value.trim() === "") {

        confirm.classList.add("invalid");
        confirm.classList.remove("valid");

        confirmError.textContent =
            "Please confirm your password.";

        valid = false;

    } else if (password.value !== confirm.value) {

        confirm.classList.add("invalid");
        confirm.classList.remove("valid");

        confirmError.textContent =
            "Passwords do not match.";

        valid = false;

    } else {

        confirm.classList.remove("invalid");
        confirm.classList.add("valid");

        confirmError.textContent = "";
    }


    /* ==================================================
       TASK 7 - SAVE ONLY VALID DATA
       ================================================== */

    if (valid) {

        saveStudent();

        document.getElementById("registerSuccess").textContent =
            "Registration successful. Student record has been saved.";

        document.getElementById("registerForm").reset();

    } else {

        document.getElementById("registerSuccess").textContent = "";
    }
};


/* CLEAR VALIDATION STYLE WHEN USER TYPES */

document.querySelectorAll("input, select").forEach(input => {

    input.addEventListener("input", () => {

        input.classList.remove("invalid");
        input.classList.remove("valid");

        const error =
            document.getElementById(input.id + "Error");

        if (error) {
            error.textContent = "";
        }
    });

});


/* ==================================================
   TASK 7 - DATA STORAGE
   ================================================== */

let students =
    JSON.parse(localStorage.getItem("clearSyncStudents")) || [];


/* DISPLAY STUDENT RECORDS */

function displayStudents() {

    const tableBody =
        document.getElementById("studentTableBody");

    tableBody.innerHTML = "";

    students.forEach((student, index) => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.id}</td>
            <td>${student.department}</td>
            <td>${student.address}</td>
            <td>${student.contact}</td>
            <td>${student.email}</td>
            <td>
                <button class="delete-btn"
                        onclick="deleteStudent(${index})">
                    Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}


/* SAVE STUDENT RECORD */

function saveStudent() {

    const student = {

        name:
            document.getElementById("studentName").value.trim(),

        id:
            document.getElementById("studentId").value.trim(),

        department:
            document.getElementById("department").value,

        address:
            document.getElementById("address").value.trim(),

        contact:
            document.getElementById("contactNumber").value.trim(),

        email:
            document.getElementById("email").value.trim()
    };


    students.push(student);


    localStorage.setItem(
        "clearSyncStudents",
        JSON.stringify(students)
    );


    displayStudents();
}


/* DELETE STUDENT RECORD */

function deleteStudent(index) {

    if (confirm("Are you sure you want to delete this record?")) {

        students.splice(index, 1);

        localStorage.setItem(
            "clearSyncStudents",
            JSON.stringify(students)
        );

        displayStudents();
    }
}


/* LOAD SAVED RECORDS */

displayStudents();