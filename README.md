# Digitization of a Game: "Papel y Boli"

This project is the **Final Degree Project (TFG)** of my Computer Engineering studies. Its objective is to **digitize the traditional game "Papel y Boli"**, transforming it into a **multiplayer, accessible and customizable web application** that can be played from any device with a browser.

The system covers the **full software lifecycle**: requirements analysis, frontend & backend development, database integration, deployment, and testing.

---

- **Customizable game settings** (words, rounds, timer).  
- **Game lifecycle management**: create game, add words, play with timer, rounds, results.  
- **Automated testing** (frontend, backend, and integration).  
- **Self-managed deployment** on a virtual machine with Ubuntu, PM2, and Nginx.

---

## Tech Stack  

**Frontend**  
- [Vue.js](https://vuejs.org/) – Component-based reactive UI  
- [Jest](https://jestjs.io/) + [Vue Test Utils](https://test-utils.vuejs.org/) – Unit and integration testing  

**Backend**  
- [Node.js](https://nodejs.org/) – Runtime environment  
- [Express](https://expressjs.com/) – HTTP server and API routes  
- [SQLite](https://www.sqlite.org/) – Lightweight relational database  
- [Jest](https://jestjs.io/) + [Supertest](https://www.npmjs.com/package/supertest) – API testing  

**Deployment**  
- [Ubuntu Server](https://ubuntu.com/)  
- [PM2](https://pm2.keymetrics.io/) – Process manager  
- [Nginx](https://nginx.org/) – Reverse proxy & static files  

---

## Project Structure

- **frontend/**: user interface developed with Vue.js.
- **backend/**: server developed with Node.js and Express, responsible for connecting to the SQLite database.
- **documentation/**: documentation and diagrams (optional)

---

## Instructions to Run the Project Locally

### 1. Clone the repository  

```bash
git clone https://github.com/Leyva03/papel_y_boli_tfg.git
cd papel_y_boli_tfg
```

### 2. Backend

```bash
cd backend
npm install
node server.js
```
This will run the server at http://localhost:3000

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```
This will open the application at http://localhost:5173

---

## Author

**Pau Leyva García**
Final Degree Project – Computer Engineering
Universitat Autònoma de Barcelona

## GitHub Repository

Full resource code at https://github.com/Leyva03/papel_y_boli_tfg
