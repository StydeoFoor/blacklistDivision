import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    set,
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
const db = getDatabase(app);

/* -----------------------------
   APP STATE
----------------------------- */

const App = {
    state: {
        currentChannel: "general",
        user: {
            name: "Guest"
        }
    }
};

window.App = App;

/* -----------------------------
   CHANNEL SYSTEM
----------------------------- */

App.setChannel = (channel) => {
    App.state.currentChannel = channel;
};

/* -----------------------------
   SEND MESSAGE
----------------------------- */

App.sendMessage = async (text) => {

    const messagesRef = ref(db, "messages");
    const newMsgRef = push(messagesRef);

    await set(newMsgRef, {
        text,
        author: App.state.user.name,
        channel: App.state.currentChannel,
        createdAt: Date.now()
    });
};

/* -----------------------------
   LISTEN MESSAGES
----------------------------- */

App.listenMessages = (callback) => {

    const messagesRef = query(
        ref(db, "messages"),
        orderByChild("createdAt")
    );

    onValue(messagesRef, (snapshot) => {

        const data = snapshot.val() || {};
        const messages = Object.values(data);

        callback(messages);
    });
};

/* -----------------------------
   UI LOGIC (MESSAGES PAGE)
----------------------------- */

const messagesContainer = document.getElementById("messages");
const textarea = document.querySelector("textarea");
const sendBtn = document.querySelector("button");
const channelButtons = document.querySelectorAll(".channel");

/* CHANNEL SWITCH */

channelButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        channelButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        App.setChannel(btn.dataset.channel);

        renderMessages(lastMessages);

    });

});

/* SEND MESSAGE */

sendBtn.addEventListener("click", async () => {

    const text = textarea.value.trim();
    if (!text) return;

    await App.sendMessage(text);

    textarea.value = "";
});

/* -----------------------------
   RENDER SYSTEM
----------------------------- */

let lastMessages = [];

function renderMessages(messages) {

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

/* LIVE LISTENER */

App.listenMessages((messages) => {
    lastMessages = messages;
    renderMessages(messages);
});