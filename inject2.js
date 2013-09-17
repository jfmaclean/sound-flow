function getFrameID(id){
    var elem = document.getElementById(id);
    if (elem) {
        if(/^iframe$/i.test(elem.tagName)) return id; //Frame, OK
        // else: Look for frame
        var elems = elem.getElementsByTagName("iframe");
        if (!elems.length) return null; //No iframe found, FAILURE
        for (var i=0; i<elems.length; i++) {
           if (/^https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com(\/|$)/i.test(elems[i].src)) break;
        }
        elem = elems[i]; //The only, or the best iFrame
        if (elem.id) return elem.id; //Existing ID, return it
        // else: Create a new ID
        do { //Keep postfixing `-frame` until the ID is unique
            id += "-frame";
        } while (document.getElementById(id));
        elem.id = id;
        return id;
    }
    // If no element, return null.
    return null;
}

// Define YT_ready function.
var YT_ready = (function() {
    var onReady_funcs = [], api_isReady = false;
    console.log("YT_ready");
    /* @param func function     Function to execute on ready
     * @param func Boolean      If true, all qeued functions are executed
     * @param b_before Boolean  If true, the func will added to the first
                                 position in the queue*/
    return function(func, b_before) {
        if (func === true) {
            api_isReady = true;
            while (onReady_funcs.length) {
                console.log("onReady_funcs");
                // Removes the first func from the array, and execute func
                onReady_funcs.shift()();
            }
        } else if (typeof func == "function") {
            console.log("is api_ready?",api_isReady);
            if (api_isReady) func();
            else onReady_funcs[b_before?"unshift":"push"](func);
        }
    };
})();
// This function will be called when the API is fully loaded
function onYouTubePlayerAPIReady() {
    console.log("APIREADY");
    YT_ready(true);
}
function onYouTubePlayerReady(p) {
    console.log("player ready ", p);
    p.addEventListener("onStateChange", function(event){alert("shit");});
}

// Load YouTube Frame API
(function() { // Closure, to not leak to the scope
  var s = document.createElement("script");
  s.src = (location.protocol == 'https:' ? 'https' : 'http') + "://www.youtube.com/player_api";
  var before = document.getElementsByTagName("script")[0];
  before.parentNode.insertBefore(s, before);
})();
var player; //Define a player object, to enable later function calls, without
            // having to create a new class instance again.
var container;
// Add function to execute when the API is ready
YT_ready(function(){
    var frameID = "movie_player";
    if (frameID) { //If the frame exists
        // player = new YT.Player(frameID, {
        //     events: {
        //         "onStateChange": "stopCycle",
        //         "onReady": "logState"
        //     }
        // });
        player = document.getElementById(frameID);
        container = document.getElementById("player-api");
    } else alert("frameID DNE");
});

YT_ready(function(){
    console.log("adding pause in 5 sec");
    // console.log(player);
    // console.log(player.getPlayerState());
    setTimeout(function() {player.pauseVideo();}, 5000);
});
YT_ready(function(){
    container = document.getElementById("player-api");
    console.log("added event listener");
    sendMessgeToContent("YT_READY", {sender: "PAGE", player: player});
    player.addEventListener("onStateChange", function(event) {console.log("onStateChange: ", event.data);});
    container.addEventListener("onStateChange", function(event) {console.log("onStateChange: ", event.data);});
});
// YT_ready(function(){
//     var all = document.getElementsByTagName("*");

//     for (var i=0, max=all.length; i < max; i++) {
//         console.log(".");
//         all[i].addEventListener("onStateChange", function(event) {console.log("onStateChange: ", event.data);});
//     }
// });
var logState = function(){
    console.log("added event listener");
    player.addEventListener("onStateChange", function(event) {console.log("onStateChange: ", event.data);});
};

// Example: function stopCycle, bound to onStateChange
function stopCycle(event) {
    console.log("stopCycle");
    alert("onStateChange has fired!\nNew state:" + event.data);
}

var sendMessgeToContent = function (name, data) {
    var event = new CustomEvent(name, {detail: data, bubbles: true, cancelable : false});
    var dispatched = container.dispatchEvent(event);
    console.log("sent message ", name, " with data ", data);
};