export function getCurrentBaseUrl(loc) {
    let arrayOf = loc.split('/')
    return arrayOf[0] + '//' + arrayOf[2];
}

