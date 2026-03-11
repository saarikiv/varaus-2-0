const { validateBody } = require('../helpers/validateBody');

exports.setApp = function(JPS) {

    //######################################################
    // POST: notifyRegistration
    //######################################################
    JPS.app.post('/notifyRegistration', JPS.authMiddleware, async (req, res) => {

        const now = Date.now();
        console.log("notifyRegistration requested.", now);
        const post = req.body;
        console.log("POST:", post);

        const validationErrors = validateBody(post, [
            { field: 'current_user', type: 'string' }
        ]);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(', ') });
        }

        const currentUserUID = req.auth.uid;
        const user = req.auth.user;

        console.log("User: ", currentUserUID, " requested notifyRegistration.");

        try {
            JPS.mailer.sendRegistration(user)
            res.status(200).json({ message: "Notification sent ok." });
        } catch(err) {
            console.error("Notification failed: ", err);
            res.status(500).json({ error: "Notification failed: " + String(err) });
        }
    })
}
