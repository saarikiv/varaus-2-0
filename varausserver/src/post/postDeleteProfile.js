// Database rules verification:
// The existing rules in database.rules.json grant varausserver (via databaseAuthVariableOverride: { uid: "varausserver" })
// write access to /users, /bookingsbyuser, /transactions, and /specialUsers.
// The .remove() operation is a write operation, so no rule changes are needed.

/**
 * Determines whether a booking is active (its slot end time is in the future).
 * A booking's slot end time = booking.slotTime + slotInfo.end - slotInfo.start
 *
 * @param {object} booking - The booking object, must have a numeric `slotTime` property.
 * @param {object} slotInfo - The slot definition, must have numeric `start` and `end` properties.
 * @param {number} now - The current timestamp in milliseconds.
 * @returns {boolean} True if the booking is active (slot end time > now).
 */
function isBookingActive(booking, slotInfo, now) {
    const slotEndTime = booking.slotTime + slotInfo.end - slotInfo.start;
    return slotEndTime > now;
}

exports.isBookingActive = isBookingActive;

exports.setApp = function(JPS) {

    //######################################################
    // POST: deleteProfile
    // Deletes the authenticated user's profile, including all
    // database records and the Firebase Auth account.
    // Requires no active bookings.
    //######################################################

    JPS.app.post('/deleteProfile', JPS.authMiddleware, async (req, res) => {
        const now = Date.now();
        console.log("POST: deleteProfile", now);

        const uid = req.auth.uid;
        const user = req.auth.user;

        console.log("User: ", uid, " requested profile deletion.");

        try {
            // 1. Check for active bookings
            const bookingsSnapshot = await JPS.firebase.database().ref('/bookingsbyuser/' + uid).once('value');
            const allSlots = bookingsSnapshot.val();

            if (allSlots) {
                // Read slot definitions to calculate end times
                const slotsSnapshot = await JPS.firebase.database().ref('/slots').once('value');
                const slotDefs = slotsSnapshot.val() || {};

                for (const slotKey in allSlots) {
                    const bookings = allSlots[slotKey];
                    const slotInfo = slotDefs[slotKey];

                    if (!slotInfo) continue;

                    for (const bookingKey in bookings) {
                        const booking = bookings[bookingKey];

                        if (isBookingActive(booking, slotInfo, now)) {
                            console.log("Active booking found for user: ", uid, " slot: ", slotKey);
                            return res.status(409).json({
                                error: "Cannot delete profile while active bookings exist. Please cancel your upcoming bookings first."
                            });
                        }
                    }
                }
            }

            // 2. Delete database records
            await JPS.firebase.database().ref('/users/' + uid).remove();
            await JPS.firebase.database().ref('/bookingsbyuser/' + uid).remove();
            await JPS.firebase.database().ref('/transactions/' + uid).remove();
            await JPS.firebase.database().ref('/specialUsers/' + uid).remove();

            console.log("Deleted database records for user: ", uid);

            // 3. Send deletion confirmation email (non-blocking)
            try {
                JPS.mailer.sendDeletionConfirmation(user.email, new Date(now));
            } catch (emailErr) {
                console.error("Failed to send deletion confirmation email: ", emailErr);
            }

            // 4. Delete Firebase Auth account
            await JPS.firebase.auth().deleteUser(uid);

            console.log("Deleted Firebase Auth account for user: ", uid);

            res.status(200).json({ message: "Profile deleted successfully." });

        } catch (err) {
            console.error("Profile deletion failed: ", err);
            res.status(500).json({ error: "Profile deletion failed: " + String(err) });
        }
    });
};
