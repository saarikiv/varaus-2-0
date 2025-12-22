exports.setApp = function(JPS) {

    //######################################################
    // POST: 
    //######################################################
    JPS.app.post('/cancelpaytrailtransaction', (req, res) => {

        JPS.now = Date.now();
        console.log("cancelpaytrailtransaction requested.", JPS.now);
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
            JPS.transactionToCancel = JPS.post.pending_transaction;
            console.log("POST:", JPS.post);

            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
                .then(decodedToken => {
                    JPS.currentUserUID = decodedToken.uid || decodedToken.sub;
                    console.log("User: ", JPS.currentUserUID, " requested cancelpaytrailtransaction.");
                    return JPS.firebase.database().ref('/pendingtransactions/' + JPS.transactionToCancel).remove();
                })
                .then( () => {
                    res.status(200).jsonp("Cancel successful.").end();
                }).catch(err => {
                    console.error("Cancel Pay Trai transaction failed: ", err);
                    res.status(500).jsonp({
                        message: "Cancel Pay Trai transaction failde." + err.toString()
                    }).end(err);
                });
            })
        })
}
