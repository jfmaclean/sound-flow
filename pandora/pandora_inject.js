var player, container;
var DEBUG = 1;

var PLAYING = 1;
var PAUSED = 0;

// Messaging functions
var sendMessageToContent = function (name, data) {
    data.sender = "INJECTED_PAGE";
    var event = new CustomEvent(name, {detail: data, bubbles: false, cancelable : false});
    var dispatched = container.dispatchEvent(event);
    if (DEBUG) console.log("injected script sent event ", name, "with data", data);
};

var listenFromContent = function (name, handler) {
    container.addEventListener(name, function(event){
        if (DEBUG) console.log("Injected script got message", name, "with event ", event);
        handler(event);
    }, false);
};

//// Individual event handlers
// Listening to player
var onStateChange = function (event) {
    sendMessageToContent("STATE_CHANGE", {sender: "PAGE", state: event});
};

// Receiving from content script
var updatePlayer = function(event) {
    var request = event.detail;
    var err;
    if (request.hasOwnProperty("setVolume")) {
        if (request.setVolume < 0 || request.setVolume > 100) {
            // TODO
        } else err = "Can't parse setVolume=" + request.setVolume;
    } else if (request.hasOwnProperty("setMute")) {
        if (request.setMute === 0) { //unmute
            // TODO
        } else if (request.setMute === 1) { //mute
            // TODO
        } else err = "Can't parse setMute=" + request.setMute;
    } else if (request.hasOwnProperty("setState")) {
        if (request.setState === PLAYING) { // play
            play.click();
        } else if (request.setState === PAUSED) { //pause
            pause.click();
        } else err = "Can't parse setState=" + request.setState;
    }
    else {
        err = "Can't parse request";
    }
    sendMessageToContent("UPDATE_RESPONSE", {err: err});
};

var getState = function () {
    console.log("getState");
    if (play.display === none) {
        return PAUSED;
    } else {
        return PLAYING;
    }
};

var requestInfo = function (event) {
    var response = {};
    for (var request in event.detail.requests) {
        switch (request) {
            case "state":
                response.state = getState();
                break;
            case "volume":
                // response.volume = TODO
                break;
            case "isMuted":
                // response.isMuted = TODO
                break;
            default:
                console.log("Unknown request for injected script", request);
        }
    }
    sendMessageToContent("INFO_RESPONSE", response);
};


$(document).ready(function () {
    if (DEBUG) console.log("Pandora injected!");
    
    container = document.getElementById("playbackControl");
    play = document.getElementsByClassName("playButton")[0];
    pause = document.getElementsByClassName("pauseButton")[0];

    listenFromContent("UPDATE_PLAYER", updatePlayer);
    listenFromContent("REQUEST_INFO", requestInfo);
    sendMessageToContent("READY", {});
});
