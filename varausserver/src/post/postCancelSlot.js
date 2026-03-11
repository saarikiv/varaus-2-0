
exports.setApp = function(JPS) {

    //######################################################
    // POST: cancelSlot
    //######################################################

    JPS.app.post('/cancelSlot', async (req, res) => {
        const now = Date.now();
        console.log("POST: cancelSlot", now);
        const post = req.body;
        console.log("POST:", post);
        const currentUserToken = post.user;
        const slotInfo = post.slotInfo;
        const cancelItem = post.cancelItem;
        const txRef = post.transactionReference;
        const timezoneOffset = post.timezoneOffset;

        try {
            const decodedToken = await JPS.firebase.auth().verifyIdToken(currentUserToken);
            const currentUserUID = decodedToken.uid || decodedToken.sub;
            console.log("User: ", currentUserUID, " requested cancel slot.");

            const userSnapshot = await JPS.firebase.database().ref('/users/' + currentUserUID).once('value');
            if (userSnapshot.val() == null) {
                throw new Error("User record does not exist in the database: " + currentUserUID);
            }
            const user = userSnapshot.val();
            user.key = userSnapshot.key;
            console.log("USER:", user);

            const slotSnapshot = await JPS.firebase.database().ref('/bookingsbyslot/' + slotInfo.key + '/' + cancelItem + '/' + user.key).once('value');
            if (slotSnapshot.val() == null) {
                throw new Error("Booking by-SLOT does not exist in the database.");
            }

            const userBookingSnapshot = await JPS.firebase.database().ref('/bookingsbyuser/' + user.key + '/' + slotInfo.key + '/' + cancelItem).once('value');
            if (userBookingSnapshot.val() == null) {
                throw new Error("Booking by-USER does not exist in the database.");
            }

            await JPS.firebase.database().ref('/bookingsbyuser/' + user.key + '/' + slotInfo.key + '/' + cancelItem).remove();
            await JPS.firebase.database().ref('/bookingsbyslot/' + slotInfo.key + '/' + cancelItem + '/' + user.key).remove();

            console.log("Transaction reference: ", txRef);
            if (txRef != 0) {
                // Give back one use time for the user
                const txSnapshot = await JPS.firebase.database().ref('/transactions/' + user.key + '/' + txRef).once('value');
                if (txSnapshot.val() == null) {
                    throw new Error("Transaction not found in the DB: TX:" + user.key + "/" + txRef);
                }
                let unusedtimes = txSnapshot.val().unusedtimes;
                unusedtimes++;
                await JPS.firebase.database().ref('/transactions/' + user.key + '/' + txRef).update({
                    unusedtimes: unusedtimes
                });

                res.status(200).json({
                    message: "Cancellation COUNT was successful."
                });
                JPS.mailer.sendCancellationCount(user.email, slotInfo, cancelItem);
            } else {
                res.status(200).json({
                    message: "Cancellation TIME was successful."
                });
                JPS.mailer.sendCancellationTime(user.email, slotInfo, cancelItem);
            }
        } catch (err) {
            console.error("POST Cancel Slot failed: ", err);
            res.status(500).json({
                error: "POST Cancel Slot failed: " + err.toString()
            });
        }
    })
}
