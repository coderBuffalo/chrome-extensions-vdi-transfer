var prefix = 'https://www.feishu.cn/docs'
function loadOption() {
  chrome.storage.local.get(['url', 'method'], function(result) {
    if (result.method == 'read' || result.method == 'write' || result.method == 'readwrite') {
      document.getElementById(result.method).checked = true;
    }
    if (result.url && result.url.startsWith(prefix)) {
      document.getElementById('url').value = result.url;
    }
  });
}
function saveOption(){
  var url = document.querySelector('input[name="url"]').value;
  var method = document.querySelector('input[name="method"]:checked');
  if (!url || !url.startsWith(prefix) || !method || !method.value) {
    return showStatus('请设置飞书文档url以及读写类型')
  }
  var res = {url: url, method: method.value}
  console.log("saveOption -> res", res)
  chrome.storage.local.set(res, function () {
    showStatus('设置成功！')
    
    chrome.runtime.sendMessage({settings: res});
    
    window.close();
  });
}
function showStatus(txt) {
  var status = document.getElementById('status');
  status.textContent = txt;
  setTimeout(function() {status.textContent = '';}, 2000);
}
document.getElementById('save').addEventListener('click', saveOption);
document.addEventListener('DOMContentLoaded', loadOption);
