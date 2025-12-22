exports.setApp = function(JPS) {

    //######################################################
    // POST: checkout, post the item being purchased
    // This post will read the shop item and find out the token + price associated with it
    // It then creates payment transaction and inserts the payment data to the firebase
    // Finally adds to the users entitlement new tokens to use.
    //######################################################
    JPS.app.post('/checkout', (req, res) => {

        JPS.now = Date.now();
        console.log("Checkout requested.", JPS.now);
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
            console.log("POST:", JPS.post);

            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
                .then(decodedToken => {
                    JPS.currentUserUID = decodedToken.uid || decodedToken.sub;
                    console.log("User: ", JPS.currentUserUID, " requested checkout.");
                    return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
                })
                .then(snapshot => {
                    if(snapshot.val() != null){
                        JPS.user = snapshot.val()
                        JPS.user.key = snapshot.key;
                        return JPS.firebase.database().ref('/shopItems/' + JPS.shopItemKey).once('value');
                    }
                    throw( new Error("User was not found in db: " + JPS.currentUserUID) );

                })
                .then(snapshot => {
                    JPS.shopItem = snapshot.val();
                    JPS.transaction = {
                            user: JPS.user.key,
                            shopItem: JPS.shopItem,
                            shopItemKey: JPS.shopItemKey,
                            error: {
                                code: 0
                            },
                            details: {
                                success: true,
                                    transaction: {
                                    amount: JPS.shopItem.price,
                                    currencyIsoCode: "EUR",
                                    id: JPS.now,
                                    paymentInstrumentType: "invoice",
                                    paymentMethod: "invoice"
                                    }
                        }
                    }
                    JPS.shopItem.expires = JPS.timeHelper.shiftUntilEndOfDayMs(JPS.date.setTime(JPS.now + JPS.shopItem.expiresAfterDays * 24 * 60 * 60 * 1000));
                    JPS.shopItem.unusedtimes = JPS.shopItem.usetimes;
                    JPS.firebase.database().ref('/transactions/' + JPS.user.key + '/' + JPS.now)
                        .update(Object.assign(JPS.transaction, JPS.shopItem))
                        .then(() => {
                            console.log("Transaction saved: ", JPS.transaction, JPS.shopItem);
                            res.status(200).jsonp("Checkout successful.").end();
                            JPS.mailer.sendReceipt(JPS.user.email, JPS.transaction, JPS.now); //Send confirmation email
                        }).catch(err => {
                            throw (new Error(err.message + " " + err.code));
                        });
                }).catch(err => {
                    console.error("Checkout failde: ", err);
                    res.status(500).jsonp("Checkout failde." + String(err)).end();
                });
        })
    })
}
