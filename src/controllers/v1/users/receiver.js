// when receiver confirms payment, status of the giver user changes to hibernation, response also contains 2 weeks timer(14days or 336 hrs). Receievr status changes to plain user so they can make another plan. Its only when receiver confirms payment that the 2weeks starts counting. If user clicks not paid then status of giver changes to not paid and they are alerted and cancle status becpmes =+ 1. also receiver status is still ready to pair
const confirmedPayment = async (req, res) => {};

// This endpoint will return the givers information name, email, phone, amount to pay and status. along with a 1hr countdown timer. If the 1hr coutdown timer runs down and their status is still pending users, then it changes their status back to awaiting users. and adds status of cancel to 1. If they cancel 3 times they get banned.
const getGiversDetails = async (req, res) => {};
