const User = require('../models/User');
const fs = require('fs');
const path = require('path');

let messaging = null;

try {
  const { initializeApp, cert, applicationDefault, getApps } = require('firebase-admin/app');
  const { getMessaging } = require('firebase-admin/messaging');

  const serviceAccountPath1 = path.join(__dirname, '../config/firebase-service-account.json');
  const serviceAccountPath2 = path.join(__dirname, '../config/firebase-service-account.json.json');

  let app = null;
  const existingApps = getApps();

  if (existingApps.length > 0) {
    app = existingApps[0];
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    app = initializeApp({ credential: cert(serviceAccount) });
    console.log('🔥 Firebase Admin SDK initialized from FIREBASE_SERVICE_ACCOUNT env');
  } else if (fs.existsSync(serviceAccountPath1)) {
    const serviceAccount = require(serviceAccountPath1);
    app = initializeApp({ credential: cert(serviceAccount) });
    console.log('🔥 Firebase Admin SDK initialized with firebase-service-account.json');
  } else if (fs.existsSync(serviceAccountPath2)) {
    const serviceAccount = require(serviceAccountPath2);
    app = initializeApp({ credential: cert(serviceAccount) });
    console.log('🔥 Firebase Admin SDK initialized with firebase-service-account.json.json');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    app = initializeApp({ credential: applicationDefault() });
    console.log('🔥 Firebase Admin SDK initialized with default credentials');
  }

  if (app) {
    messaging = getMessaging(app);
  }
} catch (e) {
  console.log('ℹ️ Firebase Admin SDK initialization note:', e.message);
}

/**
 * Clean up invalid or unregistered FCM tokens from MongoDB
 */
const cleanupInvalidTokens = async (invalidTokens) => {
  if (!invalidTokens || invalidTokens.length === 0) return;
  try {
    await User.updateMany(
      { fcmToken: { $in: invalidTokens } },
      { $set: { fcmToken: '' } }
    );
    console.log(`🧹 Cleaned up ${invalidTokens.length} expired/invalid FCM token(s)`);
  } catch (err) {
    console.error('Error cleaning up invalid FCM tokens:', err.message);
  }
};

/**
 * Dispatch real-time Socket.io alert + Firebase FCM Push Notification
 * 
 * @param {Object} params
 * @param {string} [params.recipientId] - Specific User ID to notify
 * @param {string} [params.targetRole] - Target role ('admin' or 'user')
 * @param {string} params.title - Alert Title
 * @param {string} params.message - Alert Message / Body
 * @param {Object} [params.data] - Custom deep-link payload (e.g. { type: 'chat', userId: '...' })
 */
const sendNotification = async ({ recipientId, targetRole, title, message, data = {} }) => {
  try {
    const cleanTitle = title || 'Media Wave HRMS';
    const cleanMessage = message || '';
    const eventType = data.type || data.screen || 'general';

    // 1. Dispatch Real-time Socket.io Event (Safe lazy evaluation to prevent circular dependency)
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      if (io) {
        const socketPayload = {
          title: cleanTitle,
          message: cleanMessage,
          data: {
            ...data,
            type: eventType,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };

        if (recipientId) {
          io.to(recipientId.toString()).emit('notification_event', socketPayload);
        } else if (targetRole === 'admin') {
          io.to('admin').emit('notification_event', socketPayload);
        } else {
          io.emit('notification_event', socketPayload);
        }
      }
    } catch (socketErr) {
      // Socket may not be initialized during certain CLI scripts or tests
    }

    // 2. FCM Push Notification
    if (messaging) {
      let targetUsers = [];

      if (recipientId) {
        const user = await User.findById(recipientId).select('fcmToken');
        if (user && user.fcmToken && user.fcmToken.trim().length > 10) {
          targetUsers.push(user);
        }
      } else if (targetRole) {
        targetUsers = await User.find({
          role: targetRole,
          fcmToken: { $exists: true, $ne: '' },
        }).select('fcmToken');
      } else {
        targetUsers = await User.find({
          fcmToken: { $exists: true, $ne: '' },
        }).select('fcmToken');
      }

      const validTokens = targetUsers
        .map((u) => u.fcmToken)
        .filter((t) => t && t.trim().length > 10);

      if (validTokens.length === 0) {
        return;
      }

      // Format all data payload properties as Strings (FCM requirement)
      const fcmDataPayload = {
        title: String(cleanTitle),
        message: String(cleanMessage),
        body: String(cleanMessage),
        type: String(eventType),
        screen: String(data.screen || eventType),
        timestamp: new Date().toISOString(),
      };

      for (const [key, val] of Object.entries(data)) {
        if (val !== undefined && val !== null) {
          fcmDataPayload[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
        }
      }

      // If single token, send directly
      if (validTokens.length === 1) {
        const token = validTokens[0];
        try {
          await messaging.send({
            token,
            notification: {
              title: cleanTitle,
              body: cleanMessage,
            },
            data: fcmDataPayload,
            android: {
              priority: 'high',
              notification: {
                channelId: 'hrms_high_importance_channel',
                sound: 'default',
                icon: 'ic_launcher',
                defaultSound: true,
                defaultVibrateTimings: true,
                visibility: 'public',
              },
            },
            apns: {
              headers: {
                'apns-priority': '10',
              },
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                  contentAvailable: true,
                },
              },
            },
          });
          console.log(`🚀 FCM Push sent successfully to token: ${token.slice(0, 12)}...`);
        } catch (singleErr) {
          console.error(`⚠️ FCM send error: ${singleErr.message}`);
          if (
            singleErr.code === 'messaging/registration-token-not-registered' ||
            singleErr.code === 'messaging/invalid-registration-token'
          ) {
            await cleanupInvalidTokens([token]);
          }
        }
      } else {
        // Multicast for multiple recipients
        try {
          const multicastMessage = {
            tokens: validTokens,
            notification: {
              title: cleanTitle,
              body: cleanMessage,
            },
            data: fcmDataPayload,
            android: {
              priority: 'high',
              notification: {
                channelId: 'hrms_high_importance_channel',
                sound: 'default',
                icon: 'ic_launcher',
                defaultSound: true,
                defaultVibrateTimings: true,
                visibility: 'public',
              },
            },
            apns: {
              headers: {
                'apns-priority': '10',
              },
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                  contentAvailable: true,
                },
              },
            },
          };

          const response = await messaging.sendEachForMulticast(multicastMessage);
          console.log(`🚀 FCM Multicast sent: ${response.successCount} success, ${response.failureCount} failed.`);

          if (response.failureCount > 0) {
            const badTokens = [];
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                const errCode = resp.error?.code;
                if (
                  errCode === 'messaging/registration-token-not-registered' ||
                  errCode === 'messaging/invalid-registration-token'
                ) {
                  badTokens.push(validTokens[idx]);
                }
              }
            });
            if (badTokens.length > 0) {
              await cleanupInvalidTokens(badTokens);
            }
          }
        } catch (multiErr) {
          console.error('⚠️ FCM Multicast send error:', multiErr.message);
        }
      }
    }
  } catch (err) {
    console.error('Error dispatching notification:', err.message);
  }
};

module.exports = { sendNotification };
