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

    if (validPages.includes(pageID)) {
        $('#master-' + pageID).removeClass("hidden");
        if (pageID == "home") { pageID = "" }
        window.history.pushState(pageID, 'Rebble Developer Portal - ' + pageID, '/' + pageID);
    } else {
        $('#master-home').removeClass("hidden");
    }

    
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
    $('#appinfo-uuid').html(data.uuid);
    $('#appinfo-category').html(data.category);
    $('#appinfo-initaldate').html(data.created_at);
    $('#appinfo-latestdate').html(data.latest_release.published_date);
    $('#appinfo-description').html(data.description);
    $('#appinfo-sourcelink').html(data.source);
    $('#appinfo-releasenotes').html(data.latest_release.release_notes);
    $('#appinfo-icon').attr("src",data.screenshot_images[0]["144x168"]);

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

function submitNewApp() {

    var shinyNewApp = {
        name: $('#i-newapp-name').val(),
        type: ($('#i-iswatchface').prop("checked")) ? "face" : "app",
        category: $('#i-appCat').val(),
        description: $('#i-description').val(),
        releaseNotes: $('#i-releaseNotes').val(),
    }

    //Client side basic validation
    if (shinyNewApp.name == "") { newAppValidationError("App name cannot be blank"); return }
    if (shinyNewApp.type == "app" && shinyNewApp.category == "") { newAppValidationError("Please select an app category"); return }
    if (shinyNewApp.description == "") { newAppValidationError("Description cannot be blank"); return }
    if (shinyNewApp.releaseNotes == "") { newAppValidationError("Release Notes cannot be blank"); return }


    var formData = new FormData();

    formData.append("appname", );
    formData.append("apptype", apptype); // number 123456 is immediately converted to a string "123456"

    // HTML file input, chosen by user
    // formData.append("userfile", fileInputElement.files[0]);

    // JavaScript file-like object
    // var content = '<a id="a"><b id="b">hey!</b></a>'; // the body of the new file...
    // var blob = new Blob([content], { type: "text/xml"});

    // formData.append("webmasterfile", blob);

    var request = new XMLHttpRequest();
    request.open("POST", config.endpoint.base + config.path.submitApp);
    request.send(formData);

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

    //Bind other events
    $('#master-profile').on('classChange', function(e) {
        // Change subtitle on visiblity change
        alert("F")
        updateProfileSubtitle();
     });

    $('.rbtype').on('click', function(e) {
        if ($('#i-iswatchface').prop("checked")) {
            $('#appCategory').addClass("hidden");
            $('.appOrFace').html("Watchface")
        } else {
            $('#appCategory').removeClass("hidden");
            $('.appOrFace').html("App")
        }
    });

    $('#screenshotCollectionType').on('click', function(e) {
        if ($('#screenshotCollectionType').prop("checked")) {
            $('#platformAgnosticScreenshots').addClass("hidden");
            $('#platformSpecificScreenshots').removeClass("hidden");
        } else {
            $('#platformSpecificScreenshots').addClass("hidden");
            $('#platformAgnosticScreenshots').removeClass("hidden");
        }
    });

    
    //Start up. Router runs on callback
    getUserInfo();

    // $('#submitModal').modal('show');

}

initDevPortal();