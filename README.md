# CollabSphere

CollabSphere is a student collaboration platform for discovering projects, requesting to join teams, creating events, and messaging collaborators.

## Project Structure

- `frontend/` static HTML, CSS, and browser JavaScript
- `backend/` Express API, Socket.IO messaging, and MongoDB models
- `scripts/validate-project.js` dependency-free project validation used by `npm test`
- `docs/` API and implementation notes

## Setup

1. Install root dependencies:

   ```bash
   npm install
   ```

2. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

3. Create backend environment values:

   ```bash
   copy .env.example .env
   ```

4. Start the backend:

   ```bash
   npm start
   ```

5. Open `frontend/pages/index.html` in a browser, or serve the `frontend/` folder with any static web server.

By default the frontend calls `http://localhost:5002/api`. To point it at a different API, set `localStorage.collabsphere_api_url` in the browser.

## Testing

Run the project validation from the repository root:

```bash
npm test
```

The backend test script runs the same validation:

```bash
cd backend
npm test
```

The validator checks core HTML structure and JavaScript syntax across the project without requiring external test packages.






Project Console: https://console.firebase.google.com/project/collabsphere-be6bf-787b2/overview
Hosting URL: https://collabsphere-be6bf-787b2.web.app





env file data

# Server Configuration
PORT=5002
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://godavarthitejash_db_user:TFTVru8OKhG4qhxL@collabsphere.hitldnz.mongodb.net/?appName=CollabSphere

# JWT Configuration
JWT_SECRET=c04f40c27c259b672d717172cb60111f25285dd46b55c9f1340cce7af2d6e21f4130b0f92fbca2b50a305d1a0b77e1b0e6335e9b119d5ffd77ebd08da177b9b4
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=10485760

# AI Services
GEMINI_API_KEY=AIzaSyBcgMWE1wx4wqED2_fay1R99I78u9fIFxw
