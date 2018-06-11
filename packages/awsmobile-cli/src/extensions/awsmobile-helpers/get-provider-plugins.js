function getPlugins() {
    let providerDetailsList = [];
    let pluginConfig = {
        "providerPlugins": {
            "awsmobile-provider-cloudformation": {
                "name": "AWS Cloudformation",
                "path": "awsmobile-provider-cloudformation"
            }
        },
        "frontendPlugins": [],
        "defaultProviders": [
            "awsmobile-provider-cloudformation"
        ]
    };
    let providerPlugins = pluginConfig.defaultProviders;

    for (let i = 0; i < providerPlugins.length; i++) {
        let providerPluginDetail = pluginConfig.providerPlugins[providerPlugins[i]];
        providerPluginDetail.plugin = providerPlugins[i];
        providerDetailsList.push(providerPluginDetail);
    }
    return providerDetailsList;
}

module.exports = {
    getPlugins
}