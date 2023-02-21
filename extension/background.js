var extensionApi;

/* eslint-disable no-undef */
if (typeof browser !== 'undefined') {
  extensionApi = browser;
} else if (typeof chrome !== 'undefined') {
  extensionApi = chrome;
}
/* eslint-enable no-undef */

if (!extensionApi) {
  throw new Error('extension API not found. Both `chrome` and `browser` are undefined.');
}

extensionApi.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.query === 'poe-ninja') {
    fetch('https://poe.ninja/api' + request.resource)
      .then(function (response) {
        return response.json();
      })
      .then(function (payload) {
        sendResponse(payload);
      })
      .catch(function () {
        sendResponse(null);
      });

    return true;
  }
});
