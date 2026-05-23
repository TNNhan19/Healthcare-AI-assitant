const User = require('../models/userModel');

let webpush;
try {
  webpush = require('web-push');
} catch (e) {
  console.warn('web-push not installed; web push sending will be disabled. To enable, run: npm install web-push');
}

const getVapidKeys = () => {
  const publicKey = process.env.WEBPUSH_VAPID_PUBLIC;
  const privateKey = process.env.WEBPUSH_VAPID_PRIVATE;
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey };
};

if (webpush) {
  const keys = getVapidKeys();
  if (keys) {
    webpush.setVapidDetails(process.env.WEBPUSH_SUBJECT || 'mailto:admin@example.com', keys.publicKey, keys.privateKey);
  }
}

async function sendWebPushToSubscription(subscription, payload) {
  if (!webpush) throw new Error('web-push not available');
  try {
    const res = await webpush.sendNotification(subscription, JSON.stringify(payload));
    return res;
  } catch (err) {
    // Many errors are network related or subscription expired
    throw err;
  }
}

async function sendNotificationToUser(userId, payload) {
  const user = await User.findById(userId).lean();
  if (!user) throw new Error('User not found');
  const subs = user.pushSubscriptions || [];
  const results = [];
  for (const sub of subs) {
    try {
      const r = await sendWebPushToSubscription(sub, payload);
      results.push({ subId: sub.endpoint || sub.id || null, ok: true, res: r });
    } catch (e) {
      results.push({ subId: sub.endpoint || sub.id || null, ok: false, err: e.message });
    }
  }
  return results;
}

module.exports = { sendWebPushToSubscription, sendNotificationToUser };
