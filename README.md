## 🧠 AI Interview Trainer Platform

This is an AI-powered mock interview platform that allows users to practice interviews with an intelligent voice assistant. The system leverages Next.js, Shadcn UI, Firebase, and Vapi (voice agent API) to deliver dynamic, real-time interview experiences with AI feedback.

# 🚀 Project Setup
1. Create a Vapi Agent & Workflow
Go to Vapi and create a new Agent.

Set up a Workflow and connect it to your agent — this defines how the AI will behave during interviews.

2. Create a Next.js App
bash
Copy
Edit
npx create-next-app@latest .
Clean up the boilerplate: remove favicon.ico, reset page.tsx, and update layout.tsx to use dark mode.

3. Install Shadcn UI
bash
Copy
Edit
npx shadcn-ui@latest init
Install components:

bash
Copy
Edit
npx shadcn-ui@latest add button form input sonner
Shadcn UI provides beautifully-designed, accessible components customizable in React apps.

4. Set Up the Public Folder
Copy contents from the GitHub repo into your public/ directory.

Use index.ts inside constants/ as mock data for the model (you can comment out trainer data if causing errors).

Move favicon to the /app folder and run the app:

bash
Copy
Edit
npm run dev
🧩 Routing & Layout
Route Groups
Use route groups (e.g. (auth), (global)) to structure your app without affecting URLs.

Example: (auth)/sign-in/page.tsx, (auth)/sign-up/page.tsx

Update layout.tsx to render {children} and apply consistent layout and styling across nested pages.

🔐 Auth Pages
Add AuthForm.tsx and make it a client component ("use client").

sign-in and sign-up pages both reuse AuthForm, passing type to switch modes dynamically.

Create Zod schema for form validation.

On sign-up:

Use Firebase Client SDK to create user (createUserWithEmailAndPassword)

Store the user in Firestore with signUp()

On sign-in:

Validate user with signInWithEmailAndPassword

Pass token to backend to validate, create secure session cookie, and set it.

🔥 Firebase Integration
Use both Admin SDK and Client SDK.

admin.ts handles secure, privileged actions (e.g., setSessionCookie, getCurrentUser).

client.ts handles user auth actions on the client.

Use getCurrentUser to check if a session is active (auth guard).

🤖 AI Interview Flow with Vapi + Gemini
Workflow:
User selects interview type (frontend, backend, behavioral, etc.)

Vapi assistant asks questions and collects answers in real-time.

After the call ends, the transcript is sent to the backend.

Gemini AI generates interview feedback and stores it in Firestore.

Key Functions:
handleCall(): starts a Vapi session with input variables.

handleDisconnect(): ends the call and triggers feedback generation.

createFeedback(): sends transcript to Gemini and stores structured feedback.

🧠 Interview Features
getInterviewByUserId: Fetch interviews from Firestore per user.

getFormattedQuestions: Map tech stacks to logo/image URLs via getTechLogos().

DisplayTechIcons.tsx: Displays tech logos per interview.

📄 Pages & Components
root/page.tsx: Home page renders sections + interview cards.

InterviewCard.tsx: Shows available interviews.

interviewer/index.ts: Defines the assistant model, voice, and behavior prompt.

🛠️ Miscellaneous
Uses Zod for form validation.

Uses route groups to modularize (auth) and (global) layouts.

Uses useEffect to hook into Vapi event lifecycles (start/stop/message).

Indexed Firestore documents and added support for viewing past/upcoming interviews.

🧪 API Endpoints
GET /api/interview → Returns success: true

POST /api/interview → Accepts transcript + prompt, returns questions from Gemini

Auth and feedback endpoints also included (e.g., createFeedback)

✅ ENV Variables
env
Copy
Edit
NEXT_PUBLIC_FIREBASE_API_KEY=...
FIREBASE_PROJECT_ID=...
VAPI_API_KEY=...
GEMINI_API_KEY=...
🧱 Tech Stack
Next.js 14 (App Router)

Shadcn/UI + Tailwind CSS

Firebase (Auth, Firestore, Admin SDK)

Google Gemini (LLM)

Vapi (Voice agent SDK)

📦 Future Improvements
Add realtime status tracking for interview progress

Store transcripts as Markdown for readability

Add multi-language support

Generate follow-up questions via Gemini

Let me know if you'd like a PDF version or want it broken into CONTRIBUTING.md, INSTALL.md, etc. ✅
