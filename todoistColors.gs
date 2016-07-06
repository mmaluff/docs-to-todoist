// A global array of Todoist project colors, 0-11. See https://developer.todoist.com/#projects
var tColors =
  ["#95ef63",
  "#ff8581",
  "#ffc471",
  "#f9ec75",
  "#a8c8e4",
  "#d2b8a3",
  "#e2a8e4",
  "#cccccc", // The Inbox color (7)
  "#fb886e",
  "#ffcc00",
  "#74e8d3",
  "#3bd5fb"];

// Returns the appropriate hex color for an item or project
//   @param colorID The internal project color ID
function getColor(colorID) {
  // Check that the color ID is a valid number in our tColors array
  if ( typeof colorID === "number" && isFinite(colorID) && colorID >= 0 && colorID < tColors.length ) {
    return tColors[colorID];
  } else {
    return tColors[7]; // Default to Inbox gray
  }
}
