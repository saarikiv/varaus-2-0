exports.setApp = function(JPS) {

    //######################################################
    // POST: 
    //######################################################
    JPS.app.post('/initializedelayedtransaction', (req, res) => {

        JPS.now = Date.now();
        console.log("initializedelayedtransaction requested.", JPS.now);
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
            JPS.shopItemKey = JPS.post.item_key;
            JPS.itemType = JPS.post.purchase_target;
            console.log("POST:", JPS.post);

            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
                .then(decodedToken => {
                    JPS.currentUserUID = decodedToken.uid || decodedToken.sub;
                    console.log("User: ", JPS.currentUserUID, " requested initializedelayedtransaction.");
                    return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
                })
                .then(snapshot => {
                    if(snapshot.val() != null){
                        JPS.user = snapshot.val()
                        JPS.user.key = snapshot.key;
                        switch(JPS.itemType){
                        case "special":
                            return JPS.firebase.database().ref('/specialSlots/' + JPS.shopItemKey).once('value');
                        default:
                            return JPS.firebase.database().ref('/shopItems/' + JPS.shopItemKey).once('value');
                        }
                    } else {
                        throw(new Error("User was not found in the database: " + JPS.currentUserUID))
                    }

                })
                .then(snapshot => {
                    JPS.shopItem = snapshot.val();
                    console.log("shopitem: ",JPS.shopItem );
                    JPS.transaction = {
                            user: JPS.user.key,
                            shopItem: JPS.shopItem,
                            shopItemKey: JPS.shopItemKey,
                            error: { code: 0 },
                            details: "pending"
                        }
                        //==================================
                        // Write the transaction to the database
                        //==================================
                        //calculate the expiry moment if type is count
                    if (JPS.shopItem.type === "count") {
                        JPS.shopItem.expires = JPS.timeHelper.shiftUntilEndOfDayMs(JPS.date.setTime(JPS.now + JPS.shopItem.expiresAfterDays * 24 * 60 * 60 * 1000));
                        JPS.shopItem.unusedtimes = JPS.shopItem.usetimes;
                        const newRef = JPS.firebase.database().ref('/pendingtransactions/').push();
                        newRef.set({
                            transaction: JPS.transaction,
                            shopItem: JPS.shopItem,
                            user: JPS.user.key,
                            receiptEmail: JPS.user.email,
                            timestamp: JPS.now
                        }).then(() => {
                            console.log("Pending count transaction saved: ", newRef.key);
                            res.status(200).jsonp(newRef.key).end();
                        }).catch(err => {
                            console.error("COUNT push failed: ", err);
                            throw (new Error("COUNT push failed: " + err.message));
                        });
                    }
                    if (JPS.shopItem.type === "time") {
                        console.log("time item process started.");
                        JPS.lastTimeUserHasValidUseTime = JPS.now;
                        JPS.firebase.database().ref('/transactions/' + JPS.user.key).once('value')
                            .then(snapshot => {
                                if(snapshot.val() != null){ //User has previous transactions - find the latest expiry
                                    console.log("Processing users previous transactions to find latest expiry.");
                                    var one;
                                    var all = snapshot.val();
                                    for (one in all) {
                                        if (all[one].type === "time") {
                                            if (all[one].expires > JPS.lastTimeUserHasValidUseTime) {
                                                JPS.lastTimeUserHasValidUseTime = all[one].expires;
                                                console.log("Found later expiry than now: ", JPS.lastTimeUserHasValidUseTime);
                                            }
                                        }
                                    }
                                }
                                JPS.shopItem.expires = JPS.timeHelper.shiftUntilEndOfDayMs(JPS.date.setTime(JPS.lastTimeUserHasValidUseTime + JPS.shopItem.usedays * 24 * 60 * 60 * 1000));
                                console.log("This new time expires: ", JPS.shopItem.expires);
                                const newRef = JPS.firebase.database().ref('/pendingtransactions/').push();
                                return newRef.set({
                                    transaction: JPS.transaction,
                                    shopItem: JPS.shopItem,
                                    receiptEmail: JPS.user.email,
                                    user: JPS.user.key,
                                    timestamp: JPS.now
                                }).then(() => {
                                    console.log("Pending time transaction saved: ", newRef.key);
                                    res.status(200).jsonp(newRef.key).end();
                                });
                            }).catch(err => {
                                console.error("TIME push failed: ", err);
                                throw (new Error("TIME push failed: " + err.message));
                            });
                    }
                    if(JPS.shopItem.type === "special"){
                        console.log("special slot purchase....");
                        JPS.shopItem.expires = 0;
                        const newRef = JPS.firebase.database().ref('/pendingtransactions/').push();
                        newRef.set({
                            transaction: JPS.transaction,
                            shopItem: JPS.shopItem,
                            user: JPS.user.key,
                            receiptEmail: JPS.user.email,
                            timestamp: JPS.now
                        }).then(() => {
                            console.log("Pending special transaction saved: ", newRef.key);
                            res.status(200).jsonp(newRef.key).end();
                        }).catch(err => {
                            console.error("SPECIAL push failed: ", err);
                            throw (new Error("SPECIAL push failed: " + err.message));
                        });
                    }

                }).catch(err => {
                    console.error("Initialize delayed transaction failed: ", err);
                    res.status(500).jsonp({
                        message: "Initialize delayed transaction failed: " + err.toString()
                    }).end();
                });
            })
        })
}
