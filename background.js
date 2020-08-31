// events
// =====================================================
var lastTabId = -1;
var settings = { url: '', method: '' }
var method2command = { write: 'paste-from-clipboard', read: 'copy-to-clipboard' }
var method2badge = {
  write: { text: '写', color: [255,0,0,255] }, 
  read: { text: '读', color: [0,0,255,255] }, 
  readwrite: { text: '读写', color: [255,0,255,255] }, 
}
var METHOD = Object.keys(method2badge)
chrome.runtime.onInstalled.addListener(function() {
  loadSettings(function(s) {
    updateBadge()
    
    if (!s.url || !s.method) optionPage()
  })
});
chrome.browserAction.onClicked.addListener(function() {
  executeCommand()
});
chrome.commands.onCommand.addListener(function(com) {
  executeCommand(com)
});
chrome.runtime.onMessage.addListener(function(msg) {
  if (msg.settings && msg.settings.url && msg.settings.method) {
    settings.url =  msg.settings.url
    settings.method =  msg.settings.method
    updateBadge()
  } else if(msg.executeScriptDone) {
    executeCallback()
  }
});
// utils
// =====================================================
function loadSettings(callback) {
  if (settings && settings.url && settings.method) return callback(settings)
  chrome.storage.local.get(['url', 'method'], function(res) {
    settings = settings || {}
    settings.url = res.url
    settings.method = res.method
    callback(settings)
  });
}
function optionPage() {
  chrome.tabs.create({url: 'chrome://extensions/?options=' + chrome.runtime.id});
}
function feiShuDocTab(callback) {
  callback = callback || function() {};
  chrome.tabs.getAllInWindow(void 0, function(tabs) {
    var finded = null;
    for (var i = 0, tab; tab = tabs[i]; i++) {
      if (tab.selected) lastTabId = tab.id;
      if (tab.url && isFeiShuDoc(tab.url)) {
        finded = tab
      }
    }
    if (finded) {
      chrome.tabs.update(finded.id, {selected: true}, callback);
    } else {
      chrome.tabs.create({url: getFeiShuDoc()}, callback);
    }
  });
}
function getFeiShuDoc() {
  return settings && settings.url;
}
function isFeiShuDoc(url) {
  return url.startsWith(getFeiShuDoc());
}
function executeCommand(com) {
  loadSettings(function(s) {
    if (!s.url || !s.method) return optionPage()
    var command = method2command[s.method]
    if (!command && com && s.method === METHOD[2]) {
      command = com
    }
    // console.log("method2command ", command)
    if (command) {
      feiShuDocTab(function (tab) {
        feiShuDocCommand(tab, command)
      });
    }
  })
}
function feiShuDocCommand(tab, command) {
  if (command == 'paste-from-clipboard') {
    console.log("pasteFromClipboard -> tab", tab.id)
    chrome.tabs.executeScript(tab.id, {
      code: "("+ executeScript + ")('paste');",
    });
  } else if (command == 'copy-to-clipboard') {
    console.log("copyToClipboard -> tab", tab.id)
    chrome.tabs.executeScript(tab.id, {
      code: "("+ executeScript + ")('copy');",
    });
  }
}
function executeScript(command) {
  var id = ['paste', 'copy'].indexOf(command)
  if (id < 0) command = 'copy'
  var message = id === 0 ? 'Paste To Feishu' : 'Copy From Feishu'
  function $t() { return document.querySelector('[contenteditable=true]') }
  function task() {
    var txt = $t()
    if (txt) {
      var scrEl = document.querySelector('.etherpad-container-wrapper')
      scrEl && (scrEl.scrollTop = 10000)
      
      setTimeout(function(){
        var selection = document.getSelection()
        selection.selectAllChildren(txt)
        var res = document.execCommand(command)
        new Notification(message, { body: res ? "Success!!!" : "Error!!!" });
        // selection.removeAllRanges();
        // scrEl && (scrEl.scrollTop = 0)
        chrome.runtime.sendMessage({executeScriptDone: true})
      }, 1000);
    }
  }
  if (document.readyState === 'complete' || document.readyState === 'loaded') {
    task()
  } else {
    window.addEventListener('load', function() { task() })
  }
}
function executeCallback() {
  if (lastTabId !== -1) {
    chrome.tabs.update(lastTabId, {selected:true});
  }
  if (chrome.runtime.lastError) {
    console.error('error: \n' + chrome.runtime.lastError.message);
  }
}
function updateBadge() {
  var method = settings.method || ''
  var badge = method2badge[method]
  if (method && badge) {
    chrome.browserAction.setBadgeText({text: badge.text});
    chrome.browserAction.setBadgeBackgroundColor({color: badge.color});
  } else chrome.browserAction.setBadgeText({text: ''});
}
