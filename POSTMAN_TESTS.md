# E-Sumbong – Postman Tests  (base URL: http://localhost:5000)
For POST/PUT: Body > raw > JSON.   Run `npm start` first.

## A. USERS (auth)
1. POST /api/auth/register   -> 201
   { "username": "carlo", "password": "1234" }
2. POST /api/auth/register (same username again) -> 409  (duplicate)
3. POST /api/auth/login      -> 200
   { "username": "carlo", "password": "1234" }
4. POST /api/auth/login (wrong password) -> 401

## B. REPORTS (CRUD)
1. CREATE   POST   /api/reports   -> 201   (copy the "ref" from the response)
   { "name": "carlo", "handle": "@carlo", "category": "Road Problems",
     "location": "Tondo, Manila", "text": "Large pothole in front of the school.",
     "coords": [14.6179, 120.9667] }
2. READ ALL GET    /api/reports                    -> 200
   (filters) GET /api/reports?status=Pending
             GET /api/reports?search=road
3. READ ONE GET    /api/reports/<ref>              -> 200
4. UPDATE   PUT    /api/reports/<ref>              -> 200
   { "status": "Reviewing" }
5. DELETE   DELETE /api/reports/<ref>              -> 200

## C. ERROR TESTS (Testing & Debugging)
- POST /api/reports  { "category": "Road Problems" }              -> 400 (missing fields)
- POST /api/reports  text shorter than 10 characters              -> 400
- POST /api/reports  { "category": "Pizza", ... }                 -> 400 (invalid category)
- PUT  /api/reports/<ref> { "status": "Done" }                    -> 400 (invalid status)
- GET  /api/reports/doesnotexist                                  -> 404

## Screenshot checklist (full desktop each time)
- VS Code: server.js, models/Report.js, models/User.js, routes/reports.js, routes/auth.js
- Terminal: "MongoDB connected" + "Server running"
- Postman: one screenshot per request above (URL, body, status code visible)
- MongoDB Compass: `esumbong` DB > `reports` and `users` collections (after create/update/delete)
- Browser: http://localhost:5000  (login, report list, report form, map)
