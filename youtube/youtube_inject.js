var player, container;
var DEBUG = 1;

//state = {playing: boolean, volume: volume: 0 - 1, muted: boolean, title: string}
var state = {playing: false, volume: 1, muted: false, title: ""};
var PLAYING = 1;
var PAUSED = 0;
var forceUpdate = false;

(function() { // Closure, to not leak to the scope
  var s = document.createElement("script");
  s.src = (location.protocol == 'https:' ? 'https' : 'http') + "://www.youtube.com/player_api";
  var before = document.getElementsByTagName("script")[0];
  before.parentNode.insertBefore(s, before);
})();

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

// Listening to player
var onStateChange = function (e) {
    state.playing = (e === PLAYING);
    sendMessageToContent("STATE_CHANGE", {state: state});
};

// Receiving from content script
var updatePlayer = function(event) {
    var requestState = event.detail.setState;
    var err = "";
    if (requestState.volume !== state.volume) {
        player.setVolume(requestState.volume * 100);
    }
    if (requestState.muted !== state.muted) {
        if (requestState.muted) {
            player.mute();
        } else {
            player.unMute();
        }
    }
    if (requestState.playing !== state.playing) {
        if (requestState.playing) {
            player.playVideo();
        } else {
            player.pauseVideo();
        }
    }
    if (requestState.title !== state.title) {
        err += "diff title";
    }

    // sendMessageToContent("STATE_CHANGE", {state:state});
    setTimeout(function() {
        forceUpdateFunc();
    }, 1000);
};

var requestInfo = function (event) {
    updateState();
    sendMessageToContent("INFO_RESPONSE", {state: state});
};

var forceUpdateFunc = function() {
    var tempState = {};
    tempState.playing = (player.getPlayerState() == PLAYING);
    tempState.muted = player.isMuted();
    tempState.volume = player.getVolume()/100.0;
    tempState.title = document.getElementsByClassName("watch-title")[0].title;
    state = tempState;
    sendMessageToContent("STATE_CHANGE", {state: state});
};

var updateState = function() {
    var tempState = {};
    tempState.playing = (player.getPlayerState() == PLAYING);
    tempState.muted = player.isMuted();
    tempState.volume = player.getVolume()/100.0;
    tempState.title = document.getElementsByClassName("watch-title")[0].title;
    for (var i in tempState) {
        if (tempState[i] !== state[i]) {
            console.log(i, " was changed from ", state[i], " to  ", tempState[i]);
            state = tempState;
            sendMessageToContent("STATE_CHANGE", {state: state});
        }
    }
};


window.onYouTubePlayerReady = function (playerid) {
    if (DEBUG) console.log("onYouTubePlayerReady injected!");
    
    player = playerid;
    
    container = document.getElementById("player-api");

    player.addEventListener('onStateChange', onStateChange);

    listenFromContent("UPDATE_PLAYER", updatePlayer);
    listenFromContent("REQUEST_INFO", requestInfo);

    setInterval(function() {
        updateState();
    }, 1000);

    sendMessageToContent("YT_READY", {player: player});
};


