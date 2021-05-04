var CategoryChatMessaging = {};
module.exports = CategoryChatMessaging;

CategoryChatMessaging.init = function(modules) {
  const { db, logging } = modules
  CategoryChatMessaging.db = db
  CategoryChatMessaging.logging = logging
  return CategoryChatMessaging
}

CategoryChatMessaging.sendMessage = async function(category, user, message, ip) {
  if (!CategoryChatMessaging.db) throw new Error("Messaging has not been initialized!");
  const { db } = CategoryChatMessaging;
  const messageOrder = await db.incrObjectField('global', `${category}-chat-order`);
  const at = Date.now();
  let messageData = {
    message,
    at,
    user,
    category,
    has_deleted: false,
    from_system: false,
  };

  if (ip) {
    messageData.source_ip = source_ip;
  }

  const key = `${category}-chat-${messageOrder}`
  await db.setObject(key, messageData);
  return {
    order: messageOrder,
    data: messageData
  }
}

CategoryChatMessaging.getMessages = async function(category, limit, backtrackFrom) {
  if (!CategoryChatMessaging.db) throw new Error("Messaging has not been initialized!");
  const { db, logging: _logging } = CategoryChatMessaging;
  const chatOrderKey = `${category}-chat-order`;
  const log = _logging || console.log
  const lastChatOrder = (
    typeof backtrackFrom !== "undefined" ? 
      backtrackFrom 
      : +(
        (
          await db.getObject('global', [chatOrderKey]).then(e => {
            log(`[plugin/category-chatroom] Last chat order from db: ${e}`)
            return e
          })
        )[chatOrderKey]
      )
  ) || -1;
  log(`[plugin/category-chatroom] Last chat order: ${lastChatOrder}`)
  const from = Math.max(0, lastChatOrder - limit);
  log(`[plugin/category-chatroom] Fetching from: ${from}`)
  var ids = []
  for(let i = from; i <= lastChatOrder; i++) ids.push(`${category}-chat-${i}`)
  log(`[plugin/category-chatroom] Fetching ids:`, {ids})
  return await db.getObjects(ids)
}
