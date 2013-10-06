// tabs: {tab.id => {tab: tab,state: state}, ...}
// playing: [tabid]
// past: {currTabId => PrevTabId, ...}

var PLAYING = 1;
var PAUSED = 0;

var storage = false;
var data;
var requests = {};

//////////////////////////////////////////////
//////////// Event Handlers //////////////////
//////////////////////////////////////////////


// var registerTab = function (newTab, state) {
//     // console.log("registering tab:", newTab, "with state:", state);
//     var tabs = {};
//     if (storage) {
//         chrome.storage.local.get("tabs", function (items) {
//             if (items && items.tabs) {
//                 tabs = items.tabs;
//             }
//             // console.log("Got tablist: ", tabs);
//             tabs[newTab.id] = {tab: newTab, state: state};
//             // console.log("new tablist should be ", tabs);
//             chrome.storage.local.set({"tabs": tabs}, function () {
//                 console.log("set callback, last error?", chrome.runtime.lastError);
//                 stateUpdate(newTab.id, state);
//             });
//         });
//     } else {
//         // console.log("current memory ", data);
//         // data.tabs[newTab.id] = {tab: newTab, state: state};
//         // stateUpdate(newTab.id, state);
//     }
// };

var onTabClosed = function (tabId, removeInfo) {
    var pastTabId;
    if (data.tabs.hasOwnProperty(tabId)) {
        if (tabId == data.starred) {
            data.starred = undefined;
        }
        delete data.tabs[tabId];
        delete requests[tabId];
        sendMessageToPopup({type: "popupUpdate", data: data});
        if (data.curr === tabId) {
            // debugger;
            console.log(data);
            pastTabId = data.past[tabId];
            //find a tab to go back to
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
            data.tabs[pastTabId].state.playing = true;
            sendUpdate(pastTabId, data.tabs[pastTabId].state);
            data.curr = pastTabId;
        } else {
            // TODO
        }
    }
};

var stateUpdate = function (tabId, state, replace) {
    if (tabId) {
        if (state.playing && tabId !== data.curr && replace) {
            if (data.curr) {
                if (requests[tabId]) {
                    requests[tabId] = false;
                    data.tabs[tabId].state = state;
                    sendMessageToPopup({type: "popupUpdate", data: data});
                    return;
                }
                data.past[tabId] = data.curr;
                data.tabs[data.curr].state.playing = false;
                sendUpdate(data.curr, data.tabs[data.curr].state);
            }
            data.curr = tabId;
        }
        data.tabs[tabId].state = state;
        sendMessageToPopup({type: "popupUpdate", data: data});
    }

};

var updateFromPage = function (tab, state) {
    console.log(data, tab, state);
    if (!data.tabs.hasOwnProperty(tab.id)) {
        data.tabs[tab.id] = {tab: tab, state: state};
        requests[tab.id] = false;
    }

    stateUpdate(tab.id, state, true);


};

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
        sendMessageToPopup({type: "popupInit", data: data});
    } else if (request.type === "popupClick" && request.state) {
        requests[request.tabId] = true;
        sendUpdate(request.tabId, request.state);
    } else if (request.type === "popupStar" ) {
        data.starred = request.tabId;
        sendMessageToPopup({type: "popupUpdate", data: data});
    }
  });

// Send updates to pages
var sendUpdate = function (tabId, state) {
    chrome.tabs.sendMessage(tabId, {type: "updatePlayer", desiredState: state}, function (response) {
        console.log("Content script received update message!");
    });
    sendMessageToPopup({type: "popupUpdate", tab: tabId, state: state});
};

var sendMessageToPopup = function(message) {
    chrome.runtime.sendMessage(message, function (response) {
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

//////////////////////////////////////////////
//////////// Initialization //////////////////
//////////////////////////////////////////////


var init = function () {
    data = {tabs: {}, curr: undefined, past: {}, starred: undefined};
    
    chrome.tabs.onRemoved.addListener(onTabClosed);
};

init();
