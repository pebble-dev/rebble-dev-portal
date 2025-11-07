//Global variables
currentAppCache = {}
notifications = {
    count: 0
}
funMessageIntervalTimer = null;
isWizard = false

const PLATFORMS = ["aplite","basalt","chalk","diorite", "emery"]
const GREYSCALE_PLATFORMS = ["aplite", "diorite"]


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
        <a class="nav-link ' + extraClasses + '" href="#" onclick="getAppDetails(\'' + app.id + '\')"><span class="ml-2" id="appselector_' + app.id + '_title"></span></a>\
    </li>';

    $('#userAppList').append(html);
    $(`#appselector_${app.id}_title`).text(app.title)

    html = '\
    <li class="nav-item">\
        <a class="nav-link" data-dismiss="modal" href="#" onclick="getAppDetails(\'' + app.id + '\')" onmouseover="$(this).addClass(\'showChevron\')" onmouseout="$(this).removeClass(\'showChevron\')"><i class="fas fa-chevron-right nav-indicator"></i><span class="ml-2" id="appPickerList_' + app.id + '_title"></span></a>\
    </li>';

    $('#appPickerList').append(html)
    $(`#appPickerList_${app.id}_title`).text(app.title);
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
    html_populateScreenshotTabList();
    html_populateBannerTabList();

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
    var platform = currentAppCache.screenshot_hardware
    //There seems to be a bug in the .tab() function. Sometimes the tab selector changes but not the tabcontent.
    //Switching to aplite then the desired fixes this
    $('#e-scr-aplite-tab').tab("show");
    $('#e-scr-' + platform + "-tab").tab("show");
    getEditScreenshotsForPlatform(platform)

    $('#e-banner-aplite-tab').tab("show");
    $('#e-banner-' + platform + "-tab").tab("show");
    getEditBannersForPlatform(platform)

    getEditIcons()

}
function updateAppField(field) {
    $('#change-' + field).removeClass("hidden")
}
function saveAndPublishAppEdits() {
    //Submit changes to store

    var appUpdateObj = {}

    $('#updateModal-inProgress').removeClass("hidden");
    $('#updateModal-success').addClass("hidden");
    $('#updateAppName').text($('#edit-title').val())
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

    $('.updateModalPage').addClass("hidden");
    $('#updateModal-success').removeClass("hidden");
    $('.change').addClass("hidden");
    returnToMainSecondaryWindow();
    //Make sure we refresh our updated app
    getAppDetails(data.id);
}
function saveAndPublishAppEdits_ecb(data, code) {
    $('#updateModal').modal('hide');

    if (code == 429) { return }

    jumpToTopOfPage()

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


function getEditScreenshotsForPlatform(platform) {
    apiGET(config.endpoint.base + config.path.editApp + currentAppCache.id + "/screenshots/" + platform, getEditScreenshotsForPlatform_cb, genericAPIErrorHandler, platform);
}
function getEditScreenshotsForPlatform_cb(data, platform) {
    var data = JSON.parse(data);
    console.log(data)

    if (! currentAppCache.hasOwnProperty("screenshotCache")) { currentAppCache.screenshotCache = {} }
    currentAppCache.screenshotCache[platform] = data
    //Screenshots
    var shortPlatform = platform.substr(0,1)
    var assetCfgType = (platform == "chalk") ? "screenshotAssetRound" : "screenshotAsset"
    var numScreenshots = data.length

    data.forEach((screenshotID, index) => {
        $(`#e-screenshot-${shortPlatform}-${index+1}-i`).attr("src", config.misc[assetCfgType] + screenshotID)
        $(`#e-screenshot-${shortPlatform}-${index+1}-btn-add`).addClass("hidden");
        $(`#e-screenshot-${shortPlatform}-${index+1}-btn-delete`).removeClass("hidden");
        
        // Set the data attrs to the screenshot UUID for the delete button and modal delete button
        $(`#e-screenshot-${shortPlatform}-${index+1}-btn-delete-btn`).attr("data-uuid", screenshotID);
        
    });

    for (var i = numScreenshots; i < 5; i++) {
        var srclink = getScreenshotPlaceholderImagePath(platform)
        $(`#e-screenshot-${shortPlatform}-${i+1}-i`).attr("src", srclink);
        $(`#e-screenshot-${shortPlatform}-${i+1}-btn-add`).removeClass("hidden");
        $(`#e-screenshot-${shortPlatform}-${i+1}-btn-delete`).addClass("hidden");
    }

}
function newScreenshotForUpload(imgHolderID, file, platform) {
    $('#' + imgHolderID).attr("src", "/res/img/screenshotUploading.png");
    var btnID = imgHolderID.replace("-i", "-btn-add");
    $('#' + btnID).addClass("hidden")
    var formData = new FormData();
    formData.append("screenshot", file)
    apiPOST(config.endpoint.base + config.path.editApp + `${currentAppCache.id}/screenshots/${platform}`, formData, newScreenshotForUpload_cb, newScreenshotForUpload_ecb, platform, true, null)
}
function newScreenshotForUpload_cb(data) {
    data = JSON.parse(data)
    getEditScreenshotsForPlatform(data.platform)
}
function newScreenshotForUpload_ecb(data, httpCode, platform) {
    console.log(data);
    try {
        data = JSON.parse(data)

        var nicerMessages = {
            "screenshots.illegaldimensions": "Your image is not the correct dimensions for the selected platform",
            "screenshots.illegalvalue": "Invalid file type. Please use png, jpg or gif",
        }
        var err = nicerMessages.hasOwnProperty(data.e) ? nicerMessages[data.e] : data.error

        if (data.hasOwnProperty("message")) {
            err += ". " + data.message
        }

        showAlert("Failed to upload screenshot", err);
    } catch (e) {
        showAlert("Failed to upload screenshot", "Please try again later");
    }

    jumpToTopOfPage();
    getEditScreenshotsForPlatform(platform);
}
function deleteScreenshotFromButton(screenshotID, platform) {
    var deleteImmediately = getSettingSafeBool("disableWarnBeforeScreenshotDelete")

    if (deleteImmediately) {
        deleteScreenshot(currentAppCache.id, platform, screenshotID)
    } else {
        if (platform == "chalk") {
            $('#deleteScreenshotModalPreviewImg').attr("src", config.misc.screenshotAssetRound + screenshotID);
            $('#deleteScreenshotModalPreviewImg').addClass("roundScr");
        } else {
            $('#deleteScreenshotModalPreviewImg').attr("src", config.misc.screenshotAsset + screenshotID);
            $('#deleteScreenshotModalPreviewImg').removeClass("roundScr");
        }
        $(`#delete-screenshot-modal-btn`).attr("data-appID", currentAppCache.id);
        $(`#delete-screenshot-modal-btn`).attr("data-platform", platform);
        $(`#delete-screenshot-modal-btn`).attr("data-uuid", screenshotID);
        $('#confirmDeleteScreenshotModal').modal("show")
    }
}
function deleteScreenshot(appID, platform, screenshotID) {
    apiDELETE(config.endpoint.base + config.path.editApp + appID + `/screenshots/${platform}/${screenshotID}`, deleteScreenshot_cb, deleteScreenshot_ecb);
}
function deleteScreenshot_cb(data) {
    data = JSON.parse(data);
    getEditScreenshotsForPlatform(data.platform);
}
function deleteScreenshot_ecb(data) {
    data = JSON.parse(data)
    if (data.hasOwnProperty("message")) {
        showWarning("Cannot delete screenshot", data.message);
    } else {
        showAlert("Failed to delete screenshot", data.error);
    }
    jumpToTopOfPage();
}
function html_populateScreenshotTabList() {
    //Create the HTML for the edit dialogue screenshot list
    var maxScreenshots = 5
    var output = ""
    var exClass = "show active"

    PLATFORMS.forEach(p => {
        pshort = p.substring(0,1)
        output += `<div class="tab-pane fade ${exClass}" id="e-scr-${p}" role="tabpanel" aria-labelledby="e-scr-${p}-tab">`
        output += `<div class="row">`

        placeholder = getScreenshotPlaceholderImagePath(p)

        var exImgClass = (p == "chalk") ? "roundScr" : ""
        
        for (var i = 1; i <= maxScreenshots; i++) {
            output += `<div class="card img-card ${p} noshadow border-lite ml-3 mt-3">
                        <img id="e-screenshot-${pshort}-${i}-i" class="card-img-top ${exImgClass} ${p}" src="${placeholder}" />
                        <div class="card-body wide hidden" id="e-screenshot-${pshort}-${i}-btn-delete">
                            <button class="btn btn-danger" id="e-screenshot-${pshort}-${i}-btn-delete-btn" onclick="deleteScreenshotFromButton(this.getAttribute('data-uuid'), '${p}')">Delete</button>
                        </div>
                        <label for="e-screenshot-${pshort}-${i}-f" class="mt-1">
                            <div class="card-body wide" id="e-screenshot-${pshort}-${i}-btn-add">
                                <a  class="btn btn-primary">Add</a>
                            </div>
                        </label>
                        <input id="e-screenshot-${pshort}-${i}-f" type="file" class="hidden" onchange="newScreenshotForUpload('e-screenshot-${pshort}-${i}-i', this.files[0], '${p}')">
                    </div>`
        }
        output += '</div></div>'
        exClass = ""
    })

    $('#editScreenshotTabContent').html(output)
}


function getEditBannersForPlatform(platform) {
    apiGET(config.endpoint.base + config.path.editApp + currentAppCache.id + "/banners/" + platform, getEditBannersForPlatform_cb, genericAPIErrorHandler, platform);
}
function getEditBannersForPlatform_cb(data, platform) {
    var data = JSON.parse(data);
    console.log(data)

    if (! currentAppCache.hasOwnProperty("bannerCache")) { currentAppCache.bannerCache = {} }
    currentAppCache.bannerCache[platform] = data
    //Banners
    var shortPlatform = platform.substr(0,1)
    var numBanners = data.length

    data.forEach((bannerID, index) => {
        console.log("SET " + `#e-banner-${shortPlatform}-${index+1}-i`)
        $(`#e-banner-${shortPlatform}-${index+1}-i`).attr("src", config.misc.bannerAsset + bannerID)
        $(`#e-banner-${shortPlatform}-${index+1}-btn-add`).addClass("hidden");
        $(`#e-banner-${shortPlatform}-${index+1}-btn-delete`).removeClass("hidden");
        
        // Set the data attrs to the screenshot UUID for the delete button and modal delete button
        $(`#e-banner-${shortPlatform}-${index+1}-btn-delete-btn`).attr("data-uuid", bannerID);
        
    });

    for (var i = numBanners; i < 3; i++) {
        $(`#e-banner-${shortPlatform}-${i+1}-i`).attr("src", "/res/img/newappbanner.png");
        $(`#e-banner-${shortPlatform}-${i+1}-btn-add`).removeClass("hidden");
        $(`#e-banner-${shortPlatform}-${i+1}-btn-delete`).addClass("hidden");
    }
}
function newBannerForUpload(imgHolderID, file, platform) {
    $('#' + imgHolderID).attr("src", "/res/img/bannerUploading.png");
    var btnID = imgHolderID.replace("-i", "-btn-add");
    $('#' + btnID).addClass("hidden")
    var formData = new FormData();
    formData.append("banner", file)
    apiPOST(config.endpoint.base + config.path.editApp + `${currentAppCache.id}/banners/${platform}`, formData, newBannerForUpload_cb, newBannerForUpload_ecb, platform, true, null)
}
function newBannerForUpload_cb(data) {
    data = JSON.parse(data)
    getEditBannersForPlatform(data.platform)
}
function newBannerForUpload_ecb(data, httpCode, platform) {
    try {
        data = JSON.parse(data)

        var nicerMessages = {
            "banner.illegaldimensions": "Your image is not the correct dimensions for the selected platform",
            "banner.illegalvalue": "Invalid file type. Please use png, jpg or gif",
        }
        var err = nicerMessages.hasOwnProperty(data.e) ? nicerMessages[data.e] : data.error

        if (data.hasOwnProperty("message")) {
            err += ". " + data.message
        }

        showAlert("Failed to upload banner", err);
    } catch (e) {
        showAlert("Failed to upload banner", "Please try again later");
    }

    jumpToTopOfPage();
    getEditBannersForPlatform(platform);
}
function deleteBannerFromButton(bannerID, platform) {
    var deleteImmediately = getSettingSafeBool("disableWarnBeforeScreenshotDelete")

    if (deleteImmediately) {
        deleteBanner(currentAppCache.id, platform, bannerID)
    } else {
        $('#deleteBannerModalPreviewImg').attr("src", config.misc.bannerAsset + bannerID);
        $('#deleteBannerModalPreviewImg').removeClass("roundScr");
        $(`#delete-banner-modal-btn`).attr("data-appID", currentAppCache.id);
        $(`#delete-banner-modal-btn`).attr("data-platform", platform);
        $(`#delete-banner-modal-btn`).attr("data-uuid", bannerID);
        $('#confirmDeleteBannerModal').modal("show")
    }
}
function deleteBanner(appID, platform, bannerID) {
    apiDELETE(config.endpoint.base + config.path.editApp + appID + `/banners/${platform}/${bannerID}`, deleteBanner_cb, deleteBanner_ecb);
}
function deleteBanner_cb(data) {
    data = JSON.parse(data);
    getEditBannersForPlatform(data.platform);
}
function deleteBanner_ecb(data) {
    data = JSON.parse(data)
    if (data.hasOwnProperty("message")) {
        showWarning("Cannot delete banner", data.message);
    } else {
        showAlert("Failed to delete banner", data.error);
    }
    jumpToTopOfPage();
}
function html_populateBannerTabList() {
    //Create the HTML for the edit dialogue banner list
    var maxBanners = 3
    var output = ""
    var exClass = "show active"

    PLATFORMS.forEach(p => {
        pshort = p.substr(0,1)
        output += `<div class="tab-pane fade ${exClass}" id="e-banner-${p}" role="tabpanel" aria-labelledby="e-banner-${p}-tab">`
        output += `<div class="row">`
        
        for (var i = 1; i <= maxBanners; i++) {         
            output += `<div class="card noshadow border-lite ml-3 mt-3">
                        <img id="e-banner-${pshort}-${i}-i" class="card-img-top banner" src="/res/img/newappbanner.png">
                        <div class="card-body wide hidden" id="e-banner-${pshort}-${i}-btn-delete">
                            <button class="btn btn-danger" id="e-banner-${pshort}-${i}-btn-delete-btn" onclick="deleteBannerFromButton(this.getAttribute('data-uuid'), '${p}')">Delete</button>
                        </div>
                        <label for="e-banner-${pshort}-${i}-f" class="mt-1">
                            <div class="card-body wide" id="e-banner-${pshort}-${i}-btn-add">
                                <a class="btn btn-primary">Add</a>
                            </div>
                        </label>
                        <input id="e-banner-${pshort}-${i}-f" type="file" class="hidden" onchange="newBannerForUpload('e-banner-${pshort}-${i}-i', this.files[0], '${p}')">
                    </div>`
        }
        output += '</div></div>'
        exClass = ""
    })

    $('#editBannersTabContent').html(output)
}


function getEditIcons() {
    apiGET(config.endpoint.base + config.path.editApp + currentAppCache.id + "/icons", (icon_data => {
        icon_data = JSON.parse(icon_data)
        Object.keys(currentAppCache.list_image).forEach(k => {
            currentAppCache.list_image[k] = config.misc.assetBase + k + '/' + icon_data.large
        })
        Object.keys(currentAppCache.icon_image).forEach(k => {
            currentAppCache.icon_image[k] = config.misc.assetBase + k + '/' + icon_data.small
        })
        $('#e-icon-small-i').attr("src", currentAppCache.icon_image["48x48"])
        $('#e-icon-large-i').attr("src", currentAppCache.list_image["144x144"])
    }), genericAPIErrorHandler);

}
function newIconForUpload(imgHolderID, file, size) {
    $('#' + imgHolderID).attr("src", "/res/img/iconUploading.png");
    var formData = new FormData();
    formData.append("icon", file)
    apiPOST(config.endpoint.base + config.path.editApp + `${currentAppCache.id}/icon/${size}`, formData, getEditIcons, newIconForUpload_ecb, null, true)
}
function newIconForUpload_ecb(data, httpCode, platform) {
    try {
        data = JSON.parse(data)

        var nicerMessages = {
            "icon.illegalvalue": "Invalid file type. Please use png or jpg",
        }
        var err = nicerMessages.hasOwnProperty(data.e) ? nicerMessages[data.e] : data.error

        if (data.hasOwnProperty("message")) {
            err += ". " + data.message
        }

        showAlert("Failed to upload icon", err);
    } catch (e) {
        showAlert("Failed to upload icon", "Please try again later");
    }

    jumpToTopOfPage();
    getEditIcons();
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
        "Developer Extraordinaire",
        "Developer Extraordinaire",
        "Developer Extraordinaire",
        "Developer Extraordinaire",
        "Developer Extraordinaire",
        "Developer Extraordinaire",
        "Developer Extraordinaire",
        "Developer Extraordinaire",
        "Developer Extraordinaire",
        "Rebble with a cause",
        "Prolific publisher",
        "Watchface wizard",
        "Assembler of apps",
        "<span class='rainbow-text'>You're amazing!</span>"
    ]

    var seasonal = {
        "25-12": "Merry Christmas 🎄",
        "31-10": "Happy Halloween 🎃",
        "25-11": "Happy Thanksgiving 🥧",
        "19-12": "<a target='_blank' href='https://rebble.io/2016/12/19/rebble-community-update-1.html' onclick='hugeTada()'>Happy Birthday Rebble 🎂</a>",
        "28-4": "Ed Balls",
        "31-12": "Happy New Year 📅",
        "1-1": "Happy New Year 🎆"
    }

    var today = new Date()
    var dString = today.getDate().toString() + "-" + (today.getMonth()+1).toString();

    if (seasonal.hasOwnProperty(dString)) {
        $('#developer-subtitle').html(seasonal[dString]);
    } else {
        $('#developer-subtitle').html(subtitles[Math.floor(Math.random() * subtitles.length)])
    }

}

function toggleUsernameEdit(operation) {
    $('#profile-username-edit').removeClass("disabled");
    if (operation == "hide") {
        $('#profile-username-edit').addClass("hidden");
        $('#profile-username-display').removeClass("hidden");
    } else {
        $('#editUsernameInput').val($('#profileUsername').html())
        $('#profile-username-edit').removeClass("hidden");
        $('#profile-username-display').addClass("hidden");
    }

}
function updateDeveloperName() {
    $('#profile-username-edit').addClass("disabled");

    if ($('#editUsernameInput').val().length < 1) {
        showAlert("Name update failed", "Developer name cannot be blank");
        toggleUsernameEdit("hide");
        return
    }

    var postdata = {
        name: $('#editUsernameInput').val()
    }

    apiPOST(config.endpoint.base + config.path.aboutme, JSON.stringify(postdata), updateDeveloperName_cb, updateDeveloperName_ecb);
}
function updateDeveloperName_cb(data) {
    toggleUsernameEdit("hide");
    getUserInfo();
}
function updateDeveloperName_ecb(data) {
    toggleUsernameEdit("hide");
    try {
        data = JSON.parse(data);
    } catch (e) {
        console.log(e)
        showAlert("Name update failed", "Something went wrong. Please try again later.");
    }
    showAlert("Name update failed", data.error);
} 

//  - Submit
function getCurrentAppSumitStep() {
    var currentStep = 1
    $('.substep').each((i,e) => {
        if (! $(e).hasClass("hidden")) {
            currentStep = $(e).attr("id").toString().split("-")[1]
        }
    })
    currentStep = parseInt(currentStep);
    return currentStep
}
function validateThenProgressSubmission() {
    var step = getCurrentAppSumitStep()

    if (step == 1) {
        //Validate step 1 data
        if ($('#i-newapp-name').val().length < 1) { showValidationError("App name cannot be blank"); return }
        if ($('#i-iswatchapp').prop("checked") && $('#i-appCat').val().length < 1) { showValidationError("Select an app category"); return }
        if ($('#i-description').val().length < 1) { showValidationError("Description cannot be blank"); return }
    }

    if (step == 3) {
        
    }

    progressAppSubmission()
}
function showValidationError(text) {
    $('#btn_sub_next').addClass("btn-danger")
    $('#btn_sub_next').text(text)
    setTimeout(function() {
        $('#btn_sub_next').removeClass("btn-danger")
        $('#btn_sub_next').html("Next <i class='fas fa-forward'></i>")
    }, 2000)
}
function progressAppSubmission(step) {
    var maxStep = 4
    var currentStep = getCurrentAppSumitStep()
    if (step != null) {
        currentStep = step
    } else {
        if (currentStep < maxStep) {
            currentStep++
        } else {
            return
        }
    }

    $('.substep').addClass("hidden");
    $('#substep-' + currentStep).removeClass("hidden");
    $('.ball').removeClass("green");
    $('#subball-' + currentStep).addClass("green");
    if (currentStep == 0) { $('#btn_sub_prev').addClass("hidden");  } else { $('#btn_sub_prev').removeClass("hidden"); }
    if (currentStep == maxStep) { $('#btn_sub_next').addClass("hidden");  } else { $('#btn_sub_next').removeClass("hidden"); }
}
function reverseAppSubmission() {
    var currentStep = getCurrentAppSumitStep()
    if (currentStep > 0) {
        currentStep--
        progressAppSubmission(currentStep)
    }
}
function submitAddImage(imagePrefix, imageFile) {
    document.getElementById(`${imagePrefix}-i`).src = window.URL.createObjectURL(imageFile);
    $(`#${imagePrefix}-addbtn`).addClass("hidden");
    $(`#${imagePrefix}-removebtn`).removeClass("hidden");
}
function submitRemoveImage(imagePrefix) {
    var srclink = getScreenshotPlaceholderImagePath(imagePrefix.split("-")[2])
    $(`#${imagePrefix}-f`).val("");
    $(`#${imagePrefix}-i`).attr("src",srclink);
    $(`#${imagePrefix}-addbtn`).removeClass("hidden");
    $(`#${imagePrefix}-removebtn`).addClass("hidden");
}
function html_populateAddImageTabList() {
    //Create the HTML for the add images screenshot list
    var maxScreenshots = 5
    var output = ""
    var exClass = "show active"

    PLATFORMS.forEach(p => {
        pshort = p.substr(0,1)
        output += `<div class="tab-pane fade ${exClass}" id="scr-${p}" role="tabpanel" aria-labelledby="scr-${p}-tab">`
        output += `<div class="row">`

        var placeholder = getScreenshotPlaceholderImagePath(p)
        var exImgClass = (p == "chalk") ? "roundScr" : ""
        
        for (var i = 1; i <= maxScreenshots; i++) {
            output += `<div class="card img-card ${p} noshadow border-lite ml-3 mt-3">
                            <label for="i-screenshot-${pshort}-${i}-f">
                                <img id = "i-screenshot-${pshort}-${i}-i" class="card-img-top ${exImgClass} ${p}" src="${placeholder}" />
                                <div class="card-body wide">
                                    <a  class="btn btn-primary" id="i-screenshot-${pshort}-${i}-addbtn">Add</a>
                                    <button  class="btn btn-primary hidden" id="i-screenshot-${pshort}-${i}-removebtn" onclick="submitRemoveImage('i-screenshot-${pshort}-${i}')">Remove</button>
                                </div>
                            </label>
                            <input id="i-screenshot-${pshort}-${i}-f" type="file" class="hidden" onchange="submitAddImage('i-screenshot-${pshort}-${i}', this.files[0])">
                        </div>`
        }
        output += '</div></div>'
        exClass = ""
    })

    $('#submitScreenshotTabContent').html(output)
}
function clearSubmitFields() {
    // Reset everything
    inputs = [
        "i-newapp-name",
        "i-description",
        "i-website",
        "i-source",
        "i-releaseNotes",
        "i-pbw"
    ]

    inputs.forEach(x => {
        $(`#${x}`).val("")
    })

}

//  - New Release
function showNewRelease() {
    $('.data-release-app').text(currentAppCache.title);
    showPage("release");
}
function getCurrentAppReleaseStep() {
    var currentStep = 1
    $('.relstep').each((i,e) => {
        if (! $(e).hasClass("hidden")) {
            currentStep = $(e).attr("id").toString().split("-")[1]
        }
    })
    currentStep = parseInt(currentStep);
    return currentStep
}
function validateThenProgressRelease() {
    var step = getCurrentAppReleaseStep()

    progressAppRelease()
}
function progressAppRelease(step) {
    var maxStep = 3
    var currentStep = getCurrentAppReleaseStep()
    if (step != null) {
        currentStep = step
    } else {
        if (currentStep < maxStep) {
            currentStep++
        } else {
            return
        }
    }

    $('.relstep').addClass("hidden");
    $('#relstep-' + currentStep).removeClass("hidden");
    $('.ball').removeClass("green");
    $('#relball-' + currentStep).addClass("green");
    if (currentStep == 1) { $('#btn_rel_prev').addClass("hidden");  } else { $('#btn_rel_prev').removeClass("hidden"); }
    if (currentStep == maxStep) { $('#btn_rel_next').addClass("hidden");  } else { $('#btn_rel_next').removeClass("hidden"); }
}
function reverseAppRelease() {
    var currentStep = getCurrentAppReleaseStep()
    if (currentStep > 1) {
        currentStep--
        progressAppRelease(currentStep)
    }
}
function submitRelease() {
    var formData = new FormData();

    var newRelease = {
        notes: $('#release-releaseNotes').val(),
        file: $('#release-pbw').prop('files')[0]
    }

    if (newRelease.notes == null || newRelease.notes.length < 1) {
        submitReleaseValidationError("Release notes cannot be blank");
        return
    }

    if (newRelease.file == null) {
        submitReleaseValidationError("Select a .pbw file");
        return
    }

    formData.append("release_notes", newRelease.notes);
    formData.append("pbw", newRelease.file);

    $('.updateModalPage').addClass("hidden");
    $('#updateModal-inProgress').removeClass("hidden");
    $('#updateAppName').text(currentAppCache.title)
    $('#updateChangedFields').text("")
    $('#updateChangedFields').append("<li> New Release </li>")
    $('#updateModal').modal('show');

    setTimeout(function() {
        apiPOST(config.endpoint.base + config.path.editApp + currentAppCache.id + '/release', formData, submitRelease_cb, submitRelease_ecb, null, true)
    }, 500);

}
function submitRelease_cb(data) {
    $('.updateModalPage').addClass("hidden");
    $('#updateModal-release-success').removeClass("hidden");
    $('.change').addClass("hidden");
}
function submitRelease_ecb(data, code) {
    $('#updateModal').modal('hide');
    if (code == 429) { return }
    jumpToTopOfPage()

    try {
        data = JSON.parse(data)
    } catch (e) {
        showAlert("Failed to publish release", "Something went wrong. Tell someone.");
        console.log(e);
        return
    }

    var errmsg = (data.hasOwnProperty("message")) ? data.message : data.error
    showAlert("Failed to publish release", errmsg);
    console.log(data)
}
function submitReleaseValidationError(txt) {
    $('#btn-newReleaseSubmit').text(txt);
    $('#btn-newReleaseSubmit').addClass("btn-danger");
    setTimeout(function() {
        $('#btn-newReleaseSubmit').text("Publish release to store");
        $('#btn-newReleaseSubmit').removeClass("btn-danger");
    }, 2000)
}

//  - Setup
function showSetupStep(step) {
    $('.setupWindow').addClass("hidden");
    $('#setup-' + step).removeClass("hidden");

    var placeholderNames = [
        "Renholm Industries",
        "Aperture Science",
        "Black Mesa",
        "Umbrella Corporation",
        "Acme Corp",
        "Sirius Cybernetics Corp",
        "Wayne Enterprises",
        "Globex",
        "Stark Industries",
        "Cyberdyne Systems",
        "Oscorp"
    ];

    $('#newDevName').attr("placeholder",placeholderNames[Math.floor(Math.random() * placeholderNames.length)]);
}

// -  Wizard
function wizardLoadAppInfo() {
    appID = $('#wizard_app_string').val()

    if (appID.includes("/")) {
        if (appID.substr(-1) == "/") { appID = appID.substr(0, appID.length -1) }
        appID = appID.split("/")
        appID = appID[appID.length-1]
    }
    if (appID.includes("?")) {
        appID = appID.split("?")[0]
    }
    $('#wizard_app_string').val(appID)

    apiGET(config.endpoint.base + config.path.appInfo + appID, wizardLoadAppInfo_cb, wizardLoadAppInfo_ecb);
}
function wizardLoadAppInfo_cb(data) {

    console.log(data)
    data = JSON.parse(data)
    if (data.data.length < 1) {
        showWarning("Not found", "App or face not found");
        return
    }
    data = data.data
    $('#wizard_lookup_title').text(data[0].title)
    $('#wizard_lookup_author').text(data[0].author)
    $('#wizard_current_dev_name').text(data[0].author)
    $('#wizardUpdateDeveloperNameBtn').attr("data-id",data[0].developer_id);
    $('#wizard_lookup_version').text(data[0].latest_release.version)
    $('#wizard_lookup_category').text(data[0].category)
    $('#wizard_lookup_developerid').html(`<a href="${config.misc.developerUrl}${data[0].developer_id}/1" target="_blank"> ${data[0].developer_id} </a>`)
    $('#wizard_current_developer_id').html(`<a href="${config.misc.developerUrl}${data[0].developer_id}/1" target="_blank"> ${data[0].developer_id} </a>`)
    $('#wizardUpdateDeveloperIDBtn').attr("data-id", data[0].id)
    $('#wizard_lookup_uuid').text(data[0].uuid)
    $('#wizard_lookup_id').text(data[0].id)
    $('#wizardDeleteAppBtn').attr("data-id", data[0].id)
    $('#wizardGetS3ResourcesBtn').attr("data-id", data[0].id)
    $('#wizard_lookup_image').attr("src", data[0].list_image["144x144"])
    $('#wizard_lookup_added').text(friendlyTimeAgo(data[0].created_at) + ` (${data[0].created_at})`)
    $('#wizard_lookup_updated').text(friendlyTimeAgo(data[0].latest_release.published_date) + ` (${data[0].latest_release.published_date})`)

    $('.data-wizard_app_name').text(data[0].title)
    $('.data-wizard_app_id').text(data[0].id)

    $('#wizardDeleteCbConfirm').prop("checked",false)

    $('#wizard_load_info').removeClass("hidden");


}
function wizardLoadAppInfo_ecb(data) {
    data = JSON.parse(data)
    showAlert("Oops", data.error);
}
function wizardUpdateDeveloperName(id) {

    if ($('#wizard_new_dev_name').val().length < 1) {
        return
    }

    var postData = {
        name: $('#wizard_new_dev_name').val()
    }
    apiPOST(config.endpoint.base + config.path.wizardUpdateDevName + id, JSON.stringify(postData), function() {
        wizardLoadAppInfo();
        $('#wizardChangeDevModal').modal("hide");
        alert("Done")
    }, genericAPIErrorHandler);
}
function wizardUpdateDeveloperID(appid) {

    var developerID = $('#wizard_new_dev_id').val();

    if (developerID.length < 1) {
        return
    }

    var postData = {
        developer_id: developerID
    }
    apiPOST(config.endpoint.base + config.path.wizardApp + appid, JSON.stringify(postData), function() {
        wizardLoadAppInfo();
        $('#wizardChangeDevIDModal').modal("hide");
        alert("Done")
    }, genericAPIErrorHandler);
}
function wizardDeleteAppBtnPush(id) {

    if (! $('#wizardDeleteCbConfirm').prop("checked")) {
        $('#wizardDeleteAppBtn').text("Tick the box");
        setTimeout(function() {
            $('#wizardDeleteAppBtn').text("Delete App");
        }, 2000);
        return
    }

    apiDELETE(config.endpoint.base + config.path.wizardApp + id, function() {
        $('#wizard_load_info').addClass("hidden");
        $('#wizardDeleteAppModal').modal("hide")
        showWarning("App Delete Successful", "Deleted app " + id);
    }, genericAPIErrorHandler)
    
}
function wizardGetS3Info(id) {
    apiGET(config.endpoint.base + config.path.wizardApp + id, wizardGetS3Info_cb, genericAPIErrorHandler)
}
function wizardGetS3Info_cb(data) {
    data = JSON.parse(data);
    $('#wizard_s3_images').text(JSON.stringify(data.images))
    $('#wizard_s3_pbws').text(JSON.stringify(data.pbws))
    $('#wizardS3InfoModal').modal("show")
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
function showWarning(title, text) {
    $('#mainWarning').removeClass("hidden");
    $('#mainWarning-topic').html(title);
    $('#mainWarning-text').html(text);
}
function hideMainWarning() {
    $('#mainWarning').addClass("hidden");
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
function launchElement(id) {
    $(id).addClass("animated zoomOutUp");
}
function beatElement(id) {
    $(id).addClass("animated heartBeat");
    $(id).addClass("red-text");
    setTimeout(function() {
        $(id).removeClass("animated heartBeat");
        $(id).removeClass("red-text");
    }, 1000)
}

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

function tada() {
    confetti({
            angle: randomInRange(55, 125),
            spread: randomInRange(50, 70),
            particleCount: randomInRange(50, 100),
            origin: { y: 0.6 },
            zIndex: 2000,
            disableForReducedMotion: true,
    });
}
    
function hugeTada() {
    var end = Date.now() + (15 * 1000);
    
    var colors = ['#ff4700', '#373a3c'];
    
    (function frame() {
        confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
        });
        confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
        });
    
        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}
    

function showPage(pageID, isFreshLoad = false) {

    pageID = pageID.replace("/","");

    $('.page').addClass("hidden");

    var validPages = ["profile","home","submit","release","setup","recover-account", "wizard"];

    //Any weird custom per-window log goes here
    if (pageID == "submit") {

        html_populateAddImageTabList();
        progressAppSubmission(0);
        syncScreenshotButtonPreviews();
        if ($('#i-iswatchface').prop("checked") == false && $('#i-iswatchapp').prop("checked") == false) {
            $('#i-iswatchface').prop("checked", true)
        }
        if (! isFreshLoad) {
            clearSubmitFields()
        }

    } else if (pageID == "release") {

        progressAppRelease(1);
        $('#release-releaseNotes').val("");
        $('#release-pbw').val(null)
        if (isFreshLoad) {
            $('#appPickerModal').modal("show");
        }

    } else if (pageID == "profile") {

        updateProfileSubtitle();

    } else if (pageID == "setup") {

        $('#viewAllOn').addClass("hidden")

    } else if (pageID == "wizard") {

        if (! isWizard) {
            $('#viewAllOn').removeClass("hidden")
            $('#master-wizard-noaccess').removeClass("hidden");
            window.history.pushState(pageID, 'Rebble Developer Portal - ' + pageID, '/' + pageID);
            return
        }

    }

    syncSettings()

    if (validPages.includes(pageID)) {
        $('#viewAllOn').removeClass("hidden")
        $('#master-' + pageID).removeClass("hidden");
        if (pageID == "home") { pageID = "" }
        window.history.pushState(pageID, '/' + pageID, '/' + pageID);
    } else {
        $('#master-home').removeClass("hidden");
    }

    
}

function changePreviewWatchPlatform(platform, sender, forceFetch = false) {
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

    // forceFetch = true means we've been called by a user clicking the tiny icons.
    //Try to get the platform specific screenshot
    if (forceFetch) {
        apiGET(config.endpoint.base + config.path.editApp + currentAppCache.id + "/screenshots/" + platform, res => {
            res = JSON.parse(res);
            if (res.length > 0) {
                var platform_src_path = (platform == "chalk") ? config.misc.screenshotAssetRound : config.misc.screenshotAsset
                $('#appinfo-icon').prop("src", platform_src_path + res[0])
            }
        }, null);
    }

    $('#previewImageContainer').removeClass("bandw");
    $('#previewImageContainer').removeClass("chalk");
    if (platform == "chalk") {
        $('#previewImageContainer').addClass("chalk");
    } else if (GREYSCALE_PLATFORMS.includes(platform)) {
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
        "Just checking bluesky real quick",
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
    funMessageIntervalTimer = setInterval(updateFunMessage, 4000);
}
function stopFunMessageTimer() {
    clearInterval(funMessageIntervalTimer);
}
function jumpToTopOfPage() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
} 
function addNotification(title, text, cb) {
    var notifID = uuidv4()

    notifications[notifID] = {
        title: title,
        content: text,
        cb: cb
    }
    notifications.count++

    $('#notif_container').removeClass("hidden");
    $('#notif_count').removeClass("hidden");
    $('#notif_count').text(notifications.count)
    $('#notif_list').append(`<a class="dropdown-item p-3" href="#" onclick="showNotification('${notifID}')"><i class="fas fa-info mr-2"></i> ${title}</a>`)
}
function showNotification(id) {
    if (! notifications.hasOwnProperty(id)) { return }
    var n = notifications[id];
    $('#notif_modal_title').text(n.title);
    $('#notif_modal_body').html(n.content);
    $('#notificationModal').modal("show");
    notifications.count--
    $('#notif_count').text(notifications.count);

    if (n.cb != null) {
        n.cb()
    }

    if (notifications.count < 1) {
        $('#notif_count').addClass("hidden");
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

    var page = window.location.pathname;
    debugLog("Init router detected path as " + page);

    if (! data.hasOwnProperty("name")) { data.name = "New User"}

    if (data.hasOwnProperty("authName")) {
        $(".data-rebbleUsername").text(data.authName);
    }
   

    $(".data-username").text(data.name);
    $(".data-developerID").text(data.id);
    $(".data-userID").text(data.userid);
    $("#userAppList").html("");
    
    if (window.FS) {
        FS.identify(data.userid);
    }

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
    
    if (data.needsSetup && ! ["/setup","/recover-account"].includes(page)) {
        showPage("setup");
        return
    }
    if (! data.needsSetup) {
        //Show the 'how did you get here' screen on /setup for users who should never go there
        $('.setupWindow').addClass("hidden")
        $('#setup-notNeeded').removeClass("hidden")
    }

    if (data.w) {
        $('#wizard_nav_button').removeClass("hidden")
        isWizard = true
    }

    showPage(page, true);
}

function getAppDetails(appID) {
    $('#appinfo-icon').attr("src", "/res/placeholder/140x140.png")
    changePreviewWatchPlatform("basalt")
    $('#userAppList .active').removeClass("active");
    $('#appselector_' + appID).addClass("active");
    returnToMainSecondaryWindow();

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

    var appinfostring = (data.category == "Faces") ? '<i class="far fa-clock ml-4"></i> Watchface' : '<i class="fas fa-mobile-alt ml-4"></i> Watchapp'
    var appOrFace = (data.category == "Faces") ? "Watchface" : "App"
    $('.appOrFace').text(appOrFace)

    //Data
    $('#appinfo-appname').text(data.title);
    $('#appinfo-hearts').text(data.hearts);
    $('#appinfo-latestrelease').text(data.latest_release.version);
    $('#appinfo-latestreleaselist').text(data.latest_release.version);
    $('#appinfo-releasehistory').attr("href", config.misc.appstoreUrl + data.id + "/changelog");
    $('#appinfo-type').html(appinfostring)
    $('#appinfo-id').text(data.id);
    $('#appinfo-category').text(data.category);
    $('#appinfo-initaldate').text(data.created_at);
    $('#appinfo-latestdate').text(data.latest_release.published_date);
    $('#appinfo-description').text(data.description);
    $('#appinfo-sourcelink').text(data.source);
    $('#appinfo-releasenotes').text(data.latest_release.release_notes);
    

    //Icons
    $('.tinyicon').addClass("incompatible");
    $('.tinyicon').attr("title", "Unsupported Platform");
    var favouriteSupportedPlatform = "basalt"
    if (data.compatibility.emery.supported) { $('.supports-emery').removeClass("incompatible"); $('.supports-emery').attr("title", "Supports Emery"); favouriteSupportedPlatform = "emery" }
    if (data.compatibility.aplite.supported) { $('.supports-aplite').removeClass("incompatible"); $('.supports-aplite').attr("title", "Supports Aplite"); favouriteSupportedPlatform = "aplite" }
    if (data.compatibility.chalk.supported) { $('.supports-chalk').removeClass("incompatible"); $('.supports-chalk').attr("title", "Supports Chalk"); favouriteSupportedPlatform = "chalk" }
    if (data.compatibility.diorite.supported) { $('.supports-diorite').removeClass("incompatible"); $('.supports-diorite').attr("title", "Supports Diorite"); favouriteSupportedPlatform = "diorite" }
    if (data.compatibility.basalt.supported) { $('.supports-basalt').removeClass("incompatible"); $('.supports-basalt').attr("title", "Supports Basalt"); favouriteSupportedPlatform = "basalt" }


    changePreviewWatchPlatform(favouriteSupportedPlatform)

    // if (data.compatibility.emery.supported) { $('.supports-emery').removeClass("bandw"); $('.supports-emery').removeClass("hidden");  }

    // Preview icon
    if (favouriteSupportedPlatform == "chalk") {
        $('#appinfo-icon').attr("src",data.screenshot_images[0]["180x180"]);
    } else {
        $('#appinfo-icon').attr("src",data.screenshot_images[0]["144x168"]);
    }

    //Status
    if (data.visible) {
        $('#statusText').text("Published");
        $('#statusIcon').removeClass();
        $('#statusIcon').addClass("far fa-check-circle");
        $('#statusIcon').css("color", "var(--color-rebble-green)")
    } else {
        $('#statusText').text("Unpublished");
        $('#statusIcon').removeClass();
        $('#statusIcon').addClass("far fa-pause-circle");
        $('#statusIcon').css("color", "var(--color-rebble-amber)")
    }

    $('#externalStoreListing').attr("href", config.misc.appstoreUrl + data.id)

    $('.data-release-app').text(currentAppCache.title);

    $('#appinfo-main').addClass("animated fadeIn");
    $('#appinfo-main').removeClass("hidden");
    $('#appinfo-main-loader').addClass("hidden");

    //Update the app name in the lefthand menu if it doesn't match. This will happen if the user edits the listing and updates the app's name
    if ($('#appselector_' + data.id).data("title") != data.title) {
        $('#appselector_' + data.id).data("title",data.title);
        $(`#appselector_${data.id}_title`).text(data.title)
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
        showAlert("Connection Error", "Failed to talk to Rebble. Please check your internet connection. If the problem persists check <a target='_blank' href='https://bsky.app/profile/rebble.io'>Bluesky</a> or <a target='_blank' href='https://rebble.io/discord'>Discord</a>.")
    }

    if (statusCode == 500) {
        //Network error
        showAlert("Something went wrong", "Please retry. If the problem persists check the <a target='_blank' href='#'>rebble service status</a>, or ask on <a target='_blank' href='https://rebble.io/discord'>Discord</a>.")
    }

    if (statusCode == 400) {
        try {
            data = JSON.parse(data)
            if (data.hasOwnProperty("message")) {
                showAlert("Error", data.message)
            } else if (data.hasOwnProperty("error")) {
                showAlert("Error", data.error)
            } else {
                showAlert("Error","Something went wrong")
            }
        } catch (e) {
            showAlert("Error","Something went wrong")
        }
    }
    
    if (typeof cbo == "object") {
        $(cbo).text("Something went wrong")
    }
}

function rateLimitErrorHandler() {
    $('#rateLimitModal').modal("show");
}

function showAppUploadingModal() {
    $('.submitModal-section').addClass("hidden");
    $('#submitModal-uploading').removeClass("hidden");
    $('#submitModal').modal('show');
    clearTimeout(funMessageIntervalTimer)
    setTimeout(startFunMessageTimer, 2000);
}
function syncScreenshotButtonPreviews() {
    //If we refresh the page the file inputs retain the images, but the preview <img>s loose their values. This reloads those. Called by showPage()
    ["a","b","c","d"].forEach(e => {
        for (var i=1;i<6;i++) {
            var fileInput = document.getElementById(`i-screenshot-${e}-${i}-f`)
            if (fileInput != null && fileInput.files.length > 0) {
                document.getElementById(`i-screenshot-${e}-${i}-i`).src = window.URL.createObjectURL(fileInput.files[0])
            }
        }
    });
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

    if (
        $('#i-screenshot-a-1-f').prop('files')[0] == undefined &&
        $('#i-screenshot-b-1-f').prop('files')[0] == undefined &&
        $('#i-screenshot-c-1-f').prop('files')[0] == undefined &&
        $('#i-screenshot-d-1-f').prop('files')[0] == undefined &&
        $('#i-screenshot-e-1-f').prop('files')[0] == undefined
    ) {
        newAppValidationError("Provide at least one screenshot")
        return
    }

    //App specific fields
    if ($('#i-iswatchapp').prop("checked")) {

        if ($('#i-ban-f').prop('files')[0] == undefined) { newAppValidationError("A banner is required"); return }
        if ($('#i-icon-large-f').prop('files')[0] == undefined) { newAppValidationError("A large app icon required"); return }
        if ($('#i-icon-small-f').prop('files')[0] == undefined) { newAppValidationError("A small app icon required"); return }

    }

    if ($('#i-pbw').prop('files')[0] == undefined) { newAppValidationError("You need to include a .pbw file!"); return }

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
    
    var largeIcon = null;
    //Collect screenshots, store the first valid one for use as largeIcon if we're a watchface
    //if ($('#usePlatformSpecificScreenshots').prop("checked")) {

        //The weird order here is order of preference for largeIcon platform. Basalt looks best
        ["basalt","aplite", "diorite", "chalk", "emery"].forEach(platform => {
            var short = platform.substr(0,1);
            for (var i = 1; i < 6; i ++) {
                if ($(`#i-screenshot-${short}-${i}-f`).prop("files")[0] != undefined) { 
                    formData.append(`screenshot-${platform}-${i}`, $(`#i-screenshot-${short}-${i}-f`).prop("files")[0]); 
                    if (largeIcon === null && shinyNewApp.type == "watchface") { largeIcon = $(`#i-screenshot-${short}-${i}-f`).prop("files")[0] }
                }
            }
        })

    //append app-only fields
    if (shinyNewApp.type == "watchapp") {
        console.log("Is an app, yo")
        formData.append("large_icon", $('#i-icon-large-f').prop("files")[0])
        formData.append("small_icon", $('#i-icon-small-f').prop("files")[0])
        formData.append("timeline_enabled", $('#i-timeline').prop("checked"))
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
    tada();
}
function submitNewApp_ecb(data) {
    stopFunMessageTimer();
    $('.submitModal-section').addClass("hidden");
    $('#submitModal-error').removeClass("hidden");

    try {
        data = JSON.parse(data)
    } catch (e) {
        $('#submitModal-error-text').html("Something went wrong, please try again later. If the problem persists, ask on the <a target='_blank' href='https://rebble.io/discord'>Rebble Discord</a>.");
        var errorOutput = "Error:\n" + e + "\n\n Data:\n" + data
        $('#fatalErrorText').text(errorOutput)
        return
    }

    var nicerMessages = {
        "app.exists": "An application with the supplied UUID already exists. Did you mean to <a href='/release'>publish a new release?</a><br>If you are sure you have not uploaded this app already, please generate a new UUID in your appinfo.json.",
        "screenshots.illegalvalue": "One or more screenshots provided are an invalid format. Please use .jpg, .jpeg, .png or .gif"
    }

    var msg = nicerMessages.hasOwnProperty(data.e) ? nicerMessages[data.e] : data.error;

    if (nicerMessages.hasOwnProperty(data.e)) {
        $('#submitModal-error-text').html(msg)
    } else {
        $('#submitModal-error-text').text(msg)
    }
}
function newAppValidationError(txt) {
    $('#btn-newAppSubmit').text(txt);
    $('#btn-newAppSubmit').addClass("btn-danger");
    setTimeout(function() {
        $('#btn-newAppSubmit').text("Publish app to store");
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
function onboardNewDeveloper() {
    var newDevName = $('#newDevName').val();
    if (newDevName.length < 1) {
        showAlert("Failed to onboard user", "Developer name cannot be blank");
        return
    }

    $('#runNewDevOnboardBtn').text("Setting up account");
    var requestData = {
        name: newDevName
    }

    apiPOST(config.endpoint.base + config.path.onboard, JSON.stringify(requestData), onboardNewDeveloper_cb, onboardNewDeveloper_ecb)
}
function onboardNewDeveloper_cb() {
    showPage("home");
    getUserInfo();
}
function onboardNewDeveloper_ecb(data) {
    showAlert("Failed to onboard user", "Something went wrong. Please try again shortly.");
    $('#runNewDevOnboardBtn').text("Create Account");
}
function setSetting(setting, value) {
    debugLog("Setting " + setting + " to " + value);
    localStorage.setItem("SETTING_" + setting, value);
}
function getSetting(setting) {
  return localStorage.getItem("SETTING_" + setting);
}
function getSettingSafeBool(setting) {
    var setting = localStorage.getItem("SETTING_" + setting);
    return setting == "true"
}
function syncSettings() {
    // Set checkboxes to match their settings
    setting_to_checkbox_map = [
        {
            "setting": "disableWarnBeforeScreenshotDelete",
            "checkboxes": ["deleteImmediatelyCheckbox", "deleteImmediatelyCheckbox_settings"]
        }
    ]

    setting_to_checkbox_map.forEach((x, i) => {
        x.checkboxes.forEach((y,j) => {
            $('#' + y).prop("checked", getSettingSafeBool(x.setting))
        });
    });
}

// Helper functions

function apiPOST(rurl, postdata, callback, errorCallback, callBackObject, disableContentTypeSet = false, percentageCallback) {
	debugLog("POST: " + rurl + " - Data: " + postdata)
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() {
	if (xmlHttp.readyState == 4 && RegExp('20[01]').test(xmlHttp.status)) {
		if (callBackObject != null) {
			callback(xmlHttp.responseText, callBackObject);
		} else {
			callback(xmlHttp.responseText);
        }
	} else if (xmlHttp.readyState == 4) {
        if (xmlHttp.status == 429) {
            rateLimitErrorHandler()
        }
        if (errorCallback != null) {
	   	    errorCallback(xmlHttp.responseText, xmlHttp.status, callBackObject);
        }
	}
    }
    xmlHttp.onprogress = function (e) {
        if (e.lengthComputable && percentageCallback != null) {
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

function apiPUT(rurl, putdata, callback, errorCallback, callBackObject, disableContentTypeSet = false) {
	debugLog("PUT: " + rurl + " - Data: " + putdata)
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() {
	if (xmlHttp.readyState == 4 && RegExp('20[01]').test(xmlHttp.status)) {
		if (callBackObject != null) {
			callback(xmlHttp.responseText, callBackObject);
		} else {
			callback(xmlHttp.responseText);
        }
	} else if (xmlHttp.readyState == 4) {
        console.log("Error Code: " + xmlHttp.status)
        if (xmlHttp.status == 429) {
            rateLimitErrorHandler()
        } 
        if (errorCallback != null) {
            errorCallback(xmlHttp.responseText, xmlHttp.status, callBackObject);
       	}
	}
    }
    xmlHttp.open("PUT", rurl, true);
    if (! disableContentTypeSet) {
        xmlHttp.setRequestHeader("Content-Type", "application/json");
    }
    if (getUserToken() != null) {
      xmlHttp.setRequestHeader("Authorization", "Bearer " + getUserToken());
    }
    xmlHttp.send(putdata);
}

function apiGET(url, callback, errorCallback, callBackObject) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && RegExp('20[01]').test(xmlHttp.status)) {
        if (callBackObject != null) {
          callback(xmlHttp.responseText, callBackObject);
        } else {
          callback(xmlHttp.responseText);
        }
        console.log(url);
  
      } else if (xmlHttp.readyState == 4) {
        if (xmlHttp.status == 429) {
            rateLimitErrorHandler()
        } 
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

function apiDELETE(url, callback, errorCallback, callBackObject) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && RegExp('20[01]').test(xmlHttp.status)) {
        if (callBackObject != null) {
          callback(xmlHttp.responseText, callBackObject);
        } else {
          callback(xmlHttp.responseText);
        }
        console.log(url);
  
      } else if (xmlHttp.readyState == 4) {
        if (xmlHttp.status == 429) {
            rateLimitErrorHandler()
        } 
        if (errorCallback != null) {
            errorCallback(xmlHttp.responseText, xmlHttp.status, callBackObject);
        }
      }
    }
    xmlHttp.open("DELETE", url, true);
    if (getUserToken() != null) {
      xmlHttp.setRequestHeader("Authorization", "Bearer " + getUserToken());
    }
    xmlHttp.send(null);
}
  
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

function getUserToken() {
    return localStorage.getItem("access_token");
}

function populateChangeLog() {
    apiGET('/res/js/release.json', populateChangeLog_cb, null);
}

function populateChangeLog_cb(releaseInfo) {
    var release = JSON.parse(releaseInfo)
    var lastSeenChangeLog = parseFloat(getSetting("changelog"));
    if (isNaN(lastSeenChangeLog)) {
        // If they don't have a setting, skip this announcement
        // We only want to notify existing users to new versions
        setSetting("changelog", release.version)
    }
    
    if (lastSeenChangeLog < release.version) {
        addNotification(release.logTitle, release.logMessage, function() {
            setSetting("changelog", release.version)
        })
    }

}

function friendlyTimeAgo(lc) {
    var then = new Date(lc);
    var now = new Date();
    var delta = now - then;
    var out = 99;
    var units = "??";
    delta = delta / 1000;
    if (delta < 60) {
        out = Math.floor(delta);
        units = "seconds"
    } else if (delta < 3600) {
        out = Math.floor(delta / 60);
        units = "minutes"
    } else if (delta < 86400) {
        out = Math.floor(delta / 3600)
        units = "hours"
    } else if (delta < 2592000) {
        out = Math.floor(delta / 86400)
        units = "days"
    } else if (delta < 31536000) {
        out = Math.floor(delta / 2592000)
        units = "months"
    } else {
        out = Math.floor(delta / 31536000)
        units = "years"
    }
    return out + " " + units + " ago";
}

function getScreenshotPlaceholderImagePath(platform) {
    // Accepts aplite, basalt etc as well as a, b etc
    platform = platform.substring(0,1).toLowerCase()
    const default_path = "/res/img/screenshotSquare.png" 
    const non_defaults = {
        "c": "/res/img/screenshotRound.png",
        "e": "/res/img/screenshotEmery.png"
    }
    let placeholder = (non_defaults.hasOwnProperty(platform)) ? non_defaults[platform] : default_path
    return placeholder
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
        updateProfileSubtitle();
     });

    $('.rbtype').on('click', function(e) {
        if ($('#i-iswatchface').prop("checked")) {
            $('#appCategory').addClass("hidden");
            $('#uses-timeline').addClass("hidden")
            $('#appIconContainer').addClass("hidden");
            $('.newappOrFace').text("Watchface");
        } else {
            $('#appCategory').removeClass("hidden");
            $('#uses-timeline').removeClass("hidden")
            $('#appIconContainer').removeClass("hidden");
            $('.newappOrFace').text("App")
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

    $('#deleteImmediatelyCheckbox').on('change', function(e) {
        var dwbsd = $('#deleteImmediatelyCheckbox').prop("checked");
        setSetting("disableWarnBeforeScreenshotDelete", dwbsd)
    })
    $('#deleteImmediatelyCheckbox_settings').on('change', function(e) {
        var dwbsd = $('#deleteImmediatelyCheckbox_settings').prop("checked");
        setSetting("disableWarnBeforeScreenshotDelete", dwbsd)
    })

    
    $(window).on('popstate', function() {
        // Back button pressed
        var page = window.location.pathname;
        showPage(page)
    });
    
    populateChangeLog();
    
    //Start up. Router and other special stuff runs on callback. Follow this.
    getUserInfo();

}


initDevPortal();
