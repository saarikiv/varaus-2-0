module.exports = {
    cancelSlot: (JPS, user, slotInfo, slotInstance, transactionReference) => {

        var promise = new Promise((resolve, reject) => {

            console.log("USER:", user);
            JPS.firebase.database().ref('/bookingsbyslot/' + slotInfo.key + '/' + slotInstance + '/' + user).once('value')
            .then(snapshot => {
                if (snapshot.val() == null) {
                    throw (new Error("Booking by-SLOT does not exist in the database."))
                }
                return JPS.firebase.database().ref('/bookingsbyuser/' + user + '/' + slotInfo.key + '/' + slotInstance).once('value');
            })
            .then(snapshot => {
                if (snapshot.val() == null) {
                    throw (new Error("Booking by-USER does not exist in the database."))
                }
                return JPS.firebase.database().ref('/bookingsbyuser/' + user + '/' + slotInfo.key + '/' + slotInstance).remove();
            })
            .then(() => {
                return JPS.firebase.database().ref('/bookingsbyslot/' + slotInfo.key + '/' + slotInstance + '/' + user).remove();
            })
            .then(() => {
                console.log("Transaction reference: ", transactionReference)
                if (transactionReference != 0) {
                    //Give back one use time for the user
                    JPS.firebase.database().ref('/transactions/' + user + '/' + transactionReference).once('value')
                        .then(snapshot => {
                            if (snapshot.val() == null) {
                                throw (new Error("Transaction not found in the DB: TX:" + user + "/" + transactionReference));
                            }
                            JPS.unusedtimes = snapshot.val().unusedtimes;
                            JPS.unusedtimes++;
                            return JPS.firebase.database().ref('/transactions/' + user + '/' + transactionReference).update({
                                unusedtimes: JPS.unusedtimes
                            })
                        })
                        .then(err => {
                            if (err) {
                                throw (new Error(err.message + " " + err.code));
                            }
                            JPS.mailer.sendSlotCancellationCount(JPS.user.email, slotInfo, slotInstance); //Send confirmation email
                        }).catch(err => {
                            throw (new Error(err.message + " " + err.code));
                        })
                } else {
                    JPS.mailer.sendSlotCancellationTime(JPS.user.email, slotInfo, slotInstance); //Send confirmation email
                }
            })
            .catch(err => {
                console.error("Cancel Slot failed: ", err);
                reject( "cancel slot failed: " + err.toString() );
            });
            resolve()
        })
        return promise;
    }
}
