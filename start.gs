// Runs when the document is opened. Create Start button.
function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
    .addItem('Open', 'startUp')
    .addToUi();
}

// Runs when the add-on is installed. Initialize app.
function onInstall(e) {
  onOpen(e);
}

// Check if we can get data or need to authenticate, then open the sidebar either way when we hear back
function startUp() {
  var response = {};
  todoistAPI({ key: "resource_types", value: '["projects"]'}, function(response) {
    showSidebar(response);
  });
}

// Show the sidebar
//   @param response The response object from the authentication attempt.
function showSidebar(response) {
  if (response.error === true) {
    // If we fail to load the projects, show the authentication sidebar
    template = HtmlService.createTemplateFromFile('authSidebar');
    template.response = response;
  }  else {
    // If we succeed, show the projects sidebar
    template = HtmlService.createTemplateFromFile('sidebar');
    projects = response.projects;
    template.projects = parseProjects(projects);
  }
  var ui = template.evaluate().setTitle('Add to Todoist');
  DocumentApp.getUi().showSidebar(ui);
}

// Parse the projects object sent by Todoist into a neat list of buttons
//   @param projects The projects object as sent by the Todoist response
function parseProjects(projects) {
  // Initialize user properties so we can save some info on the projects for use elsewhere (esp. in separate server calls)
  var userProperties = PropertiesService.getUserProperties();
  
  // Sort by item order
  projects.sort(function(a, b) {
    return a.item_order - b.item_order;
  });
  
  // Add nice formatting
  var retString = "<ul class='prj'>";
  for (var i = 0; i < projects.length; i++) {
    var prjId = projects[i].id;
    var prjName = projects[i].name;
    var prjColor = getColor(projects[i].color);
    // Build the return string for each project
    retString += "<li>" + projCircle(prjColor, "button")
        + "<button class='prj' id='"
        + prjId + "' onclick='addTask(this);'>"
        + prjName + "</button></li>";
    // Keep track of the project colors in the user properties
    // This kind of makes the assumption that there's one Todoist user per Google user, which is not great
    userProperties.setProperty(prjId, prjColor);
  }
  
  retString +="</ul>";
  return retString;
}

// Takes some project info and returns the right colored circle
//   @param color The hex color to user
//   @param context The prefix for the class of the circle, used for CSS later
function projCircle(color, context) {
  return "<div class='" + context + "-circle' style='background-color:" + color + "'></div>";
}

// Given the project ID, actually gets the selected text, tries to add it to Todoist, and initiates adding it to the sidebar as an added tasks
// This function should probably be modularized a bit, so at least the selection is separated from the Todoist-specific stuff is separated from the UI stuff
//   @param prjID The project ID to add the selected text
function addTaskTodoist(prjID) {
  // Get the selected text
  var text;
  try {
    text = getSelectedText();
  }
  catch(e) {
    throw e;
  }
  
  // Get user properties so we can use the saved project color
  var userProperties = PropertiesService.getUserProperties();
  
  // Populate this object for use in the callback that populates the added tasks
  var args = {
    "text": text,
    "color": userProperties.getProperty(prjID),
  }
  
  // Generate unique IDs for Todoist API
  var uuid = guid(); // The response object from Todoist will use this as the index on the array of responses
  var temp_id = guid();
  
  // Actually call the API using an object of the info we want
  return todoistAPI({ key: "commands", value: '[{\
      "type": "item_add",\
      "uuid": "' + uuid + '",\
      "temp_id": "' + temp_id + '",\
      "args": {"content": "' + text + '", "project_id": "' + prjID + '"}\
    }]'}, function(response, args){
      // If everything works out, add the task to the sidebar
      if (response.sync_status[uuid] === "ok") {
        return taskLi(args.text, args.color);
      } else {
        // Return an error that can be displayed to the user
        throw response.sync_status[uuid].error;
      }
    }, args);
}

// Takes some task information and returns an nice list item
//   @param text The text of the task we're adding
//   @param color The project color (to be used as a bullet point)
function taskLi(text, color) {
  return projCircle(color, "tasks") + "<li class='tasks'>" + text + "</li>";
}

// Generate random guid
// Copied from http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}
            

// This lets me separate my HTML, CSS, and JS files
//   @param filename The file to insert into the HTML
function include(filename) {
   return HtmlService.createHtmlOutputFromFile(filename)
  .getContent();
}
