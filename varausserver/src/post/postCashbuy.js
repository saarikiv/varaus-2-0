exports.setApp = function(JPS) {

    //######################################################
    // POST: cashbuy, post the item being purchased
    //######################################################
    JPS.app.post('/cashbuy', (req, res) => {

        JPS.now = Date.now();
        console.log("Cashbuy requested.", JPS.now);
        JPS.body = '';
        req.on('data', (data) => {
            JPS.body += data;
            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (JPS.body.length > 1e6) req.connection.destroy();
        });
        req.on('end', () => {
            JPS.post = JSON.parse(JPS.body);
            JPS.forUserId = JPS.post.for_user;
            JPS.currentUserToken = JPS.post.current_user;
            JPS.shopItemKey = JPS.post.item_key;
            JPS.itemType = JPS.post.purchase_target;
            console.log("POST:", JPS.post);

            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
                .then(decodedToken => {
                    JPS.currentUserUID = decodedToken.uid || decodedToken.sub;
                    console.log("User: ", JPS.currentUserUID, " requested cashbuy for user: ", JPS.forUserId);
                    return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
                })
                .then(snapshot => {
                    JPS.user = snapshot.val()
                    JPS.user.key = snapshot.key;
                    return JPS.firebase.database().ref('/specialUsers/' + JPS.currentUserUID).once('value');
                })
                .then(snapshot => {
                    JPS.specialUser = snapshot.val()
                    if (JPS.specialUser.admin || JPS.specialUser.instructor) {
                        console.log("USER requesting cashpay is ADMIN or INSTRUCTOR");
                        return JPS.firebase.database().ref('/users/' + JPS.forUserId).once('value');
                    }
                    throw (new Error("Non admin or instructor user requesting cashbuy."))
                })
                .then(snapshot => {
                    JPS.forUser = snapshot.val()
                    JPS.forUser.key = snapshot.key;
                    switch (JPS.itemType) {
                        case "special":
                            return JPS.firebase.database().ref('/specialSlots/' + JPS.shopItemKey).once('value');
                        default:
                            return JPS.firebase.database().ref('/shopItems/' + JPS.shopItemKey).once('value');
                    }
                })
                .then(snapshot => {
                    JPS.shopItem = snapshot.val();

                    JPS.transaction = {
                            user: JPS.forUser.key,
                            shopItem: JPS.shopItem,
                            shopItemKey: JPS.shopItemKey,
                            error: {
                                code: 0
                            },
                            details: {
                                success: true,
                                transaction: {
                                    id: "myyjä: " + JPS.user.lastname,
                                    amount: JPS.shopItem.price.toString(),
                                    paymentInstrumentType: "cash",
                                    currencyIsoCode: "EUR"
                                }
                            }
                        }
                        //==================================
                        // Write the transaction to the database
                        //==================================
                        //calculate the expiry moment if type is count

                    if (JPS.shopItem.type === "count") {
                        JPS.shopItem.expires = JPS.timeHelper.shiftUntilEndOfDayMs(JPS.date.setTime(JPS.now + JPS.shopItem.expiresAfterDays * 24 * 60 * 60 * 1000));
                        JPS.shopItem.unusedtimes = JPS.shopItem.usetimes;
                        JPS.firebase.database().ref('/transactions/' + JPS.forUser.key + '/' + JPS.now)
                            .update(Object.assign(JPS.transaction, JPS.shopItem))
                            .then(() => {
                                console.log("Transaction saved: ", JPS.transaction, JPS.shopItem);
                                res.status(200).jsonp(JPS.transaction).end();
                                JPS.mailer.sendReceipt(JPS.forUser.email, JPS.transaction, JPS.now); //Send confirmation email
                            }).catch(err => {
                                throw (new Error(err.message + " " + err.code));
                            });
                    }
                    if (JPS.shopItem.type === "time") {
                        JPS.lastTimeUserHasValidUseTime = JPS.now;
                        JPS.firebase.database().ref('/transactions/' + JPS.forUser.key).once('value')
                            .then(snapshot => {
                                var one;
                                var all = snapshot.val();
                                for (one in all) {
                                    if (all[one].type === "time") {
                                        if (all[one].expires > JPS.lastTimeUserHasValidUseTime) {
                                            JPS.lastTimeUserHasValidUseTime = all[one].expires;
                                        }
                                    }
                                }
                                JPS.shopItem.expires = JPS.timeHelper.shiftUntilEndOfDayMs(JPS.date.setTime(JPS.lastTimeUserHasValidUseTime + JPS.shopItem.usedays * 24 * 60 * 60 * 1000));
                                return JPS.firebase.database().ref('/transactions/' + JPS.forUser.key + '/' + JPS.now)
                                    .update(Object.assign(JPS.transaction, JPS.shopItem))
                            })
                            .then(() => {
                                console.log("Transaction saved: ", JPS.transaction, JPS.shopItem);
                                res.status(200).jsonp(JPS.transaction).end();
                                JPS.mailer.sendReceipt(JPS.forUser.email, JPS.transaction, JPS.now); //Send confirmation email
                            })
                            .catch(err => {
                                console.error(err.message + " " + err.code)
                                throw (new Error(err.message + " " + err.code));
                            });
                    }
                    if(JPS.shopItem.type === "special"){
                      console.log("special slot purchase ok....");
                      JPS.shopItem.expires = 0;
                      JPS.firebase.database().ref('/transactions/' + JPS.forUser.key + '/' + JPS.now)
                          .update(Object.assign(JPS.transaction, JPS.shopItem))
                          .then(() => {
                            return JPS.firebase.database().ref('/scbookingsbyslot/' + JPS.shopItemKey + '/' + JPS.forUser.key)
                            .update({transactionReference: JPS.now})
                          })
                          .then(() => {
                            return JPS.firebase.database().ref('/scbookingsbyuser/' + JPS.forUser.key + '/' + JPS.shopItemKey)
                            .update({transactionReference: JPS.now, shopItem: JPS.shopItem})
                          })
                          .then(() => {
                              console.log("Transaction saved: ", JPS.transaction, JPS.shopItem);
                              res.status(200).jsonp(JPS.transaction).end();
                              JPS.mailer.sendReceipt(JPS.forUser.email, JPS.transaction, JPS.now); //Send confirmation email
                          }).catch(err => {
                              throw (new Error(err.message + " " + err.code));
                          });
                    }

                }).catch(err => {
                    console.error("Cashpay failde: ", err);
                    res.status(500).jsonp({
                        message: "Cashpay failde." + err.toString()
                    }).end(err);
                });
        })
    })
}
