const socket = io();

// Elements
const $chatbox = document.querySelector(".chat-form");
const $chatboxInput = $chatbox.querySelector('input[name="message"]');
const $chatboxButton = $chatbox.querySelector("button");
const $locationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $chatSidebar = document.querySelector(".chat__sidebar");

// Templates
const $messageTemplate = document.querySelector("#message-template").innerHTML;
const $locationTemplate = document.querySelector("#location-template").innerHTML;
const $sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

// AutoScrolling Function
const autoscroll = () => {
    const $newMessage = $messages.lastElementChild;

    // Height of new message
    const newMessageHeight = $newMessage.offsetHeight + getComputedStyle($newMessage).marginBottom;

    // Get visible height
    const visibleHeight = $messages.offsetHeight;

    // Container height
    const containerHeight = $messages.scrollHeight;

    // How far have the user scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on("message", (message) => {
    console.log(message.text);

    const HTML = Mustache.render($messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a"),
    });

    $messages.insertAdjacentHTML("beforeend", HTML);
    autoscroll();
});

$chatbox.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!$chatboxInput.value) {
        return;
    }

    $chatboxButton.setAttribute("disabled", "disabled");
    
    socket.emit("sendMessage", $chatboxInput.value, (ack) => {
        $chatboxButton.removeAttribute("disabled");
        $chatboxInput.value = "";
        $chatboxInput.focus();

        console.log(ack);
    });
});


$locationButton.addEventListener("click", (e) => {
    if (!navigator.geolocation) {
        return alert("Your browser does not support geolocation!");
    }

    $locationButton.setAttribute("disabled", "disabled");
    navigator.geolocation.getCurrentPosition(position => {
        socket.emit("sendLocation", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $locationButton.removeAttribute("disabled");
            console.log("Location Shared!");
        });
    });
});

socket.on("locationMessage", (location) => {
    const locationHTML = Mustache.render($locationTemplate, {
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format("h:mm a"),
    });

    $messages.insertAdjacentHTML("beforeend", locationHTML);
    autoscroll();
}, () => {
    console.log("Location shared!")
});

socket.on("roomData", ({ room, users }) => {
    const HTML = Mustache.render($sidebarTemplate, {
        room,
        users
    });

    $chatSidebar.innerHTML = HTML;
});

socket.emit("join", { username, room }, (error) => {
    alert(error);
    location.href = "/";
});
