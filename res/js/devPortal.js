var currentAppCache = {}

// Worker functions

function displayLoginPage() {
    $.ajaxSetup ({
        cache: false
    });
    var ajax_load = "";

    // load() functions
    var loadUrl = "/login/index.html";
    // $("#loadbasic").click(function(){        setTimeout(function() {
    $("body").html(ajax_load).load(loadUrl);
    // });
}

function checkAuthState() {
    if (getUserToken() == null) { displayLoginPage(); return }
}

function addUserApp(app, isActive) {
    var extraClasses = (isActive) ? "active" : ""
    let html = '\
    <li class="nav-item animated fadeIn searchResult" data-title="' + app.title + '" id="appselector_' + app.id + '">\
        <a class="nav-link ' + extraClasses + '" href="#" onclick="getAppDetails(\'' + app.id + '\')"><span class="ml-2">' + app.title + '</span></a>\
    </li>';

    $('#userAppList').append(html);
    if (isActive) { getAppDetails(app.id) }
}
function searchUserApps(searchText) {
    if (searchText == "") {
        $('.hiddenSearchResult').removeClass("hiddenSearchResult");
        return
    }

    $('.searchResult').each((index, element) => {
        if (! $(element).data("title").toString().toLowerCase().includes(searchText.toLowerCase())) {
            $(element).addClass("hiddenSearchResult")
        } else {
            $(element).removeClass("hiddenSearchResult")
        }
    })
}


// UX functions

// - Edit appstore listing
function editAppListing() {
    $('.appinfoscreen').addClass("hidden");
    $('#appinfo-secondary-listingcontrol').removeClass("hidden");

    $('.change').addClass("hidden");
    $('#edit-title').val(currentAppCache.title);
    $('#edit-description').val(currentAppCache.description);
    $('#edit-website').val(currentAppCache.website);
    $('#edit-source').val(currentAppCache.source);


    //Screenshots
    $('#edit-screenshotContainer').html("");
    var extra = 5 - currentAppCache.screenshot_images.length
    currentAppCache.screenshot_images.forEach((screenshot, index) => {
        $('#edit-screenshotContainer').append('\
        <div class="card img-card ml-3 mt-3">\
            <img class="card-img-top" src="' + screenshot["144x168"] + '" alt="Card image cap" />\
            <div class="card-body">\
                <a href="#" class="btn btn-primary">Delete</a>\
            </div>\
        </div>');
    });
    for (var i = 0; i < extra; i++) {
        $('#edit-screenshotContainer').append('\
        <div class="card img-card ml-3 mt-3">\
            <img class="card-img-top" src="https://rebble.io/submit/img/add.png" alt="Card image cap" />\
            <div class="card-body">\
                <a href="#" class="btn btn-primary">Add</a>\
            </div>\
        </div>');
    }
    $('#screenshot-platform').val(currentAppCache.screenshot_hardware);
}
function updateAppField(field) {
    $('#change-' + field).removeClass("hidden")
}
function returnToMainSecondaryWindow() {
    $('.appinfoscreen').addClass("hidden");
    $('#appinfo-secondary').removeClass("hidden");
}

// - More options
function showMoreOptions() {
    $('.appinfoscreen').addClass("hidden");
    $('#appinfo-secondary-moreoptions').removeClass("hidden");
}

// Data functions

function getUserInfo() {
    apiGET(config.endpoint.base + config.path.aboutme, getUserInfo_cb, genericAPIErrorHandler);
}
function getUserInfo_cb(data) {
    try {
        data = JSON.parse(data);
    } catch (e) {
        genericAPIErrorHandler("Failed to parse getUserInfo_cb data")
    }

    $(".data-username").html(data.name);
    $("#userAppList").html("");
    data.applications.forEach((element, index) => {
        console.log(element)
        addUserApp(element, (index == 0))
    });
    if (data.applications.length > 14) {
        debugLog("Wow. Use has enough apps to use the search bar.")
        $('#appsearch').removeClass("hidden");
    }
}

function getAppDetails(appID) {
    $('#appinfo-icon').attr("src", "/res/placeholder/140x140.png")
    $('#userAppList .active').removeClass("active");
    $('#appselector_' + appID).addClass("active");
    // $('#appinfo-main-loader').removeClass("hidden");

    apiGET(config.endpoint.base + config.path.appInfo + appID, getAppDetails_cb, genericAPIErrorHandler, $('#appinfo-main-loader'))
}
function getAppDetails_cb(data) {
    try {
        data = JSON.parse(data);
    } catch (e) {
        genericAPIErrorHandler("Failed to parse getAppDetails_cb data")
    }

    if (data.data.length > 1) {
        console.warn("API returned more than one result for the ID " + appID + ". Using just the first.");
    }

    data = data.data[0];
    currentAppCache = data

    debugLog(data)

    //Data
    $('#appinfo-appname').html(data.title);
    $('#appinfo-hearts').html(data.hearts);
    $('#appinfo-latestrelease').html(data.latest_release.version);
    $('#appinfo-latestreleaselist').html(data.latest_release.version);
    $('#appinfo-category').html(data.category);
    $('#appinfo-initaldate').html(data.created_at);
    $('#appinfo-latestdate').html(data.latest_release.published_date);
    $('#appinfo-description').html(data.description);
    $('#appinfo-sourcelink').html(data.source);
    $('#appinfo-releasenotes').html(data.latest_release.release_notes);
    $('#appinfo-icon').attr("src",data.list_image["144x144"]);

    //Icons
    $('.tinyicon').addClass("bandw");
    $('.supports-emery').addClass("hidden");
    if (data.compatibility.aplite.supported) { $('.supports-aplite').removeClass("bandw") }
    if (data.compatibility.basalt.supported) { $('.supports-basalt').removeClass("bandw") }
    if (data.compatibility.chalk.supported) { $('.supports-chalk').removeClass("bandw") }
    if (data.compatibility.diorite.supported) { $('.supports-diorite').removeClass("bandw") }
    if (data.compatibility.emery.supported) { $('.supports-emery').removeClass("bandw"); $('.supports-emery').removeClass("hidden");  }

    //Status
    if (data.visible) {
        $('#statusText').html("Published");
        $('#statusIcon').removeClass();
        $('#statusIcon').addClass("far fa-check-circle");
        $('#statusIcon').css("color", "var(--color-rebble-green)")
    } else {
        $('#statusText').html("Unpublished");
        $('#statusIcon').removeClass();
        $('#statusIcon').addClass("far fa-pause-circle");
        $('#statusIcon').css("color", "var(--color-rebble-amber)")
    }

    $('#externalStoreListing').attr("href", config.misc.appstoreUrl + data.id)

    $('#appinfo-main').addClass("animated fadeIn");
    $('#appinfo-main').removeClass("hidden");
    $('#appinfo-main-loader').addClass("hidden");


    //TEST
    showMoreOptions();
}

function genericAPIErrorHandler(data, statusCode, cbo) {
    console.log("API error. Data to follow.")
    console.log(data)

    if ([401,403].includes(statusCode)) {
        debugLog("Auth expired?");
        console.log("Authentication has expired. Redirecting to login page");
        localLogout();
    }
    
    if (typeof cbo == "object") {
        $(cbo).html("Something went wrong")
    }
}


// Helper functions

function apiPOST(rurl, postdata, callback, errorCallback, callBackObject) {
	console.log("POST: " + rurl + " - Data: " + postdata)
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() {
	if (xmlHttp.readyState == 4 && RegExp('2.*').test(xmlHttp.status)) {
		if (callBackObject != null) {
			callback(xmlHttp.responseText, callBackObject);
		} else {
			callback(xmlHttp.responseText);
    }
	} else if (xmlHttp.readyState == 4) {
           console.log("Error Code: " + xmlHttp.status)
           if (errorCallback != null) {
	   	        errorCallback(xmlHttp.responseText, xmlHttp.status, callBackObject);
       	   }
	}
    }
    xmlHttp.open("POST", rurl, true); // true for asynchronous
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    if (getUserToken() != null) {
      xmlHttp.setRequestHeader("Authorization", "Bearer " + getUserToken());
    }
    xmlHttp.send(postdata);
}

function apiGET(url, callback, errorCallback, callBackObject) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && RegExp('2.*').test(xmlHttp.status)) {
        if (callBackObject != null) {
          callback(xmlHttp.responseText, callBackObject);
        } else {
          callback(xmlHttp.responseText);
        }
        console.log(url);
  
      } else if (xmlHttp.readyState == 4) {
        if (errorCallback != null) {
            errorCallback(xmlHttp.responseText, xmlHttp.status, callBackObject);
        }
      }
    }
    xmlHttp.open("GET", url, true); // true for asynchronous
    if (getUserToken() != null) {
      xmlHttp.setRequestHeader("Authorization", "Bearer " + getUserToken());
    }
    xmlHttp.send(null);
  }
  
function getUserToken() {
    return sessionStorage.getItem("access_token");
}

function initDevPortal() {
    //Check if we need to log in
    checkAuthState();

    //Bind keyevents
    $('#appsearch').on('keyup',function(e){
        searchUserApps($('#appsearch').val())
    });

    //Start up
    getUserInfo();
}

initDevPortal();