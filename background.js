// tabs: {tab.id => {tab: tab,state: state}, ...}
// curr: tabid
// past: {currTabId => PrevTabId, ...}

var PLAYING = 1;
var PAUSED = 0;

var storage = false;
var data;

//////////////////////////////////////////////
//////////// Event Handlers //////////////////
//////////////////////////////////////////////


var registerTab = function (newTab, state) {
    // console.log("registering tab:", newTab, "with state:", state);
    var tabs = {};
    if (storage) {
        chrome.storage.local.get("tabs", function (items) {
            if (items && items.tabs) {
                tabs = items.tabs;
            }
            // console.log("Got tablist: ", tabs);
            tabs[newTab.id] = {tab: newTab, state: state};
            // console.log("new tablist should be ", tabs);
            chrome.storage.local.set({"tabs": tabs}, function () {
                console.log("set callback, last error?", chrome.runtime.lastError);
                stateUpdate(newTab.id, state);
            });
        });
    } else {
        // console.log("current memory ", data);
        data.tabs[newTab.id] = {tab: newTab, state: state};
        stateUpdate(newTab.id, state);
    }
};

var onTabClosed = function (tabId, removeInfo) {
    var pastTabId;
    // console.log("tab closed");
    if (storage) {

    } else {
        if (data.tabs.hasOwnProperty(tabId)) {
            delete data.tabs[tabId];
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
                        return;
                    }
                }
                sendUpdate(pastTabId, PLAYING);
                data.curr = pastTabId;
            } else {
                // TODO
            }

        }

    }
};

var stateUpdate = function (tabId, state, past) {
    if (storage) {

    } else {
        if (state.playing && tabId !== data.curr) {
            if (data.curr) {
                data.past[tabId] = data.curr;
                data.tabs[tabId].state.playing = false;
                sendUpdate(data.curr, data.tabs[tabId].state);
            }
            data.curr = tabId;
        } else if (state === PAUSED) {
            if (data.tabs.hasOwnProperty(tabId)){
                data.tabs[tabId].state = state;
            }
        }
        data.tabs[tabId].state = state;
        sendMessageToPopup({type: "popupUpdate", data: data});
    }
};

var updateFromPage = function (tab, state) {
    console.log(data);
    stateUpdate(tab.id, state);


};

//////////////////////////////////////////////
//////////// Message Passing /////////////////
//////////////////////////////////////////////

// Listen from pages
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("Request ", request, "from ", sender);
    if (request.type === "register" && request.state) {
        registerTab(sender.tab, request.state);
        sendResponse();
    } else if (request.type === "update" && request.state) {
        updateFromPage(sender.tab, request.state);
    } else if (request.type === "registerPopup") {
        sendMessageToPopup({type: "popupInit", data: data});
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

var getTab = function (tabId) {
    if (!tabId) {
        return "Undefined tabId";
    }
    else if (data.tabs.hasOwnProperty(tabId) && data.tabs[tabId]) {
        return "Tab {0} ({1}) is {2}".format(tabId, data.tabs[tabId].tab.title, data.tabs[tabId].state === PLAYING ? "playing" : "paused");
    }
    else {
        return "Tab {0} is not found".format(tabId);
    }
};

//////////////////////////////////////////////
//////////// Initialization //////////////////
//////////////////////////////////////////////


var init = function () {
    if (storage) {
        chrome.storage.local.clear(function () {
            if (chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError);
            } else {
                chrome.storage.local.set({"tabs": {}, "curr": undefined, "past": {}}, function () {
                    console.log("init set callback, last error?", chrome.runtime.lastError);
                });
            }
        });
    } else {
        data = {tabs: {}, curr: undefined, past: {}};
    }
    chrome.tabs.onRemoved.addListener(onTabClosed);

    if (!String.prototype.format) {
      String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
          return typeof args[number] != 'undefined' ? args[number] : match;
        });
      };
    }
};

init();
