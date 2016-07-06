var CLIENT_ID = YOUR_CLIENT_ID;
var CLIENT_SECRET = YOUR_CLIENT_SECRET;

// Sets up the OAuth service for Todoist. Note that this requires the OAuth2 library
// Modified from https://github.com/googlesamples/apps-script-oauth2
function getService() {
  return OAuth2.createService('todoist')
      .setAuthorizationBaseUrl('https://todoist.com/oauth/authorize')
      .setTokenUrl('https://todoist.com/oauth/access_token')
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)
      .setCallbackFunction('authCallback')
      .setPropertyStore(PropertiesService.getUserProperties())
      // Set Todoist scope
      .setScope('data:read_write')
}

// What happens after the user attempts to authenticate
//   @param request The request object to pass to handleCallback
function authCallback(request) {
  var todoistService = getService();
  var isAuthorized = todoistService.handleCallback(request);
  
  // Return the appropriate page based on success/failure of the authentication
  if (isAuthorized) {
    startUp(); // If successful, also reload the sidebar
    return callbackHTML(true);
  } else {
    return callbackHTML(false);
  }
}

// Return a pretty HTML object to the authentication callback. Displays after the user tries to log in.
//   @param success Which message to show. True for success, false for failure.
function callbackHTML(success) {
  if (success) {
    var splashText = "Success! You can close this tab.";
    var title = "Success!";
  } else {
    var splashText = "Denied. You can close this tab";
    var title = "Denied";
  }
  var template = HtmlService.createTemplateFromFile('authCallback');
  template.splashText = splashText;
  return template.evaluate().setTitle(title);
}

// Initialize the service, try to perform the request
//   @param request An object containing the core of the request to send to the Todoist API
//     .key The key of the request (e.g. "resource_types")
//     .value The value of the request (e.g. '["all"]')
//   @param callback A callback function to return after the request to the API
//   @param args Arguments to pass to the callback function
function todoistAPI(request, callback, args) {
  var response = {};
  
  var service = getService();
  if (service.hasAccess()) {
  
    var api = "https://todoist.com/API/v7/sync";
    
    var payload = {
      "token": service.getAccessToken(),
      "sync_token": "*",
    };
    
    payload[request.key] = request.value
    
    var options = {
      "method" : "POST",
      "muteHttpExceptions": true,
      "payload": payload,
    };
    
    var responseText = UrlFetchApp.fetch(api, options);
    
    response = JSON.parse(responseText.getContentText());
    
  } else {
    response = {
      error: true,
      authUrl: service.getAuthorizationUrl(),
    };
  }
  return callback(response, args);
}
