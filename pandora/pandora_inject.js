var player, container;
var DEBUG = 1;

var PLAYING = 1;
var PAUSED = 0;

// (function() { // Closure, to not leak to the scope
//   var s = document.createElement("script");
//   s.src = (location.protocol == 'https:' ? 'https' : 'http') + "://www.youtube.com/player_api";
//   var before = document.getElementsByTagName("script")[0];
//   before.parentNode.insertBefore(s, before);
// })();

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
            // player.setVolume(request.setVolume);
        } else err = "Can't parse setVolume=" + request.setVolume;
    } else if (request.hasOwnProperty("setMute")) {
        if (request.setMute === 0) { //unmute
            // player.unMute();
        } else if (request.setMute === 1) { //mute
            // player.mute();
        } else err = "Can't parse setMute=" + request.setMute;
    } else if (request.hasOwnProperty("setState")) {
        if (request.setState === PLAYING) { // play
            // console.log(player.removeEventListener);
            // player.removeEventListener("onStateChange", onStateChange, false);
            // console.log("before play: ", player.getPlayerState());
            play.click();
            // console.log("after play: ", player.getPlayerState());
            // player.addEventListener('onStateChange', onStateChange);
        } else if (request.setState === PAUSED) { //pause
            // player.removeEventListener("onStateChange", onStateChange, false);
            // console.log("before pause: ", player.getPlayerState());
            pause.click();
            // console.log("after pause: ", player.getPlayerState());
            // player.addEventListener('onStateChange', onStateChange);
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
                // response.volume = player.getVolume();
                break;
            case "isMuted":
                // response.isMuted = player.isMuted();
                break;
            default:
                console.log("Unknown request for injected script", request);
        }
    }
    sendMessageToContent("INFO_RESPONSE", response);
};


// window.onYouTubePlayerReady = function (playerid) {
$(document).ready(function () {
    if (DEBUG) console.log("Pandora injected!");
    
    // player = playerid;
    
    container = document.getElementById("playbackControl");
    play = document.getElementsByClassName("playButton")[0];
    pause = document.getElementsByClassName("pauseButton")[0];

    listenFromContent("UPDATE_PLAYER", updatePlayer);
    listenFromContent("REQUEST_INFO", requestInfo);
    sendMessageToContent("READY", {});
});
    // 
// };


