// var tabs = {"paused": {}, "playing": {}, "other": {}};

// tabs: {tab.id => {tab: tab,state: state}, ...}, curr: tabid, past: {currTabId => PrevTabId, ...}

// console.log("GOT TO START OF BACKGROUND");
var PLAYING = 1;
var PAUSED = 0;

var storage = false;
var store;

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

var init = function () {
    // console.log("INIT");
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
};

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
            // console.log("1"); 
            if (store.curr === tabId) {
                // console.log("2");
                pastTabId = store.past[tabId];
                //find a tab to go back to
                while (!store.tabs.hasOwnProperty(pastTabId)) {
                    if (store.past.hasOwnPropery(pastTabId)) {
                        pastTabId = store.past[pastTabId];
                    } else { // If we can't find a tab to go back to
                        // console.log("3");
                        delete store.tabs[tabId];
                        return;
                    }
                }
                // console.log("4");
                sendUpdate(pastTabId, PLAYING);
                store.curr = pastTabId;
                delete store.tabs[tabId];

            } else {
                // console.log("5");
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


var sendUpdate = function (tabId, state) {
    chrome.tabs.sendMessage(tabId, {message: "updatePlayer", desiredState: state}, function (response) {
        console.log("Content script received update message!");
    });
};

init();

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // console.log(sender.tab ?
    //             "from a content script:" + sender.tab.url :
    //             "from the extension");
    if (request.message === "register" && request.state) {
        registerTab(sender.tab, request.state);
        sendResponse();
    }
    else if (request.message === "update" && request.state) {
        update(sender.tab, request.state);
        // chrome.tabs.sendMessage(sender.tab.id, {desiredState: request.state}, function (response) {
        //     console.log("Content script received update message!");
        // });
        // sendResponse();
    }
  });

var list = $("#list");//document.getElementById("list");

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



// setInterval( function () {
//     list.empty();
//     console.log("Curr = {0}".format(getTab(store.curr)));
//     list.append("<p>Curr = {0} </p>".format(getTab(store.curr)));
//     for (var i in store.past) {
//         console.log("{0} -> {1}\n".format(getTab(i), getTab(store.past[i])));
//         list.append("<li>{0} -> {1}</li>".format(getTab(i), getTab(store.past[i])));
//     }
// }, 5000);
