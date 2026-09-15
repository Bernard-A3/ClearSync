# ClearSync — MySQL setup guide

## 1. Create the database (MySQL Workbench)

1. Open MySQL Workbench and connect to your local server (root / `qwerty_6920@31`).
2. **File → Open SQL Script...** and pick `schema.sql` from this folder
   (or just paste its contents into a new query tab).
3. Click the lightning-bolt **Execute** button.
4. Refresh the schema list on the left — you should now see a `clearsync`
   database with two tables: `students` and `clearance`.

You can also just double-click into the `students` table afterwards
to watch rows appear live as people register through the site.

## 2. Install Node.js (one-time)

Download and install the LTS version from https://nodejs.org if you
don't already have it. Confirm it worked:

```
node -v
npm -v
```

## 3. Install the server's dependencies

Open a terminal/command prompt in this folder (`clearsync-backend`) and run:

```
npm install
```

This downloads Express, MySQL2, bcryptjs and dotenv into a `node_modules`
folder (not included here).

## 4. Check your database credentials

Open `.env` in this folder — it's already filled in with what you gave me:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=qwerty_6920@31
DB_NAME=clearsync
PORT=3000
```

Only change this if your MySQL Workbench connection uses a different
host, port, username, or database name.

**Security note:** don't commit `.env` to GitHub or share it publicly —
it contains your real database password.

## 5. Add your images

Copy your existing `images/Pics1.png` and `images/Pics2.png` into
`public/images/` in this folder (the `images` folder is already created,
just empty).

## 6. Run the server

```
npm start
```

You should see:

```
ClearSync server running at http://localhost:3000
```

## 7. Open the app

Go to **http://localhost:3000** in your browser — not by double-clicking
`index.html` anymore. The page is now served *by* the Node server, which
is what lets its JavaScript talk to `/api/...` and reach MySQL.

## What changed from the old version

- Student records, addresses, and clearance status now live in the
  `clearsync` MySQL database instead of the browser's `localStorage`.
  Data now persists across computers/browsers and survives clearing
  browser data.
- Passwords are hashed with bcrypt before being stored — never saved
  as plain text.
- `script.js` now calls a small set of `/api/...` endpoints
  (register, login, list students, get one student, toggle a clearance
  status) instead of reading/writing `localStorage` directly.
- Admin (`admin`/`admin`) and Department (`department`/`department`)
  logins are still simple built-in credentials on the server for now —
  easy to swap out for a real `staff_accounts` table later if you want
  per-department passwords.

## Folder structure

```
clearsync-backend/
├── server.js        Express API (register/login/students/clearance)
├── db.js            MySQL connection pool
├── schema.sql        Run this in MySQL Workbench
├── package.json
├── .env             Your DB credentials (keep private)
└── public/          Everything served to the browser
    ├── index.html
    ├── style.css
    ├── script.js    Updated to call the API instead of localStorage
    └── images/      Put Pics1.png / Pics2.png here
```
