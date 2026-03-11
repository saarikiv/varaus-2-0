const { validateBody } = require('../helpers/validateBody');

exports.setApp = function(JPS) {

    //######################################################
    // POST: notifydelayed
    //######################################################
    JPS.app.post('/notifydelayed', JPS.authMiddleware, async (req, res) => {

        const now = Date.now();
        console.log("notifydelayed requested.", now);
        const post = req.body;
        console.log("POST:", post);

        const validationErrors = validateBody(post, [
            { field: 'current_user', type: 'string' },
            { field: 'transaction', type: 'string' }
        ]);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(', ') });
        }

        const transaction = post.transaction;

        const currentUserUID = req.auth.uid;
        const user = req.auth.user;

        console.log("User: ", currentUserUID, " requested notifydelayed");

        try {
            JPS.mailer.sendNotifyDelayed(user, transaction)
            res.status(200).json({ message: "Notify sent ok." });
        } catch(err) {
            console.error("Notify failed: ", err);
            res.status(500).json({ error: "Notify failed: " + String(err) });
        }
    })
}
