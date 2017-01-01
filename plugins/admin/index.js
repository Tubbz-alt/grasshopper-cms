'use strict';

const path = require('path');

module.exports = loadAdmin;

function loadAdmin(app, express, pluginDir) {
    // This route should not be hard coded

    const pluginName = 'commerce';
    app.get([`/gh-admin/${pluginName}`, `/gh-admin/${pluginName}/`, `/gh-admin/${pluginName}/index.html`], render(pluginName));
    app.use('/gh-admin/commerce', express.static(pluginDir));
    app.use('/gh-admin/commerce', render(pluginName));
}

function render(pluginName) {
    return (req, res) => {
        res.locals = {
            pluginName
        };
        res.render(path.join(__dirname, 'plugin.view.pug'));
    };
}