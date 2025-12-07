config = {
    endpoint: {
	    base: "http://127.0.0.1:5000",
        ssoLogout: "http://127.0.0.1:5002/auth/logout?from=dev_portal"
    //    base: "https://appstore-api.rebble.io",
    //    ssoLogout: "https://auth.rebble.io/auth/logout?from=dev_portal"
    },
    path: {
        aboutme: "/api/v0/users/me/developer",
        appInfo: "/api/v1/apps/id/",
        submitApp: "/api/dp/submit",
        editApp: "/api/dp/app/",
        onboard: "/api/dp/onboard",
        wizardUpdateDevName: "/api/dp/wizard/rename/",
        wizardUpdateDevID: "/api/dp/wizard/reassign/",
        wizardApp: "/api/dp/wizard/app/",
        downloadArchive: "/api/dp/archive/latest",
        forumUpdate: '/api/dp/app/{appID}/forum'
    },
    misc: {
        appstoreUrl: "https://apps.rebble.io/en_US/application/",
        assetBase: "http://127.0.0.1:8124/",
        screenshotAsset: "http://127.0.0.1:8124/144x168/",
        screenshotAssetRound: "http://127.0.0.1:8124/180x180/",
        bannerAsset: "http://127.0.0.1:8124/720x320/",
        developerUrl: "https://apps.rebble.io/en_US/developer/",
        forumBaseUrl: "https://forum.rebble.io"
    }
}
