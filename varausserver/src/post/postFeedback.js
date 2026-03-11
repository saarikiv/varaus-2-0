const { validateBody } = require('../helpers/validateBody');

exports.setApp = function(JPS) {

    //######################################################
    // POST: feedback
    //######################################################
    JPS.app.post('/feedback', JPS.authMiddleware, async (req, res) => {

        const now = Date.now();
        console.log("Feedback requested.", now);
        const post = req.body;
        console.log("POST:", post);

        const validationErrors = validateBody(post, [
            { field: 'current_user', type: 'string' },
            { field: 'feedback_message', type: 'string' }
        ]);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(', ') });
        }

        const feedbackMessage = post.feedback_message;

        const currentUserUID = req.auth.uid;
        const user = req.auth.user;

        console.log("User: ", currentUserUID, " requested feedback.");

        try {
            JPS.mailer.sendFeedback(user, feedbackMessage)
            JPS.mailer.sendThankyouForFeedback(user)
            res.status(200).json({ message: "Feedback sent ok." });
        } catch(err) {
            console.error("Feedback failed: ", err);
            res.status(500).json({
                error: "Feedback failed: " + err.toString()
            });
        }
    })
}
