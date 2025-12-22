
module.exports = {
    logErrorToFirebase: (JPS, error) => {
        JPS.firebase.database().ref('/serverError/' + Date.now()).update({
            error
        }, err => {
            if (err) {
                console.error("Writing error to firebase failed: ", err);
            }
        })
    }
}