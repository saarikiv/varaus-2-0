const { validateBody } = require('../helpers/validateBody');

exports.setApp = function(JPS) {

    //######################################################
    // POST: cashbuy, post the item being purchased
    //######################################################
    JPS.app.post('/cashbuy', JPS.authMiddleware, JPS.adminAuthMiddleware, async (req, res) => {

        const now = Date.now();
        console.log("Cashbuy requested.", now);
        const post = req.body;
        console.log("POST:", post);

        const validationErrors = validateBody(post, [
            { field: 'current_user', type: 'string' },
            { field: 'for_user', type: 'string' },
            { field: 'item_key', type: 'string' },
            { field: 'purchase_target', type: 'string' }
        ]);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(', ') });
        }

        const forUserId = post.for_user;
        const shopItemKey = post.item_key;
        const itemType = post.purchase_target;

        const currentUserUID = req.auth.uid;
        const user = req.auth.user;

        console.log("User: ", currentUserUID, " requested cashbuy for user: ", forUserId);
        console.log("USER requesting cashpay is ADMIN or INSTRUCTOR");

        try {
            const forUserSnapshot = await JPS.firebase.database().ref('/users/' + forUserId).once('value');
            const forUser = forUserSnapshot.val();
            forUser.key = forUserSnapshot.key;

            let shopItemSnapshot;
            switch (itemType) {
                case "special":
                    shopItemSnapshot = await JPS.firebase.database().ref('/specialSlots/' + shopItemKey).once('value');
                    break;
                default:
                    shopItemSnapshot = await JPS.firebase.database().ref('/shopItems/' + shopItemKey).once('value');
            }
            const shopItem = shopItemSnapshot.val();

            const transaction = {
                user: forUser.key,
                shopItem: shopItem,
                shopItemKey: shopItemKey,
                error: {
                    code: 0
                },
                details: {
                    success: true,
                    transaction: {
                        id: "myyjä: " + user.lastname,
                        amount: shopItem.price.toString(),
                        paymentInstrumentType: "cash",
                        currencyIsoCode: "EUR"
                    }
                }
            };

            //==================================
            // Write the transaction to the database
            //==================================
            if (shopItem.type === "count") {
                const expiryMs = now + shopItem.expiresAfterDays * 24 * 60 * 60 * 1000;
                shopItem.expires = JPS.timeHelper.shiftUntilEndOfDayMs(expiryMs);
                shopItem.unusedtimes = shopItem.usetimes;

                await JPS.firebase.database().ref('/transactions/' + forUser.key + '/' + now)
                    .update(Object.assign(transaction, shopItem));

                console.log("Transaction saved: ", transaction, shopItem);
                res.status(200).json(transaction);
                JPS.mailer.sendReceipt(forUser.email, transaction, now);
            }
            else if (shopItem.type === "time") {
                let lastTimeUserHasValidUseTime = now;
                const txSnapshot = await JPS.firebase.database().ref('/transactions/' + forUser.key).once('value');
                const all = txSnapshot.val();
                for (let one in all) {
                    if (all[one].type === "time") {
                        if (all[one].expires > lastTimeUserHasValidUseTime) {
                            lastTimeUserHasValidUseTime = all[one].expires;
                        }
                    }
                }
                const expiryMs = lastTimeUserHasValidUseTime + shopItem.usedays * 24 * 60 * 60 * 1000;
                shopItem.expires = JPS.timeHelper.shiftUntilEndOfDayMs(expiryMs);

                await JPS.firebase.database().ref('/transactions/' + forUser.key + '/' + now)
                    .update(Object.assign(transaction, shopItem));

                console.log("Transaction saved: ", transaction, shopItem);
                res.status(200).json(transaction);
                JPS.mailer.sendReceipt(forUser.email, transaction, now);
            }
            else if (shopItem.type === "special") {
                console.log("special slot purchase ok....");
                shopItem.expires = 0;

                await JPS.firebase.database().ref('/transactions/' + forUser.key + '/' + now)
                    .update(Object.assign(transaction, shopItem));

                await JPS.firebase.database().ref('/scbookingsbyslot/' + shopItemKey + '/' + forUser.key)
                    .update({transactionReference: now});

                await JPS.firebase.database().ref('/scbookingsbyuser/' + forUser.key + '/' + shopItemKey)
                    .update({transactionReference: now, shopItem: shopItem});

                console.log("Transaction saved: ", transaction, shopItem);
                res.status(200).json(transaction);
                JPS.mailer.sendReceipt(forUser.email, transaction, now);
            }
        } catch (err) {
            console.error("Cashpay failed: ", err);
            res.status(500).json({
                error: "Cashpay failed: " + err.toString()
            });
        }
    })
}
