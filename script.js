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

/* ---------------- FIREBASE ---------------- */

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

/* ---------------- GLOBAL STATE ---------------- */

const App = {
    user: null,
    channel: "general"
};

window.App = App;

/* ---------------- HELPERS ---------------- */

function makeEmail(username) {
    return username.toLowerCase().replace(/\s/g, "") + "@blacklist.local";
}

function formatTime(ms) {
    if (!ms) return "";
    return new Date(ms).toLocaleString();
}

/* ---------------- AUTH ---------------- */

App.signup = async (username, password, fullName, referral) => {

    const email = makeEmail(username);

    const cred = await createUserWithEmailAndPassword(auth, email, password);

    const user = cred.user;

    await updateProfile(user, {
        displayName: username
    });

    await set(ref(db, "users/" + user.uid), {
        username,
        fullName,
        referral,
        createdAt: Date.now()
    });
};

const signupBtn = document.getElementById("signupButton");

if (signupBtn) {

    signupBtn.addEventListener("click", async () => {

        const inputs = document.querySelectorAll(".loginCard input");

        const fullName = inputs[0].value;
        const username = inputs[1].value;
        const password = inputs[2].value;
        const referral = inputs[3].value;

        if (!username || !password) {
            alert("Nickname and password required");
            return;
        }

        try {
            await App.signup(username, password, fullName, referral);
            alert("Account created successfully");
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });
}

App.login = async (username, password) => {

    const email = makeEmail(username);

    await signInWithEmailAndPassword(auth, email, password);
};

App.logout = async () => {
    await signOut(auth);
};

onAuthStateChanged(auth, (user) => {
    App.user = user || null;
});

/* ---------------- CHANNELS ---------------- */

App.setChannel = (channel) => {
    App.channel = channel;
};

/* ---------------- MESSAGES ---------------- */

App.sendMessage = async (text) => {

    if (!App.user || !text) return;

    await push(ref(db, "messages"), {
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

/* ---------------- MESSAGES PAGE ---------------- */

const messagesBox = document.getElementById("messages");
const textarea = document.querySelector(".messageInput textarea");
const sendBtn = document.querySelector(".messageInput button");
const channelBtns = document.querySelectorAll(".channel");

if (messagesBox && textarea && sendBtn) {

    let cache = [];

    sendBtn.addEventListener("click", async () => {

        const text = textarea.value.trim();
        if (!text) return;

        await App.sendMessage(text);
        textarea.value = "";
    });

    channelBtns.forEach(btn => {

        btn.addEventListener("click", () => {

            channelBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            App.setChannel(btn.dataset.channel);

            render(cache);
        });
    });

    function render(messages) {

        messagesBox.innerHTML = "";

        const filtered = messages.filter(m => m.channel === App.channel);

        filtered.sort((a, b) => a.createdAt - b.createdAt);

        filtered.forEach(msg => {

            const div = document.createElement("div");
            div.classList.add("message");

            div.innerHTML = `
                <div class="messageHeader">
                    <span class="author">${msg.author}</span>
                    <span class="time">${formatTime(msg.createdAt)}</span>
                </div>
                <div class="messageBody">
                    ${msg.text}
                </div>
            `;

            messagesBox.appendChild(div);
        });
    }

    App.listenMessages((msgs) => {
        cache = msgs;
        render(msgs);
    });
}

/* ---------------- MEMBERS PAGE ---------------- */

const membersBox = document.getElementById("members");

if (membersBox) {

    const usersRef = ref(db, "users");

    onValue(usersRef, (snap) => {

        const data = snap.val() || {};
        membersBox.innerHTML = "";

        Object.values(data).forEach(user => {

            const div = document.createElement("div");
            div.classList.add("member");

            div.innerHTML = `
                <div class="memberName">${user.username}</div>
                <div class="memberSub">${user.fullName || ""}</div>
            `;

            membersBox.appendChild(div);
        });

    });
}

/* ---------------- DEBUG ---------------- */

console.log("Blacklist Division loaded:", {
    user: App.user,
    channel: App.channel
});