# Doodle Outpost AI Agent (Android)

A separate Android application for the private Doodle Outpost developer workspace.

## Current scaffold
- Vite web app packaged with Capacitor for Android.
- Firebase Email/Password sign-in using the existing `doodle-f5c77` project.
- UI allowlist for `chandegaraharsh464@gmail.com`.
- Dashboard shell for scanner, bug reports, testing, AI development, GitHub and version history.
- Publishing policy is approval-required.

## Important security status
The email allowlist in the client is only a user-interface gate, not a security boundary. Before connecting any privileged AI or GitHub operation, implement server-side Firebase ID-token verification and enforce the admin email on every backend endpoint. Do not put GitHub tokens or AI provider keys in this app. The dashboard modules are currently placeholders; no AI scanning, game testing, or GitHub write operation is connected yet.

## Firebase setup
1. In Firebase Authentication, enable Email/Password.
2. Create the admin user `chandegaraharsh464@gmail.com`.
3. Verify the admin email address. The app requires a verified email.
4. Keep Firestore locked down; add narrowly scoped admin rules only after server-side authorization is implemented.

## Build Android project
Requires Node.js and Android Studio with Android SDK installed.

```bash
cd ai-agent-android
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

In Android Studio, build a debug APK for testing. For release, create and securely back up a signing key, then generate a signed APK or Android App Bundle.

## Next development milestones
1. Verify email and secure admin backend authorization.
2. Add backend health and authenticated admin session endpoint.
3. Add GitHub read-only repository inspection.
4. Add AI code review and proposed patch generation.
5. Add diff review and explicit approval before GitHub commits.
6. Add automated tests, backups and rollback support.