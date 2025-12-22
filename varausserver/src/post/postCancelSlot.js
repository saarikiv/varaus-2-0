exports.setApp = function(JPS) {

    //######################################################
    // POST: cancelSlot
    //######################################################

    JPS.app.post('/cancelSlot', (req, res) => {
        JPS.now = Date.now();
        console.log("POST: cancelSlot", JPS.now);
        JPS.body = '';
        req.on('data', (data) => {
            JPS.body += data;
            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (JPS.body.length > 1e6) req.connection.destroy();
        });
        req.on('end', () => {
            JPS.post = JSON.parse(JPS.body);
            console.log("POST:", JPS.post);
            JPS.currentUserToken = JPS.post.user;
            JPS.slotInfo = JPS.post.slotInfo;
            JPS.cancelItem = JPS.post.cancelItem;
            JPS.txRef = JPS.post.transactionReference;
            JPS.timezoneOffset = JPS.post.timezoneOffset;

            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
                .then(decodedToken => {
                    JPS.currentUserUID = decodedToken.uid || decodedToken.sub;
                    console.log("User: ", JPS.currentUserUID, " requested cancel slot.");
                    return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
                })
                .then(snapshot => {
                    if (snapshot.val() != null) {
                        JPS.user = snapshot.val();
                        JPS.user.key = snapshot.key;
                        console.log("USER:", JPS.user);
                        return JPS.firebase.database().ref('/bookingsbyslot/' + JPS.slotInfo.key + '/' + JPS.cancelItem + '/' + JPS.user.key).once('value');
                    } else {
                        throw (new Error("User record does not exist in the database: " + JPS.currentUserUID))
                    }
                })
                .then(snapshot => {
                    if (snapshot.val() == null) {
                        throw (new Error("Booking by-SLOT does not exist in the database."))
                    }
                    return JPS.firebase.database().ref('/bookingsbyuser/' + JPS.user.key + '/' + JPS.slotInfo.key + '/' + JPS.cancelItem).once('value');
                })
                .then(snapshot => {
                    if (snapshot.val() == null) {
                        throw (new Error("Booking by-USER does not exist in the database."))
                    }
                    return JPS.firebase.database().ref('/bookingsbyuser/' + JPS.user.key + '/' + JPS.slotInfo.key + '/' + JPS.cancelItem).remove();
                })
                .then(() => {
                    return JPS.firebase.database().ref('/bookingsbyslot/' + JPS.slotInfo.key + '/' + JPS.cancelItem + '/' + JPS.user.key).remove();
                })
                .then(() => {
                    console.log("Transaction reference: ", JPS.txRef)
                    if (JPS.txRef != 0) {
                        //Give back one use time for the user
                        JPS.firebase.database().ref('/transactions/' + JPS.user.key + '/' + JPS.txRef).once('value')
                            .then(snapshot => {
                                if (snapshot.val() == null) {
                                    throw (new Error("Transaction not found in the DB: TX:" + JPS.user.key + "/" + JPS.txRef));
                                }
                                JPS.unusedtimes = snapshot.val().unusedtimes;
                                JPS.unusedtimes++;
                                return JPS.firebase.database().ref('/transactions/' + JPS.user.key + '/' + JPS.txRef).update({
                                    unusedtimes: JPS.unusedtimes
                                })
                            })
                            .then(err => {
                                if (err) {
                                    throw (new Error(err.message + " " + err.code));
                                }
                                res.status(200).jsonp({
                                    message: "Cancellation COUNT was succesfull."
                                }).end();
                                JPS.mailer.sendCancellationCount(JPS.user.email, JPS.slotInfo, JPS.cancelItem); //Send confirmation email
                            }).catch(err => {
                                throw (new Error(err.message + " " + err.code));
                            })
                    } else {
                        res.status(200).jsonp({
                            message: "Cancellation TIME was succesfull."
                        }).end();
                        JPS.mailer.sendCancellationTime(JPS.user.email, JPS.slotInfo, JPS.cancelItem); //Send confirmation email
                    }
                })
                .catch(err => {
                    console.error("POST Cancel Slot failed: ", err);
                    res.status(500).jsonp({
                        message: "POST Cancel Slot failed:" + err.toString()
                    }).end();
                });
        })
    })
}
