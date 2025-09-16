// firebase.js

// 1. Firebase Config (replace with your actual Firebase project config)
const firebaseConfig = {
  apiKey: "AIzaSyDeuD86wd3kCl_HY_ApgrNihgUoH8R5Cf0",
  authDomain: "signup-db04b.firebaseapp.com",
  projectId: "signup-db04b",
  storageBucket: "signup-db04b.firebasestorage.app",
  messagingSenderId: "220726217169",
  appId: "1:220726217169:web:fe8780d02778b1d0b5f8f0",
  measurementId: "G-XTS83CQKP7"
};

// 2. Initialize Firebase
firebase.initializeApp(firebaseConfig);

// 3. Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// 4. Authentication helpers

/**
 * Monitor user login state
 * @param {function} callback - called with user object or null
 */
function onAuthStateChanged(callback) {
    auth.onAuthStateChanged(user => {
        callback(user);
    });
}

/**
 * Sign in with email/password
 */
function signIn(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

/**
 * Sign out
 */
function signOut() {
    return auth.signOut();
}

/**
 * Create a new user
 */
function signUp(email, password, displayName) {
    return auth.createUserWithEmailAndPassword(email, password)
        .then(cred => {
            return cred.user.updateProfile({ displayName: displayName });
        });
}

// 5. Firestore helpers

/**
 * Get a user's document from Firestore
 * @param {string} uid
 * @returns {Promise<DocumentSnapshot>}
 */
function getUserDoc(uid) {
    return db.collection('users').doc(uid).get();
}

/**
 * Set or update a user's document
 * @param {string} uid
 * @param {Object} data
 * @returns {Promise<void>}
 */
function setUserDoc(uid, data) {
    return db.collection('users').doc(uid).set(data, { merge: true });
}

/**
 * Listen to changes in a user's document
 * @param {string} uid
 * @param {function} callback - receives doc.data()
 */
function onUserDocChange(uid, callback) {
    return db.collection('users').doc(uid).onSnapshot(doc => {
        callback(doc.data());
    });
}

// 6. Utility: get all practice sessions
function getAllSessions() {
    return db.collection('sessions').get()
        .then(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
}

/**
 * Sign up for a session
 * @param {string} sessionId
 * @param {string} uid
 * @param {string} displayName
 */
function signUpForSession(sessionId, uid, displayName) {
    const sessionRef = db.collection('sessions').doc(sessionId);
    const userRef = db.collection('users').doc(uid);

    return db.runTransaction(async (transaction) => {
        const sessionDoc = await transaction.get(sessionRef);
        if (!sessionDoc.exists) throw "Session does not exist";

        const sessionData = sessionDoc.data();
        const volunteers = sessionData.volunteers || [];

        if (!volunteers.includes(uid) && volunteers.length < sessionData.capacity) {
            volunteers.push(uid);
            transaction.update(sessionRef, { volunteers });

            // Update user's sessions
            const userDoc = await transaction.get(userRef);
            const userData = userDoc.exists ? userDoc.data() : {};
            const userSessions = userData.sessions || [];
            userSessions.push(sessionId);
            transaction.set(userRef, { sessions: userSessions }, { merge: true });
        } else {
            throw "Session is full or user already signed up";
        }
    });
}

// 7. Export functions globally for easy use
window.firebaseAuth = auth;
window.firebaseDB = db;
window.onAuthStateChanged = onAuthStateChanged;
window.signIn = signIn;
window.signOut = signOut;
window.signUp = signUp;
window.getUserDoc = getUserDoc;
window.setUserDoc = setUserDoc;
window.onUserDocChange = onUserDocChange;
window.getAllSessions = getAllSessions;
window.signUpForSession = signUpForSession;
