// tabs: {tab.id => {tab: tab,state: state}, ...}
// playing: [tabid, ...]
// past: {currTabId => [PrevTabId, ...], ...}
// pinned: [tabId, ...]

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
        data.pinned = _.without(data.pinned, tabId);
        data.tabs = _.omit(data.tabs, tabId);
        data.requests = _.without(data.requests, tabId);
        
        sendMessageToPopup("popupUpdate", data);
        if (_.contains(data.playing, tabId)) {
            restorePrevTabs(tabId);
            data.playing = _.without(data.playing, tabId);
        } else {
            // Can't find anything to go back to
        }
    }
};

var updateFromPage = function (tab, state, replace) {
    var tabId = tab.id;
    console.log(data, tabId, state, replace);
    var isPlaying = _.contains(data.playing, tabId);
    // If this is a new tab
    if (!_.has(data.tabs, tabId)) {
        data.tabs[tabId] = {tab: tab, state: state};
    }
    // If this is switching to playing
    if (state.playing && !isPlaying) {
        moveTabToTop(tabId);
    } // or is this switching to paused
    else if (!state.playing && isPlaying) {
        restorePrevTabs(tabId);
    }
    sendMessageToPopup("popupUpdate", data);
};

//////////////////////////////////////////////
//////////// Message Passing /////////////////
//////////////////////////////////////////////

// Listen from pages
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("Request ", request, "from ", sender);
    if (request.type === "update" && request.state) {
        updateFromPage(sender.tab, request.state);
    } else if (request.type === "registerPopup") {
        sendMessageToPopup("popupInit", data);
    } else if (request.type === "popupClick" && request.state) {
        requests[request.tabId] = true;
        sendUpdate(request.tabId, request.state);
    } else if (request.type === "popupStar" ) {
        data.pinned = request.tabId;
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

var moveTabToTop = function(tabId) {
    if (_.contains(data.playing, tabId)) {
        return;
    }
    var currPlaying = _.filter(data.playing, function(tab) {
        return _.contains(data.pinned, tab);
    });
    data.past[tabId] = currPlaying;
    data.playing = _.difference(data.playing, currPlaying);
    data.playing.push(tabId);
    updateTabs([tabId], true, false);
    updateTabs(currPlaying, false, false);
};

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
            if (data.pinned && data.tabs[data.pinned]) {
                pastTabId = data.pinned;
            }
            else if (countObjectProperties(data.tabs) == 1) {
                pastTabId = getSingularProperty(data.tabs);
            }
            else return;
        }
    }
};

var updateTabs = function(tabArr, playing, pauseOthers) {
    var tabId,desiredState;
    if (pauseOthers) {
        for (var j = data.playing.length - 1; j >= 0; j--) {
            tabId = data.playing[j];
            desiredState = data.tabs[tabId].state;
            desiredState.playing = false;
            chrome.tabs.sendMessage(tabId, {type: "updatePlayer", desiredState: desiredState});
        }
    }
    for (var i = tabArr.length - 1; i >= 0; i--) {
        tabId = tabArr[i];
        desiredState = data.tabs[tabId].state;
        desiredState.playing = playing;
        chrome.tabs.sendMessage(tabId, {type: "updatePlayer", desiredState: desiredState});
    }
};

var restorePrevTabs = function (tabId) {
    var pastTabIds, nextTabIds = [];
    if (!_.has(data.past, tabId)) {
        return -1;
    }
    pastTabIds = data.past[tabId];
    //WHILE tabs does not contain anything in pastTabIds
    while (pastTabIds.length > 0) {
        nextTabIds = [];
        for (var i = pastTabIds.length - 1; i >= 0; i--) {
            if (_.has(data.tabs, pastTabIds[i])) {
                nextTabIds.push(pastTabIds[i]);
            }
        }
        // We didn't find anything to go back to, recurse
        if (nextTabIds.length === 0) {
            pastTabIds = [];
            pastTabIds.push(_.each(pastTabIds, function (e, i) {
                return data.past(e);
            }));
            continue;
        } else {
            updateTabs(nextTabIds, true, false);
            break;
        }
    }
};

//////////////////////////////////////////////
//////////// Initialization //////////////////
//////////////////////////////////////////////


var init = function () {
    data = {tabs: {}, playing: [], past: {}, pinned: undefined};
    
    chrome.tabs.onRemoved.addListener(onTabClosed);
};

init();
