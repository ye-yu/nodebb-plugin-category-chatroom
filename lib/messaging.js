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
    messageData.source_ip = ip;
  }

  const key = `${category}-chat-${messageOrder}`
  await db.setObject(key, messageData);
  return {
    order: messageOrder,
    data: messageData
  }
}

CategoryChatMessaging.getMessages = async function(category, from) {
  if (!CategoryChatMessaging.db) throw new Error("Messaging has not been initialized!");
  const { db, logging: _logging } = CategoryChatMessaging;
  const log = _logging || console.log

  const chatOrderKey = `${category}-chat-order`;
  let fetchFrom = +from

  const lastChatOrder = (
    +(
        (
          await db.getObject('global', [chatOrderKey]).then(e => {
            log(`Last chat order from db: ${e}`)
            return e
          })
        )[chatOrderKey]
      )
  ) || 0;
  
  if (fetchFrom > lastChatOrder) return []
  var ids = []
  var minFetch = Math.min(fetchFrom + 50, lastChatOrder)
  for(let i = fetchFrom; i <= minFetch; i++) ids.push(`${category}-chat-${i}`)
  log(`Fetching ids:`, {ids})
  return (await db.getObjects(ids)).map((e, i) => {
    delete e.source_ip
    e.order = from + i
    return e
  })
}

CategoryChatMessaging.getLastMessages = async function(category, limit, backtrackFrom) {
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
            log(`Last chat order from db: ${e}`)
            return e
          })
        )[chatOrderKey]
      )
  ) || 0;
  log(`Last chat order: ${lastChatOrder}`)
  const from = Math.max(1, lastChatOrder - limit);
  log(`Fetching from: ${from}`)
  var ids = []
  for(let i = from; i <= lastChatOrder; i++) ids.push(`${category}-chat-${i}`)
  log(`Fetching ids:`, {ids})
  return (await db.getObjects(ids)).map((e, i) => {
    delete e.source_ip
    e.order = from + i
    return e
  })
}
