module.exports = {

    completePendingTransaction: async (JPS, pendingTransactionKey, externalReference, paymentInstrumentType, paymentMethod) => {

        try {
            // Let's get the transaction at hand.
            const snapshot = await JPS.firebase.database().ref('/pendingtransactions/' + pendingTransactionKey).once('value');

            if (snapshot.val() === null) {
                throw new Error("PendingTransactionHelper: Pending transaction was not found: " + pendingTransactionKey);
            }

            const pendingTransaction = snapshot.val();
            console.log("Processing pending transaction: ", pendingTransaction);

            const dataToUpdate = Object.assign(
                pendingTransaction.transaction,
                pendingTransaction.shopItem, {
                details: {
                    success: true,
                    transaction: {
                        pendingTransaction: pendingTransactionKey,
                        amount: pendingTransaction.shopItem.price,
                        currencyIsoCode: "EUR",
                        id: externalReference,
                        paymentInstrumentType: paymentInstrumentType,
                        paymentMethod: paymentMethod
                    }
                }
            });

            await JPS.firebase.database().ref('/transactions/' + pendingTransaction.user + '/' + pendingTransaction.timestamp)
                .update(dataToUpdate);

            console.log("Pending transaction processed successfully. Removing pending record.");
            await JPS.firebase.database().ref('/pendingtransactions/' + pendingTransactionKey).remove();

            console.log("Pending record removed successfully.");
            if (pendingTransaction.shopItem.type === "special") {
                await JPS.firebase.database().ref('/scbookingsbyslot/' + pendingTransaction.transaction.shopItemKey + '/' + pendingTransaction.user)
                    .update({transactionReference: pendingTransaction.timestamp, shopItem: pendingTransaction.shopItem});

                await JPS.firebase.database().ref('/scbookingsbyuser/' + pendingTransaction.user + '/' + pendingTransaction.transaction.shopItemKey)
                    .update({transactionReference: pendingTransaction.timestamp, shopItem: pendingTransaction.shopItem});

                console.log("Updated SC-bookings successfully");
            }

            JPS.mailer.sendReceipt(pendingTransaction.receiptEmail, dataToUpdate, pendingTransaction.timestamp);
            return {code: 200, message: "OK"};

        } catch (err) {
            console.error("completePendingTransaction failed: ", err);
            throw {code: 500, message: "completePendingTransaction failed: " + err, err};
        }
    }
}
