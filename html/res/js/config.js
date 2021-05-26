config = {
    endpoint: {
        base: "https://appstore-api.rebble.watch",
        ssoLogout: "https://auth.rebble.watch/auth/logout"
    },
    path: {
        aboutme: "/api/v0/users/me/developer",
        appInfo: "/api/v1/apps/id/",
        submitApp: "/api/v2/submit",
        editApp: "/api/v2/app/",
        onboard: "/api/v2/onboard",
        wizardUpdateDevName: "/api/v2/wizard/rename/",
        wizardApp: "/api/v2/wizard/app/"
    },
    misc: {
        //appstoreUrl: "https://apps.rebble.watch/app/",
        appstoreUrl: "https://apps.rebble.io/en_US/application/",
        screenshotAsset: "https://assets2.rebble.io/144x168/",
        screenshotAssetRound: "https://assets2.rebble.io/180x180/"
    }
}