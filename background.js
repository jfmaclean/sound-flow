// tabs: {tab.id => {tab: tab,state: state}, ...}
// curr: tabid
// past: {currTabId => PrevTabId, ...}

var PLAYING = 1;
var PAUSED = 0;

var storage = false;
var store;

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
        store = {tabs: {}, curr: undefined, past: {}};
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
        // console.log("current memory ", store);
        store.tabs[newTab.id] = {tab: newTab, state: state};
        stateUpdate(newTab.id, state);
    }
};

var onTabClosed = function (tabId, removeInfo) {
    var pastTabId;
    // console.log("tab closed");
    if (storage) {

    } else {
        if (store.tabs.hasOwnProperty(tabId)) {
            if (store.curr === tabId) {
                pastTabId = store.past[tabId];
                //find a tab to go back to
                while (!store.tabs.hasOwnProperty(pastTabId)) {
                    if (store.past.hasOwnPropery(pastTabId)) {
                        pastTabId = store.past[pastTabId];
                    } else { // If we can't find a tab to go back to
                        delete store.tabs[tabId];
                        return;
                    }
                }
                sendUpdate(pastTabId, PLAYING);
                store.curr = pastTabId;
                delete store.tabs[tabId];

            } else {
                // TODO
            }
        }
    }
};

var stateUpdate = function (tabId, state, past) {
    if (storage) {

    } else {
        if (state === PLAYING && tabId !== store.curr) {
            if (store.curr) {
                store.past[tabId] = store.curr;
                store.tabs[tabId].state = PAUSED;
                sendUpdate(store.curr, PAUSED);
            }
            store.curr = tabId;
        } else if (state === PAUSED) {
            if (store.tabs.hasOwnProperty(tabId)){
                store.tabs[tabId].state = state;
            }
        }
    }
};

var updateFromPage = function (tabId, state) {
    stateUpdate(tabId, state);
};

//////////////////////////////////////////////
//////////// Message Passing /////////////////
//////////////////////////////////////////////

// Listen from pages
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message === "register" && request.state) {
        registerTab(sender.tab, request.state);
        sendResponse();
    }
    else if (request.message === "update" && request.state) {
        update(sender.tab, request.state);
    }
  });

// Send updates to pages
var sendUpdate = function (tabId, state) {
    chrome.tabs.sendMessage(tabId, {message: "updatePlayer", desiredState: state}, function (response) {
        console.log("Content script received update message!");
    });
};

//////////////////////////////////////////////
//////////// Helper Functions ////////////////
//////////////////////////////////////////////

var getTab = function (tabId) {
    if (!tabId) {
        return "Undefined tabId";
    }
    else if (store.tabs.hasOwnProperty(tabId) && store.tabs[tabId]) {
        return "Tab {0} ({1}) is {2}".format(tabId, store.tabs[tabId].tab.title, store.tabs[tabId].state === PLAYING ? "playing" : "paused");
    }
    else {
        return "Tab {0} is not found".format(tabId);
    }
};
