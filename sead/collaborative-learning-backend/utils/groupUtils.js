const mongoose = require("mongoose");
const Group = require("../models/Group"); // Ensure this matches your Group model path

// ✅ Verify if a user is a member of a study group
async function verifyGroupMembership(userId, groupId) {
  try {
    // Validate groupId before querying
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      console.error("❌ Invalid Group ID format");
      return false;
    }

    const group = await Group.findById(groupId);
    if (!group) return false;

    // 🔹 Check if user exists in group (Correctly using `.some()`)
    return group.members.some((m) => m.user.toString() === userId);
  } catch (error) {
    console.error("❌ Error verifying group membership:", error);
    return false;
  }
}

// ✅ Remove user from WebSocket when they leave a group
function removeDisconnectedUsers(wss, groupId, userId) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.groupId === groupId && client.userId === userId) {
      console.log(`❌ Disconnecting User ${userId} from Group ${groupId}`);
      client.close(); // Forcefully disconnect user from WebSocket
    }
  });
}

module.exports = { verifyGroupMembership, removeDisconnectedUsers };
