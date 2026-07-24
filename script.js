// Blacklist Division v1.0
// Firebase setup and core systems

import { initializeApp } from 
"https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 
"https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    get,
    push,
    onValue,
    query,
    orderByChild
} from 
"https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";


// Firebase config

const firebaseConfig = {
    apiKey: "AIzaSyByFGPF4f4kh_dmvWhrvV5g5k-agCR4cxmI",
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


// Global app state

const App = {

    user: null,

    profile: null,

    channel: localStorage.getItem("channel") || "general"

};


window.App = App;

console.log("Blacklist script loaded");

// Helpers

function makeEmail(username){

    return username
    .toLowerCase()
    .replace(/\s/g,"")
    +"@blacklist.local";

}


function formatTime(time){

    return new Date(time)
    .toLocaleString([],{
        dateStyle:"short",
        timeStyle:"short"
    });

}


// Navigation

function updateNavigation(user){

    const nav = document.querySelector("nav");

    if(!nav)
        return;


    if(user){

        nav.innerHTML = `

        <a href="index.html" class="navButton">
        Home
        </a>

        <a href="members.html" class="navButton">
        Members
        </a>

        <a href="messages.html" class="navButton">
        Messages
        </a>

        <a href="files.html" class="navButton">
        Files
        </a>

        <button id="logoutButton" class="navButton">
        Logout
        </button>

        `;


        const logout =
        document.getElementById("logoutButton");


        if(logout){

            logout.onclick = async()=>{

                await signOut(auth);

                location.href="login.html";

            };

        }


    } else {


        nav.innerHTML = `

        <a href="index.html" class="navButton">
        Home
        </a>

        <a href="signup.html" class="navButton">
        Join
        </a>

        <a href="login.html" class="navButton">
        Login
        </a>

        `;

    }

}
// Authentication and application system


// Submit application

async function submitApplication(){

    const fullName =
    document.getElementById("fullName")?.value.trim();


    const nickname =
    document.getElementById("nickname")?.value.trim();


    const password =
    document.getElementById("password")?.value;


    const referral =
    document.getElementById("referral")?.value.trim();


    const reason =
    document.getElementById("reason")?.value.trim();



    if(
        !fullName ||
        !nickname ||
        !password
    ){

        alert("Please fill out all required fields.");

        return;

    }



    try{


        await push(
            ref(db,"applications"),
            {

                fullName,

                nickname,

                password,

                referral,

                reason,

                status:"pending",

                submittedAt:Date.now()

            }
        );


        alert(
        "Application submitted. Check back later for approval."
        );


        location.href="index.html";


    }
    catch(error){

        console.error(error);

        alert(error.message);

    }

}



// Signup button

const signupButton =
document.getElementById("signupButton");


if(signupButton){


    signupButton.addEventListener(
    "click",
    submitApplication
    );


}



// Login system

async function loginUser(){

    const username =
    document.getElementById("loginUsername")?.value.trim();


    const password =
    document.getElementById("loginPassword")?.value;



    if(!username || !password){

        alert("Enter username and password.");

        return;

    }



    try{


        await signInWithEmailAndPassword(
            auth,
            makeEmail(username),
            password
        );


        location.href="messages.html";


    }
    catch(error){

        console.error(error);

        alert(
        "Login failed. Check your credentials."
        );

    }


}



// Login button

const loginButton =
document.getElementById("loginButton");


if(loginButton){


    loginButton.addEventListener(
    "click",
    loginUser
    );


}



// Load user profile

async function loadProfile(user){


    const snapshot =
    await get(
        ref(db,"users/"+user.uid)
    );


    if(snapshot.exists()){

        App.profile =
        snapshot.val();

    }


}



// Authentication listener

onAuthStateChanged(
auth,
async(user)=>{


    App.user = user || null;


    if(user){

        await loadProfile(user);

    }
    else{

        App.profile = null;

    }



    updateNavigation(user);



    protectPages(user);


});



// Page protection

function protectPages(user){


    const protectedPages = [

        "members.html",

        "messages.html",

        "files.html"

    ];


    const current =
    location.pathname
    .split("/")
    .pop();



    if(
        protectedPages.includes(current)
        &&
        !user
    ){

        location.href="login.html";

    }



}
// Messaging and channel system


// Set channel

function setChannel(channel){

    App.channel = channel;

    localStorage.setItem(
        "channel",
        channel
    );

}



// Send message

async function sendMessage(text){


    if(!App.user){

        alert("You must be logged in.");

        return;

    }


    if(!text)
        return;



    await push(
        ref(db,"messages"),
        {

            text,

            author:
            App.profile?.nickname ||
            App.user.displayName ||
            "Unknown",


            uid:
            App.user.uid,


            channel:
            App.channel,


            createdAt:
            Date.now()

        }
    );


}



// Message listener

function listenMessages(callback){


    const messagesQuery =
    query(
        ref(db,"messages"),
        orderByChild("createdAt")
    );



    onValue(
    messagesQuery,
    snapshot=>{


        const data =
        snapshot.val() || {};



        callback(
            Object.values(data)
        );


    });


}



// Messages page

const messagesBox =
document.getElementById("messages");


const messageInput =
document.getElementById("messageInput");


const sendButton =
document.getElementById("sendMessage");


const channelButtons =
document.querySelectorAll(".channel");



if(messagesBox){


    let messageCache = [];



    function renderMessages(){


        messagesBox.innerHTML="";



        const filtered =
        messageCache.filter(
            message=>
            message.channel === App.channel
        );



        filtered.forEach(message=>{


            const div =
            document.createElement("div");



            div.className="message";



            div.innerHTML=`

            <div class="messageHeader">

                <span class="author">
                ${message.author}
                </span>


                <span class="time">
                ${formatTime(message.createdAt)}
                </span>

            </div>


            <div class="messageBody">

            ${message.text}

            </div>

            `;



            messagesBox.appendChild(div);



        });



        messagesBox.scrollTop =
        messagesBox.scrollHeight;


    }



    listenMessages(messages=>{


        messageCache =
        messages.sort(
            (a,b)=>
            a.createdAt -
            b.createdAt
        );


        renderMessages();


    });



    // Send button

    if(sendButton){


        sendButton.onclick =
        async()=>{


            const text =
            messageInput.value.trim();



            if(!text)
                return;



            await sendMessage(text);



            messageInput.value="";


        };


    }



    // Enter to send

    if(messageInput){


        messageInput.addEventListener(
        "keydown",
        async(event)=>{


            if(
                event.key==="Enter"
                &&
                !event.shiftKey
            ){

                event.preventDefault();



                const text =
                messageInput.value.trim();



                if(text){


                    await sendMessage(text);


                    messageInput.value="";


                }


            }


        });


    }



    // Channel buttons

    channelButtons.forEach(
    button=>{


        button.onclick=()=>{


            channelButtons.forEach(
            b=>
            b.classList.remove("active")
            );



            button.classList.add("active");



            setChannel(
                button.dataset.channel
            );



            renderMessages();


        };


    });



    // Restore previous channel

    channelButtons.forEach(
    button=>{


        if(
            button.dataset.channel ===
            App.channel
        ){

            button.classList.add("active");

        }
        else{

            button.classList.remove("active");

        }


    });


}

// Members system


const membersContainer =
document.getElementById("members");



if(membersContainer){


    const usersRef =
    ref(db,"users");



    onValue(
    usersRef,
    snapshot=>{


        const users =
        snapshot.val() || {};



        membersContainer.innerHTML="";



        Object.values(users)
        .sort(
            (a,b)=>
            a.nickname.localeCompare(
                b.nickname
            )
        )
        .forEach(user=>{


            const card =
            document.createElement("div");



            card.className =
            "memberCard";



            card.innerHTML=`

            <h2>
            ${user.nickname}
            </h2>


            <p>
            ${user.role || "Member"}
            </p>

            `;



            membersContainer.appendChild(card);



        });



    });


}



// User utilities


App.getUser = ()=>{

    return App.user;

};



App.getProfile = ()=>{

    return App.profile;

};



// Future role system

App.hasRole = (role)=>{


    if(!App.profile)
        return false;



    return App.profile.role === role;


};



// Console debug

console.log(
"Blacklist Division initialized",
{

    user:
    App.user,


    channel:
    App.channel

}
);