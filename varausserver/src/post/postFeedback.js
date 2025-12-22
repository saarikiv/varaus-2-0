exports.setApp = function(JPS) {

    //######################################################
    // POST: cashbuy, post the item being purchased
    //######################################################
    JPS.app.post('/feedback', (req, res) => {

        JPS.now = Date.now();
        console.log("Feedback requested.", JPS.now);
        JPS.body = '';
        req.on('data', (data) => {
            JPS.body += data;
            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (JPS.body.length > 1e6) req.connection.destroy();
        });
        req.on('end', () => {
            JPS.post = JSON.parse(JPS.body);
            JPS.currentUserToken = JPS.post.current_user;
            JPS.feedbackMessage = JPS.post.feedback_message;
            console.log("POST:", JPS.post);

            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
                .then(decodedToken => {
                    JPS.currentUserUID = decodedToken.uid || decodedToken.sub;
                    console.log("User: ", JPS.currentUserUID, " requested feedback.");
                    return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
                })
                .then(snapshot => {
                    JPS.user = snapshot.val()
                    JPS.mailer.sendFeedback(JPS.user, JPS.feedbackMessage)
                    JPS.mailer.sendThankyouForFeedback(JPS.user)
                    res.status(200).jsonp("Feedback sent ok.").end()
                }).catch(err => {
                    console.error("Feedback failde: ", err);
                    res.status(500).jsonp({
                        message: "Feedback failde." + err.toString()
                    }).end(err);
                });
        })
    })
}
