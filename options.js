function handleTabnameChange(e) {
  chrome.storage.local.set({ "tabname": [e.target.value] });
}

function handleTimeascChange(e) {
  chrome.storage.local.set({ "timeasc": [e.target.checked] });
}

function constructOptions() {
  chrome.storage.local.get(['tabname'], (res) => {
    document.getElementById('tabname').value = res.tabname;
  });

  chrome.storage.local.get(['timeasc'], (res) => {
    document.getElementById('timeasc').checked = res.timeasc[0];
  });

  document.getElementById('tabname').addEventListener('change', handleTabnameChange)
  document.getElementById('timeasc').addEventListener('change', handleTimeascChange)
}

constructOptions();