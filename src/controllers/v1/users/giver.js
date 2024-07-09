// This endpoint will return the information of the receivers payment along with a 1hr countdown timer. If the 1hr coutdown timer runs down and their status is still pending users, then it changes their status back to awaiting users. and adds status of cancel to 1. If they cancel 3 times they get banned.
const getReceiversDetails = async (req, res) => {};
// when pairing is canceled, user status changes to awaiting pairing user. and add cancel status +=1 if they cancel 3 times they are banned. an email is also sent to admin
const cancelPayment = async (req, res) => {};
// when user clicks "i have paid" send an email to admin, send text message to user receiving payment. also change status to pending confirmation.
const paymentConfirmation = async (req, res) => {};

// uploaded proof is sent to user receiving payment on their dashboard
const uploadPop = async (req, res) => {};
