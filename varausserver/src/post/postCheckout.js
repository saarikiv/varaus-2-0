const { validateBody } = require('../helpers/validateBody');

exports.setApp = function(JPS) {

    //######################################################
    // POST: checkout, post the item being purchased
    //######################################################
    JPS.app.post('/checkout', JPS.authMiddleware, async (req, res) => {

        const now = Date.now();
        console.log("Checkout requested.", now);
        const post = req.body;
        console.log("POST:", post);

        const validationErrors = validateBody(post, [
            { field: 'current_user', type: 'string' },
            { field: 'item_key', type: 'string' }
        ]);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(', ') });
        }

        const shopItemKey = post.item_key;

        const currentUserUID = req.auth.uid;
        const user = req.auth.user;

        console.log("User: ", currentUserUID, " requested checkout.");

        try {
            const snapshot = await JPS.firebase.database().ref('/shopItems/' + shopItemKey).once('value');
            const shopItem = snapshot.val();

            const transaction = {
                user: user.key,
                shopItem: shopItem,
                shopItemKey: shopItemKey,
                error: {
                    code: 0
                },
                details: {
                    success: true,
                    transaction: {
                        amount: shopItem.price,
                        currencyIsoCode: "EUR",
                        id: now,
                        paymentInstrumentType: "invoice",
                        paymentMethod: "invoice"
                    }
                }
            };

            const expiryMs = now + shopItem.expiresAfterDays * 24 * 60 * 60 * 1000;
            shopItem.expires = JPS.timeHelper.shiftUntilEndOfDayMs(expiryMs);
            shopItem.unusedtimes = shopItem.usetimes;

            await JPS.firebase.database().ref('/transactions/' + user.key + '/' + now)
                .update(Object.assign(transaction, shopItem));

            console.log("Transaction saved: ", transaction, shopItem);
            res.status(200).json({ message: "Checkout successful." });
            JPS.mailer.sendReceipt(user.email, transaction, now);
        } catch (err) {
            console.error("Checkout failed: ", err);
            res.status(500).json({ error: "Checkout failed: " + String(err) });
        }
    })
}
