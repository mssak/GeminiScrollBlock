document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('title').textContent = chrome.i18n.getMessage('popupTitle');
    document.getElementById('question').textContent = chrome.i18n.getMessage('popupQuestion');
    document.getElementById('supportText').textContent = chrome.i18n.getMessage('popupSupportText');
    document.getElementById('donateButton').textContent = chrome.i18n.getMessage('popupDonateButton');
    document.getElementById('updateInfo').textContent = chrome.i18n.getMessage('updateInfo');
});