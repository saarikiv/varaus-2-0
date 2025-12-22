exports.setApp = function(JPS) {

    //######################################################
    // POST: cashbuy, post the item being purchased
    //######################################################
    JPS.app.post('/okTransaction', (req, res) => {

        JPS.now = Date.now();
        console.log("okTransaction requested.", JPS.now);
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
            JPS.forUserId = JPS.post.for_user;
            JPS.transactionToOk = JPS.post.transaction;
            console.log("POST:", JPS.post);

            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
                .then(decodedToken => {
                    JPS.currentUserUID = decodedToken.uid || decodedToken.sub;
                    console.log("User: ", JPS.currentUserUID, " requested okTransaction: ", JPS.forUserId + "/" + JPS.transactionToOk.purchasetime);
                    return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
                })
                .then(snapshot => {
                    JPS.user = snapshot.val()
                    JPS.user.key = snapshot.key;
                    return JPS.firebase.database().ref('/specialUsers/' + JPS.currentUserUID).once('value');
                })
                .then(snapshot => {
                    JPS.specialUser = snapshot.val()
                    if (JPS.specialUser.admin) {
                        console.log("USER requesting trx ok is ADMIN");
                        return JPS.firebase.database()
                        .ref('/transactions/' + JPS.forUserId + "/" + JPS.transactionToOk.purchasetime).update({paymentReceived : true});
                    }
                    throw (new Error("Non admin or instructor user requesting cashbuy."))
                })
                .then(() => {
                    res.status(200).jsonp("Transaction ok succesfully.").end();
                }).catch(err => {
                    console.error("okTransaction failde: ", err);
                    res.status(500).jsonp("okTransaction failde." + String(err)).end();
                });
        })
    })
}
