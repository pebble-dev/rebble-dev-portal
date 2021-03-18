const authconfig = {
    url: {
        auth: "https://auth.rebble.watch/oauth/authorise",
        token: "https://auth.rebble.watch/oauth/token",
    },
    clientID: "WtE2fAXm2vLTYn5vFFr1MetE",
    secret: "secret_u7pMs0AneO23lO5XnW0Aj8b7AdiY1ZEV",
    redirectURI: "https://dev-portal.rebble.watch/auth/complete",
    scopes: "pebble_token pebble profile"
}

const debugOauth = true;
function debugLog(txt) {
    if (debugOauth) {
        console.log(txt)
    }
}

function initAuth() {
    var authURL = authconfig.url.auth + "?response_type=code&client_id=" + authconfig.clientID + "&redirect_uri=" + authconfig.redirectURI + "&scope=" + authconfig.scopes + "&state=" + generateAndStoreState();
    debugLog("Redirect to " + authURL);
    window.location = authURL;
}

function authPart2() {
    //We've returned
    //Get the code
    var response = {
        code: findGetParameter("code"),
        state: findGetParameter("state")
    }

    debugLog(response);

    if (response.code == null || response.state == null) {
        debugLog("Missing code or state. Abort login");
        part2Error("Something went wrong", "001A");
        return
    }

    if (! isStateValid(response.state)) {
        debugLog("State is incorrect. Abort login");
        part2Error("You have an invalid state", "001B");
        return
    }

    var tokenurl = authconfig.url.token + "?grant_type=authorization_code&code=" + response.code + "&redirect_uri=" + authconfig.redirectURI + "&client_id=" + authconfig.clientID;

    debugLog("Call " + tokenurl);

    apiGET(tokenurl, authPart3, function(error) {
        console.log(error)
        part2Error("Something went wrong", "001C");
    })
}

function authPart3(data) {
    //This is the access token
    try {

        data = JSON.parse(data);
        sessionStorage.setItem("access_token", data.access_token);
        sessionStorage.setItem("refresh_token", data.refresh_token);
        sessionStorage.setItem("expires", data.expires);
        window.location = "/"
        

    } catch (e) {
        part2Error("Something went wrong", "001D");
        return
    }
}

// Helper functions

function generateAndStoreState() {
    var state = generateState();
    sessionStorage.setItem('state', state);
    return state
}

function generateState() {
    return 'xxxxxxxxxxxxxxxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function isStateValid(state) {
    var expectedState = sessionStorage.getItem("state");
    sessionStorage.setItem("state", null);
    debugLog("Does local state '" + expectedState + "' match given state '" + state + "'?");
    return (state == expectedState)
}

function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

// UI/UX functions

function part2Error(errortext, errorcode) {
    $('#loader').remove();
    $('#porthole').attr("src","/res/img/large_icon_failure.svg");
    $('.largetext').attr("onclick", "ohNo()");
    $('#takemeback').removeClass("hidden")
    $('#errorText').html(errortext + " [" + errorcode + "]");
}

function ohNo() {
    $('.largetext').addClass("animated hinge")
}
