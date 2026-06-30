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
    orderByChild,
    get
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
   APP STATE
----------------------------- */

const App = {
    state: {
        user: null,
        currentChannel: "general"
    }
};

window.App = App;

/* -----------------------------
   HELPERS
----------------------------- */

function makeEmail(username) {
    return username.toLowerCase().replace(/\s/g, "") + "@blacklist.local";
}

/* -----------------------------
   AUTH SYSTEM
----------------------------- */

App.signup = async (username, password) => {

    const email = makeEmail(username);

    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    await updateProfile(user, {
        displayName: username
    });

    await set(ref(db, "users/" + user.uid), {
        username,
        createdAt: Date.now()
    });

    return user;
};

App.login = async (username, password) => {

    const email = makeEmail(username);

    const userCred = await signInWithEmailAndPassword(auth, email, password);

    return userCred.user;
};

App.logout = async () => {
    await signOut(auth);
};

/* -----------------------------
   AUTH LISTENER
----------------------------- */

onAuthStateChanged(auth, (user) => {

    App.state.user = user;

    if (user) {
        console.log("Logged in as:", user.displayName);
    } else {
        console.log("Not logged in");
    }

});

/* -----------------------------
   CHANNEL SYSTEM
----------------------------- */

App.setChannel = (channel) => {
    App.state.currentChannel = channel;
};

/* -----------------------------
   MESSAGES
----------------------------- */

App.sendMessage = async (text) => {

    if (!App.state.user) return;

    const msgRef = push(ref(db, "messages"));

    await set(msgRef, {
        text,
        author: App.state.user.displayName,
        uid: App.state.user.uid,
        channel: App.state.currentChannel,
        createdAt: Date.now()
    });
};

App.listenMessages = (callback) => {

    const q = query(
        ref(db, "messages"),
        orderByChild("createdAt")
    );

    onValue(q, (snapshot) => {

        const data = snapshot.val() || {};
        const messages = Object.values(data);

        callback(messages);
    });
};

/* -----------------------------
   UI (MESSAGES PAGE ONLY)
----------------------------- */

const messagesContainer = document.getElementById("messages");
const textarea = document.querySelector("textarea");
const sendBtn = document.querySelector(".messageInput button");
const channelButtons = document.querySelectorAll(".channel");

let lastMessages = [];

/* CHANNEL SWITCH */

channelButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        channelButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        App.setChannel(btn.dataset.channel);

        render(lastMessages);
    });

});

/* SEND MESSAGE */

sendBtn.addEventListener("click", async () => {

    const text = textarea.value.trim();
    if (!text) return;

    await App.sendMessage(text);

    textarea.value = "";
});

/* RENDER */

function render(messages) {

    messagesContainer.innerHTML = "";

    const filtered = messages.filter(
        m => m.channel === App.state.currentChannel
    );

    filtered.sort((a, b) => a.createdAt - b.createdAt);

    filtered.forEach(msg => {

        const div = document.createElement("div");
        div.classList.add("message");

        const time = new Date(msg.createdAt).toLocaleString();

        div.innerHTML = `
            <div class="messageHeader">
                <span class="author">${msg.author}</span>
                <span class="time">${time}</span>
            </div>
            <div class="messageBody">
                ${msg.text}
            </div>
        `;

        messagesContainer.appendChild(div);
    });
}

/* LIVE UPDATES */

App.listenMessages((messages) => {
    lastMessages = messages;
    render(messages);
});