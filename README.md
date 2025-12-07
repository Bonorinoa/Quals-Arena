
# D1 Economist Protocol - Deployment Guide

This is a single-page React application (SPA). It uses LocalStorage for data persistence, so it requires **no backend server**. This makes it incredibly easy and free to host.

## Option 1: The Fastest Way (CodeSandbox / StackBlitz)

If you just want to use it on your phone immediately:
1.  Copy all the file contents provided by the AI.
2.  Go to [StackBlitz.com](https://stackblitz.com) -> New Project -> React (TypeScript).
3.  Paste the file contents into the corresponding files in StackBlitz.
4.  Hit "Save".
5.  The URL in the preview window (e.g., `https://random-name.stackblitz.io`) is your live app. Bookmark it on your phone.

## Option 2: The Professional Way (Vercel/Netlify)

This gives you a permanent URL and better performance.

### Prerequisites
- Node.js installed on your computer.
- A GitHub account.

### Step 1: Create the Project Locally
1.  Open your terminal/command prompt.
2.  Run: `npm create vite@latest d1-protocol -- --template react-ts`
3.  `cd d1-protocol`
4.  `npm install`
5.  `npm install lucide-react recharts date-fns` (Install the dependencies used in the code).
6.  `npm install -D tailwindcss postcss autoprefixer`
7.  `npx tailwindcss init -p`

### Step 2: Configure Tailwind
Update `tailwind.config.js` to look like this:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```
Add this to `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 3: Copy Code
1.  Replace the contents of `src/App.tsx`, `src/index.tsx` (or `main.tsx`), and create the necessary files in `src/components`, `src/services`, and `src/types` with the code provided by the AI.

### Step 4: Push to GitHub
1.  `git init`
2.  `git add .`
3.  `git commit -m "Initial commit"`
4.  Create a new repository on GitHub.
5.  Follow the instructions on GitHub to push your code.

### Step 5: Deploy to Vercel
1.  Go to [Vercel.com](https://vercel.com) and sign up/login.
2.  Click "Add New..." -> "Project".
3.  Select your `d1-protocol` repository from GitHub.
4.  Click "Deploy".
5.  Vercel will build the site and give you a URL (e.g., `d1-protocol.vercel.app`).

**That's it.** You now have a live, deployed app accessible from anywhere.
