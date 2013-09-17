
var player;
var container;
var state = -1;
var DEBUG = true;


var inject = function() {
    injected = true;
    var s = document.createElement('script');
    s.src = chrome.extension.getURL("inject.js");
    s.onload = function() {
        this.parentNode.removeChild(this);
    };
    (document.head||document.documentElement).appendChild(s);
};

// var getState = function () {
//     var state = sendMessageToPage("REQUEST_INFO", ["state"]);
//     if (state === 2) {
//         return "paused";
//     } else if (state === 1) {
//         return "playing";
//     } else if (state === -1) {
//         return "unstarted";
//     } else if (state === 3) {
//         return  "buffering";
//     } else if (state === 5) {
//         return "video_cued";
//     } return "unknown (" + state + ")";
// };


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

chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse) {
    console.log("Content received message" + sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension" + message);
  });


// receive messages
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log("content script received message ", message, " from sender ", sender);
    if (message.hasOwnProperty("updatePlayer")) {
        sendMessageToPage("UPDATE_PLAYER", message.updatePlayer);
    }
});
var injected = false;
// on load
var readyStateCheckInterval = setInterval(function() {
  if (document.readyState === "complete") {
    if (!injected) inject();
    container = document.getElementById("player-api");
    // player = document.getElementById("movie_player");
    receiveMessageFromPage("YT_READY", onLoad);
    receiveMessageFromPage("STATE_CHANGE", stateChange);
    receiveMessageFromPage("UPDATE_RESPONSE", updateResponse);
    clearInterval(readyStateCheckInterval);
  }
}, 10);


var stateChange = function (event) {
    console.log("Content got state change to", event.detail.state);
    state = event.detail.state;
};

var updateResponse = function (event) {
    console.log("Content got update response of ", event.detail.err);
};

var onLoad = function (event) {
    
    // if (DEBUG) console.log("Content");

    setInterval(function(){
        if (state === 1) sendMessageToPage("UPDATE_PLAYER", {setState: 2});
        else if (state === 2) sendMessageToPage("UPDATE_PLAYER", {setState: 1});
    }, 5000);

    // player.addEventListener("onYouTubePlayerReady", (player.id)
    // sendMessageToBackground({message: "register", status: getStatus()}, function(response) {
    //     console.log("Background responded to registration event!");
    // });
};


	