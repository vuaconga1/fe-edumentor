import * as signalR from "@microsoft/signalr";

let connection = null;
let startingPromise = null;
let stoppingPromise = null;

// ===== Event handlers =====
const handlers = {
  ReceiveMessage: new Set(),
  UserTyping: new Set(),
  MessagesRead: new Set(),
  UserOnline: new Set(),
  UserOffline: new Set(),
  OnlineUsers: new Set(),
  NewMessageNotification: new Set(),
  Error: new Set(),
  WorkActionPopup: new Set(),
  WorkActionSent: new Set(),
  WorkActionState: new Set(),
  WorkSessionStarted: new Set(),
  WorkSessionPaused: new Set(),
  WorkSessionResumed: new Set(), // ✅ Added
  WorkSessionEnded: new Set(),
  WorkActionRejected: new Set(),
  ReceiveGroupMessage: new Set(),
  ReceiveGroupMessage: new Set(),
  UserGroupTyping: new Set(),
  GroupMessagesRead: new Set(),
  OrderCompleted: new Set(), // ✅ Added
};

// ===== Start Hub (safe, no race) =====
export async function startChatHub(baseUrl, token) {
  // Nếu đã connected/connecting → trả về luôn
  if (
    connection &&
    connection.state !== signalR.HubConnectionState.Disconnected
  ) {
    return connection;
  }

  // Nếu đang start → chờ start xong
  if (startingPromise) return startingPromise;

  // Nếu đang stop → chờ stop xong rồi mới start
  if (stoppingPromise) {
    try {
      await stoppingPromise;
    } catch { }
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${baseUrl}/hubs/chat`, {
      accessTokenFactory: () => token || "",
      // ❌ Bỏ WS-only để SignalR tự negotiate (ổn định hơn)
      // transport: signalR.HttpTransportType.WebSockets,
      // skipNegotiation: true,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(signalR.LogLevel.Information)
    .build();

  // Bind server events → local handlers
  Object.keys(handlers).forEach((event) => {
    connection.on(event, (data) => {
      handlers[event].forEach((cb) => cb(data));
    });
  });

  startingPromise = connection
    .start()
    .then(() => connection)
    .finally(() => {
      startingPromise = null;
    });

  return startingPromise;
}

// ===== Stop Hub (safe, no race) =====
export async function stopChatHub() {
  if (!connection) return;

  // Nếu đang start → đợi start xong rồi mới stop
  if (startingPromise) {
    try {
      await startingPromise;
    } catch { }
  }

  if (stoppingPromise) return stoppingPromise;

  stoppingPromise = connection
    .stop()
    .finally(() => {
      stoppingPromise = null;
      connection = null;
    });

  return stoppingPromise;
}

// ===== Event bus =====
export function on(event, cb) {
  if (!handlers[event]) {
    throw new Error(`Unknown event: ${event}`);
  }
  handlers[event].add(cb);
  return () => handlers[event].delete(cb);
}

// ===== Helpers =====
function ensureConnected() {
  if (!connection) {
    throw new Error("ChatHub not started. Call startChatHub() first.");
  }

  if (connection.state !== signalR.HubConnectionState.Connected) {
    throw new Error(`ChatHub not connected. Current state: ${connection.state}`);
  }

  return connection;
}

export function isConnected() {
  return connection && connection.state === signalR.HubConnectionState.Connected;
}


// ===== Hub invokes =====
export function joinConversation(id) {
  return ensureConnected().invoke("JoinConversation", Number(id));
}

export function leaveConversation(id) {
  return ensureConnected().invoke("LeaveConversation", Number(id));
}

export function sendMessage({ conversationId, content, messageType = 0 }) {
  return ensureConnected().invoke("SendMessage", {
    conversationId: Number(conversationId),
    content,
    messageType,
  });
}

export function typing(conversationId, isTyping) {
  return ensureConnected().invoke(
    "Typing",
    Number(conversationId),
    Boolean(isTyping)
  );
}

export function markAsRead(conversationId) {
  return ensureConnected().invoke(
    "MarkAsRead",
    Number(conversationId)
  );
}
export function getOnlineUsers(userIds) {
  const conn = ensureConnected();
  if (!conn) return Promise.resolve(); // hub chưa ready → bỏ qua
  return conn.invoke("GetOnlineUsers", userIds.map(Number));
}
export const requestStartWork = (conversationId, orderId, mentorId, studentId) => {
  return connection.invoke(
    "RequestStartWork",
    Number(conversationId),
    Number(orderId),
    Number(mentorId),
    Number(studentId)
  );
};

export function requestPauseWork(conversationId, sessionId) {
  return ensureConnected().invoke(
    "RequestPauseWork",
    Number(conversationId),
    Number(sessionId)
  );
}

export function requestEndWork(conversationId, sessionId) {
  return ensureConnected().invoke(
    "RequestEndWork",
    Number(conversationId),
    Number(sessionId)
  );
}

export function requestResumeWork(conversationId, sessionId) {
  return ensureConnected().invoke(
    "RequestResumeWork",
    Number(conversationId),
    Number(sessionId)
  );
}

export function requestCompleteOrder(conversationId, orderId) {
  return ensureConnected().invoke(
    "RequestCompleteOrder",
    Number(conversationId),
    Number(orderId)
  );
}

export const respondWorkAction = (requestId, accept) => {
  const rid = String(requestId ?? "").trim();
  console.log("[hub] RespondWorkAction invoke args:", { rid, accept });

  // ❗ nếu rid rỗng thì stop ngay (tránh gọi server)
  if (!rid) throw new Error("Missing requestId");

  // ✅ đúng signature BE: (string requestId, bool accept)
  return connection.invoke("RespondWorkAction", rid, Boolean(accept));
};

// ===== Group Chat Methods =====
export function joinGroupRoom(groupId) {
  return ensureConnected().invoke("JoinGroupRoom", Number(groupId));
}

export function leaveGroupRoom(groupId) {
  return ensureConnected().invoke("LeaveGroupRoom", Number(groupId));
}

export function sendGroupMessage({ groupId, content, messageType = 0 }) {
  return ensureConnected().invoke("SendGroupMessage", {
    groupId: Number(groupId),
    content,
    messageType,
  });
}

export function groupTyping(groupId, isTyping) {
  return ensureConnected().invoke(
    "GroupTyping",
    Number(groupId),
    Boolean(isTyping)
  );
}

export function markGroupAsRead(groupId) {
  return ensureConnected().invoke("MarkGroupAsRead", Number(groupId));
}



