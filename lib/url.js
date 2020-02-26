'use strict';

/**
 * Checks if the url is in scope
 * @param URL url
 */
module.exports = (url) => {
    if (!url) {
        return false;
    }
    if (url.pathname && url.pathname.startsWith('#')) {
        return false;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return false;
    }

    if (!!global.argv && !!global.argv._.length) {
        let inScope = false;

        global.argv._.forEach((link) => {
            link = new URL(link);

            if ((new RegExp(`^${link.pathname.replace('/', '\/')}`)).test(url.pathname)) {
                inScope = true;
            }
        });

        if (!inScope) {
            return false;
        }
    }

    if (url.pathname.startsWith('/') && !url.pathname.startsWith('//')) {
        return true;
    }

    return false;
};
