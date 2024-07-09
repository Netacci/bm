const WebSocket = require('ws');
const logger = require('./logger.js');
const User = require('../models/v1/users/auth.js');
const jwt = require('jsonwebtoken');

const wss = new WebSocket.Server({ port: 8080 });
const dotenv = require('dotenv');
dotenv.config();
// TODO streghtne the aithentication cos it seems to be changing user Ids
// Error handling function for WebSocket errors
const handleError = (ws, error) => {
  logger.error('WebSocket error:', error);
  ws.terminate(); // Close the connection in case of errors
};
// Broadcast function with error handling
// wss.broadcast = function broadcast(data) {
//   wss.clients.forEach((client) => {
//     if (client.readyState === WebSocket.OPEN) {
//       try {
//         client.send(data);
//       } catch (error) {
//         handleError(client, error);
//       }
//     }
//   });
// };
wss.broadcastToUser = function broadcastToUser(userId, data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.userId === userId) {
      try {
        client.send(data);
      } catch (error) {
        handleError(client, error);
      }
    }
  });
};
// WebSocket connection handler with authentication
wss.on('connection', async function connection(ws) {
  logger.info('Client connected');

  ws.on('error', (error) => handleError(ws, error));
  // ws.on('close', () => logger.info('Client disconnected'));

  ws.on('message', async (message) => {
    try {
      const receivedMessage = message.toString('utf8');
      const parsedMessage = JSON.parse(receivedMessage);

      if (parsedMessage.type === 'authenticate') {
        const token = parsedMessage.token;
        const userId = parsedMessage.userId;

        if (!token || !userId) {
          ws.send(
            JSON.stringify({ message: 'Missing authentication information' })
          );
          return;
        }

        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded._id === userId) {
            console.log(decoded._id, userId);
            console.log('Authcated user:', ws.userId);
            ws.userId = userId; // Set userId on successful authentication
            logger.info('Authenticated user:', ws.userId);
            await checkStatus(userId); // Call checkStatus here
          } else {
            ws.send(JSON.stringify({ message: 'Authentication failed' }));
            logger.error('Authentication failed: userId does not match token');
          }
        } catch (error) {
          ws.send(JSON.stringify({ message: 'Authentication failed' }));
          logger.error('Authentication error:', error.message);
        }
      }
    } catch (error) {
      logger.error('Error handling message:', error);
    }
  });
  ws.send(JSON.stringify({ message: 'Welcome to the WebSocket server' }));
});

const checkStatus = async (userId) => {
  try {
    const user = await User.findById(userId).select('-password -token -__v');
    if (!user) {
      logger.error('User not found for ID:', userId);
      return;
    }
    const now = new Date();

    let statusUpdated = false;

    // Check if user status is "paired" and payment timer has expired
    if (user.status === 'paired') {
      user.plans.forEach((plan) => {
        plan.pairings.forEach((pairing) => {
          if (pairing.payment_timer && now > new Date(pairing.payment_timer)) {
            pairing.payment_timer = null; // Reset payment timer if expired
            statusUpdated = true;
            pairing.status = 'not_paid';
            // Add a new transaction entry for the expired payment
            const newTransaction = {
              name: plan.name,
              status: 'not_paid',
              amount: plan.amount,
              description: `Payment for pairing with ${pairing.full_name} has expired.`,
            };
            user.transactions.push(newTransaction);
          }
        });
      });
      if (statusUpdated) {
        user.plans.forEach((plan) => {
          plan.pairings.forEach((pairing) => {
            if (!pairing.payment_timer && user.status === 'paired') {
              user.status = 'ready_to_give';
              user.cancelStatus += 1;
            }
          });
        });
      }
    }

    // If user was awaiting payment and no active payment timer, set to ready to receive
    if (user.status === 'awaiting_payment') {
      user.plans.forEach((plan) => {
        plan.pairings.forEach((pairing) => {
          if (pairing.payment_timer && now > new Date(pairing.payment_timer)) {
            pairing.payment_timer = null; // Reset payment timer if expired
            statusUpdated = true;
            pairing.status = 'not_received';
            // Add a new transaction entry for the expired payment
            const newTransaction = {
              name: plan.name,
              status: 'not_received',
              amount: plan.amount,
              description: ` ${pairing.full_name} did not make payment`,
            };
            user.transactions.push(newTransaction);
          }
        });
      });
      if (statusUpdated) {
        user.plans.forEach((plan) => {
          plan.pairings.forEach((pairing) => {
            if (!pairing.payment_timer && user.status === 'awaiting_payment') {
              user.status = 'ready_to_receive';
            }
          });
        });
      }
    }

    // Check if user status is "hibernating" and hibernation timer has expired
    if (
      user.status === 'hibernating' &&
      user.hibernationTimer &&
      now >= new Date(user.hibernationTimer)
    ) {
      user.status = 'ready_to_receive';
      user.hibernationTimer = null; // Reset hibernation timer
      statusUpdated = true;
    }

    if (statusUpdated) {
      await user.save();
      logger.info('User status updated:', user.status);
      wss.broadcastToUser(
        user._id,
        JSON.stringify({ type: 'status_update', user })
      );
    }

    if (user.cancelStatus >= 3) {
      user.isBanned = true;
    }
    // if (user.status === 'ready_to_receive') {
    //   return { status: 'success', user };
    // }
    return { status: 'success', user };
  } catch (err) {
    logger.error('Error checking user status:', err);
  }
};

// Periodically check user status
// setInterval(async () => {
//   wss.clients.forEach(async (client) => {
//     logger.info('Checking status for user id:', client.userId);
//     if (client.userId) {
//       const result = await checkStatus(client.userId);

//       if (result.status === 'success') {
//         wss.broadcast(
//           JSON.stringify({ type: 'status_update', user: result.user })
//         );
//       } else {
//         logger.error('Error in checkStatus:', result.message);
//       }
//     }
//   });
// }, 10000);
setInterval(async () => {
  wss.clients.forEach(async (client) => {
    logger.info('Checking status for user id:', client.userId);
    if (client.userId) {
      const result = await checkStatus(client.userId);

      if (result.status === 'success') {
        // No need to broadcast to all clients here
        wss.broadcastToUser(
          client.userId,
          JSON.stringify({ type: 'status_update', user: result.user })
        );
      } else {
        logger.error('Error in checkStatus:', result.message);
      }
    }
  });
}, 10000);

logger.info('WebSocket server started on port 8080');

module.exports = { wss };
