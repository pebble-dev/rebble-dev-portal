config = {
    endpoint: {
    	base: "https://appstore-api.rebble.io",
    	ssoLogout: "https://auth.rebble.io/auth/logout?from=dev_portal"
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
	assetBase: "https://assets2.rebble.io/",
        screenshotAsset: "https://assets2.rebble.io/144x168/",
        screenshotAssetRound: "https://assets2.rebble.io/180x180/",
        bannerAsset: "https://assets2.rebble.io/720x320/",
        developerUrl: "https://apps.rebble.io/en_US/developer/",
        forumBaseUrl: "https://forum.rebble.io"
    }
}
