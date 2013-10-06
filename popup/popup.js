// tabs: {tab.id => {tab: tab,state: state}, ...}
// curr: tabid
// past: {currTabId => PrevTabId, ...}

var PLAYING = 1;
var PAUSED = 0;

var data;
var newData;

//////////////////////////////////////////////
////////////////// Draw //////////////////////
//////////////////////////////////////////////

var draw = function () {
  var play_list = $("#play_list").empty();
  var pause_list = $("#pause_list").empty();
  var player, icon, title, playing, state_button, volume_button, muted;

  if (data) {
    for (var i in data.tabs) {
      muted = data.tabs[i].state.muted;
      icon = "<img class='icon' src='" + (data.tabs[i].tab.favIconUrl ? data.tabs[i].tab.favIconUrl : "../images/PA.png") + "'>";
      playing = data.tabs[i].state.playing;
      title = "<p class='title'>" + (data.tabs[i].state.title ? data.tabs[i].state.title : data.tabs[i].tab.title) + "</p>";
      state_button = "<img class='state_button' src=" + (playing ? "'../images/pause_button.png'" : "'../images/play_button.png'") + ">";
      volume_button = "<img class='volume_button' src=" + (muted ?  "'../images/mute_button.png'" : "'../images/volume_button.png'") + ">";
      player = "<li class='player' data-tab-id=" + i +">" + icon + title + state_button + volume_button + "</li>";
      // console.log(i);
      if (playing) {
        play_list.append(player);
      } else {
        pause_list.append(player);
      }
    }
    // play_list.each(function(i, e) {
    //   var tab = e[data-tabId];
    //   e.
    // }
    $(".state_button").click(function (c) {
        var parent = $(this).parent('li');
        var tabId = parent.data("tab-id");
        var state = data.tabs[tabId].state;
        state.playing = !state.playing;
        sendMessageToBackground({type: "popupClick", tabId: tabId, state: state});
      });
    $(".volume_button").click(function (c) {
        var parent = $(this).parent('li');
        var tabId = parent.data("tab-id");
        var state = data.tabs[tabId].state;
        state.muted = !state.muted;
        sendMessageToBackground({type: "popupClick", tabId: tabId, state: state});
      });
  }
};

//////////////////////////////////////////////
////////////// Message Passing ///////////////
//////////////////////////////////////////////

var sendMessageToBackground = function (message, responseHandler) {
  if (responseHandler) {
    chrome.runtime.sendMessage(message, responseHandler);
  } else {
     chrome.runtime.sendMessage(message);
  }
};

// receive messages
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log("popup received message ", message, " from sender ", sender);
    if (message.type == "popupInit") {
      data = message.data;
      console.log("Popup received data of ", data);
      draw();
    } else if (message.type == "popupUpdate") {
      data = message.data;
      console.log("Popup received data of ", data);
      draw();
    }

});

$(document).ready(function(){
  sendMessageToBackground({type: "registerPopup"});
});
