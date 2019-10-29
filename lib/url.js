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
    if (url.pathname.startsWith('/') && !url.pathname.startsWith('//')) {
        return true;
    }
    return false;
};