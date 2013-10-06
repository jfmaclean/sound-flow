var player;
var container;
var state = -1;

var DEBUG = true;

var PLAYING = 1;
var PAUSED = 0;

var injected = false;

var inject = function() {
    injected = true;
    var s = document.createElement('script');
    s.src = chrome.extension.getURL("youtube/youtube_inject.js");
    s.onload = function() {
        this.parentNode.removeChild(this);
    };
    (document.head||document.documentElement).appendChild(s);
};

//////////////////////////////////////////////
////////////// Message Passing ///////////////
//////////////////////////////////////////////

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
    if (message.type === "updatePlayer") {
        sendMessageToPage("UPDATE_PLAYER", {setState: message.desiredState});
    }
});

//////////////////////////////////////////////
////////////// Event Handlers ////////////////
//////////////////////////////////////////////

var stateChange = function (event) {
    console.log("Content got state change to", event.detail.state);
    state = event.detail.state;
    sendMessageToBackground({type: "update", state: state, sender: 'content'}, function(r){console.log("response handler in background");});
};

var updateResponse = function (event) {
    console.log("Content got update response of ", event.detail.err);
};

var onLoad = function (event) {
    sendMessageToBackground({type: "register", state: 1},function() {console.log("handler");});
};


// on load
var readyStateCheckInterval = setInterval(function() {
  if (document.readyState === "complete") {
    if (!injected) inject();
    container = document.getElementById("player-api");

    receiveMessageFromPage("YT_READY", onLoad);
    receiveMessageFromPage("STATE_CHANGE", stateChange);
    receiveMessageFromPage("UPDATE_RESPONSE", updateResponse);

    clearInterval(readyStateCheckInterval);
  }
}, 10);