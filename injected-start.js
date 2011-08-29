var currentZoom = 100;
var domain = self.location.hostname;
var intervalId;

var KEY_ZOOM_IN = "=+";
var KEY_ZOOM_OUT = "-";
var KEY_ZOOM_RESET = "0";

function initZoomExtension() {
    if (shouldZoom()) {
        safari.self.addEventListener("message", handleMessage, false);
        safari.self.tab.dispatchMessage("initZoom", domain);
        document.onkeypress = handleKeyPress;
    }
}

function shouldZoom() {
    if (self.location === top.location) {
        return true;
    } else {
        return false;
    }
}

function handleKeyPress(event) {
    if (!event.metaKey) {
        return true;
    }

    if (!shouldZoom()) {
        return true;
    }

    var input = String.fromCharCode(event.charCode);
    var message = "";
    if (KEY_ZOOM_IN.indexOf(input) != -1) {
        message = "zoomIn";
    } else if (KEY_ZOOM_OUT.indexOf(input) != -1) {
        message = "zoomOut";
    } else if (KEY_ZOOM_RESET.indexOf(input) != -1) {
        message = "zoomDefault";
    } else {
        return true;
    }

    safari.self.tab.dispatchMessage(message, [domain, currentZoom]);

    return false;
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
    var messageData = msgEvent.message;
    var saveZoom = true;

    if (!shouldZoom()) {
        return;
    }

    if (messageName === "zoomTo") {
        currentZoom = messageData;
    } else if (messageName === "zoomBy") {
        currentZoom += messageData;
    } else if (messageName === "initZoom") {
        currentZoom = messageData;
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

initZoomExtension();
