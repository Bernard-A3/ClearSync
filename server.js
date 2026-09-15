require("dotenv").config();
const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const pool = require("./db");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

// The 10 clearance offices every new student gets a "Pending" row for.
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

// Kept simple on purpose, same as the old front-end-only version.
// Move these to real accounts (a staff_accounts table) later if needed.
const ADMIN_CREDENTIALS = { email: "admin", password: "admin" };
const DEPARTMENT_CREDENTIALS = { id: "department", password: "department" };

// Converts a DB row (snake_case) + its clearance object into the
// camelCase shape the front-end already expects.
function toClientStudent(row, clearance) {
    return {
        id: row.student_id,
        firstName: row.first_name,
        middleName: row.middle_name,
        lastName: row.last_name,
        department: row.department,
        yearLevel: row.year_level,
        region: row.region,
        province: row.province,
        city: row.city,
        barangay: row.barangay,
        zip: row.zip,
        contact: row.contact,
        email: row.email,
        clearance: clearance || {}
    };
}

async function fetchClearance(studentId) {
    const [rows] = await pool.query(
        "SELECT office, status FROM clearance WHERE student_id = ?",
        [studentId]
    );
    const clearance = {};
    rows.forEach(r => { clearance[r.office] = r.status; });
    return clearance;
}

async function fetchStudentByStudentId(studentId) {
    const [rows] = await pool.query(
        "SELECT * FROM students WHERE student_id = ?",
        [studentId]
    );
    if (!rows.length) return null;
    const clearance = await fetchClearance(studentId);
    return toClientStudent(rows[0], clearance);
}

/* =========================================================
   REGISTRATION
   ========================================================= */

app.post("/api/register", async (req, res) => {
    const {
        firstName, middleName, lastName, id, department, yearLevel,
        region, province, city, barangay, zip,
        contact, email, password
    } = req.body || {};

    if (!firstName || !lastName || !id || !department || !yearLevel || !contact || !email || !password) {
        return res.status(400).json({ error: "Missing required registration fields." });
    }

    try {
        const [existingId] = await pool.query(
            "SELECT id FROM students WHERE student_id = ?", [id]
        );
        if (existingId.length) {
            return res.status(409).json({ error: "A student with that Student ID is already registered." });
        }

        const [existingEmail] = await pool.query(
            "SELECT id FROM students WHERE email = ?", [email]
        );
        if (existingEmail.length) {
            return res.status(409).json({ error: "That email is already registered to another account." });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await pool.query(
            `INSERT INTO students
                (student_id, first_name, middle_name, last_name, department, year_level,
                 region, province, city, barangay, zip, contact, email, password_hash)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [id, firstName, middleName || null, lastName, department, yearLevel,
             region || null, province || null, city || null, barangay || null, zip,
             contact, email, passwordHash]
        );

        const clearanceRows = CLEARANCE_OFFICES.map(office => [id, office]);
        await pool.query(
            "INSERT INTO clearance (student_id, office) VALUES ?",
            [clearanceRows]
        );

        res.json({ ok: true });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Registration failed. Please try again." });
    }
});

/* =========================================================
   LOGIN
   ========================================================= */

app.post("/api/login/student", async (req, res) => {
    const { id, password } = req.body || {};
    try {
        const [rows] = await pool.query("SELECT * FROM students WHERE student_id = ?", [id]);
        if (!rows.length) return res.status(401).json({ error: "Invalid Student ID or password." });

        const match = await bcrypt.compare(password || "", rows[0].password_hash);
        if (!match) return res.status(401).json({ error: "Invalid Student ID or password." });

        const clearance = await fetchClearance(id);
        res.json(toClientStudent(rows[0], clearance));
    } catch (err) {
        console.error("Student login error:", err);
        res.status(500).json({ error: "Login failed. Please try again." });
    }
});

app.post("/api/login/admin", (req, res) => {
    const { email, password } = req.body || {};
    if (email !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password) {
        return res.status(401).json({ error: "Invalid administrator credentials." });
    }
    res.json({ ok: true });
});

app.post("/api/login/department", (req, res) => {
    const { department, id, password } = req.body || {};
    if (!department) return res.status(400).json({ error: "Please select your department / office." });
    if (id !== DEPARTMENT_CREDENTIALS.id || password !== DEPARTMENT_CREDENTIALS.password) {
        return res.status(401).json({ error: "Invalid Department / Office ID or password." });
    }
    res.json({ ok: true, department });
});

/* =========================================================
   STUDENT DATA (admin + department dashboards)
   ========================================================= */

app.get("/api/students", async (req, res) => {
    const { department } = req.query;
    try {
        let query = "SELECT * FROM students";
        const params = [];
        if (department) {
            query += " WHERE department = ?";
            params.push(department);
        }
        query += " ORDER BY last_name, first_name";

        const [students] = await pool.query(query, params);
        if (!students.length) return res.json([]);

        const ids = students.map(s => s.student_id);
        const [clearanceRows] = await pool.query(
            "SELECT student_id, office, status FROM clearance WHERE student_id IN (?)",
            [ids]
        );
        const byStudent = {};
        clearanceRows.forEach(c => {
            (byStudent[c.student_id] ||= {})[c.office] = c.status;
        });

        res.json(students.map(s => toClientStudent(s, byStudent[s.student_id])));
    } catch (err) {
        console.error("List students error:", err);
        res.status(500).json({ error: "Could not load students." });
    }
});

app.get("/api/students/:id", async (req, res) => {
    try {
        const student = await fetchStudentByStudentId(req.params.id);
        if (!student) return res.status(404).json({ error: "Student not found." });
        res.json(student);
    } catch (err) {
        console.error("Get student error:", err);
        res.status(500).json({ error: "Could not load student." });
    }
});

app.patch("/api/students/:id/clearance", async (req, res) => {
    const { office } = req.body || {};
    if (!office) return res.status(400).json({ error: "Missing office." });

    try {
        const [rows] = await pool.query(
            "SELECT status FROM clearance WHERE student_id = ? AND office = ?",
            [req.params.id, office]
        );
        if (!rows.length) return res.status(404).json({ error: "Clearance record not found." });

        const newStatus = rows[0].status === "Approved" ? "Pending" : "Approved";
        await pool.query(
            "UPDATE clearance SET status = ? WHERE student_id = ? AND office = ?",
            [newStatus, req.params.id, office]
        );
        res.json({ status: newStatus });
    } catch (err) {
        console.error("Toggle clearance error:", err);
        res.status(500).json({ error: "Could not update clearance." });
    }
});

app.listen(PORT, () => {
    console.log(`ClearSync server running at http://localhost:${PORT}`);
});