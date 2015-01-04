var play, pause, container;
var DEBUG = 1;

//state = {playing: boolean, volume: volume: 0 - 1, muted: boolean, title: string}
var state = {playing: false, volume: 1, muted: false, title: ""};
var PLAYING = 1;
var PAUSED = 0;

//////////////////////////////////////////////
////////////// Message Passing ///////////////
//////////////////////////////////////////////

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

//////////////////////////////////////////////
////////////// Event Handlers ////////////////
//////////////////////////////////////////////

// // Listening to player
// var onStateChange = function (e) {
//     state.playing = (e === PLAYING);
//     sendMessageToContent("STATE_CHANGE", {state: state});
// };

// Receiving from content script
var updatePlayer = function(event) {
    var requestState = event.detail.setState;
    var err = "";
    if (requestState.volume !== state.volume) {
        // Pandora doesn't have an easy way to do this
    }
    if (requestState.muted !== state.muted) {
        var volumeControl = document.getElementsByClassName("volumeControl")[0];
        // if (requestState.muted) {
            volumeControl.getElementsByClassName("volumeButton")[0].click();
        // } else {
            // volumeControl.getElementsByClassName("muted")[0].click();
        // }
    }
    if (requestState.playing !== state.playing) {
        if (requestState.playing) {
            play.click();
        } else {
            pause.click();
        }
    }
    if (requestState.title !== state.title) {
        err += "diff title";
    }

    sendMessageToContent("UPDATE_RESPONSE", {err: err});
};

var requestInfo = function (event) {
    updateState();
    
    sendMessageToContent("INFO_RESPONSE", {state: state});
};

var updateState = function() {
    var tempState = {};
    tempState.playing = getPlaying();
    tempState.muted = getMuted();
    tempState.volume = 1;
    // Temporary Hardcode
    tempState.title = document.getElementsByClassName("playerBarSong")[0].text;
    console.log("temp: ", tempState, " real: ", state);
    for (var i in tempState) {
        if (tempState[i] !== state[i]) {
            console.log(i, " was changed from ", state[i], " to  ", tempState[i]);
            state = tempState;
            sendMessageToContent("STATE_CHANGE", {state: state});
        }
    }
};

var getPlaying = function () {
    return play.style.display === "none";
};

var getMuted = function () {
    var volumeControl = document.getElementsByClassName("volumeControl")[0];
    return volumeControl.getElementsByClassName("muted").length > 0;
};

var toggle = function () {
    // console.log("toggle, play/pause", play, pause);
    if (getState() === PAUSED) {
        play.click();
    } else {
        pause.click();
    }
};

$(document).ready(function () {
    if (DEBUG) console.log("Pandora injected!");
    
    container = document.getElementById("playbackControl");
    play = document.getElementsByClassName("playButton")[0];
    pause = document.getElementsByClassName("pauseButton")[0];
    setInterval(function() {
        updateState();
    }, 1000);
    listenFromContent("UPDATE_PLAYER", updatePlayer);
    listenFromContent("REQUEST_INFO", requestInfo);
    sendMessageToContent("READY", {});
});
