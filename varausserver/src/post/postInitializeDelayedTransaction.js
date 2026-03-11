const { validateBody } = require('../helpers/validateBody');

exports.setApp = function(JPS) {

    //######################################################
    // POST: initializedelayedtransaction
    //######################################################
    JPS.app.post('/initializedelayedtransaction', JPS.authMiddleware, async (req, res) => {

        const now = Date.now();
        console.log("initializedelayedtransaction requested.", now);
        const post = req.body;
        console.log("POST:", post);

        const validationErrors = validateBody(post, [
            { field: 'current_user', type: 'string' },
            { field: 'item_key', type: 'string' },
            { field: 'purchase_target', type: 'string' }
        ]);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(', ') });
        }

        const shopItemKey = post.item_key;
        const itemType = post.purchase_target;

        const currentUserUID = req.auth.uid;
        const user = req.auth.user;

        console.log("User: ", currentUserUID, " requested initializedelayedtransaction.");

        try {
            let shopItemSnapshot;
            switch(itemType){
                case "special":
                    shopItemSnapshot = await JPS.firebase.database().ref('/specialSlots/' + shopItemKey).once('value');
                    break;
                default:
                    shopItemSnapshot = await JPS.firebase.database().ref('/shopItems/' + shopItemKey).once('value');
            }

            const shopItem = shopItemSnapshot.val();
            console.log("shopitem: ", shopItem);

            const transaction = {
                user: user.key,
                shopItem: shopItem,
                shopItemKey: shopItemKey,
                error: { code: 0 },
                details: "pending"
            };

            if (shopItem.type === "count") {
                const expiryMs = now + shopItem.expiresAfterDays * 24 * 60 * 60 * 1000;
                shopItem.expires = JPS.timeHelper.shiftUntilEndOfDayMs(expiryMs);
                shopItem.unusedtimes = shopItem.usetimes;
                const newRef = JPS.firebase.database().ref('/pendingtransactions/').push();
                await newRef.set({
                    transaction: transaction,
                    shopItem: shopItem,
                    user: user.key,
                    receiptEmail: user.email,
                    timestamp: now
                });
                console.log("Pending count transaction saved: ", newRef.key);
                res.status(200).json({ key: newRef.key });
            }
            else if (shopItem.type === "time") {
                console.log("time item process started.");
                let lastTimeUserHasValidUseTime = now;
                const txSnapshot = await JPS.firebase.database().ref('/transactions/' + user.key).once('value');
                if (txSnapshot.val() != null) {
                    console.log("Processing users previous transactions to find latest expiry.");
                    const all = txSnapshot.val();
                    for (let one in all) {
                        if (all[one].type === "time") {
                            if (all[one].expires > lastTimeUserHasValidUseTime) {
                                lastTimeUserHasValidUseTime = all[one].expires;
                                console.log("Found later expiry than now: ", lastTimeUserHasValidUseTime);
                            }
                        }
                    }
                }
                const expiryMs = lastTimeUserHasValidUseTime + shopItem.usedays * 24 * 60 * 60 * 1000;
                shopItem.expires = JPS.timeHelper.shiftUntilEndOfDayMs(expiryMs);
                console.log("This new time expires: ", shopItem.expires);
                const newRef = JPS.firebase.database().ref('/pendingtransactions/').push();
                await newRef.set({
                    transaction: transaction,
                    shopItem: shopItem,
                    receiptEmail: user.email,
                    user: user.key,
                    timestamp: now
                });
                console.log("Pending time transaction saved: ", newRef.key);
                res.status(200).json({ key: newRef.key });
            }
            else if (shopItem.type === "special") {
                console.log("special slot purchase....");
                shopItem.expires = 0;
                const newRef = JPS.firebase.database().ref('/pendingtransactions/').push();
                await newRef.set({
                    transaction: transaction,
                    shopItem: shopItem,
                    user: user.key,
                    receiptEmail: user.email,
                    timestamp: now
                });
                console.log("Pending special transaction saved: ", newRef.key);
                res.status(200).json({ key: newRef.key });
            }
        } catch (err) {
            console.error("Initialize delayed transaction failed: ", err);
            res.status(500).json({
                error: "Initialize delayed transaction failed: " + err.toString()
            });
        }
    })
}
