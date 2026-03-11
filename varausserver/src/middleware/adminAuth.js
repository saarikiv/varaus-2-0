/**
 * Admin/Instructor authorization middleware factory.
 * Requires the auth middleware to have run first (req.auth must exist).
 * Looks up /specialUsers/{uid} and checks for admin or instructor flags.
 *
 * @param {object} JPS - The global JPS object with firebase references.
 * @returns {function} Express middleware function.
 */
function createAdminAuthMiddleware(JPS) {
    return function adminAuthMiddleware(req, res, next) {
        if (!req.auth || !req.auth.uid) {
            return res.status(500).json({ error: "Authentication required before admin check." });
        }

        const uid = req.auth.uid;

        JPS.firebase.database().ref('/specialUsers/' + uid).once('value')
            .then(snapshot => {
                const specialUser = snapshot.val();
                if (specialUser && (specialUser.admin || specialUser.instructor)) {
                    req.auth.specialUser = specialUser;
                    next();
                } else {
                    res.status(500).json({ error: "Non admin or instructor user requesting privileged endpoint." });
                }
            })
            .catch(err => {
                console.error("Admin authorization check failed: ", err);
                res.status(500).json({ error: "Admin authorization check failed: " + String(err) });
            });
    };
}

module.exports = { createAdminAuthMiddleware };
