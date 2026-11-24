// Firebase connection for Doodle Outpost.
// The Firebase web config is public by design; protect player data with Firestore Rules.
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyAqBpkOG-6KdN4hJHoabliCnew0W7s0cVk",
    authDomain: "doodle-f5c77.firebaseapp.com",
    projectId: "doodle-f5c77",
    storageBucket: "doodle-f5c77.firebasestorage.app",
    messagingSenderId: "793047378097",
    appId: "1:793047378097:web:b2f5fe74d2bf296c969a90",
    measurementId: "G-ZF3WD3FGLN"
  };

  window.DO_FIREBASE = null;
  window.DO_FIREBASE_READY = (async function () {
    try {
      if (!window.firebase || !firebase.initializeApp) {
        throw new Error('Firebase SDK did not load');
      }
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      const auth = firebase.auth();
      const db = firebase.firestore();
      const credential = await auth.signInAnonymously();
      window.DO_FIREBASE = { auth, db, user: credential.user };
      console.info('Doodle Outpost Firebase anonymous sign-in ready.');
      return credential.user;
    } catch (err) {
      console.warn('Firebase sign-in unavailable; local progress will continue:', err);
      return null;
    }
  })();
})();
