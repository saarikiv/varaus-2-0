const { validateBody } = require('../helpers/validateBody');

exports.setApp = function(JPS) {

    //######################################################
    // POST: approveincomplete
    //######################################################
    JPS.app.post('/approveincomplete', JPS.authMiddleware, JPS.adminAuthMiddleware, async (req, res) => {

        const now = Date.now();
        console.log("approveincomplete requested.", now);
        const post = req.body;
        console.log("POST:", post);

        const validationErrors = validateBody(post, [
            { field: 'current_user', type: 'string' },
            { field: 'pending_transaction_id', type: 'string' }
        ]);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(', ') });
        }

        const pendingTransactionKey = post.pending_transaction_id;

        const currentUserUID = req.auth.uid;
        const user = req.auth.user;

        console.log("User: ", currentUserUID, " requested approveincomplete for trx: ", pendingTransactionKey);
        console.log("USER requesting approveincomplete is ADMIN or INSTRUCTOR");

        try {
            const status = await JPS.pendingTransactionsHelper.completePendingTransaction(JPS, pendingTransactionKey, user.lastname, "Admin", null);
            console.log("Status from completing pending transaction: ", status);
            res.status(200).json({ message: "Approve incomplete completed successfully." });
        } catch (error) {
            console.error("Complete pending transaction request failed: ", error);
            res.status(500).json({ error: "approveincomplete failed: " + String(new Error("Complete pending transaction request failed: " + error.message)) });
        }
    })
}
