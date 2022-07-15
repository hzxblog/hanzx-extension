import axios from 'axios'
const connections = {}

chrome.runtime.onConnect.addListener(function(devToolsConnection) {
  // assign the listener function to a variable so we can remove it later
  let devToolsListener = function(message, sender, sendResponse) {
      // Inject a content script into the identified tab
      const { type, tabId } = message
      if (type === 'inject-script') {
        connections[tabId] = devToolsConnection;
        chrome.tabs.executeScript({
          file: message.scriptToInject
        });
      }
      if (type === 'key') {
        devToolsConnection.postMessage(message)
      }
      if (type === 'xhr') {
        const { token, data } = message.data
        axios({
          url: 'http://10.255.158.75/doParam',
          method: 'post',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
          },
          params: {
            data,
            token
          }
        }).then(res => {
          devToolsConnection.postMessage({ data: res.data, type: 'params' })
        })
      }
  }
  // add the listener
  devToolsConnection.onMessage.addListener(devToolsListener);

  devToolsConnection.onDisconnect.addListener(function() {
       devToolsConnection.onMessage.removeListener(devToolsListener);
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Messages from content scripts should have sender.tab set
  if (sender.tab) {
    let tabId = sender.tab.id;
    if (tabId in connections) {
      connections[tabId].postMessage(request);
    } else {
      console.log("Tab not found in connection list.");
    }
  } else {
    console.log("sender.tab not defined.");
  }
  return true;
});