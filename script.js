import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    push,
    onValue,
    query,
    orderByChild
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

/* -----------------------------
   FIREBASE INIT
----------------------------- */

const firebaseConfig = {
  apiKey: "AIzaSyByFGPF4f4kh_dmvWhrvVg5k-agCR4cxmI",
  authDomain: "blacklist-division.firebaseapp.com",
  databaseURL: "https://blacklist-division-default-rtdb.firebaseio.com",
  projectId: "blacklist-division",
  storageBucket: "blacklist-division.firebasestorage.app",
  messagingSenderId: "352904791140",
  appId: "1:352904791140:web:98451c53d6c36d86d64b71",
  measurementId: "G-RV4XERPZY7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/* -----------------------------
   GLOBAL STATE
----------------------------- */

const App = {
    user: null,
    channel: "general"
};

window.App = App;

/* -----------------------------
   AUTH STATE
----------------------------- */

onAuthStateChanged(auth, (user) => {
    App.user = user;
});

/* -----------------------------
   HELPERS
----------------------------- */

function makeEmail(username) {
    return username.toLowerCase().replace(/\s/g, "") + "@blacklist.local";
}

/* -----------------------------
   AUTH (SAFE)
----------------------------- */

App.signup = async (username, password) => {

    const email = makeEmail(username);

    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(cred.user, {
        displayName: username
    });

    await set(ref(db, "users/" + cred.user.uid), {
        username,
        createdAt: Date.now()
    });

};

App.login = async (username, password) => {

    const email = makeEmail(username);

    await signInWithEmailAndPassword(auth, email, password);
};

App.logout = async () => {
    await signOut(auth);
};

/* -----------------------------
   MESSAGES SYSTEM
----------------------------- */

App.sendMessage = async (text) => {

    if (!App.user) return;

    const msgRef = push(ref(db, "messages"));

    await set(msgRef, {
        text,
        author: App.user.displayName,
        uid: App.user.uid,
        channel: App.channel,
        createdAt: Date.now()
    });
};

App.listenMessages = (callback) => {

    const q = query(ref(db, "messages"), orderByChild("createdAt"));

    onValue(q, (snap) => {

        const data = snap.val() || {};
        callback(Object.values(data));
    });
};

App.setChannel = (c) => {
    App.channel = c;
};

/* =========================================================
   🧠 PAGE DETECTION (THIS FIXES YOUR ERROR)
========================================================= */

/* -----------------------------
   MESSAGES PAGE
----------------------------- */

const messagesContainer = document.getElementById("messages");
const textarea = document.querySelector(".messageInput textarea");
const sendBtn = document.querySelector(".messageInput button");
const channelButtons = document.querySelectorAll(".channel");

if (messagesContainer && textarea && sendBtn) {

    let cache = [];

    sendBtn.addEventListener("click", async () => {

        const text = textarea.value.trim();
        if (!text) return;

        await App.sendMessage(text);

        textarea.value = "";
    });

    channelButtons.forEach(btn => {

        btn.addEventListener("click", () => {

            channelButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            App.setChannel(btn.dataset.channel);

            render(cache);
        });

    });

    function render(messages) {

        messagesContainer.innerHTML = "";

        const filtered = messages.filter(m => m.channel === App.channel);

        filtered.sort((a, b) => a.createdAt - b.createdAt);

        filtered.forEach(msg => {

            const div = document.createElement("div");
            div.classList.add("message");

            div.innerHTML = `
                <div class="messageHeader">
                    <span class="author">${msg.author}</span>
                    <span class="time">${new Date(msg.createdAt).toLocaleString()}</span>
                </div>
                <div class="messageBody">
                    ${msg.text}
                </div>
            `;

            messagesContainer.appendChild(div);
        });
    }

    App.listenMessages((msgs) => {
        cache = msgs;
        render(msgs);
    });
}

/* -----------------------------
   OPTIONAL: DEBUG LOG
----------------------------- */

console.log("Blacklist Division loaded:", {
    auth: !!auth,
    db: !!db
});