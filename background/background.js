// tabs: {tab.id => {tab: tab,state: state}, ...}
// playing: [tabid, ...]
// past: {currTabId => [PrevTabId, ...], ...}
// starred: [tabId, ...]

var PLAYING = 1;
var PAUSED = 0;

var storage = false;
var data;
// var requests = {};
var requests = [];
//////////////////////////////////////////////
//////////// Event Handlers //////////////////
//////////////////////////////////////////////

var onTabClosed = function (tabId, removeInfo) {
    var tabsToPlay;
    if (_.has(data.tabs, tabId)) {
        data.starred = _.without(data.starred, tabId);
        data.tabs = _.omit(data.tabs, tabId);
        data.requests = _.without(data.requests, tabId);
        
        sendMessageToPopup("popupUpdate", data);
        if (_.contains(data.playing, tabId)) {
            // find tabs to go back to
            // tabsToPlay = findPastTabsToPlay(tabId);
            // _.each(tabsToPlay, function(pastTabId, i, list) {
            //     var tempState = data.tabs[pastTabId].state;
            //     tempState.playing = true;
            //     requestUpdate(pastTabId, tempState);
            // });
            restorePrevTabs(tabId);
            data.playing = _.without(data.playing, tabId);
        } else {
            // Can't find anything to go back to
        }
    }
};

var updateFromPage = function (tab, state, replace) {
    var tabId = tab.id;
    var currPlaying = _.contains(data.playing, tabId);
    if (!_.has(data.tabs, tabId)) {
        data.tabs[tabId] = {tab: tab, state: state};
    }

    // If this is switching to playing
    if (state.playing && !currPlaying) {
        moveTabToTop(tabId);
    } // or is this switching to paused
    else if (!state.playing && currPlaying) {
        restorePrevTabs(tabId);
    }

};

// var stateUpdate = function (tabId, state, replace) {
//     if (tabId) {
//         if (state.playing && tabId !== data.playing && replace) {
//             if (data.playing) {
//                 if (requests[tabId]) {
//                     requests[tabId] = false;
//                     data.tabs[tabId].state = state;
//                     sendMessageToPopup({type: "popupUpdate", data: data});
//                     return;
//                 }
//                 data.past[tabId] = data.playing;
//                 data.tabs[data.playing].state.playing = false;
//                 sendUpdate(data.playing, data.tabs[data.playing].state);
//             }
//             data.playing = tabId;
//         }
//         data.tabs[tabId].state = state;
//         sendMessageToPopup({type: "popupUpdate", data: data});
//     }

// };

// var updateFromPage = function (tab, state) {
//     console.log(data, tab, state);
//     if (!data.tabs.hasOwnProperty(tab.id)) {
//         data.tabs[tab.id] = {tab: tab, state: state};
//         requests[tab.id] = false;
//     }

//     stateUpdate(tab.id, state, true);


// };

//////////////////////////////////////////////
//////////// Message Passing /////////////////
//////////////////////////////////////////////

// Listen from pages
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // console.log("Request ", request, "from ", sender);
    if (request.type === "update" && request.state) {
        updateFromPage(sender.tab, request.state);
    } else if (request.type === "registerPopup") {
        sendMessageToPopup("popupInit", data);
    } else if (request.type === "popupClick" && request.state) {
        requests[request.tabId] = true;
        sendUpdate(request.tabId, request.state);
    } else if (request.type === "popupStar" ) {
        data.starred = request.tabId;
        sendMessageToPopup("popupUpdate", data);
    }
  });

// Send updates to pages
var sendUpdate = function (tabId, state) {
    chrome.tabs.sendMessage(tabId, {type: "updatePlayer", desiredState: state}, function (response) {
        console.log("Content script received update message!");
    });
    sendMessageToPopup({type: "popupUpdate", tab: tabId, state: state});
};

var sendMessageToPopup = function(type, data) {
    chrome.runtime.sendMessage({type: type, data: data}, function (response) {
        console.log("popup received message!");
    });
};

//////////////////////////////////////////////
//////////// Helper Functions ////////////////
//////////////////////////////////////////////

var countObjectProperties =  function (obj)
{
    var count = 0;
    for(var i in obj)
        if(obj.hasOwnProperty(i))
            count++;

    return count;
};

var getSingularProperty = function (obj) {
    for(var i in obj) {
        if(obj.hasOwnProperty(i)) {
            return i;
        }
    }
};

var findPastTabsToPlay = function (tabId) {
    while (!data.tabs.hasOwnProperty(pastTabId)) {
        if (data.past.hasOwnProperty(pastTabId)) {
            pastTabId = data.past[pastTabId];
        } else { // If we can't find a tab to go back to
            console.log("couldn't find a way back");
            if (data.starred && data.tabs[data.starred]) {
                pastTabId = data.starred;
            }
            else if (countObjectProperties(data.tabs) == 1) {
                pastTabId = getSingularProperty(data.tabs);
            }
            else return;
        }
    }
};

//////////////////////////////////////////////
//////////// Initialization //////////////////
//////////////////////////////////////////////


var init = function () {
    data = {tabs: {}, playing: [], past: {}, starred: undefined};
    
    chrome.tabs.onRemoved.addListener(onTabClosed);
};

init();
