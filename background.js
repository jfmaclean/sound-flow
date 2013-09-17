// var tabs = {"paused": {}, "playing": {}, "other": {}};

var register = function (tab, status) {
    if (status === "playing") {
        if  (!jQuery.isEmptyObject(tabs["playing"])) {
            for (var i in tabs["playing"]) {
                var tempTab = tabs["playing"][i];
                sendUpdate(tempTab, "paused");
                tabs["paused"][tempTab.id] = tempTab;
                delete tabs["playing"][i];
            }
        }
    }
    tabs[status][tab.id] = tab;
    console.log(tabs);
};

var update = function (tab, status) {
    if (status === "playing") {
        if  (!jQuery.isEmptyObject(tabs["playing"])) {
            for (var i in tabs["playing"]) {
                var tempTab = tabs["playing"][i];
                sendUpdate(tempTab, "paused");
                tabs["paused"][tempTab.id] = tempTab;
                delete tabs["playing"][i];
            }
        }
    }
    tabs[status][tab.id] = tab;
    console.log(tabs);
};

var sendUpdate = function (tab, status) {
    chrome.tabs.sendMessage(tab.id, {desiredStatus: status}, function (response) {
        console.log("Content script received update message!");
    });
};

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.greeting == "hello") {
      sendResponse({farewell: "goodbye"});
    } else if (request.message === "register" && request.status) {
        register(sender.tab, request.status);
        sendResponse();
    } else if (request.message === "click" && request.status) {
        update(sender.tab, request.status);
        sendResponse();
    }
  });