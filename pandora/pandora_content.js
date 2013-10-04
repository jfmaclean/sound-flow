
var play, pause;
var DEBUG = true;

var PLAYING = 1;
var PAUSED = 0;

var inject = function() {
    injected = true;
    var s = document.createElement('script');
    s.src = chrome.extension.getURL("pandora/pandora_inject.js");
    s.onload = function() {
        this.parentNode.removeChild(this);
    };
    (document.head||document.documentElement).appendChild(s);
};

var receiveMessageFromPage = function (name, handler) {
    container.addEventListener(name, function(event){
        if (DEBUG) console.log("Content script got message", name, "with event ", event);
        handler(event);
    }, false);
};

var sendMessageToPage = function (name, data) {
    var event = new CustomEvent(name, {detail: data, bubbles: false, cancelable : false});
    var dispatched = container.dispatchEvent(event);
    if (DEBUG) console.log("Content script sent event ", name, "with data", data);
};

var sendMessageToBackground = function (message, responseHandler) {
    chrome.runtime.sendMessage(message, responseHandler);
};

// receive messages from background
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log("content script received message ", message, " from sender ", sender);
    if (message.message === "updatePlayer") {
        sendMessageToPage("UPDATE_PLAYER", {setState: message.desiredState});
    }
});

var injected = false;
// on load
var readyStateCheckInterval = setInterval(function() {
  if (document.readyState === "complete") {
    if (!injected) inject();
    container = document.getElementById("playbackControl");

    receiveMessageFromPage("READY", onLoad);
    receiveMessageFromPage("STATE_CHANGE", stateChange);
    receiveMessageFromPage("UPDATE_RESPONSE", updateResponse);

    clearInterval(readyStateCheckInterval);
  }
}, 10);

var getState = function () {
    play = document.getElementsByClassName("playButton")[0];
    pause = document.getElementsByClassName("pauseButton")[0];
    console.log("getState");
    if (play.display === "none") {
        return PAUSED;
    } else {
        return PLAYING;
    }
};

var toggle = function () {
    console.log("toggle, play/pause", play, pause);
    if (getState() === PAUSED) {
        play.click();
    } else {
        pause.click();
    }
};

var stateChange = function (event) {
    console.log("Content got state change to", event.detail.state);
    state = event.detail.state;
    sendMessageToBackground({message: "click", state: state, sender: 'content'}, function(r){console.log("response handler in background");});
};

var updateResponse = function (event) {
    console.log("Content got update response of ", event.detail.err);
};

var onLoad = function (event) {
    console.log("onload");
    sendMessageToBackground({message: "register", state: PLAYING},function() {
        console.log("handler");});

};