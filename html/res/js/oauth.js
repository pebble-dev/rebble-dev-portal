const authconfig = {
    url: {
        auth: "https://auth.rebble.io/oauth/authorise",
        token: "https://auth.rebble.io/oauth/token",
    },
    clientID: "MCNV2xmEjwUGj7wJYNA2SaO8",
    redirectURI: "https://dev-portal.rebble.io/auth/complete",
    scopes: "pebble+profile"
}

const debugOauth = false;
function debugLog(txt) {
    if (debugOauth) {
        console.log(txt)
    }
}

function initAuth() {
    var authURL = authconfig.url.auth + "?response_type=code&client_id=" + authconfig.clientID + "&redirect_uri=" + encodeURIComponent(authconfig.redirectURI) + "&scope=" + authconfig.scopes + "&state=" + generateAndStoreState();
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
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        var d = new Date()
        d.setTime(d.getTime() + data.expires_in);
        localStorage.setItem("expires", d.toISOString());
        window.location = "/"
        

    } catch (e) {
        part2Error("Something went wrong", "001D");
        return
    }
}

function localLogout() {
    //This clears the oauth client data, but doesn't log out from auth.rebble.io
    localStorage.clear();
    checkAuthState();
}
function logout() {
    localStorage.clear();
    window.location = config.endpoint.ssoLogout
}

// Helper functions

function generateAndStoreState() {
    var state = generateState();
    localStorage.setItem('state', state);
    debugLog("Store state as " + state);
    return state
}

function generateState() {
    return 'xxxxxxxxxxxxxxxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function isStateValid(state) {
    var expectedState = localStorage.getItem("state");
    localStorage.setItem("state", null);
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
