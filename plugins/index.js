'use strict';

const cookieParser = require('cookie-parser');
const loadRoutes = require('./loadRoutes');
const BB = require('bluebird');
const path = require('path');
const atob = require('atob');

const adminSrcAssetsDir = path.join(__dirname, 'admin', 'src', 'public');
const adminDistAssetsDir = path.join(__dirname, 'admin', 'dist', 'public');
const globalAssetsDir = path.join(__dirname, 'public');

module.exports = startup;

/**
 * An array of npm module names to use as plugins
 * @param options.plugins
 * @returns {function(*=)}
 */
function startup(options) {

    options.adminMountPoint = options.adminMountPoint || '/admin';
    options.apiMountPoint = options.apiMountPoint || '/api';

    /**
     * grasshopper.authenticatedRequest
     * grasshopper.grasshopper
     * @param grasshopper
     */
    return grasshopper => {

        //set adminDir
        const template = require.resolve('./plugin.layout.pug');
        options.app.use(cookieParser());

        options.app.use(options.apiMountPoint, grasshopper.grasshopper.router);

        //set engine
        options.app.set('view engine', 'pug');

        // First load routes via the standard plugin system
        loadRoutes({
            app : options.app,
            express : options.express,
            grasshopperService : grasshopper,
            mountPath: options.apiMountPoint,
            plugins : options.plugins,
            adminMountPoint: options.adminMountPoint
        });
        // Then load legacy routes. These will be shadowed by the standard routes.
        options.app.use(options.adminMountPoint, options.express.static(globalAssetsDir));

        options.app.use(options.adminMountPoint, options.express.static(adminDistAssetsDir));
        options.app.use(options.adminMountPoint, options.express.static(adminSrcAssetsDir));

        // @TODO turn the admin into a regular plugin and load it via loadRoutes as the first plugin
        options.app.use(options.adminMountPoint, (req, res) => {

            let locals = {
                adminMountPoint: `${options.adminMountPoint}/`,
                pluginName: options.pluginName ?  `${options.pluginName}/` : '',
                mode: options.mode,
                ghaConfigs : {
                    apiEndpoint : options.apiMountPoint
                },
                curUser: {}
            };

            console.log('locals', locals.ghaConfigs);

            let authToken = req.cookies && req.cookies.authToken ? atob(req.cookies.authToken.split(' ')[1]) : '';

            grasshopper.grasshopper.core.request(authToken)
                .users
                .current()
                .then(function(reply) {
                    locals.curUser = reply;
                })
                .finally(function() {
                    // Render the legacy admin
                    res.render(template, locals);
                });
        });

        return grasshopper;
    };
}
