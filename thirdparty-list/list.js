const fs = require('fs');
const parseDomain = require('parse-domain');


// read the list from the file 
const known3pHostname = fs.readFileSync(__dirname + '/3plist.txt');


// put the elements in an object to garantee a O(1) access
// 
// @example : {googleAnalytics : googleAnalytics, gtm : gtm }
// 
const listof3P = {};

known3pHostname.toString().split('\n').forEach(domain => listof3P[domain] = domain);


/**
 * isAThirdPaty
 * test if a given element is in the object 
 * @param {string} hostname 
 * @returns {bool}
 */
const isAThirdPaty = hostname => listof3P[hostname] ? true : false;



/**
 * isThirdPartyURL
 * test if a given URL is a thrid party 
 * @param {string} hostname 
 * @returns {bool}
 */
exports.isThirdPartyURL = url => {
    
    const {
        domain,
        tld
    } = parseDomain(url);

    hostname = `${domain}.${tld}`;

    return isAThirdPaty(hostname);

}



/** 
 * classifyThirdParties
 * 
 * @param {array} hostnameList an array of hostnames 
 * @returns {object} with 2 keys shouldBeBlocked (array) shouldntBeBlock (array)
 */
exports.classifyThirdParties = hostnameList => {

    let shouldBeBlocked = new Set();
    let shouldntBeBlocked = new Set();

    for (let hostname of hostnameList) {

        const {
            domain,
            tld
        } = parseDomain(hostname);

        hostname = `${domain}.${tld}`;

        isAThirdPaty(hostname) ? shouldBeBlocked.add(hostname) : shouldntBeBlocked.add(hostname);

    }


    return {
        shouldBeBlocked: [...shouldBeBlocked],
        shouldntBeBlocked: [...shouldntBeBlocked]
    }
}