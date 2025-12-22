exports.setApp = function(JPS) {

    //######################################################
    // POST: cashbuy, post the item being purchased
    //######################################################
    JPS.app.post('/removeTransaction', (req, res) => {

        JPS.now = Date.now();
        console.log("removeTransaction requested.", JPS.now);
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
            JPS.transactionToRemove = JPS.post.transaction;
            console.log("POST:", JPS.post);

            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
                .then(decodedToken => {
                    JPS.currentUserUID = decodedToken.uid || decodedToken.sub;
                    console.log("User: ", JPS.currentUserUID, " requested removeTransaction: ", JPS.forUserId + "/" + JPS.transactionToRemove.purchasetime);
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
                        console.log("USER requesting transaction remove is ADMIN");
                        return JPS.firebase.database().ref('/transactions/' + JPS.forUserId + "/" + JPS.transactionToRemove.purchasetime).remove();
                    }
                    throw (new Error("Non admin or instructor user requesting cashbuy."))
                })
                .then(() => {
                    if(JPS.transactionToRemove.type === 'special'){
                        console.log("SPECIAL slot transation - remove bookings: ", JPS.transactionToRemove.shopItemKey, JPS.forUserId);
                        JPS.firebase.database().ref('/scbookingsbyslot/' + JPS.transactionToRemove.shopItemKey + "/" + JPS.forUserId).remove();
                        JPS.firebase.database().ref('/scbookingsbyuser/' + JPS.forUserId + "/" + JPS.transactionToRemove.shopItemKey).remove();
                    }
                    res.status(200).jsonp("Transaction removed succesfully.").end();
                }).catch(err => {
                    console.error("removeTransaction failde: ", err);
                    res.status(500).jsonp("removeTransaction failde." + String(err)).end();
                });
        })
    })
}
