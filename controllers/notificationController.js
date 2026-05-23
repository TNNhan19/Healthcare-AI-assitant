const Notification = require('../models/notificationModel');

const createNotification = async (payload) => {
  // payload: { recipientUser, recipientRole, type, data }
  const n = new Notification(payload);
  await n.save();
  return n;
};

const listNotifications = async (req, res) => {
  try {
    const user = req.user;
    const { forRole } = req.query;
    let query = {};
    if (user) query.recipientUser = user.id;
    if (forRole) query.recipientRole = forRole;
    // Also allow fetching by role only (for pharmacists)
    if (!user && forRole) query = { recipientRole: forRole };
    const items = await Notification.find(query).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: items });
  } catch (e) {
    console.error('List notifications error', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { read: true });
    res.json({ success: true });
  } catch (e) {
    console.error('Mark read error', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

const clearNotifications = async (req, res) => {
  try {
    const user = req.user;
    const { forRole } = req.query;
    let query = {};
    if (user && forRole) {
      // mark notifications for this user OR role
      query = { $or: [{ recipientUser: user.id }, { recipientRole: forRole }] };
    } else if (user) {
      query = { recipientUser: user.id };
    } else if (forRole) {
      query = { recipientRole: forRole };
    } else {
      // nothing specified: nothing to clear
      return res.status(400).json({ success: false, message: 'No target specified to clear' });
    }

    const r = await Notification.updateMany(query, { read: true });
    // r.modifiedCount for mongoose 6+, fallback to nModified
    const updated = r.modifiedCount ?? r.nModified ?? 0;
    res.json({ success: true, updated });
  } catch (e) {
    console.error('Clear notifications error', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = { createNotification, listNotifications, markRead, clearNotifications };
