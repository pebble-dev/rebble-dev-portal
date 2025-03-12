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
        wizardApp: "/api/dp/wizard/app/"
    },
    misc: {
        appstoreUrl: "https://apps.rebble.io/en_US/application/",
        assetBase: "https://assets2.rebble.io/",
        screenshotAsset: "https://assets2.rebble.io/144x168/",
        screenshotAssetRound: "https://assets2.rebble.io/180x180/",
        bannerAsset: "https://assets2.rebble.io/720x320/",
        developerUrl: "https://apps.rebble.io/en_US/developer/"
    }
}

// We add the FullStory snippet here, because it is part of the
// Rebble-specific configuration.  If you want to run your own app store,
// you probably should not use our FullStory snippet...
window['_fs_debug'] = false;
window['_fs_host'] = 'staging.fullstory.com';
window['_fs_script'] = 'edge.staging.fullstory.com/s/fs.js';
window['_fs_org'] = '6X1T';
window['_fs_namespace'] = 'FS';
(function(m,n,e,t,l,o,g,y){
    if (e in m) {if(m.console && m.console.log) { m.console.log('FullStory namespace conflict. Please set window["_fs_namespace"].');} return;}
    g=m[e]=function(a,b,s){g.q?g.q.push([a,b,s]):g._api(a,b,s);};g.q=[];
    o=n.createElement(t);o.async=1;o.crossOrigin='anonymous';o.src='https://'+_fs_script;
    y=n.getElementsByTagName(t)[0];y.parentNode.insertBefore(o,y);
    g.identify=function(i,v,s){g(l,{uid:i},s);if(v)g(l,v,s)};g.setUserVars=function(v,s){g(l,v,s)};g.event=function(i,v,s){g('event',{n:i,p:v},s)};
    g.anonymize=function(){g.identify(!!0)};
    g.shutdown=function(){g("rec",!1)};g.restart=function(){g("rec",!0)};
    g.log = function(a,b){g("log",[a,b])};
    g.consent=function(a){g("consent",!arguments.length||a)};
    g.identifyAccount=function(i,v){o='account';v=v||{};v.acctId=i;g(o,v)};
    g.clearUserCookie=function(){};
    g.setVars=function(n, p){g('setVars',[n,p]);};
    g._w={};y='XMLHttpRequest';g._w[y]=m[y];y='fetch';g._w[y]=m[y];
    if(m[y])m[y]=function(){return g._w[y].apply(this,arguments)};
    g._v="1.3.0";
})(window,document,window['_fs_namespace'],'script','user');
