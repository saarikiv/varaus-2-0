const { validateBody } = require('../helpers/validateBody');

exports.setApp = function(JPS) {

    //######################################################
    // POST: removeTransaction
    //######################################################
    JPS.app.post('/removeTransaction', JPS.authMiddleware, JPS.adminAuthMiddleware, async (req, res) => {

        const now = Date.now();
        console.log("removeTransaction requested.", now);
        const post = req.body;
        console.log("POST:", post);

        const validationErrors = validateBody(post, [
            { field: 'current_user', type: 'string' },
            { field: 'for_user', type: 'string' },
            { field: 'transaction', type: 'object' },
            { field: 'transaction.purchasetime', type: 'string' },
            { field: 'transaction.type', type: 'string' }
        ]);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(', ') });
        }

        const forUserId = post.for_user;
        const transactionToRemove = post.transaction;

        const currentUserUID = req.auth.uid;
        console.log("User: ", currentUserUID, " requested removeTransaction: ", forUserId + "/" + transactionToRemove.purchasetime);
        console.log("USER requesting transaction remove is ADMIN");

        try {
            await JPS.firebase.database().ref('/transactions/' + forUserId + "/" + transactionToRemove.purchasetime).remove();
            if (transactionToRemove.type === 'special') {
                console.log("SPECIAL slot transation - remove bookings: ", transactionToRemove.shopItemKey, forUserId);
                await JPS.firebase.database().ref('/scbookingsbyslot/' + transactionToRemove.shopItemKey + "/" + forUserId).remove();
                await JPS.firebase.database().ref('/scbookingsbyuser/' + forUserId + "/" + transactionToRemove.shopItemKey).remove();
            }
            res.status(200).json({ message: "Transaction removed successfully." });
        } catch (err) {
            console.error("removeTransaction failed: ", err);
            res.status(500).json({ error: "removeTransaction failed: " + String(err) });
        }
    })
}
