//Global variables
currentAppCache = {}
funMessageIntervalTimer = null;

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

//  - Edit appstore listing
function showAppListingEditor(sender) {
    if ($('#editStoreListingBtn').hasClass("btn-active")) { returnToMainSecondaryWindow(); return; }

    $('.appinfoscreen').addClass("hidden");
    $('#appinfo-secondary-listingcontrol').removeClass("hidden");

    $('.appinfobtn').removeClass("btn-active");
    $(sender).addClass("btn-active");

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
function saveAndPublishAppEdits() {
    //Submit changes to store

    var appUpdateObj = {}

    $('#updateModal-inProgress').removeClass("hidden");
    $('#updateModal-success').addClass("hidden");
    $('#updateAppName').html($('#edit-title').val())
    $('#updateChangedFields').html("")
    $('.appUpdateField').each((i, e) => {
        var fieldName = $(e).prop("id").toString().split("-")[1];
        currentAppCache[fieldName] = (currentAppCache[fieldName] == null) ? "" : currentAppCache[fieldName];
        if ($(e).val() != currentAppCache[fieldName]) {
            $('#updateChangedFields').append("<li>" + fieldName + "</li>")
            appUpdateObj[fieldName] = $(e).val();
        }
    })

    $('#updateModal').modal('show');
    setTimeout(function() {
        apiPOST(config.endpoint.base + config.path.editApp + currentAppCache.id, JSON.stringify(appUpdateObj), saveAndPublishAppEdits_cb, saveAndPublishAppEdits_ecb)
    }, 500);
    
}
function saveAndPublishAppEdits_cb(data) {
    try {

        data = JSON.parse(data);

    } catch (e) {

        //Can't pass the response? Let the error cb handle this
        saveAndPublishAppEdits_ecb(data);
        return

    }

    $('#updateModal-inProgress').addClass("hidden");
    $('#updateModal-success').removeClass("hidden");
    $('.change').addClass("hidden");
    returnToMainSecondaryWindow();
    //Make sure we refresh our updated app
    getAppDetails(data.id);
}
function saveAndPublishAppEdits_ecb(data) {
    $('#updateModal').modal('hide');
    window.scrollTo(0,0);

    try {
        data = JSON.parse(data)
    } catch (e) {
        showAlert("Failed to update app", "Something went wrong. Tell someone.");
        console.log(e);
        return
    }

    showAlert("Failed to update app", data.error);
    console.log(data)
}
function returnToMainSecondaryWindow() {
    $('.appinfoscreen').addClass("hidden");
    $('#appinfo-secondary').removeClass("hidden");
    $('.appinfobtn').removeClass("btn-active");
}

//  - More options
function showMoreOptions(sender) {
    if ($('#moreOptionsBtn').hasClass("btn-active")) { returnToMainSecondaryWindow(); return; }
    $('.appinfoscreen').addClass("hidden");
    $('#appinfo-secondary-moreoptions').removeClass("hidden");
    $('.appinfobtn').removeClass("btn-active");
    $(sender).addClass("btn-active");
}

//  - Profile
function updateProfileSubtitle() {
    var subtitles = [
        "Developer Extraordinaire",
        "Rebble with a cause",
        "Prolific publisher",
    ]
    $('#developer-subtitle').html(subtitles[Math.floor(Math.random() * subtitles.length)])
}

//  - Global UX
function showAlert(title, text) {
    $('#mainAlert').removeClass("hidden");
    $('#mainAlert-topic').html(title);
    $('#mainAlert-text').html(text);
}
function hideMainAlert() {
    $('#mainAlert').addClass("hidden");
}

function wiggleButton(id) {
    $('#' + id).addClass("animated bounce");
    setTimeout(function () {
        $('#' + id).removeClass("animated bounce");
    }, 1000)
}
function flipElement(id) {
    $(id).addClass("animated flip");
    setTimeout(function () {
        $(id).removeClass("animated flip");
    }, 1000)
}

function showPage(pageID) {

    pageID = pageID.replace("/","");

    $('.page').addClass("hidden");

    var validPages = ["profile","home","submit"];

    //Any weird custom per-window log goes here
    if (pageID == "submit") {
        $('#i-iswatchface').prop("checked",true);
        $('#usePlatformSpecificScreenshots').prop("checked",false);
    }

    if (validPages.includes(pageID)) {
        $('#master-' + pageID).removeClass("hidden");
        if (pageID == "home") { pageID = "" }
        window.history.pushState(pageID, 'Rebble Developer Portal - ' + pageID, '/' + pageID);
    } else {
        $('#master-home').removeClass("hidden");
    }

    
}

function changePreviewWatchPlatform(platform, sender) {
    //Sender is passed by tinyicons, ignore if bandw
    if (sender != null && $(sender).hasClass("bandw")) { return }

    var platformMap = {
        "aplite": "screenshot_slider_background_original.png",
        "basalt": "screenshot_slider_background_time.png",
        "chalk": "screenshot_slider_background_time_round_14.png",
        "diorite": "screenshot_slider_background_pebble2.png"
    }
    if (platformMap.hasOwnProperty(platform)) {
        $('#previewImageContainer').css("background-image", 'url("/res/img/' + platformMap[platform] + '")');
    }

    $('#previewImageContainer').removeClass("bandw");
    $('#previewImageContainer').removeClass("chalk");
    if (platform == "chalk") {
        $('#previewImageContainer').addClass("chalk");
    } else if (["aplite","diorite"].includes(platform)) {
        $('#previewImageContainer').addClass("bandw");
    }
}

function updateFunMessage() {
    var funMessages = [
        "Please stand by",
        "Reticulating Splines",
        "Disinfecting pbw",
        "Almost there probably",
        "Testing on a Pebble Time 2",
        "Fixing Bugs",
        "Adding bugs to fix later",
        "Searching for the intranet",
        "Loading loading messages",
        "Refueling Spaceship",
        "Compressing",
        "Extracting",
        "Unzipping",
        "Point it. Zoom it. Snap it. Press it",
        "Just checking twitter real quick",
        "Working",
        "Still working",
        "Thinking",
        "Computing",
        "Checking progress",
        "Booting Windows XP",
        "Warming neurotoxin emitters",
    ];

    $('#uploadingModalFunText').removeClass("fadeIn");
    $('#uploadingModalFunText').addClass("fadeOut");
    setTimeout(function() {
        $('#uploadingModalFunText').removeClass("fadeOut");
        $('#uploadingModalFunText').html(funMessages[Math.floor(Math.random() * funMessages.length)] + ".");
        $('#uploadingModalFunText').addClass("fadeIn");
    }, 500)
}
function startFunMessageTimer() {
    funMessageIntervalTimer = setInterval(updateFunMessage, 7000);
}
function stopFunMessageTimer() {
    clearInterval(funMessageIntervalTimer);
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

    if (data.applications.length > 0) {
        //Reverse array so newest is first
        data.applications = data.applications.reverse()
        data.applications.forEach((element, index) => {
            console.log(element)
            addUserApp(element, (index == 0))
        });
        if (data.applications.length > 14) {
        debugLog("Wow. Use has enough apps to use the search bar.")
        $('#appsearch').removeClass("hidden");
        }
    } else {
        $('#appinfo-noapps').removeClass("hidden")
    }

    var page = window.location.pathname;
    debugLog("Init router detected path as " + page);
    showPage(page);
}

function getAppDetails(appID) {
    $('#appinfo-icon').attr("src", "/res/placeholder/140x140.png")
    changePreviewWatchPlatform("basalt")
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

    appinfostring = (data.category == "Faces") ? '<i class="far fa-clock ml-4"></i> Watchface' : '<i class="fas fa-mobile-alt ml-4"></i> Watchapp'

    //Data
    $('#appinfo-appname').html(data.title);
    $('#appinfo-hearts').html(data.hearts);
    $('#appinfo-latestrelease').html(data.latest_release.version);
    $('#appinfo-latestreleaselist').html(data.latest_release.version);
    $('#appinfo-type').html(appinfostring)
    $('#appinfo-id').html(data.id);
    $('#appinfo-category').html(data.category);
    $('#appinfo-initaldate').html(data.created_at);
    $('#appinfo-latestdate').html(data.latest_release.published_date);
    $('#appinfo-description').html(data.description);
    $('#appinfo-sourcelink').html(data.source);
    $('#appinfo-releasenotes').html(data.latest_release.release_notes);
    

    //Icons
    $('.tinyicon').addClass("bandw");
    // $('.supports-emery').addClass("hidden");
    var favouriteSupportedPlatform = "basalt"
    if (data.compatibility.aplite.supported) { $('.supports-aplite').removeClass("bandw"); favouriteSupportedPlatform = "aplite" }
    if (data.compatibility.chalk.supported) { $('.supports-chalk').removeClass("bandw"); favouriteSupportedPlatform = "chalk" }
    if (data.compatibility.diorite.supported) { $('.supports-diorite').removeClass("bandw"); favouriteSupportedPlatform = "diorite" }
    if (data.compatibility.basalt.supported) { $('.supports-basalt').removeClass("bandw"); favouriteSupportedPlatform = "basalt" }

    changePreviewWatchPlatform(favouriteSupportedPlatform)

    // if (data.compatibility.emery.supported) { $('.supports-emery').removeClass("bandw"); $('.supports-emery').removeClass("hidden");  }

    // Preview icon
    if (favouriteSupportedPlatform == "chalk") {
        $('#appinfo-icon').attr("src",data.screenshot_images[0]["144x168"].replace("144x168","144x144"));
    } else {
        $('#appinfo-icon').attr("src",data.screenshot_images[0]["144x168"]);
    }

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

    //Update the app name in the lefthand menu if it doesn't match. This will happen if the user edits the listing and updates the app's name
    console.log("Does " + $('#appselector_' + data.id).data("title") + " match " + data.title + " ?")
    if ($('#appselector_' + data.id).data("title") != data.title) {
        $('#appselector_' + data.id).data("title",data.title);
        $('#appselector_' + data.id).html('<a class="nav-link " href="#" onclick="getAppDetails(\'' + data.id + '\')"><span class="ml-2">' + data.title + '</span></a>');
    }
}

function genericAPIErrorHandler(data, statusCode, cbo) {
    console.log("API error. Data to follow.")
    console.log(data)
    console.log(statusCode)

    if ([401,403].includes(statusCode)) {
        debugLog("Auth expired?");
        console.log("Authentication has expired. Redirecting to login page");
        localLogout();
    }

    if (statusCode == 0) {
        //Network error
        showAlert("Connection Error", "Check your connection, or the <a href='#'>rebble service status</a>.")
    }
    
    if (typeof cbo == "object") {
        $(cbo).html("Something went wrong")
    }
}

function showAppUploadingModal() {
    $('.submitModal-section').addClass("hidden");
    $('#submitModal-uploading').removeClass("hidden");
    $('#submitModal').modal('show');
    clearTimeout(funMessageIntervalTimer)
    setTimeout(startFunMessageTimer, 2000);
}
function submitNewApp() {

    var shinyNewApp = {
        name: $('#i-newapp-name').val(),
        type: ($('#i-iswatchface').prop("checked")) ? "watchface" : "watchapp",
        description: $('#i-description').val(),
        releaseNotes: $('#i-releaseNotes').val(),
    }
    shinyNewApp.category = (shinyNewApp.type == "watchface") ? "Faces" : $('#i-appCat').val()
    //Client side basic validation
    //No blank required fields
    if (shinyNewApp.name == "") { newAppValidationError("App name cannot be blank"); return }
    if (shinyNewApp.type == "watchapp" && shinyNewApp.category == "") { newAppValidationError("Please select an app category"); return }
    if (shinyNewApp.description == "") { newAppValidationError("Description cannot be blank"); return }
    if (shinyNewApp.releaseNotes == "") { newAppValidationError("Release Notes cannot be blank"); return }
    //At least one screenshot
    if ($('#usePlatformSpecificScreenshots').prop("checked")) {

        if ($('#i-screenshot-a-1-f').prop('files')[0] == undefined && $('#i-screenshot-b-1-f').prop('files')[0] == undefined && $('#i-screenshot-c-1-f').prop('files')[0] == undefined && $('#i-screenshot-d-1-f').prop('files')[0] == undefined) {
            newAppValidationError("Provide at least one screenshot")
            return
        }

    } else {

        if ($('#i-screenshot-1-f').prop('files')[0] == undefined) {
            newAppValidationError("Provide at least one screenshot")
            return
        }

    }
    //App specific fields
    if ($('#i-iswatchapp').prop("checked")) {

        if ($('#i-ban-f').prop('files')[0] == undefined) { newAppValidationError("A banner is required"); return }
        if ($('#i-icon-large-f').prop('files')[0] == undefined) { newAppValidationError("A large app icon required"); return }
        if ($('#i-icon-small-f').prop('files')[0] == undefined) { newAppValidationError("A small app icon required"); return }

    }

    if ($('#i-pbw').prop('files')[0] == undefined) { newAppValidationError("A banner is required"); return }

    showAppUploadingModal();

    //Prepare the multipart/form

    var formData = new FormData();

    formData.append("title", shinyNewApp.name);
    formData.append("type", shinyNewApp.type);
    formData.append("description", shinyNewApp.description);
    formData.append("release_notes", shinyNewApp.releaseNotes);
    formData.append("category", shinyNewApp.category);


    //Add banner if present
    if ($('#i-ban-f').prop('files')[0] != undefined) {
        formData.append("banner", $('#i-ban-f').prop('files')[0]);
    }
    
    var largeIcon = null
    //Collect screenshots, store the first valid one for use as largeIcon if we're a watchface
    if ($('#usePlatformSpecificScreenshots').prop("checked")) {

        //The weird order here is order of preference for largeIcon platform. Basalt looks best
        ["basalt","aplite", "diorite", "chalk"].forEach(platform => {
            var short = platform.substr(0,1);
            for (var i = 1; i < 6; i ++) {
                if ($(`#i-screenshot-${short}-${i}-f`).prop("files")[0] != undefined) { 
                    formData.append(`screenshot-${platform}-${i}`, $(`#i-screenshot-${short}-${i}-f`).prop("files")[0]); 
                    if (largeIcon === null && shinyNewApp.type == "watchface") { largeIcon = $(`#i-screenshot-${short}-${i}-f`).prop("files")[0] }
                }
            }
        })

    } else {

        for (var i = 1; i < 6; i ++) {
            if ($(`#i-screenshot-${i}-f`).prop("files")[0] != undefined) { 
                formData.append(`screenshot-generic-${i}`, $(`#i-screenshot-${i}-f`).prop("files")[0]); 
                if (largeIcon === null && shinyNewApp.type == "watchface") { largeIcon = $(`#i-screenshot-${i}-f`).prop("files")[0] }
            }
        }

    }

    //append app-only fields
    if (shinyNewApp.type == "watchapp") {
        console.log("Is an app, yo")
        formData.append("large_icon", $('#i-icon-large-f').prop("files")[0])
        formData.append("small_icon", $('#i-icon-small-f').prop("files")[0])
    } else {
        // Use a screenshot as largeIcon
        formData.append("large_icon", largeIcon)
    }

    //append optional fields
    if ($('#i-website').val() != null && $('#i-website').val() != "") {
        formData.append("website", $('#i-website').val());
    }
    if ($('#i-source').val() != null && $('#i-source').val() != "") {
        formData.append("source", $('#i-source').val());
    }

    //Attach pbw
    formData.append("pbw",$('#i-pbw').prop('files')[0]);

    apiPOST(config.endpoint.base + config.path.submitApp, formData, submitNewApp_cb, submitNewApp_ecb, {}, true)

}
function submitNewApp_cb(data) {
    stopFunMessageTimer();
    $('.submitModal-section').addClass("hidden");
    $('#submitModal-success').removeClass("hidden");
    data = JSON.parse(data);
    $('#submitModal-linkToApp').attr("href",config.misc.appstoreUrl + data.id);
}
function submitNewApp_ecb(data) {
    stopFunMessageTimer();
    $('.submitModal-section').addClass("hidden");
    $('#submitModal-error').removeClass("hidden");

    try {
        data = JSON.parse(data)
    } catch (e) {
        $('#submitModal-error-text').html("Something went wrong, please try again later. If the problem persists, ask on the <a target='_blank' href='https://rebble.io/discord'>Rebble Discord</a>.");
        return
    }

    var nicerMessages = {
        "app.exists": "An application with the supplied UUID already exists. Please generate a new UUID in your appinfo.json."
    }

    var msg = nicerMessages.hasOwnProperty(data.e) ? nicerMessages[data.e] : data.error;

    $('#submitModal-error-text').html(msg)
}
function newAppValidationError(txt) {
    $('#btn-newAppSubmit').html(txt);
    $('#btn-newAppSubmit').addClass("btn-danger");
    setTimeout(function() {
        $('#btn-newAppSubmit').html("GO");
        $('#btn-newAppSubmit').removeClass("btn-danger");
    }, 2000)
}
function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function(e) {
            $('.activeImage').attr('src', e.target.result);

            var i = null;
            $('.activeImage').each(function () {
              i = this.id;
            });
            images[i] = e.target.result.split("base64,")[1];
            console.log("Image ID " + i + " = " + e.target.result)
            // $('.activeImage').css('display', 'inline');

        };

        reader.readAsDataURL(input.files[0]);
    }
}


// Helper functions

function apiPOST(rurl, postdata, callback, errorCallback, callBackObject, disableContentTypeSet = false, percentageCallback) {
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
    xmlHttp.onprogress = function (e) {
        if (e.lengthComputable) {
            percentageCallback(e.loaded, e.total)
        }
    }
    xmlHttp.open("POST", rurl, true); // true for asynchronous
    if (! disableContentTypeSet) {
        xmlHttp.setRequestHeader("Content-Type", "application/json");
    }
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

    //Bind other events
    $('#master-profile').on('classChange', function(e) {
        // Change subtitle on visiblity change
        alert("F")
        updateProfileSubtitle();
     });

    $('.rbtype').on('click', function(e) {
        if ($('#i-iswatchface').prop("checked")) {
            $('#appCategory').addClass("hidden");
            $('#appIconContainer').addClass("hidden");
            $('.appOrFace').html("Watchface");
        } else {
            $('#appCategory').removeClass("hidden");
            $('#appIconContainer').removeClass("hidden");
            $('.appOrFace').html("App")
        }
    });

    $('#usePlatformSpecificScreenshots').on('click', function(e) {
        if ($('#usePlatformSpecificScreenshots').prop("checked")) {
            $('#platformAgnosticScreenshots').addClass("hidden");
            $('#platformSpecificScreenshots').removeClass("hidden");
        } else {
            $('#platformSpecificScreenshots').addClass("hidden");
            $('#platformAgnosticScreenshots').removeClass("hidden");
        }
    });

    
    //Start up. Router and other special stuff runs on callback. Follow this.
    getUserInfo();

    // $('#submitModal').modal('show');
    // $('#updateModal').modal('show');

}

initDevPortal();