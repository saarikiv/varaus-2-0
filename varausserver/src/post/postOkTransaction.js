const { validateBody } = require('../helpers/validateBody');

exports.setApp = function(JPS) {

    //######################################################
    // POST: okTransaction
    //######################################################
    JPS.app.post('/okTransaction', JPS.authMiddleware, JPS.adminAuthMiddleware, async (req, res) => {

        const now = Date.now();
        console.log("okTransaction requested.", now);
        const post = req.body;
        console.log("POST:", post);

        const validationErrors = validateBody(post, [
            { field: 'current_user', type: 'string' },
            { field: 'for_user', type: 'string' },
            { field: 'transaction', type: 'object' },
            { field: 'transaction.purchasetime', type: 'string' }
        ]);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(', ') });
        }

        const forUserId = post.for_user;
        const transactionToOk = post.transaction;

        const currentUserUID = req.auth.uid;
        console.log("User: ", currentUserUID, " requested okTransaction: ", forUserId + "/" + transactionToOk.purchasetime);
        console.log("USER requesting trx ok is ADMIN");

        try {
            await JPS.firebase.database()
                .ref('/transactions/' + forUserId + "/" + transactionToOk.purchasetime).update({paymentReceived: true});
            res.status(200).json({ message: "Transaction ok successfully." });
        } catch (err) {
            console.error("okTransaction failed: ", err);
            res.status(500).json({ error: "okTransaction failed: " + String(err) });
        }
    })
}
