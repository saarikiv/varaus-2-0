/**
 * Authentication middleware factory.
 * Returns Express middleware that verifies the Firebase ID token,
 * looks up the user from /users/{uid}, and attaches the result to req.auth.
 *
 * Token is extracted from req.body.current_user or req.body.user.
 *
 * @param {object} JPS - The global JPS object with firebase references.
 * @returns {function} Express middleware function.
 */
function createAuthMiddleware(JPS) {
    return function authMiddleware(req, res, next) {
        const currentUserToken = req.body.current_user || req.body.user;

        if (!currentUserToken) {
            return res.status(500).json({ error: "No authentication token provided." });
        }

        JPS.firebase.auth().verifyIdToken(currentUserToken)
            .then(decodedToken => {
                const uid = decodedToken.uid || decodedToken.sub;
                return JPS.firebase.database().ref('/users/' + uid).once('value')
                    .then(snapshot => {
                        if (snapshot.val() == null) {
                            throw new Error("User record does not exist in the database: " + uid);
                        }
                        const user = snapshot.val();
                        user.key = snapshot.key;
                        req.auth = { uid, user };
                        next();
                    });
            })
            .catch(err => {
                console.error("Authentication failed: ", err);
                res.status(500).json({ error: "Authentication failed: " + String(err) });
            });
    };
}

module.exports = { createAuthMiddleware };
