// Thanks to Flambino on stackoverflow for sample code upon which I based the
// key detection code
// (http://stackoverflow.com/questions/7251956/detecting-command-keystroke-in-safari)

// Thanks to Ben Lisbakken for sample code upon which I based the charToUnicode
// function
// (http://buildingonmud.blogspot.com/2009/06/convert-string-to-unicode-in-javascript.html)

var currentZoom = 100;

var domain = self.location.hostname;
var intervalId;

var KEY_ZOOM_IN = charToUnicode("+") + charToUnicode("=");
var KEY_ZOOM_OUT = charToUnicode("-");
var KEY_ZOOM_RESET = charToUnicode("0");

var CMD   = 8;
var SHIFT = 4;
var ALT   = 2;
var CTRL  = 1;

var modifiersPressed = 0;
var zoomModifier = getZoomModifier();

function modifierCode(event) {
  switch (event.keyCode) {
    case 91:
    case 93: return CMD;
    case 16: return SHIFT;
    case 18: return ALT;
    case 17: return CTRL;
    default: return 0;
  }
}

function handleKeyDown(event) {
  var modifier = modifierCode(event);
  if (modifier !== 0) {
    // add to the bitmast "stack"
    modifiersPressed = modifiersPressed | modifier;
  } else {
    checkForZoomKey(event);
  }
}

function handleKeyUp(event) {
  modifiersPressed = modifiersPressed & ~modifierCode(event);
}

function handleWindowBlur(event) {
  modifiersPressed = 0;
}

function checkForZoomKey(event) {
  var message = "";
  var key = event.keyIdentifier;
  if (modifiersPressed & zoomModifier) {
    if (KEY_ZOOM_IN.indexOf(key) !== -1) {
      message = "zoomIn";
    } else if (KEY_ZOOM_OUT.indexOf(key) !== -1) {
      message = "zoomOut";
    } else if (KEY_ZOOM_RESET.indexOf(key) !== -1) {
      message = "zoomDefault";
    } else {
      return;
    }
    safari.self.tab.dispatchMessage(message, [domain, currentZoom]);
    event.preventDefault();
    event.stopPropagation();
  }
}

function initZoomExtension() {
  if (shouldZoom()) {
    safari.self.addEventListener("message", handleMessage, false);
    safari.self.tab.dispatchMessage("initZoom", domain);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
  }
}

function shouldZoom() {
  if (window.top === window || domain === "mail.google.com") {
    return true;
  } else {
    return false;
  }
}

function setZoomOnBodyInInterval() {
  if (document.body) {
    document.body.style.zoom = currentZoom + "%";
    window.clearInterval(intervalId);
    intervalId = null;
  }
}

function handleMessage(msgEvent) {
  var messageName = msgEvent.name;
  var zoomData = msgEvent.message.zoomData;
  var targetDomain = msgEvent.message.targetDomain;
  var saveZoom = true;

  if ((targetDomain && (targetDomain !== domain)) || !shouldZoom()) {
    return;
  }

  if (messageName === "zoomTo") {
    currentZoom = zoomData;
  } else if (messageName === "zoomBy") {
    currentZoom += zoomData;
  } else if (messageName === "initZoom") {
    currentZoom = zoomData;
    saveZoom = false;
  }

  if (document.body) {
    document.body.style.zoom = currentZoom + "%";
  } else {
    intervalId = window.setInterval(setZoomOnBodyInInterval, 10);
  }

  if (saveZoom) {
    safari.self.tab.dispatchMessage("saveZoom", [domain, currentZoom]);
  }
}

function charToUnicode(char) {
  var unicode = '0000' + char.charCodeAt(0).toString(16).toUpperCase();
  return 'U+' + unicode.substring(unicode.length - 4);
}

function getZoomModifier() {
  if (navigator.platform.indexOf("Win") !== -1) {
    return CTRL;
  } else if (navigator.platform.indexOf("Mac") !== -1) {
    return CMD;
  } else {
    return CMD;
  }
}

initZoomExtension();
