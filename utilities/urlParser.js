/* get the crud Entity by url array[] */
function getCrudEntity(parsedUrl) {
    for (let i = 0; i < parsedUrl.length; i++) {
        if (parsedUrl[i].includes('-')) {
            let crudEntity = parsedUrl[i].split('-');
            return crudEntity[0]
        }
    }
    return null;
}

/* parse the url to determine if it's an CRUD call
    * @param {string} url
    * @return {string} parsedCrudEntity if the url is a CRUD call
*/
const parseCrudEntity = (url) => {
    if (url.includes('crud')) {
        const parsedUrl = url.split('/');
        if (parsedUrl.length > 0) {
            let parsedCrudEntity = getCrudEntity(parsedUrl);
            console.log('pce', parsedCrudEntity);
            return parsedCrudEntity
        }
        return null;
    }
    return null;
}

module.exports = {
    parseCrudEntity
}
