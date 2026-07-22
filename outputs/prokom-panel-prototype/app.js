const seedData = window.PROKOM_SEED || {};
const cloneSeed = (value) => JSON.parse(JSON.stringify(value));

let people = cloneSeed(seedData.people || []);
let accounts = cloneSeed(seedData.accounts || []);
let currentUser = null;

let myDayItems = [];

let posts = [];

const postReactionTypes = [
  { id: "like", icon: "👍", label: "Dzięki" },
  { id: "done", icon: "✅", label: "Przyjęte" },
  { id: "question", icon: "❓", label: "Pytanie" },
];

let tasks = {
  todo: [],
  doing: [],
  review: [],
  done: [],
};

let requests = [];

let reports = [];

let notifications = [];
let renderedNotifications = [];
let notificationReadIds = new Set();

const defaultGroupConversations = [
  {
    id: "company",
    title: "Cała firma",
    kind: "default",
    memberMode: "all",
    messages: [],
  },
  {
    id: "service",
    title: "Serwis",
    kind: "default",
    memberRole: "Serwis",
    messages: [],
  },
];

let customGroupConversations = [];
let currentConversation = "company";
const directMessages = new Map();
let stagedChatAttachments = [];
let chatPollTimer = null;
let chatPollInFlight = false;
const chatReadInFlight = new Set();
const notifiedChatMessageIds = new Set();
const chatPollIntervalMs = 3000;

let handoverNotes = [];

let kbArticles = [];

let calendarEvents = [];
let timeSummary = null;

const columnLabels = {
  todo: "Do zrobienia",
  doing: "W trakcie",
  review: "Do sprawdzenia",
  done: "Zrobione",
};

let role = "admin";
let clockedIn = false;
let breakActive = false;
let startedAt = null;
let elapsedBefore = 0;
let timerId = null;
let currentAnnouncementFilter = "active";
let currentFeedFilter = "all";
let currentTaskFilter = "all";
let currentReportFilter = "open";
let kbSearchQuery = "";
let activePostId = null;
let activeTaskId = null;
let backendAvailable = false;
let announcementPollTimer = null;
let announcementPollInFlight = false;
const announcementPollIntervalMs = 6000;
let taskPollTimer = null;
let taskPollInFlight = false;
const taskPollIntervalMs = 5000;
let reportPollTimer = null;
let reportPollInFlight = false;
const reportPollIntervalMs = 6000;
let requestPollTimer = null;
let requestPollInFlight = false;
const requestPollIntervalMs = 6000;
let calendarPollTimer = null;
let calendarPollInFlight = false;
const calendarPollIntervalMs = 6000;
let knowledgePollTimer = null;
let knowledgePollInFlight = false;
const knowledgePollIntervalMs = 7000;
let presencePollTimer = null;
let presencePollInFlight = false;
const presencePollIntervalMs = 5000;

const storageKeys = {
  accounts: "prokom-accounts-v3",
  myDay: "prokom-myday-v2",
  requests: "prokom-requests-v2",
  tasks: "prokom-tasks-v2",
  dashboardLayout: "prokom-dashboard-layout-v2",
  chatGroups: "prokom-chat-groups-v2",
  chatMessages: "prokom-chat-messages-v2",
  notificationReadIds: "prokom-notification-read-ids-v2",
};

const viewTitles = {
  dashboard: "Tablica dnia",
  announcements: "Ogłoszenia",
  tasks: "Zadania",
  time: "Czas pracy",
  calendar: "Kalendarz",
  reports: "Zgłoszenia",
  chat: "Czat",
  knowledge: "Baza wiedzy",
  team: "Zespół",
  stats: "Statystyki",
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function updateTodayLabel() {
  const label = $("#todayLabel");
  if (!label) return;
  const formatted = new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  label.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l");
}

function readStorage(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    showToast("Nie zapisano zmian", "Przeglądarka zablokowała localStorage.");
  }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data.error || "Backend zwrócił błąd.");
  }
  return data;
}

async function apiFormRequest(path, formData, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    method: "POST",
    body: formData,
    ...options,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data.error || "Backend zwrócił błąd.");
  }
  return data;
}

function normalizeApiAccount(account) {
  return {
    login: account.login,
    name: account.name,
    label: account.label || account.name,
    role: account.role === "admin" ? "admin" : "employee",
    teamRole: account.teamRole || (account.role === "admin" ? "Administrator" : "Pracownik"),
    initials: account.initials || makeInitials(account.name),
    active: account.active !== false,
    requiresPassword: Boolean(account.requiresPassword),
    isRoot: Boolean(account.isRoot),
    canCreateUsers: Boolean(account.canCreateUsers),
    canManageUsers: Boolean(account.canManageUsers),
    canManageSchema: Boolean(account.canManageSchema),
    allowRawSql: Boolean(account.allowRawSql),
  };
}

function accountToPerson(account) {
  return {
    login: account.login,
    name: account.name,
    role: account.teamRole || (account.role === "admin" ? "Administrator" : "Pracownik"),
    initials: account.initials || makeInitials(account.name),
    status: account.active !== false ? "Niewbity" : "Wyłączone",
    state: account.active !== false ? "out" : "off",
    active: account.active !== false,
  };
}

function applyAccountSnapshot(snapshot) {
  if (Array.isArray(snapshot.accounts)) {
    accounts = snapshot.accounts.map(normalizeApiAccount);
  }
  if (Array.isArray(snapshot.people)) {
    people = snapshot.people;
  } else {
    people = accounts.filter((account) => !account.isRoot).map(accountToPerson);
  }
  if (isLoggedIn()) syncClockStateFromCurrentPerson();
}

function normalizeChatGroup(group) {
  const title = String(group.title || "Nowa grupa").trim();
  return {
    id: group.id || `group-${slugifyLogin(title)}-${Date.now()}`,
    title,
    kind: "custom",
    memberLogins: Array.isArray(group.memberLogins)
      ? [...new Set(group.memberLogins.map(normalizeLogin).filter(Boolean))]
      : [],
    createdBy: group.createdBy || group.created_by || getActiveLogin(),
    createdAt: group.createdAt || group.created_at || "teraz",
    messages: Array.isArray(group.messages) ? group.messages : [],
  };
}

function directConversationId(loginA, loginB) {
  return `dm:${[normalizeLogin(loginA), normalizeLogin(loginB)].sort().join(":")}`;
}

function getConversationMessageList(conversationId, seedMessages = []) {
  if (!directMessages.has(conversationId)) {
    directMessages.set(
      conversationId,
      Array.isArray(seedMessages) ? seedMessages.map(normalizeChatMessage) : [],
    );
  }
  return directMessages.get(conversationId);
}

function normalizeChatAttachment(attachment) {
  return {
    id: attachment.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: attachment.name || "załącznik",
    sizeLabel: attachment.sizeLabel || "",
    type: attachment.type || "",
    icon: attachment.icon || fileIcon(attachment.type, attachment.name),
    isImage: Boolean(attachment.isImage),
    url: attachment.url || "",
  };
}

function normalizeReadReceipt(receipt) {
  if (typeof receipt === "string") {
    return { login: normalizeLogin(receipt), readAt: "" };
  }
  return {
    login: normalizeLogin(receipt?.login || receipt?.readerLogin || receipt?.reader_login),
    readAt: receipt?.readAt || receipt?.read_at || "",
  };
}

function normalizeChatMessage(message) {
  const readReceipts = (
    Array.isArray(message.readReceipts) ? message.readReceipts : Array.isArray(message.readBy) ? message.readBy : []
  )
    .map(normalizeReadReceipt)
    .filter((receipt) => receipt.login);
  return {
    id: message.id || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    conversationId: message.conversationId || message.conversation_id || currentConversation,
    authorLogin: normalizeLogin(message.authorLogin || message.author_login || getActiveLogin()),
    author: message.author,
    body: message.body || "",
    time: message.time || message.time_label || "teraz",
    createdAt: message.createdAt || message.created_at || "",
    mine: Boolean(message.mine),
    attachments: Array.isArray(message.attachments) ? message.attachments.map(normalizeChatAttachment) : [],
    readBy: [...new Set(readReceipts.map((receipt) => receipt.login))],
    readReceipts,
  };
}

function chatMessageSignature(messages = []) {
  return messages
    .map((message) => {
      const readBy = (message.readBy || []).slice().sort().join(",");
      return `${message.id}:${message.authorLogin}:${message.time}:${message.body}:${readBy}`;
    })
    .join("|");
}

function applyChatGroupSnapshot(snapshot) {
  customGroupConversations = Array.isArray(snapshot.groups) ? snapshot.groups.map(normalizeChatGroup) : [];
}

async function syncChatGroupsFromBackend(options = {}) {
  if (!backendAvailable || !isLoggedIn()) return false;
  try {
    const snapshot = await apiRequest("/chat/groups");
    applyChatGroupSnapshot(snapshot);
    return true;
  } catch {
    if (!options.silent) showToast("Grupy czatu", "Nie udało się pobrać grup z backendu.");
    return false;
  }
}

async function syncConversationMessagesFromBackend(conversationId, options = {}) {
  if (!backendAvailable || !isLoggedIn() || !conversationId) return false;
  try {
    const result = await apiRequest(`/chat/messages?conversationId=${encodeURIComponent(conversationId)}`, {
      headers: {},
    });
    const previousMessages = directMessages.get(conversationId) || [];
    const nextMessages = (result.messages || []).map(normalizeChatMessage);
    const changed = chatMessageSignature(previousMessages) !== chatMessageSignature(nextMessages);
    directMessages.set(conversationId, nextMessages);
    if (changed && options.notify) {
      const previousIds = new Set(previousMessages.map((message) => message.id));
      nextMessages
        .filter((message) => !previousIds.has(message.id))
        .filter((message) => message.authorLogin !== getActiveLogin())
        .forEach((message) => {
          if (notifiedChatMessageIds.has(message.id)) return;
          notifiedChatMessageIds.add(message.id);
          pushNotification("Nowa wiadomość", `${getDisplayNameByLogin(message.authorLogin)}: ${message.body}`, {
            view: "chat",
            conversationId,
          });
        });
    }
    return changed;
  } catch {
    return false;
  }
}

async function syncVisibleChatMessagesFromBackend(options = {}) {
  if (!backendAvailable || !isLoggedIn()) return false;
  const conversations = getChatConversations();
  const results = await Promise.all(
    conversations.map((conversation) => syncConversationMessagesFromBackend(conversation.id, options)),
  );
  return results.some(Boolean);
}

function isChatViewActive() {
  return Boolean($("#chat")?.classList.contains("active-view") && !document.hidden);
}

function hasUnreadIncomingMessages(conversationId) {
  const login = getActiveLogin();
  return (directMessages.get(conversationId) || []).some(
    (message) => message.authorLogin !== login && !(message.readBy || []).includes(login),
  );
}

function applyLocalReadReceipt(conversationId, readMessageIds) {
  const login = getActiveLogin();
  const ids = new Set(readMessageIds || []);
  if (!ids.size) return false;
  const messages = directMessages.get(conversationId) || [];
  let changed = false;
  directMessages.set(
    conversationId,
    messages.map((message) => {
      if (!ids.has(message.id) || message.authorLogin === login || (message.readBy || []).includes(login)) return message;
      changed = true;
      const readReceipts = [
        ...(message.readReceipts || []).filter((receipt) => receipt.login !== login),
        { login, readAt: "teraz" },
      ];
      return {
        ...message,
        readBy: [...new Set([...(message.readBy || []), login])],
        readReceipts,
      };
    }),
  );
  return changed;
}

async function markConversationRead(conversationId = currentConversation) {
  if (!isLoggedIn() || !conversationId || !isChatViewActive() || conversationId !== currentConversation) return false;
  if (!hasUnreadIncomingMessages(conversationId)) return false;

  if (!backendAvailable) {
    const readIds = (directMessages.get(conversationId) || [])
      .filter((message) => message.authorLogin !== getActiveLogin())
      .map((message) => message.id);
    const changed = applyLocalReadReceipt(conversationId, readIds);
    if (changed) saveChatMessageState();
    return changed;
  }

  if (chatReadInFlight.has(conversationId)) return false;
  chatReadInFlight.add(conversationId);
  try {
    const result = await apiRequest("/chat/messages/read", {
      method: "POST",
      body: JSON.stringify({ conversationId }),
    });
    return applyLocalReadReceipt(conversationId, result.readMessageIds || []);
  } catch {
    return false;
  } finally {
    chatReadInFlight.delete(conversationId);
  }
}

function markCurrentConversationRead() {
  const conversationId = currentConversation;
  window.setTimeout(() => {
    markConversationRead(conversationId);
  }, 0);
}

async function pollChatMessages() {
  if (chatPollInFlight || document.hidden || !backendAvailable || !isLoggedIn()) return;
  chatPollInFlight = true;
  try {
    const changed = await syncVisibleChatMessagesFromBackend({ notify: true });
    if (changed) {
      renderChat();
      if (isChatViewActive()) markCurrentConversationRead();
    }
  } finally {
    chatPollInFlight = false;
  }
}

function startChatPolling() {
  if (chatPollTimer || !backendAvailable || !isLoggedIn()) return;
  chatPollTimer = window.setInterval(pollChatMessages, chatPollIntervalMs);
}

function stopChatPolling() {
  if (!chatPollTimer) return;
  window.clearInterval(chatPollTimer);
  chatPollTimer = null;
  chatPollInFlight = false;
}

async function syncAccountsFromBackend(preferredLogin = $("#accountSelect")?.value, options = {}) {
  try {
    const snapshot = await apiRequest("/accounts");
    backendAvailable = true;
    applyAccountSnapshot(snapshot);
    renderAccountOptions(preferredLogin);
    return true;
  } catch {
    backendAvailable = false;
    if (!options.silent) {
      showToast("Backend niedostępny", "Aplikacja działa w trybie lokalnym.");
    }
    return false;
  }
}

function formatWorkDuration(seconds = 0) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function applyTimeSummary(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return false;
  timeSummary = snapshot;
  if (Array.isArray(snapshot.people)) {
    const byLogin = new Map(snapshot.people.map((person) => [person.login, person]));
    people = people.map((person) => ({ ...person, ...(byLogin.get(person.login) || {}) }));
  }
  renderTimeDashboard();
  renderSchedule();
  return true;
}

async function syncTimeSummaryFromBackend(options = {}) {
  if (!backendAvailable || !isLoggedIn()) return false;
  try {
    const snapshot = await apiRequest("/time/summary", { headers: {} });
    return applyTimeSummary(snapshot);
  } catch {
    if (!options.silent) showToast("Czas pracy", "Nie udało się pobrać statystyk czasu pracy.");
    return false;
  }
}

function renderTimeDashboard() {
  const personal = timeSummary?.personal || {};
  const pulse = timeSummary?.pulse || {};
  const today = $("#timeTodayStat");
  const week = $("#timeWeekStat");
  const month = $("#timeMonthStat");
  if (today) today.textContent = formatWorkDuration(personal.todaySeconds);
  if (week) week.textContent = formatWorkDuration(personal.weekSeconds);
  if (month) month.textContent = formatWorkDuration(personal.monthSeconds);

  const working = $("#timeWorkingCount");
  const breakCount = $("#timeBreakCount");
  const overtime = $("#timeOvertimeWeek");
  const pulseBadge = $("#timePulseBadge");
  if (working) working.textContent = String(pulse.workingNow || 0);
  if (breakCount) breakCount.textContent = String(pulse.breakNow || 0);
  if (overtime) overtime.textContent = formatWorkDuration(pulse.overtimeWeekSeconds);
  if (pulseBadge) {
    const missing = Number(pulse.missingToday || 0);
    pulseBadge.textContent = missing ? `${missing} nieobecnych` : "Aktualne";
    pulseBadge.className = `pill ${missing ? "amber" : "green"}`;
  }
}

function normalizePost(post) {
  return ensurePostSocial({
    id: post.id || `post-${Date.now()}`,
    title: post.title || "Ogłoszenie",
    body: post.body || "",
    priority: post.priority || "normal",
    author: post.author || getDisplayNameByLogin(post.authorLogin) || "Użytkownik",
    authorLogin: post.authorLogin || post.author_login || "",
    read: Number(post.read || 0),
    total: Number(post.total || activePeople().length || 1),
    unread: Boolean(post.unread),
    readers: Array.isArray(post.readers) ? post.readers : [],
    reactions: post.reactions && typeof post.reactions === "object" ? post.reactions : {},
    comments: Array.isArray(post.comments) ? post.comments : [],
    createdAt: post.createdAt || post.created_at || "",
  });
}

function announcementSignature(items = posts) {
  return JSON.stringify(
    items.map((post) => ({
      id: post.id,
      read: post.read,
      total: post.total,
      unread: post.unread,
      comments: post.comments?.length || 0,
      reactions: postReactionTypes.map((reaction) => post.reactions?.[reaction.id]?.length || 0),
    })),
  );
}

function applyAnnouncementSnapshot(snapshot) {
  if (!Array.isArray(snapshot.posts)) return false;
  posts = snapshot.posts.map(normalizePost);
  return true;
}

function renderAnnouncementState() {
  renderPosts(currentFeedFilter);
  if (activePostId && $("#postDialog")?.open) {
    const post = getPostById(activePostId);
    if (post) renderPostDialog(post);
  }
}

function applyAnnouncementMutationResult(result, postId = activePostId) {
  if (Array.isArray(result.posts)) {
    applyAnnouncementSnapshot(result);
  } else if (result.post) {
    const normalized = normalizePost(result.post);
    const index = posts.findIndex((post) => String(post.id) === String(normalized.id));
    if (index >= 0) posts[index] = normalized;
    else posts.unshift(normalized);
  }
  if (result.post?.id) activePostId = result.post.id;
  else if (postId) activePostId = postId;
  renderAnnouncementState();
  return getPostById(result.post?.id || postId);
}

async function syncAnnouncementsFromBackend(options = {}) {
  if (!backendAvailable || !isLoggedIn()) return false;
  const previousIds = new Set(posts.map((post) => String(post.id)));
  const previousSignature = announcementSignature(posts);
  try {
    const snapshot = await apiRequest("/announcements", { headers: {} });
    const nextPosts = Array.isArray(snapshot.posts) ? snapshot.posts.map(normalizePost) : [];
    const changed = previousSignature !== announcementSignature(nextPosts);
    posts = nextPosts;
    if (changed && options.notify) {
      posts
        .filter((post) => !previousIds.has(String(post.id)))
        .filter((post) => post.authorLogin !== getActiveLogin())
        .forEach((post) => {
          pushNotification("Nowe ogłoszenie", post.title, { view: "announcements", postId: post.id });
        });
    }
    return changed;
  } catch {
    if (!options.silent) showToast("Ogłoszenia", "Nie udało się pobrać ogłoszeń z backendu.");
    return false;
  }
}

async function pollAnnouncements() {
  if (announcementPollInFlight || document.hidden || !backendAvailable || !isLoggedIn()) return;
  announcementPollInFlight = true;
  try {
    const changed = await syncAnnouncementsFromBackend({ notify: true, silent: true });
    if (changed) renderAnnouncementState();
  } finally {
    announcementPollInFlight = false;
  }
}

function startAnnouncementPolling() {
  if (announcementPollTimer || !backendAvailable || !isLoggedIn()) return;
  announcementPollTimer = window.setInterval(pollAnnouncements, announcementPollIntervalMs);
}

function stopAnnouncementPolling() {
  if (!announcementPollTimer) return;
  window.clearInterval(announcementPollTimer);
  announcementPollTimer = null;
  announcementPollInFlight = false;
}

function normalizeTaskItem(task, fallbackColumn = "todo") {
  const column = task.column || task.column_key || fallbackColumn;
  return {
    id: task.id || makeTaskId(),
    title: task.title || "Nowe zadanie",
    owner: task.owner || getDisplayNameByLogin(task.ownerLogin || task.owner_login) || getActiveName(),
    ownerLogin: normalizeLogin(task.ownerLogin || task.owner_login || ""),
    due: task.due || "dziś",
    priority: task.priority || "normal",
    description: task.description || "Brak dodatkowego opisu.",
    source: task.source || columnLabels[column] || "Zadania",
    createdAt: task.createdAt || task.created_at || "Dzisiaj",
  };
}

function applyTaskSnapshot(snapshot) {
  if (!snapshot?.tasks || typeof snapshot.tasks !== "object") return false;
  const nextTasks = Object.fromEntries(Object.keys(columnLabels).map((column) => [column, []]));
  Object.entries(snapshot.tasks).forEach(([column, items]) => {
    if (!nextTasks[column] || !Array.isArray(items)) return;
    nextTasks[column] = items.map((task) => normalizeTaskItem(task, column));
  });
  tasks = nextTasks;
  normalizeTasks();
  return true;
}

function taskSignature(value = tasks) {
  return JSON.stringify(
    Object.entries(value).flatMap(([column, items]) =>
      (items || []).map((task) => [
        column,
        task.id,
        task.title,
        task.owner,
        task.ownerLogin,
        task.due,
        task.priority,
        task.description,
        task.source,
      ]),
    ),
  );
}

function renderTaskState() {
  renderKanban();
  if (activeTaskId && $("#taskDialog")?.open) {
    const ref = getTaskRef(activeTaskId);
    if (ref) openTaskDetails(activeTaskId);
    else $("#taskDialog")?.close();
  }
}

async function syncTasksFromBackend(options = {}) {
  if (!backendAvailable || !isLoggedIn()) return false;
  const previousSignature = taskSignature();
  try {
    const snapshot = await apiRequest("/tasks", { headers: {} });
    applyTaskSnapshot(snapshot);
    return previousSignature !== taskSignature();
  } catch {
    if (!options.silent) showToast("Zadania", "Nie udało się pobrać wspólnej listy zadań.");
    return false;
  }
}

async function pollTasks() {
  if (taskPollInFlight || document.hidden || !backendAvailable || !isLoggedIn()) return;
  taskPollInFlight = true;
  try {
    const changed = await syncTasksFromBackend({ silent: true });
    if (changed) renderTaskState();
  } finally {
    taskPollInFlight = false;
  }
}

function startTaskPolling() {
  if (taskPollTimer || !backendAvailable || !isLoggedIn()) return;
  taskPollTimer = window.setInterval(pollTasks, taskPollIntervalMs);
}

function stopTaskPolling() {
  if (!taskPollTimer) return;
  window.clearInterval(taskPollTimer);
  taskPollTimer = null;
  taskPollInFlight = false;
}

function makeReportId() {
  return `report-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeReport(report) {
  return {
    id: report.id || makeReportId(),
    category: report.category || "Sprawa organizacyjna",
    title: report.title || report.category || "Zgłoszenie",
    detail: report.detail || "",
    status: report.status || "Nowe",
    owner: report.owner || getDisplayNameByLogin(report.ownerLogin || report.owner_login) || getActiveName(),
    ownerLogin: normalizeLogin(report.ownerLogin || report.owner_login || ""),
    createdAt: report.createdAt || report.created_at || "teraz",
    updatedAt: report.updatedAt || report.updated_at || "",
  };
}

function normalizeReports() {
  reports = reports.map(normalizeReport);
}

function makeRequestId(request, index = 0) {
  const base = `${request.kind || "request"}-${request.title || ""}-${request.detail || ""}`;
  return `request-${slugifyLogin(base).slice(0, 70) || index}`;
}

function normalizeRequest(request, index = 0) {
  const kind = request.kind === "correction" ? "correction" : "leave";
  return {
    id: request.id || makeRequestId(request, index),
    title: request.title || (kind === "leave" ? "Wniosek urlopowy" : "Korekta czasu"),
    detail: request.detail || "",
    status: request.status || (kind === "leave" ? "Oczekuje" : "Do sprawdzenia"),
    kind,
    owner: request.owner || getDisplayNameByLogin(request.ownerLogin || request.owner_login) || getActiveName(),
    ownerLogin: normalizeLogin(request.ownerLogin || request.owner_login || ""),
    createdAt: request.createdAt || "",
    updatedAt: request.updatedAt || request.updated_at || "",
  };
}

function normalizeRequests() {
  requests = requests.map(normalizeRequest);
}

function saveRequestsState() {
  normalizeRequests();
  writeStorage(storageKeys.requests, requests);
}

function requestNeedsDecision(request) {
  return ["Oczekuje", "Do sprawdzenia"].includes(request.status);
}

function reportNeedsDecision(report) {
  return report.status === "Nowe";
}

function getDecisionItems() {
  normalizeRequests();
  normalizeReports();
  const requestDecisions = requests.filter(requestNeedsDecision).map((request) => ({
    id: `request:${request.id}`,
    type: "request",
    requestId: request.id,
    title: request.title,
    detail: request.detail,
    label: request.kind === "correction" ? "Akceptuj korektę" : "Akceptuj",
  }));
  const reportDecisions = reports.filter(reportNeedsDecision).map((report) => ({
    id: `report:${report.id}`,
    type: "report",
    reportId: report.id,
    title: `Zgłoszenie: ${report.title}`,
    detail: report.detail,
    label: "Utwórz zadanie",
  }));
  return [...requestDecisions, ...reportDecisions];
}

function requestSignature(value = requests) {
  return JSON.stringify(
    value.map((request) => [
      request.id,
      request.title,
      request.detail,
      request.status,
      request.kind,
      request.ownerLogin,
      request.updatedAt,
    ]),
  );
}

function applyRequestSnapshot(snapshot) {
  if (!Array.isArray(snapshot?.requests)) return false;
  requests = snapshot.requests.map(normalizeRequest);
  return true;
}

function renderRequestState() {
  renderRequests();
  applyRole();
}

async function syncRequestsFromBackend(options = {}) {
  if (!backendAvailable || !isLoggedIn()) return false;
  const previousIds = new Set(requests.map((request) => String(request.id)));
  const previousSignature = requestSignature();
  try {
    const snapshot = await apiRequest("/requests", { headers: {} });
    applyRequestSnapshot(snapshot);
    const changed = previousSignature !== requestSignature();
    if (changed && options.notify && currentUser?.role === "admin") {
      requests
        .filter(requestNeedsDecision)
        .filter((request) => !previousIds.has(String(request.id)))
        .filter((request) => request.ownerLogin !== getActiveLogin())
        .forEach((request) => {
          pushNotification("Nowy wniosek", request.title, { view: "time", requestId: request.id });
        });
    }
    return changed;
  } catch {
    if (!options.silent) showToast("Wnioski", "Nie udało się pobrać wspólnych wniosków.");
    return false;
  }
}

async function pollRequests() {
  if (requestPollInFlight || document.hidden || !backendAvailable || !isLoggedIn()) return;
  requestPollInFlight = true;
  try {
    const changed = await syncRequestsFromBackend({ notify: true, silent: true });
    if (changed) renderRequestState();
  } finally {
    requestPollInFlight = false;
  }
}

function startRequestPolling() {
  if (requestPollTimer || !backendAvailable || !isLoggedIn()) return;
  requestPollTimer = window.setInterval(pollRequests, requestPollIntervalMs);
}

function stopRequestPolling() {
  if (!requestPollTimer) return;
  window.clearInterval(requestPollTimer);
  requestPollTimer = null;
  requestPollInFlight = false;
}

function reportSignature(value = reports) {
  return JSON.stringify(
    value.map((report) => [
      report.id,
      report.category,
      report.title,
      report.detail,
      report.status,
      report.owner,
      report.ownerLogin,
      report.updatedAt,
    ]),
  );
}

function applyReportSnapshot(snapshot) {
  if (!Array.isArray(snapshot?.reports)) return false;
  reports = snapshot.reports.map(normalizeReport);
  return true;
}

function getReportById(reportId) {
  normalizeReports();
  return reports.find((report) => String(report.id) === String(reportId));
}

function renderReportState() {
  renderReports();
  applyRole();
}

async function syncReportsFromBackend(options = {}) {
  if (!backendAvailable || !isLoggedIn()) return false;
  const previousIds = new Set(reports.map((report) => String(report.id)));
  const previousSignature = reportSignature();
  try {
    const snapshot = await apiRequest("/reports", { headers: {} });
    applyReportSnapshot(snapshot);
    const changed = previousSignature !== reportSignature();
    if (changed && options.notify) {
      reports
        .filter((report) => !previousIds.has(String(report.id)))
        .filter((report) => report.ownerLogin !== getActiveLogin())
        .forEach((report) => {
          pushNotification("Nowe zgłoszenie", `${report.category}: ${report.detail}`, { view: "reports" });
        });
    }
    return changed;
  } catch {
    if (!options.silent) showToast("Zgłoszenia", "Nie udało się pobrać wspólnej listy zgłoszeń.");
    return false;
  }
}

async function pollReports() {
  if (reportPollInFlight || document.hidden || !backendAvailable || !isLoggedIn()) return;
  reportPollInFlight = true;
  try {
    const changed = await syncReportsFromBackend({ notify: true, silent: true });
    if (changed) renderReportState();
  } finally {
    reportPollInFlight = false;
  }
}

function startReportPolling() {
  if (reportPollTimer || !backendAvailable || !isLoggedIn()) return;
  reportPollTimer = window.setInterval(pollReports, reportPollIntervalMs);
}

function stopReportPolling() {
  if (!reportPollTimer) return;
  window.clearInterval(reportPollTimer);
  reportPollTimer = null;
  reportPollInFlight = false;
}

function makeCalendarEventId() {
  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeCalendarEvent(event) {
  return {
    id: event.id || makeCalendarEventId(),
    day: Number(event.day || 1),
    title: event.title || "Wydarzenie",
    date: event.date || event.date_label || "",
    time: event.time || event.time_label || "",
    rsvp: event.rsvp || "Niepotwierdzone",
    attendees: Number(event.attendees || 0),
    createdBy: event.createdBy || event.created_by || "",
    createdAt: event.createdAt || event.created_at || "",
  };
}

function applyCalendarSnapshot(snapshot) {
  if (!Array.isArray(snapshot?.events)) return false;
  calendarEvents = snapshot.events.map(normalizeCalendarEvent);
  return true;
}

function calendarSignature(value = calendarEvents) {
  return JSON.stringify(
    value.map((event) => [
      event.id,
      event.day,
      event.title,
      event.date,
      event.time,
      event.rsvp,
      event.attendees,
    ]),
  );
}

function renderCalendarState() {
  renderCalendar();
}

async function syncCalendarFromBackend(options = {}) {
  if (!backendAvailable || !isLoggedIn()) return false;
  const previousIds = new Set(calendarEvents.map((event) => String(event.id)));
  const previousSignature = calendarSignature();
  try {
    const snapshot = await apiRequest("/calendar", { headers: {} });
    applyCalendarSnapshot(snapshot);
    const changed = previousSignature !== calendarSignature();
    if (changed && options.notify) {
      calendarEvents
        .filter((event) => !previousIds.has(String(event.id)))
        .filter((event) => event.createdBy !== getActiveLogin())
        .forEach((event) => {
          pushNotification("Nowe wydarzenie", event.title, { view: "calendar" });
        });
    }
    return changed;
  } catch {
    if (!options.silent) showToast("Kalendarz", "Nie udało się pobrać wspólnego kalendarza.");
    return false;
  }
}

async function pollCalendar() {
  if (calendarPollInFlight || document.hidden || !backendAvailable || !isLoggedIn()) return;
  calendarPollInFlight = true;
  try {
    const changed = await syncCalendarFromBackend({ notify: true, silent: true });
    if (changed) renderCalendarState();
  } finally {
    calendarPollInFlight = false;
  }
}

function startCalendarPolling() {
  if (calendarPollTimer || !backendAvailable || !isLoggedIn()) return;
  calendarPollTimer = window.setInterval(pollCalendar, calendarPollIntervalMs);
}

function stopCalendarPolling() {
  if (!calendarPollTimer) return;
  window.clearInterval(calendarPollTimer);
  calendarPollTimer = null;
  calendarPollInFlight = false;
}

function makeKnowledgeArticleId() {
  return `kb-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeHandoverNoteId() {
  return `handover-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeKnowledgeArticle(article) {
  const fileName = article.fileName || article.file_name || "";
  const fileMime = article.fileMime || article.file_mime || "";
  return {
    id: article.id || makeKnowledgeArticleId(),
    type: article.type || fileIcon(fileMime, fileName) || "PLIK",
    title: article.title || "Dokument",
    detail: article.detail || "",
    fileName,
    fileMime,
    fileSize: Number(article.fileSize || article.file_size || 0),
    fileUrl: article.fileUrl || article.file_url || "",
    createdBy: article.createdBy || article.created_by || "",
    createdAt: article.createdAt || article.created_at || "",
  };
}

function normalizeHandoverNote(note) {
  return {
    id: note.id || makeHandoverNoteId(),
    authorLogin: normalizeLogin(note.authorLogin || note.author_login || ""),
    author: note.author || getDisplayNameByLogin(note.authorLogin || note.author_login) || "Użytkownik",
    text: note.text || "",
    time: note.time || note.time_label || "teraz",
    accepted: Boolean(note.accepted),
    acceptedCount: Number(note.acceptedCount || note.accepted_count || (note.accepted ? 1 : 0)),
    createdAt: note.createdAt || note.created_at || "",
  };
}

function applyKnowledgeSnapshot(snapshot) {
  if (Array.isArray(snapshot?.articles)) {
    kbArticles = snapshot.articles.map(normalizeKnowledgeArticle);
  }
  if (Array.isArray(snapshot?.handoverNotes)) {
    handoverNotes = snapshot.handoverNotes.map(normalizeHandoverNote);
  }
  return Array.isArray(snapshot?.articles) || Array.isArray(snapshot?.handoverNotes);
}

function knowledgeSignature() {
  return JSON.stringify({
    articles: kbArticles.map((article) => [
      article.id,
      article.type,
      article.title,
      article.detail,
      article.fileName,
      article.fileSize,
    ]),
    notes: handoverNotes.map((note) => [
      note.id,
      note.authorLogin,
      note.author,
      note.text,
      note.time,
      note.accepted,
      note.acceptedCount,
    ]),
  });
}

function renderKnowledgeState() {
  renderKnowledge();
}

async function syncKnowledgeFromBackend(options = {}) {
  if (!backendAvailable || !isLoggedIn()) return false;
  const previousArticleIds = new Set(kbArticles.map((article) => String(article.id)));
  const previousNoteIds = new Set(handoverNotes.map((note) => String(note.id)));
  const previousSignature = knowledgeSignature();
  try {
    const snapshot = await apiRequest("/knowledge", { headers: {} });
    applyKnowledgeSnapshot(snapshot);
    const changed = previousSignature !== knowledgeSignature();
    if (changed && options.notify) {
      kbArticles
        .filter((article) => !previousArticleIds.has(String(article.id)))
        .filter((article) => article.createdBy !== getActiveLogin())
        .forEach((article) => {
          pushNotification("Baza wiedzy", `Dodano dokument: ${article.title}`, { view: "knowledge" });
        });
      handoverNotes
        .filter((note) => !previousNoteIds.has(String(note.id)))
        .filter((note) => note.authorLogin !== getActiveLogin())
        .forEach((note) => {
          pushNotification("Zeszyt zmiany", `Nowa notatka: ${note.author}`, { view: "knowledge" });
        });
    }
    return changed;
  } catch {
    if (!options.silent) showToast("Baza wiedzy", "Nie udało się pobrać wspólnych dokumentów.");
    return false;
  }
}

async function pollKnowledge() {
  if (knowledgePollInFlight || document.hidden || !backendAvailable || !isLoggedIn()) return;
  knowledgePollInFlight = true;
  try {
    const changed = await syncKnowledgeFromBackend({ notify: true, silent: true });
    if (changed) renderKnowledgeState();
  } finally {
    knowledgePollInFlight = false;
  }
}

function startKnowledgePolling() {
  if (knowledgePollTimer || !backendAvailable || !isLoggedIn()) return;
  knowledgePollTimer = window.setInterval(pollKnowledge, knowledgePollIntervalMs);
}

function stopKnowledgePolling() {
  if (!knowledgePollTimer) return;
  window.clearInterval(knowledgePollTimer);
  knowledgePollTimer = null;
  knowledgePollInFlight = false;
}

async function pollPresence() {
  if (presencePollInFlight || document.hidden || !backendAvailable || !isLoggedIn()) return;
  presencePollInFlight = true;
  try {
    await refreshPresence();
  } finally {
    presencePollInFlight = false;
  }
}

async function refreshPresence() {
  if (!backendAvailable || !isLoggedIn()) return false;
  const synced = await syncAccountsFromBackend(currentUser?.login, { silent: true });
  await syncTimeSummaryFromBackend({ silent: true });
  if (synced) {
    renderPeople();
    renderChat();
    updateClockControls();
  }
  return synced;
}

function startPresencePolling() {
  if (presencePollTimer || !backendAvailable || !isLoggedIn()) return;
  presencePollTimer = window.setInterval(pollPresence, presencePollIntervalMs);
}

function stopPresencePolling() {
  if (!presencePollTimer) return;
  window.clearInterval(presencePollTimer);
  presencePollTimer = null;
  presencePollInFlight = false;
}

function loadStoredState() {
  const accountState = readStorage(storageKeys.accounts);
  if (Array.isArray(accountState?.people) && Array.isArray(accountState?.accounts)) {
    people = accountState.people;
    accounts = accountState.accounts;
  }

  const storedMyDay = readStorage(storageKeys.myDay);
  if (Array.isArray(storedMyDay)) {
    myDayItems = storedMyDay;
  }

  const storedRequests = readStorage(storageKeys.requests);
  if (Array.isArray(storedRequests)) {
    requests = storedRequests;
  }

  const storedTasks = readStorage(storageKeys.tasks);
  if (storedTasks && typeof storedTasks === "object") {
    tasks = { ...tasks, ...storedTasks };
  }

  const storedChatGroups = readStorage(storageKeys.chatGroups);
  if (Array.isArray(storedChatGroups)) {
    customGroupConversations = storedChatGroups.map(normalizeChatGroup);
  }
  const storedChatMessages = readStorage(storageKeys.chatMessages);
  if (storedChatMessages && typeof storedChatMessages === "object") {
    Object.entries(storedChatMessages).forEach(([conversationId, messages]) => {
      if (Array.isArray(messages)) {
        directMessages.set(conversationId, messages.map(normalizeChatMessage));
      }
    });
  }
  const storedNotificationReadIds = readStorage(storageKeys.notificationReadIds, []);
  notificationReadIds = new Set(Array.isArray(storedNotificationReadIds) ? storedNotificationReadIds.map(String) : []);
  normalizeRequests();
  normalizeTasks();
  normalizeReports();
}

function saveAccountState() {
  if (backendAvailable) return;
  writeStorage(storageKeys.accounts, { people, accounts: accounts });
}

function saveMyDayState() {
  writeStorage(storageKeys.myDay, myDayItems);
}

function makeTaskId() {
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTasks() {
  Object.keys(columnLabels).forEach((column) => {
    tasks[column] = Array.isArray(tasks[column]) ? tasks[column] : [];
    tasks[column] = tasks[column].map((task, index) => ({
      id: task.id || `task-${column}-${index}-${slugifyLogin(task.title || "zadanie")}`,
      title: task.title || "Nowe zadanie",
      owner: task.owner || getActiveName(),
      ownerLogin: normalizeLogin(task.ownerLogin || task.owner_login || ""),
      due: task.due || "dziś",
      priority: task.priority || "normal",
      description: task.description || "Brak dodatkowego opisu. Uzupełnij szczegóły przy kolejnym dopracowaniu zadania.",
      source: task.source || columnLabels[column],
      createdAt: task.createdAt || "Dzisiaj",
    }));
  });
}

function saveTaskState() {
  normalizeTasks();
  if (backendAvailable) return;
  writeStorage(storageKeys.tasks, tasks);
}

function saveChatGroupState() {
  if (backendAvailable) return;
  writeStorage(storageKeys.chatGroups, customGroupConversations);
}

function saveChatMessageState() {
  if (backendAvailable) return;
  writeStorage(storageKeys.chatMessages, Object.fromEntries(directMessages));
}

function makeInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2);
}

function slugifyLogin(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function activePeople() {
  return people.filter((person) => person.active !== false);
}

function activeAccounts() {
  return accounts.filter((account) => account.active !== false);
}

function presenceStatusForState(state, active = true) {
  if (!active) return "Wyłączone";
  if (state === "work") return "W pracy";
  if (state === "break") return "Przerwa";
  return "Niewbity";
}

function statusDotClass(state) {
  if (state === "break") return "break";
  if (state === "work") return "";
  return "off";
}

function getCurrentPerson() {
  return people.find((person) => person.login === getActiveLogin());
}

function getActiveName() {
  return currentUser?.name || "Tadeusz";
}

function getActiveLogin() {
  return currentUser?.login || "tadeusz";
}

function getActiveInitials() {
  return currentUser?.initials || "TA";
}

function isLoggedIn() {
  return Boolean(currentUser);
}

function updateAuthUi() {
  $("#loginScreen").classList.toggle("hidden", isLoggedIn());
  $("#appShell").classList.toggle("hidden", !isLoggedIn());
  if (!isLoggedIn()) return;

  $("#currentUserAvatar").textContent = getActiveInitials();
  $("#currentUserName").textContent = currentUser.label;
  $("#currentUserRole").textContent = currentUser.isRoot
    ? "root / SQL"
    : currentUser.role === "admin"
      ? "admin"
      : "pracownik";
  $("#dashboardGreeting").textContent = `Dzień dobry, ${getActiveName()}`;
  $("#passwordAccountLabel").textContent = getActiveLogin();
  $("#roleSelect").value = role;
  $("#roleSelect").disabled = currentUser.role !== "admin";
}

function refreshUserScopedUi() {
  updateAuthUi();
  applyRole();
  renderMyDay();
  renderPeople();
  renderPosts(currentFeedFilter);
  renderKanban();
  renderRequests();
  renderReports();
  renderStats();
  renderCalendar();
  renderChat();
  renderKnowledge();
  renderNotifications();
}

function updateLoginFields() {
  const selectedLogin = $("#accountSelect").value;
  const selectedAccount = findAccountByLogin(selectedLogin);
  const needsPassword = Boolean(selectedAccount?.requiresPassword || selectedAccount?.password);
  $("#passwordField").classList.toggle("hidden", !needsPassword);
  $("#passwordInput").required = needsPassword;
  if (!needsPassword) $("#passwordInput").value = "";
  $("#loginError").classList.add("hidden");
}

function normalizeLogin(login) {
  return String(login || "").trim().toLowerCase();
}

function findAccountByLogin(login) {
  return accounts.find((item) => item.login === normalizeLogin(login) && item.active !== false);
}

function renderAccountOptions(preferredLogin = $("#accountSelect")?.value || "tadeusz") {
  const select = $("#accountSelect");
  if (!select) return;
  const accounts = activeAccounts();
  select.innerHTML = accounts
    .map((account) => {
      const label = account.isRoot ? "root" : account.role === "admin" ? "administrator" : "pracownik";
      return `<option value="${escapeHtml(account.login)}">${escapeHtml(account.login)} - ${label}</option>`;
    })
    .join("");
  const nextLogin = accounts.some((account) => account.login === preferredLogin) ? preferredLogin : accounts[0]?.login;
  if (nextLogin) select.value = nextLogin;
  updateLoginFields();
}

async function signIn(login, password = "") {
  if (backendAvailable) {
    try {
      const result = await apiRequest("/login", {
        method: "POST",
        body: JSON.stringify({ login, password }),
      });
      currentUser = normalizeApiAccount(result.user);
      role = currentUser.role;
      localStorage.setItem("prokom-user", JSON.stringify({ login: currentUser.login, backend: true }));
      await syncAccountsFromBackend(currentUser.login, { silent: true });
      await syncTimeSummaryFromBackend({ silent: true });
      await syncAnnouncementsFromBackend({ silent: true });
      await syncTasksFromBackend({ silent: true });
      await syncReportsFromBackend({ silent: true });
      await syncRequestsFromBackend({ silent: true });
      await syncCalendarFromBackend({ silent: true });
      await syncKnowledgeFromBackend({ silent: true });
      await syncChatGroupsFromBackend({ silent: true });
      await syncVisibleChatMessagesFromBackend();
      startAnnouncementPolling();
      startTaskPolling();
      startReportPolling();
      startRequestPolling();
      startCalendarPolling();
      startKnowledgePolling();
      startChatPolling();
      startPresencePolling();
      $("#loginError").classList.add("hidden");
      refreshUserScopedUi();
      activateView("dashboard");
      showToast("Zalogowano przez backend", `Konto: ${currentUser.label}`);
      return;
    } catch (error) {
      $("#loginError").textContent = error.message || "Nie udało się zalogować przez backend.";
      $("#loginError").classList.remove("hidden");
      return;
    }
  }

  const account = findAccountByLogin(login);
  if (!account) {
    $("#loginError").textContent = "Wybierz istniejące konto.";
    $("#loginError").classList.remove("hidden");
    return;
  }
  if (account.password && account.password !== password) {
    $("#loginError").textContent = "Nieprawidłowe hasło.";
    $("#loginError").classList.remove("hidden");
    return;
  }
  currentUser = { ...account };
  role = account.role;
  localStorage.setItem(
    "prokom-user",
    JSON.stringify({ login: account.login, passwordVerified: Boolean(account.password) }),
  );
  $("#loginError").classList.add("hidden");
  refreshUserScopedUi();
  activateView("dashboard");
  showToast("Zalogowano", `Konto: ${account.label}`);
}

function signOut() {
  stopAnnouncementPolling();
  stopTaskPolling();
  stopReportPolling();
  stopRequestPolling();
  stopCalendarPolling();
  stopKnowledgePolling();
  stopChatPolling();
  stopPresencePolling();
  if (backendAvailable) {
    apiRequest("/logout", { method: "POST" }).catch(() => {});
  }
  currentUser = null;
  localStorage.removeItem("prokom-user");
  renderAccountOptions("tadeusz");
  $("#passwordInput").value = "";
  updateLoginFields();
  updateAuthUi();
}

async function restoreSession() {
  if (backendAvailable) {
    try {
      const result = await apiRequest("/me");
      currentUser = normalizeApiAccount(result.user);
      role = currentUser.role;
      localStorage.setItem("prokom-user", JSON.stringify({ login: currentUser.login, backend: true }));
      await syncAccountsFromBackend(currentUser.login, { silent: true });
      await syncTimeSummaryFromBackend({ silent: true });
      await syncAnnouncementsFromBackend({ silent: true });
      await syncTasksFromBackend({ silent: true });
      await syncReportsFromBackend({ silent: true });
      await syncRequestsFromBackend({ silent: true });
      await syncCalendarFromBackend({ silent: true });
      await syncKnowledgeFromBackend({ silent: true });
      await syncChatGroupsFromBackend({ silent: true });
      await syncVisibleChatMessagesFromBackend();
      startAnnouncementPolling();
      startTaskPolling();
      startReportPolling();
      startRequestPolling();
      startCalendarPolling();
      startKnowledgePolling();
      startChatPolling();
      startPresencePolling();
      refreshUserScopedUi();
      return;
    } catch {
      localStorage.removeItem("prokom-user");
      updateAuthUi();
      return;
    }
  }

  const savedSession = localStorage.getItem("prokom-user");
  let parsedSession = null;
  try {
    parsedSession = savedSession ? JSON.parse(savedSession) : null;
  } catch {
    parsedSession = { login: savedSession, passwordVerified: false };
  }
  const account = findAccountByLogin(parsedSession?.login);
  if (!account) {
    updateAuthUi();
    return;
  }
  if (account.password && !parsedSession.passwordVerified) {
    localStorage.removeItem("prokom-user");
    updateAuthUi();
    return;
  }
  currentUser = { ...account };
  role = account.role;
  refreshUserScopedUi();
}

function formatTimer(ms) {
  const total = Math.floor(ms / 1000);
  const hours = String(Math.floor(total / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function currentElapsed() {
  if (!clockedIn || !startedAt) return elapsedBefore;
  return elapsedBefore + Date.now() - startedAt;
}

function renderTimer() {
  const value = formatTimer(currentElapsed());
  $("#liveTimer").textContent = value;
  $("#timeHeroTimer").textContent = value;
}

function updateClockControls() {
  $(".clock-card")?.setAttribute("data-clock-state", clockedIn ? (breakActive ? "break" : "in") : "out");
  $("#clockStatus").textContent = clockedIn ? (breakActive ? "Przerwa" : "W pracy") : "Niewbity";
  $("#timeHeroStatus").textContent = clockedIn
    ? breakActive
      ? "Przerwa w trakcie"
      : "Zmiana rozpoczęta"
    : "Poza pracą";
  $("#clockButton").textContent = clockedIn ? "Wybijam się" : "Wbijam się";
  $("#timeClockButton").textContent = clockedIn ? "Wybijam się" : "Wbijam się";
  $("#breakButton").textContent = breakActive ? "Koniec przerwy" : "Przerwa";
  $("#breakButton").disabled = !clockedIn;
}

function setCurrentPersonPresence(state) {
  const person = getCurrentPerson();
  if (!person) return;
  person.state = state;
  person.status = presenceStatusForState(state, person.active !== false);
  renderPeople();
  renderChat();
}

function syncClockStateFromCurrentPerson() {
  if (!isLoggedIn()) return;
  const person = getCurrentPerson();
  if (!person) return;
  const nextClockedIn = ["work", "break"].includes(person.state);
  const nextBreakActive = person.state === "break";
  if (clockedIn !== nextClockedIn || breakActive !== nextBreakActive) {
    clockedIn = nextClockedIn;
    breakActive = nextBreakActive;
    if (clockedIn && !startedAt) startedAt = Date.now();
    if (!clockedIn) {
      startedAt = null;
      if (timerId) clearInterval(timerId);
      timerId = null;
    } else if (!timerId) {
      timerId = setInterval(renderTimer, 500);
    }
  }
  updateClockControls();
  renderTimer();
}

async function savePresenceState() {
  if (!backendAvailable || !isLoggedIn()) return;
  try {
    const result = await apiRequest("/time/presence", {
      method: "PATCH",
      body: JSON.stringify({ clockedIn, breakActive }),
    });
    applyAccountSnapshot(result);
    syncClockStateFromCurrentPerson();
    await syncTimeSummaryFromBackend({ silent: true });
    renderPeople();
    renderChat();
  } catch (error) {
    showToast("Nie zapisano statusu", error.message || "Backend odrzucił zmianę obecności.");
  }
}

async function toggleClock() {
  if (!clockedIn) {
    clockedIn = true;
    breakActive = false;
    startedAt = Date.now();
    if (!timerId) timerId = setInterval(renderTimer, 500);
    setCurrentPersonPresence("work");
  } else {
    elapsedBefore = currentElapsed();
    clockedIn = false;
    breakActive = false;
    startedAt = null;
    if (timerId) clearInterval(timerId);
    timerId = null;
    setCurrentPersonPresence("out");
  }
  updateClockControls();
  renderTimer();
  await savePresenceState();
}

async function toggleBreak() {
  if (!clockedIn) return;
  breakActive = !breakActive;
  setCurrentPersonPresence(breakActive ? "break" : "work");
  updateClockControls();
  await savePresenceState();
}

function renderMyDay() {
  const done = myDayItems.filter((item) => item.done).length;
  const total = myDayItems.length;
  const count = $("#myDayCount");
  count.textContent = `${done} z ${total}`;
  count.className = `pill ${total === 0 || done === total ? "green" : done === 0 ? "red" : "amber"}`;

  $("#myDayList").innerHTML = myDayItems
    .map(
      (item) => `
        <div class="checklist-item">
          <label>
            <input type="checkbox" data-myday-check="${item.id}" ${item.done ? "checked" : ""} />
            <span>${escapeHtml(item.title)}</span>
          </label>
          <button class="mini-icon-button" data-myday-remove="${item.id}" type="button" aria-label="Usuń wpis">&times;</button>
        </div>
      `,
    )
    .join("");
}

function addMyDayItem(event) {
  event.preventDefault();
  const input = $("#myDayInput");
  const title = input.value.trim();
  if (!title) return;
  const nextId = myDayItems.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  myDayItems.push({ id: nextId, title, done: false });
  input.value = "";
  saveMyDayState();
  renderMyDay();
  showToast("Dodano wpis", title);
}

function renderPeople() {
  const visiblePeople = activePeople();
  const workingPeople = visiblePeople.filter((person) => ["work", "break"].includes(person.state));
  const small = workingPeople.length
    ? workingPeople
    .map(
      (person) => `
        <div class="person">
          <div class="avatar">${escapeHtml(person.initials)}</div>
          <div>
            <strong>${escapeHtml(person.name)}</strong>
            <div class="muted">${escapeHtml(person.status)}</div>
          </div>
          <span class="status-dot ${statusDotClass(person.state)}"></span>
        </div>
      `,
    )
    .join("")
    : `<div class="empty-state">Nikt nie jest teraz wbity.</div>`;

  $("#peopleToday").innerHTML = small;
  $("#peopleTodayCount").textContent = `${workingPeople.length} osób`;
  const timeWorkingCount = $("#timeWorkingCount");
  if (timeWorkingCount) timeWorkingCount.textContent = String(workingPeople.length);
  $("#teamGrid").innerHTML = visiblePeople
    .map(
      (person) => `
        <article class="team-card">
          <div class="avatar">${escapeHtml(person.initials)}</div>
          <div class="meta">
            <strong>${escapeHtml(person.name)}</strong>
            <span class="muted">${escapeHtml(person.role)}</span>
            <span>${escapeHtml(person.status)}</span>
            <span class="muted">Urlop: ${person.name === "Paweł" ? "12/26" : "18/26"} dni</span>
          </div>
          <span class="status-dot ${statusDotClass(person.state)}"></span>
        </article>
      `,
    )
    .join("");

  $("#recipientGrid").innerHTML = people
    .filter((person) => person.active !== false && person.name !== getActiveName())
    .map(
      (person) => `
        <label>
          <input data-announcement-recipient type="checkbox" value="${escapeHtml(person.login)}" checked />
          <span class="avatar">${escapeHtml(person.initials)}</span>
          ${escapeHtml(person.name)}
        </label>
      `,
    )
    .join("");

  renderAccountManagement();
}

function renderAccountManagement() {
  const list = $("#accountManagementList");
  if (!list) return;
  const activeCount = activeAccounts().length;
  $("#accountCount").textContent = `${activeCount} aktywnych`;
  list.innerHTML = accounts
    .map((account) => {
      const person = people.find((item) => item.login === account.login);
      const isProtected = account.isRoot;
      const isCurrent = account.login === currentUser?.login;
      const active = account.active !== false;
      return `
        <article class="account-management-card ${active ? "" : "inactive"}">
          <div class="avatar">${escapeHtml(account.initials)}</div>
          <div class="meta">
            <strong>${escapeHtml(account.name)}</strong>
            <span class="muted">${escapeHtml(account.login)} · ${account.role === "admin" ? "admin" : "pracownik"} · ${escapeHtml(
              person?.role || account.teamRole || "Pracownik",
            )}</span>
            <span class="pill ${active ? "green" : "red"}">${active ? "Aktywne" : "Wyłączone"}</span>
          </div>
          <div class="account-actions">
            <select data-account-role="${escapeHtml(account.login)}" ${isProtected || isCurrent ? "disabled" : ""}>
              <option value="employee" ${account.role === "employee" ? "selected" : ""}>Pracownik</option>
              <option value="admin" ${account.role === "admin" ? "selected" : ""}>Admin</option>
            </select>
            <button class="secondary-button" data-account-toggle="${escapeHtml(account.login)}" type="button" ${
              isProtected || isCurrent ? "disabled" : ""
            }>${active ? "Wyłącz" : "Włącz"}</button>
            <button class="secondary-button" data-account-remove="${escapeHtml(account.login)}" type="button" ${
              isProtected || isCurrent ? "disabled" : ""
            }>Usuń</button>
          </div>
          <form class="account-password-form admin-only" data-account-password-form="${escapeHtml(account.login)}">
            <input data-account-password="${escapeHtml(account.login)}" type="password" minlength="4" placeholder="Nowe hasło" autocomplete="new-password" />
            <button class="secondary-button" type="submit">Zmień hasło</button>
          </form>
        </article>
      `;
    })
    .join("");
}

function syncAccountPerson(account) {
  const person = people.find((item) => item.login === account.login);
  if (person) {
    person.name = account.name;
    person.initials = account.initials;
    person.role = account.teamRole || (account.role === "admin" ? "Administrator" : "Pracownik");
    person.active = account.active !== false;
    return;
  }
  people.push({
    login: account.login,
    name: account.name,
    role: account.teamRole || (account.role === "admin" ? "Administrator" : "Pracownik"),
    initials: account.initials,
    status: "Niewbity",
    state: "out",
    active: account.active !== false,
  });
}

function removeConversationMessagesForLogin(login) {
  const normalized = normalizeLogin(login);
  [...directMessages.keys()].forEach((conversationId) => {
    if (conversationId.startsWith("dm:") && conversationId.split(":").includes(normalized)) {
      directMessages.delete(conversationId);
    }
  });
  saveChatMessageState();
}

async function createAccount(event) {
  event.preventDefault();
  const name = $("#accountNameInput").value.trim();
  const login = slugifyLogin($("#accountLoginInput").value || name);
  const accountRole = $("#accountRoleInput").value;
  const teamRole =
    accountRole === "admin" ? "Administrator" : $("#accountTeamRoleInput").value.trim() || "Pracownik";
  if (!name || !login) return;
  if (accounts.some((account) => account.login === login)) {
    showToast("Login zajęty", "Wybierz inny login dla nowego konta.");
    return;
  }

  if (backendAvailable) {
    try {
      const snapshot = await apiRequest("/users", {
        method: "POST",
        body: JSON.stringify({ name, login, role: accountRole, teamRole }),
      });
      applyAccountSnapshot(snapshot);
      event.target.reset();
      $("#accountTeamRoleInput").value = "Pracownik";
      renderAccountOptions(login);
      refreshUserScopedUi();
      pushNotification("Nowe konto", `${name} może zalogować się jako ${login}.`, { view: "team" });
      showToast("Konto dodane w bazie", `${name} jest widoczny w zespole.`);
      return;
    } catch (error) {
      showToast("Nie dodano konta", error.message || "Backend odrzucił zapis.");
      return;
    }
  }

  const account = {
    login,
    name,
    label: name,
    role: accountRole,
    teamRole,
    initials: makeInitials(name),
    active: true,
  };
  accounts.push(account);
  syncAccountPerson(account);
  saveAccountState();
  event.target.reset();
  $("#accountTeamRoleInput").value = "Pracownik";
  renderAccountOptions(login);
  refreshUserScopedUi();
  pushNotification("Nowe konto", `${name} może zalogować się jako ${login}.`, { view: "team" });
  showToast("Konto dodane", `${name} jest widoczny w zespole.`);
}

async function setAccountRole(login, nextRole) {
  const account = accounts.find((item) => item.login === login);
  if (!account || account.isRoot || account.login === currentUser?.login) return;
  if (backendAvailable) {
    try {
      const snapshot = await apiRequest(`/users/${encodeURIComponent(login)}`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole, active: account.active !== false }),
      });
      applyAccountSnapshot(snapshot);
      renderAccountOptions(currentUser?.login || "tadeusz");
      refreshUserScopedUi();
      showToast("Uprawnienia zmienione w bazie", `${account.name}: ${nextRole === "admin" ? "admin" : "pracownik"}.`);
    } catch (error) {
      renderAccountManagement();
      showToast("Nie zmieniono uprawnień", error.message || "Backend odrzucił zmianę.");
    }
    return;
  }
  account.role = nextRole;
  account.teamRole = nextRole === "admin" ? "Administrator" : account.teamRole || "Pracownik";
  syncAccountPerson(account);
  saveAccountState();
  renderAccountOptions(currentUser?.login || "tadeusz");
  refreshUserScopedUi();
  showToast("Uprawnienia zmienione", `${account.name}: ${nextRole === "admin" ? "admin" : "pracownik"}.`);
}

async function toggleAccount(login) {
  const account = accounts.find((item) => item.login === login);
  if (!account || account.isRoot || account.login === currentUser?.login) return;
  if (backendAvailable) {
    try {
      const nextActive = account.active === false;
      const snapshot = await apiRequest(`/users/${encodeURIComponent(login)}`, {
        method: "PATCH",
        body: JSON.stringify({ role: account.role, active: nextActive }),
      });
      applyAccountSnapshot(snapshot);
      renderAccountOptions(currentUser?.login || "tadeusz");
      refreshUserScopedUi();
      showToast(nextActive ? "Konto włączone w bazie" : "Konto wyłączone w bazie", account.name);
    } catch (error) {
      showToast("Nie zmieniono konta", error.message || "Backend odrzucił zmianę.");
    }
    return;
  }
  account.active = account.active === false;
  const person = people.find((item) => item.login === login);
  if (person) person.active = account.active;
  saveAccountState();
  renderAccountOptions(currentUser?.login || "tadeusz");
  refreshUserScopedUi();
  showToast(account.active ? "Konto włączone" : "Konto wyłączone", account.name);
}

async function removeAccount(login) {
  const account = accounts.find((item) => item.login === login);
  if (!account || account.isRoot || account.login === currentUser?.login) return;
  if (backendAvailable) {
    try {
      const snapshot = await apiRequest(`/users/${encodeURIComponent(login)}`, { method: "DELETE" });
      applyAccountSnapshot(snapshot);
      removeConversationMessagesForLogin(login);
      renderAccountOptions(currentUser?.login || "tadeusz");
      refreshUserScopedUi();
      showToast("Konto usunięte z bazy", account.name);
    } catch (error) {
      showToast("Nie usunięto konta", error.message || "Backend odrzucił usunięcie.");
    }
    return;
  }
  accounts = accounts.filter((item) => item.login !== login);
  people = people.filter((item) => item.login !== login);
  removeConversationMessagesForLogin(login);
  saveAccountState();
  renderAccountOptions(currentUser?.login || "tadeusz");
  refreshUserScopedUi();
  showToast("Konto usunięte", account.name);
}

function applyPasswordChangeSnapshot(result, login) {
  if (Array.isArray(result?.accounts)) {
    applyAccountSnapshot(result);
  } else if (result?.user) {
    const updated = normalizeApiAccount(result.user);
    const index = accounts.findIndex((account) => account.login === updated.login);
    if (index >= 0) accounts[index] = updated;
  }
  const updatedAccount = accounts.find((account) => account.login === login);
  if (updatedAccount?.login === currentUser?.login) {
    currentUser = { ...currentUser, ...updatedAccount };
    role = currentUser.role;
  }
  renderAccountOptions(currentUser?.login || "tadeusz");
  refreshUserScopedUi();
}

async function changePassword(login, password, currentPassword = "") {
  const targetLogin = normalizeLogin(login);
  if (!targetLogin || !password) return false;
  if (backendAvailable) {
    try {
      const result = await apiRequest(`/users/${encodeURIComponent(targetLogin)}/password`, {
        method: "PATCH",
        body: JSON.stringify({ password, currentPassword }),
      });
      applyPasswordChangeSnapshot(result, targetLogin);
      showToast("Hasło zmienione", targetLogin === getActiveLogin() ? "Twoje konto ma nowe hasło." : `Konto: ${targetLogin}`);
      return true;
    } catch (error) {
      showToast("Nie zmieniono hasła", error.message || "Backend odrzucił zmianę.");
      return false;
    }
  }

  const account = accounts.find((item) => item.login === targetLogin);
  if (!account) {
    showToast("Nie znaleziono konta", targetLogin);
    return false;
  }
  const isOwnPassword = targetLogin === currentUser?.login;
  const isAdmin = currentUser?.role === "admin";
  if (!isAdmin && !isOwnPassword) {
    showToast("Brak uprawnień", "Możesz zmienić tylko własne hasło.");
    return false;
  }
  if (isOwnPassword && !isAdmin && account.password && account.password !== currentPassword) {
    showToast("Nieprawidłowe aktualne hasło");
    return false;
  }
  account.password = password;
  account.requiresPassword = true;
  if (isOwnPassword) currentUser = { ...currentUser, password, requiresPassword: true };
  saveAccountState();
  renderAccountOptions(currentUser?.login || "tadeusz");
  refreshUserScopedUi();
  showToast("Hasło zmienione", isOwnPassword ? "Twoje konto ma nowe hasło." : `Konto: ${targetLogin}`);
  return true;
}

async function changeOwnPassword(event) {
  event.preventDefault();
  const currentPassword = $("#currentPasswordInput").value;
  const password = $("#newPasswordInput").value.trim();
  const repeated = $("#repeatPasswordInput").value.trim();
  if (password.length < 4) {
    showToast("Hasło za krótkie", "Wpisz co najmniej 4 znaki.");
    return;
  }
  if (password !== repeated) {
    showToast("Hasła się różnią", "Powtórz nowe hasło dokładnie tak samo.");
    return;
  }
  const changed = await changePassword(getActiveLogin(), password, currentPassword);
  if (changed) event.target.reset();
}

async function changeManagedAccountPassword(event) {
  const form = event.target.closest("[data-account-password-form]");
  if (!form) return;
  event.preventDefault();
  const login = form.dataset.accountPasswordForm;
  const input = form.querySelector("[data-account-password]");
  const password = input.value.trim();
  if (password.length < 4) {
    showToast("Hasło za krótkie", "Wpisz co najmniej 4 znaki.");
    return;
  }
  const changed = await changePassword(login, password);
  if (changed) input.value = "";
}

function priorityLabel(priority) {
  const labels = {
    urgent: ["Pilne", "red"],
    important: ["Ważne", "amber"],
    normal: ["Zwykłe", ""],
  };
  return labels[priority] || labels.normal;
}

function ensurePostSocial(post) {
  post.readers ||= [];
  post.reactions ||= {};
  post.comments ||= [];
  postReactionTypes.forEach((reaction) => {
    post.reactions[reaction.id] ||= [];
  });
  post.read = Math.min(post.total, post.readers.length || post.read);
  return post;
}

function getPostById(postId) {
  const post = posts.find((item) => String(item.id) === String(postId));
  return post ? ensurePostSocial(post) : null;
}

function commentsLabel(count) {
  if (count === 1) return "1 komentarz";
  if (count > 1 && count < 5) return `${count} komentarze`;
  return `${count} komentarzy`;
}

function reactionSummary(post) {
  ensurePostSocial(post);
  const active = postReactionTypes
    .map((reaction) => `${reaction.icon} ${post.reactions[reaction.id].length}`)
    .join(" · ");
  return `${active} · ${commentsLabel(post.comments.length)}`;
}

function renderPostDialog(post = getPostById(activePostId)) {
  if (!post) return;
  const [label, color] = priorityLabel(post.priority);
  $("#postDialogPriority").textContent = `Ogłoszenie ${label.toLowerCase()}`;
  $("#postDialogPriority").className = `eyebrow ${color}`;
  $("#postDialogTitle").textContent = post.title;
  $("#postDialogBody").textContent = post.body;
  $("#postReadCount").textContent = `Odczytali ${post.read}/${post.total}`;
  $("#postReadNames").textContent = post.readers.length
    ? post.readers.map((reader) => `${reader.name} ${reader.time}`).join(" · ")
    : "Brak potwierdzonych odczytów";

  $("#postReactionBar").innerHTML = postReactionTypes
    .map((reaction) => {
      const names = post.reactions[reaction.id];
      const active = names.includes(getActiveName());
      return `
        <button class="reaction-button ${active ? "active" : ""}" data-post-reaction="${reaction.id}" type="button" title="${escapeHtml(
          names.join(", ") || "Brak reakcji",
        )}">
          <span>${reaction.icon}</span>
          <strong>${reaction.label}</strong>
          <span>${names.length}</span>
        </button>
      `;
    })
    .join("");

  $("#postComments").innerHTML = post.comments.length
    ? post.comments
        .map(
          (comment) => `
            <article class="comment-card">
              <header>
                <strong>${escapeHtml(comment.author)}</strong>
                <span class="muted">${escapeHtml(comment.time)}</span>
              </header>
              <p>${escapeHtml(comment.body)}</p>
            </article>
          `,
        )
        .join("")
    : `<p class="muted">Brak komentarzy. Dodaj pierwszą odpowiedź pod ogłoszeniem.</p>`;
}

function getUrgentUnreadPost() {
  return posts.map(ensurePostSocial).find((post) => post.priority === "urgent" && post.unread);
}

function renderUrgentStrip() {
  const strip = $(".urgent-strip");
  if (!strip) return;
  const post = getUrgentUnreadPost();
  strip.classList.toggle("hidden", !post);
  if (!post) return;
  strip.dataset.openPost = post.id;
  strip.querySelector("strong").textContent = "Pilne ogłoszenie nieodczytane";
  strip.querySelector("span").textContent = `${post.title}. Kliknij, aby otworzyć i potwierdzić.`;
}

function renderPosts(filter = "all") {
  currentFeedFilter = filter;
  const visiblePosts = posts.filter((post) => {
    if (currentFeedFilter === "boss") {
      const authorAccount = accounts.find(
        (account) => account.login === post.authorLogin || account.name === post.author,
      );
      return authorAccount?.role === "admin";
    }
    if (currentFeedFilter === "unread") return post.unread;
    return true;
  });

  const cards = visiblePosts
    .map((post) => {
      ensurePostSocial(post);
      const [label, color] = priorityLabel(post.priority);
      return `
        <article class="feed-card">
          <div class="widget-header">
            <strong>${escapeHtml(post.title)}</strong>
            <span class="pill ${color}">${label}</span>
          </div>
          <span class="muted">${escapeHtml(post.author)} · odczytali ${post.read}/${post.total}</span>
          <p class="note">${escapeHtml(post.body)}</p>
          <div class="post-social-summary"><span>${reactionSummary(post)}</span></div>
          <button data-open-post="${post.id}" type="button">Otwórz ogłoszenie</button>
        </article>
      `;
    })
    .join("");

  $("#feedList").innerHTML = cards;
  renderUrgentStrip();

  const announcementPosts = posts.filter((post) => {
    if (currentAnnouncementFilter === "urgent") return post.priority === "urgent";
    if (currentAnnouncementFilter === "mine") return post.author === getActiveName();
    return true;
  });

  $("#announcementList").innerHTML = announcementPosts
    .map((post) => {
      ensurePostSocial(post);
      const [label, color] = priorityLabel(post.priority);
      return `
        <article class="announcement-card">
          <div class="widget-header">
            <strong>${escapeHtml(post.title)}</strong>
            <span class="pill ${color}">${label}</span>
          </div>
          <p class="note">${escapeHtml(post.body)}</p>
          <div class="read-status">
            <span>Autor: ${escapeHtml(post.author)}</span>
            <span>Odczytali ${post.read}/${post.total}</span>
            <span>${post.unread ? "Nieprzeczytane przez część zespołu" : "Potwierdzone"}</span>
          </div>
          <div class="post-social-summary"><span>${reactionSummary(post)}</span></div>
          <button data-open-post="${post.id}" type="button">Odczyty i komentarze</button>
        </article>
      `;
    })
    .join("");
  renderNotifications();
}

function renderKanban() {
  normalizeTasks();
  $("#kanban").innerHTML = Object.entries(tasks)
    .map(
      ([column, items]) => `
        <section class="kanban-column" data-column="${column}">
          <h3>${columnLabels[column]} <span class="pill">${
            items.filter((task) => taskMatchesFilter(task)).length
          }</span></h3>
          ${items
            .map((task, index) => ({ task, index }))
            .filter(({ task }) => taskMatchesFilter(task))
            .map(({ task, index }) => {
              const [label, color] = priorityLabel(task.priority);
              return `
                <article class="task-card" draggable="true" data-column="${column}" data-index="${index}" data-task-id="${
                  task.id
                }">
                  <button class="task-title-button" data-task-detail="${task.id}" type="button">
                    <strong>${escapeHtml(task.title)}</strong>
                  </button>
                  <p class="task-summary">${escapeHtml(task.description)}</p>
                  <div class="task-meta">
                    <span>${escapeHtml(task.owner)} · <span class="task-due">${escapeHtml(task.due)}</span></span>
                    <span class="pill ${color}">${label}</span>
                  </div>
                  <label class="task-mobile-move">Przenieś do
                    <select data-task-move="${task.id}">
                      ${Object.entries(columnLabels)
                        .map(
                          ([targetColumn, targetLabel]) =>
                            `<option value="${targetColumn}" ${
                              targetColumn === column ? "selected" : ""
                            }>${targetLabel}</option>`,
                        )
                        .join("")}
                    </select>
                  </label>
                  <div class="task-actions">
                    <button class="secondary-button" data-task-detail="${task.id}" type="button">Szczegóły</button>
                    <button class="secondary-button danger-button" data-task-delete="${task.id}" type="button">Usuń</button>
                  </div>
                </article>
              `;
            })
            .join("")}
        </section>
      `,
    )
    .join("");

  $$(".task-card").forEach((card) => {
    card.addEventListener("dragstart", () => card.classList.add("dragging"));
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  });

  $$(".kanban-column").forEach((column) => {
    column.addEventListener("dragover", (event) => event.preventDefault());
    column.addEventListener("drop", async () => {
      const dragging = $(".task-card.dragging");
      if (!dragging) return;
      const toColumn = column.dataset.column;
      await moveTask(dragging.dataset.taskId, toColumn);
    });
  });
}

function getTaskRef(taskId) {
  for (const [column, items] of Object.entries(tasks)) {
    const index = items.findIndex((task) => task.id === taskId);
    if (index >= 0) return { column, index, task: items[index] };
  }
  return null;
}

function renderTaskOwnerOptions(selectedOwner = getActiveName()) {
  const ownerSelect = $("#taskOwnerInput");
  if (!ownerSelect) return;
  ownerSelect.innerHTML = activePeople()
    .map((person) => `<option value="${escapeHtml(person.login)}">${escapeHtml(person.name)} - ${escapeHtml(person.role)}</option>`)
    .join("");
  const selectedLogin = activePeople().find((person) => person.login === selectedOwner || person.name === selectedOwner)?.login;
  if (selectedLogin) {
    ownerSelect.value = selectedLogin;
  } else if (activePeople().some((person) => person.login === selectedOwner)) {
    ownerSelect.value = selectedOwner;
  }
}

function openTaskForm() {
  renderTaskOwnerOptions();
  $("#taskForm").reset();
  $("#taskOwnerInput").value = activePeople().some((person) => person.login === getActiveLogin())
    ? getActiveLogin()
    : activePeople()[0]?.login || "";
  $("#taskColumnInput").value = "todo";
  $("#taskPriorityInput").value = "normal";
  $("#taskDueInput").value = "dziś";
  openDialog("#taskFormDialog");
  $("#taskTitleInput").focus();
}

async function createTask(event) {
  event.preventDefault();
  const column = $("#taskColumnInput").value || "todo";
  const title = $("#taskTitleInput").value.trim();
  if (!title || !tasks[column]) return;
  const description = $("#taskDescriptionInput").value.trim();
  const ownerLogin = normalizeLogin($("#taskOwnerInput").value || getActiveLogin());
  const owner = getDisplayNameByLogin(ownerLogin);
  const due = $("#taskDueInput").value.trim() || "dziś";
  const priority = $("#taskPriorityInput").value || "normal";
  if (backendAvailable) {
    try {
      const result = await apiRequest("/tasks", {
        method: "POST",
        body: JSON.stringify({
          column,
          title,
          description,
          ownerLogin,
          due,
          priority,
          source: "Dodane ręcznie",
        }),
      });
      applyTaskSnapshot(result);
      renderTaskState();
      $("#taskFormDialog").close();
      showToast("Zadanie dodane", `${title} jest widoczne w widoku Cała firma.`);
      return;
    } catch (error) {
      showToast("Nie dodano zadania", error.message || "Backend odrzucił zapis.");
      return;
    }
  }
  tasks[column].unshift({
    id: makeTaskId(),
    title,
    owner,
    ownerLogin,
    due,
    priority,
    description: description || "Brak dodatkowego opisu.",
    source: "Dodane ręcznie",
    createdAt: "teraz",
  });
  saveTaskState();
  renderKanban();
  $("#taskFormDialog").close();
  showToast("Zadanie dodane", `${title} trafiło do kolumny: ${columnLabels[column]}.`);
}

async function addTaskToBoard(task, column = "todo") {
  if (backendAvailable) {
    try {
      const ownerLogin = normalizeLogin(task.ownerLogin || activePeople().find((person) => person.name === task.owner)?.login || getActiveLogin());
      const result = await apiRequest("/tasks", {
        method: "POST",
        body: JSON.stringify({
          column,
          title: task.title,
          description: task.description,
          ownerLogin,
          due: task.due,
          priority: task.priority,
          source: task.source,
        }),
      });
      applyTaskSnapshot(result);
      renderTaskState();
      return result.task || task;
    } catch (error) {
      showToast("Nie utworzono zadania", error.message || "Backend odrzucił zapis.");
      return null;
    }
  }
  tasks[column].unshift({
    id: makeTaskId(),
    ownerLogin: normalizeLogin(task.ownerLogin || activePeople().find((person) => person.name === task.owner)?.login || ""),
    ...task,
  });
  saveTaskState();
  renderKanban();
  return task;
}

function openTaskDetails(taskId) {
  const ref = getTaskRef(taskId);
  if (!ref) return;
  activeTaskId = taskId;
  const [priorityText, priorityColor] = priorityLabel(ref.task.priority);
  $("#taskDialogStatus").textContent = columnLabels[ref.column];
  $("#taskDialogTitle").textContent = ref.task.title;
  $("#taskDialogDescription").textContent = ref.task.description;
  $("#taskDialogOwner").textContent = ref.task.owner;
  $("#taskDialogDue").textContent = ref.task.due;
  $("#taskDialogPriority").textContent = priorityText;
  $("#taskDialogPriority").className = `pill ${priorityColor}`;
  $("#taskDialogSource").textContent = ref.task.source || columnLabels[ref.column];
  $("#taskDialogCreated").textContent = ref.task.createdAt || "Dzisiaj";
  openDialog("#taskDialog");
}

async function deleteTask(taskId) {
  const ref = getTaskRef(taskId);
  if (!ref) return;
  if (backendAvailable) {
    try {
      const result = await apiRequest(`/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });
      applyTaskSnapshot(result);
      renderTaskState();
      if ($("#taskDialog").open) $("#taskDialog").close();
      showToast("Zadanie usunięte", ref.task.title);
    } catch (error) {
      showToast("Nie usunięto zadania", error.message || "Backend odrzucił usunięcie.");
    }
    return;
  }
  const [removed] = tasks[ref.column].splice(ref.index, 1);
  saveTaskState();
  renderKanban();
  if ($("#taskDialog").open) $("#taskDialog").close();
  showToast("Zadanie usunięte", removed.title);
}

async function moveTask(taskId, nextColumn) {
  const ref = getTaskRef(taskId);
  if (!ref || !tasks[nextColumn] || ref.column === nextColumn) return;
  if (backendAvailable) {
    try {
      const result = await apiRequest(`/tasks/${encodeURIComponent(taskId)}`, {
        method: "PATCH",
        body: JSON.stringify({ column: nextColumn }),
      });
      applyTaskSnapshot(result);
      renderTaskState();
      showToast("Zadanie przeniesione", `${ref.task.title}: ${columnLabels[nextColumn]}.`);
    } catch (error) {
      renderKanban();
      showToast("Nie przeniesiono zadania", error.message || "Backend odrzucił zmianę.");
    }
    return;
  }
  const [moved] = tasks[ref.column].splice(ref.index, 1);
  tasks[nextColumn].push(moved);
  saveTaskState();
  renderKanban();
  showToast("Zadanie przeniesione", `${moved.title}: ${columnLabels[nextColumn]}.`);
}

function taskMatchesFilter(task) {
  if (currentTaskFilter === "mine") return task.ownerLogin === getActiveLogin() || task.owner === getActiveName();
  if (currentTaskFilter === "person") return task.ownerLogin === "kuba" || task.owner === "Kuba";
  return true;
}

function renderSchedule() {
  const schedule = timeSummary?.schedule;
  const days = schedule?.days?.length
    ? schedule.days
    : [
        { key: "mon", label: "Pon" },
        { key: "tue", label: "Wt" },
        { key: "wed", label: "Śr" },
        { key: "thu", label: "Czw" },
        { key: "fri", label: "Pt" },
      ];
  const rows = schedule?.rows?.length
    ? schedule.rows
    : activePeople().map((person) => ({
        login: person.login,
        name: person.name,
        cells: days.map((day) => ({ day: day.key, value: "" })),
      }));
  if (!rows.length) {
    $("#scheduleTable").innerHTML = `<div class="empty-state">Brak aktywnych użytkowników do pokazania w grafiku.</div>`;
    return;
  }
  const canEdit = role === "admin";
  $("#scheduleTable").innerHTML = [
    `<div class="head">Osoba</div>`,
    ...days.map((day) => `<div class="head">${escapeHtml(day.label)}</div>`),
    ...rows.flatMap((row) =>
      [
        `<div class="head schedule-person">${escapeHtml(row.name)}</div>`,
        ...days.map((day) => {
          const cell = row.cells?.find((item) => item.day === day.key) || { value: "" };
          const value = cell.value || "";
          return `<div class="schedule-cell">${
            canEdit
              ? `<input class="schedule-input" data-schedule-user="${escapeHtml(row.login)}" data-schedule-day="${escapeHtml(
                  day.key,
                )}" value="${escapeHtml(value)}" placeholder="-" aria-label="Grafik ${escapeHtml(row.name)} ${escapeHtml(
                  day.label,
                )}" />`
              : `<span class="${value ? "" : "muted"}">${escapeHtml(value || "-")}</span>`
          }</div>`;
        }),
      ]
    ),
  ].join("");
}

async function saveScheduleCell(input) {
  if (!backendAvailable || role !== "admin") return;
  const userLogin = input.dataset.scheduleUser;
  const day = input.dataset.scheduleDay;
  const value = input.value.trim();
  input.disabled = true;
  try {
    const result = await apiRequest("/time/schedule", {
      method: "PATCH",
      body: JSON.stringify({ userLogin, day, value }),
    });
    applyTimeSummary(result);
    showToast("Grafik zapisany", value || "Komórka wyczyszczona.");
  } catch (error) {
    showToast("Nie zapisano grafiku", error.message || "Backend odrzucił zmianę.");
    await syncTimeSummaryFromBackend({ silent: true });
  } finally {
    input.disabled = false;
  }
}

function renderCalendar() {
  calendarEvents = calendarEvents.map(normalizeCalendarEvent).sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  $("#calendarGrid").innerHTML = Array.from({ length: 31 }, (_, index) => {
    const day = index + 1;
    const dayEvents = calendarEvents.filter((item) => item.day === day);
    return `
      <div class="calendar-day">
        <strong>${day}</strong>
        ${dayEvents.map((event) => `<span class="event-chip">${escapeHtml(event.title)}</span>`).join("")}
      </div>
    `;
  }).join("");

  $("#eventList").innerHTML = calendarEvents.length
    ? calendarEvents
        .map(
          (event) => `
            <article>
              <strong>${escapeHtml(event.title)}</strong>
              <span>${escapeHtml(event.date)}, ${escapeHtml(event.time)} · ${event.attendees} będą · ${escapeHtml(
                event.rsvp,
              )}</span>
              <button class="secondary-button" data-rsvp="${escapeHtml(event.id)}" type="button" ${
                event.rsvp === "Będę" ? "disabled" : ""
              }>${event.rsvp === "Będę" ? "Potwierdzono" : "Będę"}</button>
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">Brak wydarzeń w kalendarzu.</div>`;
  renderDashboardUpcoming();
}

function renderDashboardUpcoming() {
  const list = $("#dashboardUpcomingList");
  if (!list) return;
  const upcoming = calendarEvents.slice(0, 3);
  list.innerHTML = upcoming.length
    ? upcoming
        .map((event) => `<li><time>${escapeHtml(event.date || "-")}</time><span>${escapeHtml(event.title)}</span></li>`)
        .join("")
    : `<li class="empty-state">Brak nadchodzących wydarzeń.</li>`;
}

function renderRequests() {
  normalizeRequests();
  $("#requestList").innerHTML = requests
    .map(
      (request, index) => `
        <article class="request-card">
          <div class="card-line">
            <strong>${request.title}</strong>
            <span class="pill ${request.kind === "leave" ? "teal" : "amber"}">${request.status}</span>
          </div>
          <span class="muted">${request.detail}</span>
          <div class="card-actions admin-widget">
            <button class="secondary-button" data-request-action="approve" data-request-index="${index}" type="button">Akceptuj</button>
            <button class="secondary-button" data-request-action="reject" data-request-index="${index}" type="button">Odrzuć</button>
          </div>
        </article>
      `,
    )
    .join("");
  renderDecisions();
  renderNotifications();
}

function renderReports() {
  normalizeReports();
  const visibleReports = reports
    .map((report) => ({ report }))
    .filter(({ report }) => {
      if (currentReportFilter === "mine") return report.ownerLogin === getActiveLogin() || report.owner === getActiveName();
      if (currentReportFilter === "closed") return report.status === "Załatwione";
      return report.status !== "Załatwione";
    });

  $("#reportList").innerHTML = visibleReports
    .map(({ report }) => {
      return `
        <article class="report-card">
          <div class="card-line">
            <strong>${report.title}</strong>
            <span class="pill ${report.status === "Nowe" ? "red" : "teal"}">${report.status}</span>
          </div>
          <span class="muted">${report.category} · ${report.owner}</span>
          <p class="note">${report.detail}</p>
          <div class="card-actions">
            <button class="secondary-button admin-widget" data-report-task="${report.id}" type="button">Utwórz zadanie</button>
            <button class="secondary-button" data-report-close="${report.id}" type="button">Oznacz załatwione</button>
          </div>
        </article>
      `;
    })
    .join("");
  renderDecisions();
  renderStats();
  renderNotifications();
}

function renderStats() {
  const summary = $("#statsSummary");
  const chart = $("#statsBarChart");
  const issueList = $("#statsIssueList");
  if (!summary || !chart || !issueList) return;

  const taskItems = Object.values(tasks).flatMap((items) => items || []);
  const doneTasks = tasks.done?.length || 0;
  const openReports = reports.filter((report) => report.status !== "Załatwione");
  const unreadUrgent = posts.filter((post) => post.priority === "urgent" && post.unread).length;

  if (!taskItems.length && !reports.length && !posts.length) {
    summary.textContent = "Brak danych do raportu.";
  } else {
    summary.textContent = `Zadania wykonane: ${doneTasks}, otwarte zgłoszenia: ${openReports.length}, pilne nieodczytane ogłoszenia: ${unreadUrgent}.`;
  }

  const bars = [tasks.todo?.length || 0, tasks.doing?.length || 0, tasks.review?.length || 0, doneTasks, openReports.length];
  const max = Math.max(1, ...bars);
  chart.innerHTML = bars
    .map((value) => `<span style="height: ${Math.max(10, Math.round((value / max) * 100))}%"></span>`)
    .join("");

  issueList.innerHTML = openReports.length
    ? openReports
        .map((report) => `<button data-stat-report="${escapeHtml(report.id)}" type="button">${escapeHtml(report.title)}</button>`)
        .join("")
    : `<div class="empty-state">Brak otwartych zgłoszeń.</div>`;
}

function renderDecisions() {
  const list = $("#decisionList");
  const count = $("#decisionCount");
  if (!list || !count) return;
  const decisions = getDecisionItems();
  count.textContent = String(decisions.length);
  count.className = `pill ${decisions.length ? "red" : "green"}`;
  list.innerHTML = decisions.length
    ? decisions
        .map(
          (decision) => `
            <button data-decision-action="${decision.type === "request" ? "approve-request" : "create-report-task"}" ${
              decision.requestId ? `data-request-id="${escapeHtml(decision.requestId)}"` : ""
            } ${decision.reportId ? `data-report-id="${escapeHtml(decision.reportId)}"` : ""} type="button">
              <span>
                <strong>${escapeHtml(decision.title)}</strong>
                <small>${escapeHtml(decision.detail)}</small>
              </span>
              <span>${escapeHtml(decision.label)}</span>
            </button>
          `,
        )
        .join("")
    : `<div class="empty-state">Brak decyzji do obsłużenia.</div>`;
}

function saveNotificationReadState() {
  writeStorage(storageKeys.notificationReadIds, [...notificationReadIds]);
}

function normalizeNotification(notification) {
  const title = notification.title || "Powiadomienie";
  const body = notification.body || "";
  const target = notification.target || inferNotificationTarget(title, body);
  const persistent = Boolean(notification.persistent);
  const id =
    notification.id ||
    `${target.view || "dashboard"}:${target.postId || target.reportId || target.requestId || target.conversationId || ""}:${title}:${body}`;
  return {
    id,
    title,
    body,
    target,
    persistent,
    unread: persistent || (notification.unread !== false && !notificationReadIds.has(String(id))),
    createdAt: notification.createdAt || Date.now(),
  };
}

function buildSystemNotifications() {
  const systemNotifications = [];
  if (currentUser && !currentUser.isRoot && !currentUser.requiresPassword && !currentUser.password) {
    systemNotifications.push(
      normalizeNotification({
        id: `account-password:${getActiveLogin()}`,
        title: "Ustaw hasło do konta",
        body: "Utwórz własne hasło, aby zabezpieczyć swoje konto firmowe.",
        target: { view: "team" },
        persistent: true,
      }),
    );
  }

  posts
    .map(ensurePostSocial)
    .filter((post) => post.priority === "urgent" && post.unread)
    .forEach((post) => {
      systemNotifications.push(
        normalizeNotification({
          id: `announcement:${post.id}:urgent`,
          title: "Pilne ogłoszenie",
          body: post.title,
          target: { view: "announcements", postId: post.id },
        }),
      );
    });

  if (currentUser?.role === "admin") {
    getDecisionItems().forEach((decision) => {
      systemNotifications.push(
        normalizeNotification({
          id: `decision:${decision.id}`,
          title: "Decyzja do obsłużenia",
          body: decision.title,
          target:
            decision.type === "request"
              ? { view: "time", requestId: decision.requestId }
              : { view: "reports", reportId: decision.reportId },
        }),
      );
    });
  }

  handoverNotes
    .map(normalizeHandoverNote)
    .filter((note) => !note.accepted && note.authorLogin !== getActiveLogin())
    .forEach((note) => {
      systemNotifications.push(
        normalizeNotification({
          id: `handover:${note.id}`,
          title: "Zeszyt zmiany",
          body: `Nowa notatka: ${note.author}`,
          target: { view: "knowledge", noteId: note.id },
        }),
      );
    });

  return systemNotifications;
}

function getVisibleNotifications() {
  const merged = [...notifications.map(normalizeNotification), ...buildSystemNotifications()];
  const byId = new Map();
  merged.forEach((notification) => {
    const existing = byId.get(notification.id);
    if (!existing || Number(notification.createdAt || 0) > Number(existing.createdAt || 0)) {
      byId.set(notification.id, notification);
    }
  });
  return [...byId.values()].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

function markNotificationRead(notification) {
  if (!notification) return;
  if (notification.persistent) return;
  notificationReadIds.add(String(notification.id));
  notifications = notifications.map((item) =>
    normalizeNotification(item).id === notification.id ? { ...item, id: notification.id, unread: false } : item,
  );
  saveNotificationReadState();
}

function renderNotifications() {
  renderedNotifications = getVisibleNotifications();
  const unread = renderedNotifications.filter((notification) => notification.unread).length;
  $(".bell strong").textContent = unread;
  $(".bell span").classList.toggle("hidden", unread === 0);
  $("#notificationList").innerHTML = renderedNotifications.length
    ? renderedNotifications
    .map(
      (notification, index) => `
        <button class="notification-card" data-notification-index="${index}" type="button">
          <div class="card-line">
            <strong>${escapeHtml(notification.title)}</strong>
            <span class="pill ${notification.persistent ? "red" : notification.unread ? "red" : "green"}">${
              notification.persistent ? "Wymagane" : notification.unread ? "Nowe" : "Odczytane"
            }</span>
          </div>
          <span>${escapeHtml(notification.body)}</span>
        </button>
      `,
    )
    .join("")
    : `<div class="empty-state">Brak powiadomień.</div>`;
}

function openDialog(selector, options = {}) {
  const dialog = $(selector);
  if (!dialog) return;
  if (dialog.open) {
    if (options.toggle) dialog.close();
    return;
  }
  dialog.showModal();
}

function inferNotificationTarget(title, body = "") {
  const text = `${title} ${body}`.toLowerCase();
  if (text.includes("ogłos") || text.includes("komentarz")) return { view: "announcements", postId: activePostId };
  if (text.includes("wiadomo") || text.includes("czat")) return { view: "chat", conversationId: currentConversation };
  if (text.includes("zgłosz")) return { view: "reports" };
  if (text.includes("wniosek") || text.includes("korekt") || text.includes("urlop") || text.includes("grafik")) {
    return { view: "time" };
  }
  if (text.includes("wydarzenie") || text.includes("rsvp") || text.includes("kalendarz")) return { view: "calendar" };
  if (text.includes("baza wiedzy") || text.includes("zeszyt")) return { view: "knowledge" };
  if (text.includes("konto")) return { view: "team" };
  return { view: "dashboard" };
}

function pushNotification(title, body, target = inferNotificationTarget(title, body), options = {}) {
  const notification = normalizeNotification({
    id: options.id || `event:${Date.now()}:${Math.random().toString(16).slice(2)}`,
    title,
    body,
    target,
    unread: true,
    createdAt: Date.now(),
  });
  notificationReadIds.delete(notification.id);
  notifications = notifications.filter((item) => normalizeNotification(item).id !== notification.id);
  notifications.unshift(notification);
  renderNotifications();
}

async function openNotificationSource(index) {
  const notification = renderedNotifications[index];
  if (!notification) return;
  markNotificationRead(notification);
  const target = notification.target || inferNotificationTarget(notification.title, notification.body);
  $("#notificationsDialog")?.close();

  if (target.conversationId) currentConversation = target.conversationId;
  if (target.view === "announcements" && target.postId) {
    activateView("announcements");
    await openPost(target.postId);
    renderNotifications();
    return;
  }

  activateView(target.view || "dashboard");
  if (target.view === "chat") renderChat();
  if (target.view === "reports") {
    currentReportFilter = "open";
    renderReportState();
  }
  if (target.view === "announcements") {
    renderPosts(currentFeedFilter);
  }
  if (target.taskId) openTaskDetails(target.taskId);
  renderNotifications();
}

function showToast(title, body = "") {
  const toast = document.createElement("div");
  toast.className = "toast";
  const titleNode = document.createElement("strong");
  titleNode.textContent = title;
  toast.append(titleNode);
  if (body) {
    const bodyNode = document.createElement("span");
    bodyNode.textContent = body;
    toast.append(bodyNode);
  }
  $("#toastStack").append(toast);
  setTimeout(() => toast.remove(), 3200);
}

function markDecisionDone(button, label) {
  button.querySelector("span").textContent = label;
  button.classList.add("is-done");
  button.disabled = true;
  const count = $("#decisionCount");
  const next = Math.max(0, Number(count.textContent) - 1);
  count.textContent = String(next);
  count.className = `pill ${next === 0 ? "green" : "red"}`;
}

async function acceptHandoverNote(noteId) {
  const note = handoverNotes.find((item) => String(item.id) === String(noteId));
  if (!note) return null;
  if (backendAvailable) {
    try {
      const result = await apiRequest(`/knowledge/handover/${encodeURIComponent(note.id)}/accept`, {
        method: "POST",
      });
      applyKnowledgeSnapshot(result);
      renderKnowledgeState();
      return result.note || handoverNotes.find((item) => String(item.id) === String(note.id)) || note;
    } catch (error) {
      showToast("Nie przyjęto notatki", error.message || "Backend odrzucił zapis.");
      return null;
    }
  }
  if (!note.accepted) {
    note.accepted = true;
    note.acceptedCount = Number(note.acceptedCount || 0) + 1;
  }
  renderKnowledge();
  return note;
}

async function deleteHandoverNote(noteId) {
  const note = handoverNotes.find((item) => String(item.id) === String(noteId));
  if (!note || !canDeleteHandoverNote(note)) return;
  if (backendAvailable) {
    try {
      const result = await apiRequest(`/knowledge/handover/${encodeURIComponent(note.id)}`, {
        method: "DELETE",
      });
      applyKnowledgeSnapshot(result);
      renderKnowledgeState();
      showToast("Notatka usunięta", "Zeszyt zmiany został zaktualizowany.");
      return;
    } catch (error) {
      showToast("Nie usunięto notatki", error.message || "Backend odrzucił usunięcie.");
      return;
    }
  }
  handoverNotes = handoverNotes.filter((item) => String(item.id) !== String(noteId));
  renderKnowledge();
  showToast("Notatka usunięta");
}

function getDashboardHandoverNote() {
  handoverNotes = handoverNotes.map(normalizeHandoverNote);
  return handoverNotes.find((note) => !note.accepted) || handoverNotes[0] || null;
}

function renderDashboardHandover() {
  const note = getDashboardHandoverNote();
  const badge = $("#dashboardHandoverBadge");
  const body = $("#dashboardHandoverNote");
  const button = $("[data-dashboard-handover]");
  if (!badge || !body || !button) return;
  if (!note) {
    badge.textContent = "Brak";
    badge.className = "pill green";
    body.textContent = "Nie ma nowych notatek w zeszycie zmiany.";
    button.textContent = "Przyjęte";
    button.disabled = true;
    return;
  }
  badge.textContent = note.accepted ? "Przyjęte" : "Nowe";
  badge.className = `pill ${note.accepted ? "green" : "amber"}`;
  body.textContent = `${note.author}: ${note.text}`;
  button.textContent = note.accepted ? "Przyjęte" : "Przyjąłem";
  button.disabled = note.accepted;
}

async function acceptDashboardHandover(button) {
  const note = getDashboardHandoverNote();
  if (note) {
    const acceptedNote = await acceptHandoverNote(note.id);
    if (!acceptedNote) return;
  }
  renderDashboardHandover();
  showToast("Notatka przyjęta", "Zeszyt zmiany został oznaczony jako odczytany.");
}

function getDirectConversation(person) {
  const id = directConversationId(getActiveLogin(), person.login);
  return {
    id,
    title: person.name,
    kind: "direct",
    memberLogins: [getActiveLogin(), person.login],
    subtitle: `${person.role} · ${person.status}`,
    messages: getConversationMessageList(id),
  };
}

function getPersonByLogin(login) {
  return activePeople().find((person) => person.login === login) || people.find((person) => person.login === login);
}

function getAccountByLogin(login) {
  return accounts.find((account) => account.login === login);
}

function getDisplayNameByLogin(login) {
  return getPersonByLogin(login)?.name || getAccountByLogin(login)?.name || login || "Użytkownik";
}

function getConversationMembers(conversation) {
  if (conversation.kind === "direct") {
    return conversation.memberLogins.map(getPersonByLogin).filter(Boolean);
  }
  if (conversation.memberMode === "all") {
    return activePeople();
  }
  if (conversation.memberRole) {
    return activePeople().filter((person) => person.role === conversation.memberRole);
  }
  if (Array.isArray(conversation.memberLogins)) {
    return activePeople().filter((person) => conversation.memberLogins.includes(person.login));
  }
  return activePeople();
}

function canSeeGroupConversation(conversation) {
  if (currentUser?.role === "admin") return true;
  if (conversation.memberMode === "all") return true;
  return getConversationMembers(conversation).some((person) => person.login === getActiveLogin());
}

function enrichGroupConversation(conversation) {
  const members = getConversationMembers(conversation);
  const messages = getConversationMessageList(conversation.id, conversation.messages);
  const lastMessage = messages.at(-1);
  return {
    ...conversation,
    messages,
    subtitle: `${members.length} ${members.length === 1 ? "osoba" : "osób"} · ${
      lastMessage ? `ostatnio ${lastMessage.time}` : "bez wiadomości"
    }`,
  };
}

function getChatConversations() {
  const groups = [...defaultGroupConversations, ...customGroupConversations]
    .filter(canSeeGroupConversation)
    .map(enrichGroupConversation);
  const direct = activePeople()
    .filter((person) => person.login !== getActiveLogin())
    .map((person) => getDirectConversation(person));
  return [...groups, ...direct];
}

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileIcon(fileType = "", fileName = "") {
  if (fileType.startsWith("image/")) return "IMG";
  if (fileType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf")) return "PDF";
  if (fileType.includes("spreadsheet") || /\.(xlsx|xls|csv)$/i.test(fileName)) return "XLS";
  if (fileType.includes("word") || /\.(docx|doc)$/i.test(fileName)) return "DOC";
  return "PLIK";
}

function renderAttachments(attachments = []) {
  if (!attachments.length) return "";
  return `
    <div class="message-attachments">
      ${attachments
        .map((attachment) => {
          const preview = attachment.isImage && attachment.url ? `<img src="${attachment.url}" alt="" />` : "";
          return `
            <a class="attachment-card" href="${attachment.url || "#"}" ${attachment.url ? "target=\"_blank\"" : ""}>
              ${preview}
              <span class="pill">${escapeHtml(attachment.icon || fileIcon(attachment.type, attachment.name))}</span>
              <span>${escapeHtml(attachment.name)}</span>
              <small>${escapeHtml(attachment.sizeLabel)}</small>
            </a>
          `;
        })
        .join("")}
    </div>
  `;
}

function releaseAttachmentUrls(attachments = []) {
  attachments.forEach((attachment) => {
    if (attachment.url?.startsWith("blob:")) {
      URL.revokeObjectURL(attachment.url);
    }
  });
}

function clearStagedChatAttachments({ release = true } = {}) {
  if (release) releaseAttachmentUrls(stagedChatAttachments);
  stagedChatAttachments = [];
  const input = $("#chatAttachmentInput");
  if (input) input.value = "";
  renderChatAttachmentPreview();
}

function renderChatAttachmentPreview() {
  const preview = $("#chatAttachmentPreview");
  if (!stagedChatAttachments.length) {
    preview.classList.add("hidden");
    preview.innerHTML = "";
    return;
  }
  preview.classList.remove("hidden");
  preview.innerHTML = stagedChatAttachments
    .map(
      (attachment) => `
        <span class="attachment-chip">
          <span class="pill">${escapeHtml(attachment.icon)}</span>
          <span>${escapeHtml(attachment.name)}</span>
          <small>${escapeHtml(attachment.sizeLabel)}</small>
          <button data-remove-chat-attachment="${attachment.id}" type="button" aria-label="Usuń załącznik">&times;</button>
        </span>
      `,
    )
    .join("");
}

function stageChatAttachments(files) {
  [...files].forEach((file) => {
    const isImage = file.type.startsWith("image/");
    stagedChatAttachments.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: file.name,
      sizeLabel: formatFileSize(file.size),
      type: file.type,
      icon: fileIcon(file.type, file.name),
      isImage,
      url: URL.createObjectURL(file),
    });
  });
  renderChatAttachmentPreview();
}

function articleMatchesKnowledgeSearch(article) {
  const query = normalizeSearch(kbSearchQuery);
  if (!query) return true;
  return normalizeSearch(
    [article.title, article.detail, article.type, article.fileName, article.fileMime].filter(Boolean).join(" "),
  ).includes(query);
}

function canDeleteHandoverNote(note) {
  return currentUser?.role === "admin" || note.authorLogin === getActiveLogin();
}

function renderChatGroupMembers() {
  const box = $("#chatGroupMembers");
  if (!box) return;
  box.innerHTML = activePeople()
    .map(
      (person) => `
        <label>
          <input data-chat-group-member type="checkbox" value="${escapeHtml(person.login)}" checked />
          <span class="avatar">${escapeHtml(person.initials)}</span>
          <span>${escapeHtml(person.name)}</span>
        </label>
      `,
    )
    .join("");
}

function getMessageAuthor(message) {
  if (message.authorLogin) return getDisplayNameByLogin(message.authorLogin);
  if (message.author === "Ja") return getActiveName();
  return message.author || "Użytkownik";
}

function isOwnMessage(message) {
  if (message.authorLogin) return message.authorLogin === getActiveLogin();
  return Boolean(message.mine);
}

function getMessageReadLogins(message) {
  return [...new Set((message.readBy || []).map(normalizeLogin).filter((login) => login && login !== message.authorLogin))];
}

function getMessageReceiptLabel(message, conversation) {
  if (!isOwnMessage(message)) return "napisane";
  const readLogins = getMessageReadLogins(message);
  if (!readLogins.length) return "wysłane";
  if (conversation.kind === "direct") return "odczytane";

  const expectedReaders = getConversationMembers(conversation)
    .map((person) => person.login)
    .filter((login) => login && login !== message.authorLogin);
  const readCount = expectedReaders.filter((login) => readLogins.includes(login)).length || readLogins.length;
  return expectedReaders.length > 1 ? `odczytane ${readCount}/${expectedReaders.length}` : "odczytane";
}

function renderChat() {
  const availableConversations = getChatConversations();
  if (!availableConversations.some((conversation) => conversation.id === currentConversation)) {
    currentConversation = availableConversations[0]?.id || "";
  }

  renderChatGroupMembers();

  $("#conversationList").innerHTML = availableConversations
    .map(
      (conversation) => `
        <button class="conversation-button ${conversation.id === currentConversation ? "active" : ""}" data-conversation="${conversation.id}" type="button">
          <strong>${conversation.title}</strong>
          <span class="muted">${conversation.subtitle}</span>
        </button>
      `,
    )
    .join("");

  const conversation = availableConversations.find((item) => item.id === currentConversation) || availableConversations[0];
  $("#chatTitle").textContent = conversation.title;
  $("#messageList").innerHTML = conversation.messages.length
    ? conversation.messages
        .map((message) => {
          const ownMessage = isOwnMessage(message);
          return `
        <article class="message ${ownMessage ? "mine" : ""}">
          <strong>${escapeHtml(getMessageAuthor(message))}</strong>
          <span>${escapeHtml(message.body)}</span>
          ${renderAttachments(message.attachments)}
          <small>${message.time} · ${getMessageReceiptLabel(message, conversation)}</small>
        </article>
      `;
        })
        .join("")
    : `<div class="empty-state">Brak wiadomości w tej rozmowie.</div>`;
  markCurrentConversationRead();
}

function renderKnowledge() {
  kbArticles = kbArticles.map(normalizeKnowledgeArticle);
  handoverNotes = handoverNotes.map(normalizeHandoverNote);
  const visibleArticles = kbArticles.filter(articleMatchesKnowledgeSearch);
  const searchInput = $("#kbSearchInput");
  if (searchInput && searchInput.value !== kbSearchQuery) searchInput.value = kbSearchQuery;
  const count = $("#kbSearchCount");
  if (count) {
    count.textContent = kbSearchQuery
      ? `${visibleArticles.length} z ${kbArticles.length}`
      : `${kbArticles.length} ${kbArticles.length === 1 ? "dokument" : "dokumentów"}`;
  }
  $("#kbList").innerHTML = visibleArticles.length
    ? visibleArticles
    .map(
      (article) => {
        const sizeLabel = article.fileSize ? formatFileSize(article.fileSize) : "";
        const fileMeta = [article.fileName, sizeLabel].filter(Boolean).join(" · ");
        return `
        <article class="kb-card">
          <span class="kb-icon">${escapeHtml(article.type)}</span>
          <div>
            <div class="card-line">
              <strong>${escapeHtml(article.title)}</strong>
              <span class="pill">${escapeHtml(article.type)}</span>
            </div>
            <p class="note">${escapeHtml(article.detail)}</p>
            <div class="card-line">
              <span class="muted">${escapeHtml(fileMeta || "Brak pliku")}</span>
              ${
                article.fileUrl
                  ? `<a class="secondary-button" href="${escapeHtml(article.fileUrl)}" target="_blank" rel="noopener">Otwórz</a>`
                  : ""
              }
            </div>
          </div>
        </article>
      `;
      },
    )
    .join("")
    : `<div class="empty-state">${
        kbArticles.length ? "Brak dokumentów pasujących do wyszukiwania." : "Brak dokumentów w bazie wiedzy."
      }</div>`;

  $("#handoverList").innerHTML = handoverNotes.length
    ? handoverNotes
    .map(
      (note) => {
        const deleteButton = canDeleteHandoverNote(note)
          ? `<button class="secondary-button danger-button" data-handover-delete="${escapeHtml(note.id)}" type="button">Usuń</button>`
          : "";
        return `
        <article class="handover-card">
          <div class="card-line">
            <strong>${escapeHtml(note.author)}</strong>
            <span class="pill ${note.accepted ? "green" : "amber"}">${note.accepted ? "Przyjęte" : "Nowe"}</span>
          </div>
          <p class="note">${escapeHtml(note.text)}</p>
          <div class="card-line">
            <span class="muted">${escapeHtml(note.time)} · przyjęło ${note.acceptedCount}</span>
            <button class="secondary-button" data-handover-accept="${escapeHtml(note.id)}" type="button" ${
              note.accepted ? "disabled" : ""
            }>${note.accepted ? "Przyjęte" : "Przyjąłem"}</button>
            ${deleteButton}
          </div>
        </article>
      `;
      },
    )
    .join("")
    : `<div class="empty-state">Brak notatek w zeszycie zmiany.</div>`;
  renderDashboardHandover();
}

function applyRole() {
  document.body.dataset.role = role;
  const isAdmin = role === "admin";
  $$(".admin-only, .admin-widget").forEach((node) => node.classList.toggle("hidden", !isAdmin));
  if (!isAdmin && $("#stats").classList.contains("active-view")) activateView("dashboard");
}

function activateView(viewId) {
  $$(".view").forEach((view) => view.classList.toggle("active-view", view.id === viewId));
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
  $("#viewTitle").textContent = viewTitles[viewId] || "Panel";
  $(".sidebar").classList.remove("open");
  if (["dashboard", "announcements"].includes(viewId) && backendAvailable && isLoggedIn()) {
    syncAnnouncementsFromBackend({ silent: true }).then((changed) => {
      if (changed) renderAnnouncementState();
    });
  }
  if (["dashboard", "time"].includes(viewId) && backendAvailable && isLoggedIn()) {
    refreshPresence();
  }
  if (viewId === "tasks" && backendAvailable && isLoggedIn()) {
    syncTasksFromBackend({ silent: true }).then((changed) => {
      if (changed) renderTaskState();
    });
  }
  if (viewId === "reports" && backendAvailable && isLoggedIn()) {
    syncReportsFromBackend({ silent: true }).then((changed) => {
      if (changed) renderReportState();
    });
  }
  if (viewId === "time" && backendAvailable && isLoggedIn()) {
    syncRequestsFromBackend({ silent: true }).then((changed) => {
      if (changed) renderRequestState();
    });
  }
  if (viewId === "calendar" && backendAvailable && isLoggedIn()) {
    syncCalendarFromBackend({ silent: true }).then((changed) => {
      if (changed) renderCalendarState();
    });
  }
  if (viewId === "knowledge" && backendAvailable && isLoggedIn()) {
    syncKnowledgeFromBackend({ silent: true }).then((changed) => {
      if (changed) renderKnowledgeState();
    });
  }
  if (viewId === "chat") renderChat();
}

function getWidgetKey(widget) {
  return widget.querySelector("h3")?.textContent.trim() || "";
}

function saveDashboardLayout() {
  const order = $$("#dashboardGrid .widget").map(getWidgetKey).filter(Boolean);
  writeStorage(storageKeys.dashboardLayout, order);
}

function restoreDashboardLayout() {
  const grid = $("#dashboardGrid");
  if (!grid) return;
  const savedOrder = readStorage(storageKeys.dashboardLayout, []);
  if (!Array.isArray(savedOrder) || !savedOrder.length) return;
  const widgetsByKey = new Map($$("#dashboardGrid .widget").map((widget) => [getWidgetKey(widget), widget]));
  savedOrder.forEach((key) => {
    const widget = widgetsByKey.get(key);
    if (widget) grid.append(widget);
  });
}

function bindDashboardDrag() {
  let dragged = null;
  $$("#dashboardGrid .widget").forEach((widget) => {
    widget.addEventListener("dragstart", () => {
      dragged = widget;
      widget.classList.add("dragging");
    });
    widget.addEventListener("dragend", () => {
      widget.classList.remove("dragging");
      dragged = null;
    });
    widget.addEventListener("dragover", (event) => event.preventDefault());
    widget.addEventListener("drop", () => {
      if (!dragged || dragged === widget) return;
      widget.parentNode.insertBefore(dragged, widget);
      saveDashboardLayout();
    });
  });
}

function openSearch(query = $("#globalSearchInput")?.value || "") {
  openDialog("#searchDialog");
  $("#searchInput").value = query;
  $("#searchInput").focus();
  renderSearch(query);
}

function renderSearch(query) {
  const normalizedQuery = normalizeSearch(query);
  const taskItems = Object.values(tasks).flatMap((items) => items || []);
  const chatItems = getVisibleConversations().map((conversation) => ["Czat", conversation.title]);
  const items = [
    ...posts.map((post) => ["Og?oszenie", post.title, post.body]),
    ...taskItems.map((task) => ["Zadanie", task.title, task.description]),
    ...calendarEvents.map((event) => ["Wydarzenie", event.title, `${event.date} ${event.time}`]),
    ...reports.map((report) => ["Zg?oszenie", report.title, report.detail]),
    ...requests.map((request) => ["Wniosek", request.title, request.detail]),
    ...kbArticles.map((article) => ["Baza wiedzy", article.title, article.detail]),
    ...handoverNotes.map((note) => ["Zeszyt zmiany", note.text, note.author]),
    ...chatItems,
  ].filter((item) => normalizeSearch(item.join(" ")).includes(normalizedQuery));

  $("#searchResults").innerHTML = items.length
    ? items
        .map(
          ([type, title]) => `
            <article>
              <strong>${escapeHtml(title)}</strong>
              <span>${escapeHtml(type)}</span>
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">Brak wynik?w dla bie??cych danych.</div>`;
}

function submitGlobalSearch(event) {
  event.preventDefault();
  openSearch($("#globalSearchInput").value.trim());
}

async function addQuickTaskFromContext(title = "Nowe zadanie") {
  const createdTask = await addTaskToBoard({
    title,
    owner: getActiveName(),
    ownerLogin: getActiveLogin(),
    due: "dzi?",
    priority: "normal",
    description: "Zadanie dodane szybkim skr?tem do dalszego uzupe?nienia.",
    source: "Szybkie dodanie",
    createdAt: "teraz",
  });
  if (createdTask) showToast("Dodano zadanie", "Nowa karta trafi?a do kolumny Do zrobienia.");
}

async function createPost(event) {
  event.preventDefault();
  const title = $("#postTitle").value.trim();
  const body = $("#postBody").value.trim();
  const priority = $("#postPriority").value;
  const audience = $("#postAudience").value;
  const recipientLogins = $$("[data-announcement-recipient]:checked").map((input) => normalizeLogin(input.value));
  if (!title || !body) return;

  if (backendAvailable) {
    try {
      const result = await apiRequest("/announcements", {
        method: "POST",
        body: JSON.stringify({ title, body, priority, audience, recipientLogins }),
      });
      applyAnnouncementMutationResult(result, result.post?.id);
      pushNotification("Nowe ogłoszenie", title, { view: "announcements", postId: result.post?.id });
      showToast("Opublikowano ogłoszenie", "Jest zapisane w bazie i widoczne dla pozostałych użytkowników.");
      event.target.reset();
      renderPeople();
      return;
    } catch (error) {
      showToast("Nie opublikowano ogłoszenia", error.message || "Backend odrzucił zapis.");
      return;
    }
  }

  const now = new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  const total =
    audience === "selected"
      ? Math.max(1, recipientLogins.length + 1)
      : audience === "boss"
        ? 1
        : activePeople().length;
  const post = {
    id: Date.now(),
    title,
    body,
    priority,
    author: getActiveName(),
    read: 1,
    total,
    unread: false,
    readers: [{ name: getActiveName(), time: now }],
    reactions: { like: [], done: [getActiveName()], question: [] },
    comments: [],
  };
  posts.unshift(post);
  renderPosts();
  pushNotification("Nowe ogłoszenie", post.title, { view: "announcements", postId: post.id });
  showToast("Opublikowano ogłoszenie", "Pojawiło się w strumieniu i na liście ogłoszeń.");
  event.target.reset();
}

async function createPostComment(event) {
  event.preventDefault();
  const post = getPostById(activePostId);
  const input = $("#postCommentInput");
  const body = input.value.trim();
  if (!post || !body) return;

  if (backendAvailable) {
    try {
      const result = await apiRequest(`/announcements/${encodeURIComponent(post.id)}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      input.value = "";
      applyAnnouncementMutationResult(result, post.id);
      pushNotification("Nowy komentarz", `${getActiveName()} skomentował(a): ${post.title}`, {
        view: "announcements",
        postId: post.id,
      });
      showToast("Komentarz dodany", "Jest zapisany w bazie ogłoszeń.");
      return;
    } catch (error) {
      showToast("Nie dodano komentarza", error.message || "Backend odrzucił zapis.");
      return;
    }
  }

  post.comments.push({
    author: getActiveName(),
    body,
    time: "teraz",
  });
  input.value = "";
  renderPostDialog(post);
  renderPosts(currentFeedFilter);
  pushNotification("Nowy komentarz", `${getActiveName()} skomentował(a): ${post.title}`, {
    view: "announcements",
    postId: post.id,
  });
  showToast("Komentarz dodany", "Widać go pod ogłoszeniem.");
}

async function markPostRead(postId) {
  let post = getPostById(postId);
  if (!post) return null;

  if (backendAvailable) {
    try {
      const result = await apiRequest(`/announcements/${encodeURIComponent(post.id)}/read`, { method: "POST" });
      return applyAnnouncementMutationResult(result, post.id);
    } catch (error) {
      showToast("Nie zapisano odczytu", error.message || "Backend odrzucił potwierdzenie.");
      return post;
    }
  }

  post.unread = false;
  if (!post.readers.some((reader) => reader.name === getActiveName())) {
    post.readers.push({ name: getActiveName(), time: "teraz" });
  }
  post.read = Math.min(post.total, Math.max(post.read, post.readers.length));
  renderPostDialog(post);
  renderPosts(currentFeedFilter);
  return post;
}

async function openPost(postId) {
  let post = getPostById(postId);
  if (!post) return;
  activePostId = post.id;
  post = await markPostRead(post.id);
  if (post) renderPostDialog(post);
  openDialog("#postDialog");
  renderPosts(currentFeedFilter);
}

async function updateRequestStatus(requestId, status) {
  const request = requests.find((item) => String(item.id) === String(requestId));
  if (!request) return null;
  if (backendAvailable) {
    try {
      const result = await apiRequest(`/requests/${encodeURIComponent(request.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      applyRequestSnapshot(result);
      renderRequestState();
      return requests.find((item) => String(item.id) === String(request.id)) || result.request || request;
    } catch (error) {
      showToast("Nie zapisano decyzji", error.message || "Backend odrzucił zmianę statusu.");
      return null;
    }
  }
  request.status = status;
  request.updatedAt = "teraz";
  saveRequestsState();
  renderRequestState();
  return request;
}

async function createLeaveRequest(event) {
  event.preventDefault();
  const detail = `${$("#leaveFrom").value}-${$("#leaveTo").value} · ${$("#leaveType").value}`;
  const title = `Urlop: ${getActiveName()}`;
  if (backendAvailable) {
    try {
      const result = await apiRequest("/requests", {
        method: "POST",
        body: JSON.stringify({ kind: "leave", title, detail }),
      });
      applyRequestSnapshot(result);
      renderRequestState();
      pushNotification("Nowy wniosek urlopowy", "Wniosek czeka na decyzję admina.", { view: "time" });
      showToast("Wniosek wysłany", "Trafił do wspólnej listy wniosków i korekt.");
      return;
    } catch (error) {
      showToast("Nie wysłano wniosku", error.message || "Backend odrzucił zapis.");
      return;
    }
  }
  requests.unshift({
    id: `request-leave-${Date.now()}`,
    title,
    detail,
    status: "Oczekuje",
    kind: "leave",
    createdAt: "teraz",
  });
  saveRequestsState();
  renderRequests();
  applyRole();
  pushNotification("Nowy wniosek urlopowy", "Wniosek czeka na decyzję admina.", { view: "time" });
  showToast("Wniosek wysłany", "Trafił do listy wniosków i korekt.");
}

async function createReport(event) {
  event.preventDefault();
  const category = $("#reportCategory").value;
  const detail = $("#reportText").value.trim();
  if (!detail) return;
  if (backendAvailable) {
    try {
      const result = await apiRequest("/reports", {
        method: "POST",
        body: JSON.stringify({ category, title: category, detail }),
      });
      applyReportSnapshot(result);
      renderReportState();
      event.target.reset();
      pushNotification("Nowe zgłoszenie", `${category}: ${detail}`, { view: "reports" });
      showToast("Zgłoszenie wysłane", "Jest zapisane w bazie i widoczne dla admina oraz zespołu.");
      return;
    } catch (error) {
      showToast("Nie wysłano zgłoszenia", error.message || "Backend odrzucił zapis.");
      return;
    }
  }
  reports.unshift({
    id: makeReportId(),
    category,
    title: category,
    detail,
    status: "Nowe",
    owner: getActiveName(),
    ownerLogin: getActiveLogin(),
  });
  renderReports();
  applyRole();
  pushNotification("Nowe zgłoszenie", `${category}: ${detail}`, { view: "reports" });
  showToast("Zgłoszenie wysłane", "Admin zobaczy je na liście zgłoszeń.");
}

async function updateReportStatus(reportId, status) {
  const report = getReportById(reportId);
  if (!report) return null;
  if (backendAvailable) {
    try {
      const result = await apiRequest(`/reports/${encodeURIComponent(report.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      applyReportSnapshot(result);
      renderReportState();
      return getReportById(report.id);
    } catch (error) {
      showToast("Nie zmieniono zgłoszenia", error.message || "Backend odrzucił zmianę statusu.");
      return null;
    }
  }
  report.status = status;
  report.updatedAt = "teraz";
  renderReportState();
  return report;
}

async function createChatMessage(event) {
  event.preventDefault();
  const input = $("#chatInput");
  const body = input.value.trim();
  if (!body && !stagedChatAttachments.length) return;
  const conversation = getChatConversations().find((item) => item.id === currentConversation);
  if (!conversation) return;
  const attachments = stagedChatAttachments.map((attachment) => ({ ...attachment }));
  const message = {
    authorLogin: getActiveLogin(),
    conversationId: conversation.id,
    body: body || "Wysłano załącznik.",
    time: "teraz",
    attachments,
  };
  if (backendAvailable) {
    try {
      const result = await apiRequest("/chat/messages", {
        method: "POST",
        body: JSON.stringify({
          conversationId: conversation.id,
          body: message.body,
          attachments: attachments.map(({ name, sizeLabel, type, icon, isImage }) => ({
            name,
            sizeLabel,
            type,
            icon,
            isImage,
          })),
        }),
      });
      conversation.messages.push(normalizeChatMessage(result.message));
    } catch (error) {
      showToast("Nie wysłano wiadomości", error.message || "Backend odrzucił zapis wiadomości.");
      return;
    }
  } else {
    conversation.messages.push(normalizeChatMessage(message));
    saveChatMessageState();
  }
  clearStagedChatAttachments({ release: false });
  input.value = "";
  renderChat();
  pushNotification("Nowa wiadomość", `Wysłano do: ${$("#chatTitle").textContent}`, {
    view: "chat",
    conversationId: currentConversation,
  });
  showToast("Wiadomość wysłana", "Status zmieni się po otwarciu rozmowy przez odbiorcę.");
}

async function createChatGroup(event) {
  event.preventDefault();
  if (currentUser?.role !== "admin") {
    showToast("Brak uprawnień", "Grupy może tworzyć tylko administrator.");
    return;
  }
  const name = $("#chatGroupName").value.trim();
  const selectedLogins = $$("[data-chat-group-member]:checked").map((input) => normalizeLogin(input.value));
  const memberLogins = [...new Set(selectedLogins.filter(Boolean))];
  if (!name) {
    showToast("Podaj nazwę grupy");
    return;
  }
  if (!memberLogins.length) {
    showToast("Wybierz członków", "Grupa musi mieć co najmniej jednego użytkownika.");
    return;
  }

  if (backendAvailable) {
    try {
      const snapshot = await apiRequest("/chat/groups", {
        method: "POST",
        body: JSON.stringify({ title: name, memberLogins }),
      });
      applyChatGroupSnapshot(snapshot);
      currentConversation = snapshot.createdGroup?.id || customGroupConversations.at(-1)?.id || currentConversation;
      event.target.reset();
      renderChat();
      pushNotification("Nowa grupa czatu", `Utworzono grupę: ${name}`, {
        view: "chat",
        conversationId: currentConversation,
      });
      showToast("Grupa utworzona w bazie", name);
      return;
    } catch (error) {
      showToast("Nie utworzono grupy", error.message || "Backend odrzucił zapis.");
      return;
    }
  }

  const group = normalizeChatGroup({
    id: `group-${slugifyLogin(name)}-${Date.now()}`,
    title: name,
    memberLogins,
    createdBy: getActiveLogin(),
    createdAt: "teraz",
    messages: [],
  });
  customGroupConversations.push(group);
  saveChatGroupState();
  currentConversation = group.id;
  event.target.reset();
  renderChat();
  pushNotification("Nowa grupa czatu", `Utworzono grupę: ${name}`, {
    view: "chat",
    conversationId: currentConversation,
  });
  showToast("Grupa utworzona", name);
}

async function createHandoverNote(event) {
  event.preventDefault();
  const text = $("#handoverText").value.trim();
  if (!text) return;
  if (backendAvailable) {
    try {
      const result = await apiRequest("/knowledge/handover", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      applyKnowledgeSnapshot(result);
      $("#handoverText").value = "";
      renderKnowledgeState();
      pushNotification("Zeszyt zmiany", "Dodano notatkę dla kolejnej osoby.", { view: "knowledge" });
      showToast("Notatka zapisana w bazie", "Pojawiła się we wspólnym zeszycie zmiany.");
      return;
    } catch (error) {
      showToast("Nie zapisano notatki", error.message || "Backend odrzucił zapis.");
      return;
    }
  }
  handoverNotes.unshift({
    id: makeHandoverNoteId(),
    authorLogin: getActiveLogin(),
    author: getActiveName(),
    text,
    time: "teraz",
    accepted: false,
    acceptedCount: 0,
  });
  $("#handoverText").value = "";
  renderKnowledge();
  pushNotification("Zeszyt zmiany", "Dodano notatkę dla kolejnej osoby.", { view: "knowledge" });
  showToast("Notatka zapisana", "Pojawiła się w archiwum zeszytu zmiany.");
}

function exportTimeCsv() {
  const summaryPeople = timeSummary?.people?.length ? timeSummary.people : activePeople();
  const rows = [
    ["Osoba", "Dzisiaj", "Tydzień", "Miesiąc", "Status", "Stan odbicia", "Eksport"],
    ...summaryPeople.map((person) => [
      person.name,
      formatWorkDuration(person.todaySeconds),
      formatWorkDuration(person.weekSeconds),
      formatWorkDuration(person.monthSeconds),
      person.status || "Niewbity",
      person.state || "out",
      new Date().toLocaleString("pl-PL"),
    ]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "prokom-ewidencja-czasu.csv";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  $("#exportStatus").textContent = "Ostatni eksport: wygenerowano plik CSV przed chwilą";
  showToast("Eksport gotowy", "Pobrano raport CSV ze statystykami czasu pracy.");
}

async function addCalendarEvent() {
  const title = window.prompt("Tytuł wydarzenia")?.trim();
  if (!title) return;
  const today = new Date();
  const defaultDay = String(today.getDate()).padStart(2, "0");
  const dayText = window.prompt("Dzień miesiąca", defaultDay)?.trim() || defaultDay;
  const day = Math.min(31, Math.max(1, Number.parseInt(dayText, 10) || today.getDate()));
  const defaultDate = `${String(day).padStart(2, "0")}.${String(today.getMonth() + 1).padStart(2, "0")}`;
  const date = window.prompt("Data w formacie DD.MM", defaultDate)?.trim() || defaultDate;
  const time = window.prompt("Godzina w formacie HH:MM", "09:00")?.trim() || "09:00";
  const eventPayload = { day, title, date, time };
  if (backendAvailable) {
    try {
      const result = await apiRequest("/calendar", {
        method: "POST",
        body: JSON.stringify(eventPayload),
      });
      applyCalendarSnapshot(result);
      renderCalendarState();
      pushNotification("Nowe wydarzenie", `${title} dodane do kalendarza.`, { view: "calendar" });
      showToast("Dodano wydarzenie w bazie", "Pojawi?o si? we wsp?lnym kalendarzu.");
      return;
    } catch (error) {
      showToast("Nie dodano wydarzenia", error.message || "Backend odrzuci? zapis.");
      return;
    }
  }
  calendarEvents.push({
    id: makeCalendarEventId(),
    ...eventPayload,
    rsvp: "Niepotwierdzone",
    attendees: 1,
  });
  renderCalendar();
  pushNotification("Nowe wydarzenie", `${title} dodane do kalendarza.`, { view: "calendar" });
  showToast("Dodano wydarzenie", "Pojawi?o si? w kalendarzu i na li?cie nadchodz?cych.");
}

async function createKnowledgeArticle(event) {
  event.preventDefault();
  const form = event.target;
  const file = $("#kbFileInput").files?.[0];
  const title = $("#kbTitleInput").value.trim();
  const detail = $("#kbDetailInput").value.trim();
  if (!file) {
    showToast("Wybierz plik", "Dokument musi zawierać prawdziwy załącznik.");
    return;
  }
  const articlePayload = {
    type: fileIcon(file.type, file.name),
    title: title || file.name.replace(/\.[^.]+$/, ""),
    detail: detail || `Dokument dodany z pliku ${file.name}.`,
    fileName: file.name,
    fileMime: file.type,
    fileSize: file.size,
  };
  if (backendAvailable) {
    try {
      const formData = new FormData(form);
      const result = await apiFormRequest("/knowledge/articles", formData);
      applyKnowledgeSnapshot(result);
      form.reset();
      renderKnowledgeState();
      pushNotification("Baza wiedzy", `Dodano dokument: ${articlePayload.title}`, { view: "knowledge" });
      showToast("Dokument dodany w bazie", "Nowa pozycja jest widoczna dla wszystkich użytkowników.");
      return;
    } catch (error) {
      showToast("Nie dodano dokumentu", error.message || "Backend odrzucił zapis.");
      return;
    }
  }
  kbArticles.unshift({
    id: makeKnowledgeArticleId(),
    ...articlePayload,
    fileUrl: URL.createObjectURL(file),
    createdBy: getActiveLogin(),
  });
  form.reset();
  renderKnowledge();
  pushNotification("Baza wiedzy", `Dodano dokument: ${articlePayload.title}`, { view: "knowledge" });
  showToast("Dokument dodany", "Nowa pozycja jest widoczna w bazie wiedzy.");
}

async function boot() {
  updateTodayLabel();
  loadStoredState();
  await syncAccountsFromBackend(undefined, { silent: true });
  renderMyDay();
  renderPeople();
  renderPosts();
  renderKanban();
  renderSchedule();
  renderCalendar();
  renderRequests();
  renderReports();
  renderStats();
  renderChat();
  renderKnowledge();
  renderNotifications();
  restoreDashboardLayout();
  bindDashboardDrag();
  applyRole();
  renderTimer();
  renderAccountOptions();
  await restoreSession();

  $("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await signIn($("#accountSelect").value, $("#passwordInput").value);
  });
  $("#accountSelect").addEventListener("change", updateLoginFields);
  $("#logoutButton").addEventListener("click", signOut);
  $$(".nav-item").forEach((item) => item.addEventListener("click", () => activateView(item.dataset.view)));
  document.addEventListener("click", async (event) => {
    const trigger = event.target.closest("[data-open-post]");
    if (!trigger) return;
    await openPost(trigger.dataset.openPost);
  });
  $("#roleSelect").addEventListener("change", (event) => {
    if (currentUser?.role !== "admin") {
      event.target.value = role;
      return;
    }
    role = event.target.value;
    refreshUserScopedUi();
  });
  $("#themeToggle").addEventListener("click", () => {
    const isDark = document.documentElement.dataset.theme === "dark";
    document.documentElement.dataset.theme = isDark ? "" : "dark";
    $("#themeToggle").textContent = isDark ? "Tryb ciemny" : "Tryb jasny";
  });
  $("#clockButton").addEventListener("click", toggleClock);
  $("#timeClockButton").addEventListener("click", toggleClock);
  $("#breakButton").addEventListener("click", toggleBreak);
  $("#addTaskButton").addEventListener("click", openTaskForm);
  $("#taskForm").addEventListener("submit", createTask);
  $("#announcementForm").addEventListener("submit", createPost);
  $("#postCommentForm").addEventListener("submit", createPostComment);
  $("#leaveForm").addEventListener("submit", createLeaveRequest);
  $("#reportForm").addEventListener("submit", createReport);
  $("#chatForm").addEventListener("submit", createChatMessage);
  $("#chatGroupForm").addEventListener("submit", createChatGroup);
  $("#accountForm").addEventListener("submit", createAccount);
  $("#passwordForm").addEventListener("submit", changeOwnPassword);
  document.addEventListener("submit", async (event) => {
    if (event.target.matches("[data-account-password-form]")) {
      await changeManagedAccountPassword(event);
    }
  });
  $("[data-chat-attach]").addEventListener("click", () => $("#chatAttachmentInput").click());
  $("#chatAttachmentInput").addEventListener("change", (event) => stageChatAttachments(event.target.files));
  $("#myDayForm").addEventListener("submit", addMyDayItem);
  $("#handoverForm").addEventListener("submit", createHandoverNote);
  $("#kbForm").addEventListener("submit", createKnowledgeArticle);
  $("#kbSearchInput").addEventListener("input", (event) => {
    kbSearchQuery = event.target.value;
    renderKnowledge();
  });
  $("#globalSearchForm").addEventListener("submit", submitGlobalSearch);
  $("#globalSearchInput").addEventListener("input", (event) => {
    if ($("#searchDialog").open) {
      $("#searchInput").value = event.target.value;
      renderSearch(event.target.value);
    }
  });
  $("#globalSearchInput").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    openSearch(event.target.value.trim());
  });
  $("#searchInput").addEventListener("input", (event) => {
    $("#globalSearchInput").value = event.target.value;
    renderSearch(event.target.value);
  });
  $("#menuToggle").addEventListener("click", () => $(".sidebar").classList.toggle("open"));
  $("#notificationsButton").addEventListener("click", () => openDialog("#notificationsDialog", { toggle: true }));
  $("#markNotificationsButton").addEventListener("click", (event) => {
    event.preventDefault();
    getVisibleNotifications()
      .filter((notification) => !notification.persistent)
      .forEach((notification) => notificationReadIds.add(String(notification.id)));
    notifications = notifications.map((notification) => ({ ...notification, unread: false }));
    saveNotificationReadState();
    renderNotifications();
    showToast("Powiadomienia odczytane");
  });
  $("#exportTimeButton").addEventListener("click", exportTimeCsv);
  $("#addEventButton").addEventListener("click", addCalendarEvent);
  $("#correctionButton").addEventListener("click", async () => {
    const title = `Korekta czasu: ${getActiveName()}`;
    const detail = "Dzisiaj · zapomniałem wybić się o 17:00";
    if (backendAvailable) {
      try {
        const result = await apiRequest("/requests", {
          method: "POST",
          body: JSON.stringify({ kind: "correction", title, detail }),
        });
        applyRequestSnapshot(result);
        renderRequestState();
        pushNotification("Korekta czasu", "Nowa korekta czeka na decyzję.", { view: "time" });
        showToast("Korekta zgłoszona", "Trafiła do wspólnej listy wniosków i korekt.");
        activateView("time");
        return;
      } catch (error) {
        showToast("Nie zgłoszono korekty", error.message || "Backend odrzucił zapis.");
        return;
      }
    }
    requests.unshift({
      id: `request-correction-${Date.now()}`,
      title,
      detail,
      status: "Do sprawdzenia",
      kind: "correction",
      createdAt: "teraz",
    });
    saveRequestsState();
    renderRequests();
    applyRole();
    pushNotification("Korekta czasu", "Nowa korekta czeka na decyzję.", { view: "time" });
    showToast("Korekta zgłoszona", "Trafiła do listy wniosków i korekt.");
    activateView("time");
  });

  document.addEventListener("change", async (event) => {
    const myDayCheckbox = event.target.closest("[data-myday-check]");
    if (myDayCheckbox) {
      const item = myDayItems.find((entry) => String(entry.id) === String(myDayCheckbox.dataset.mydayCheck));
      if (item) item.done = myDayCheckbox.checked;
      saveMyDayState();
      renderMyDay();
      return;
    }

    const accountRoleSelect = event.target.closest("[data-account-role]");
    if (accountRoleSelect) {
      setAccountRole(accountRoleSelect.dataset.accountRole, accountRoleSelect.value);
      return;
    }

    const taskMoveSelect = event.target.closest("[data-task-move]");
    if (taskMoveSelect) {
      await moveTask(taskMoveSelect.dataset.taskMove, taskMoveSelect.value);
      return;
    }

    const scheduleInput = event.target.closest("[data-schedule-user][data-schedule-day]");
    if (scheduleInput) {
      await saveScheduleCell(scheduleInput);
      return;
    }
  });

  document.addEventListener("click", async (event) => {
    const accountToggleButton = event.target.closest("[data-account-toggle]");
    if (accountToggleButton) {
      toggleAccount(accountToggleButton.dataset.accountToggle);
      return;
    }

    const notificationButton = event.target.closest("[data-notification-index]");
    if (notificationButton) {
      await openNotificationSource(Number(notificationButton.dataset.notificationIndex));
      return;
    }

    const accountRemoveButton = event.target.closest("[data-account-remove]");
    if (accountRemoveButton) {
      removeAccount(accountRemoveButton.dataset.accountRemove);
      return;
    }

    const taskDetailButton = event.target.closest("[data-task-detail]");
    if (taskDetailButton) {
      openTaskDetails(taskDetailButton.dataset.taskDetail);
      return;
    }

    const taskDeleteButton = event.target.closest("[data-task-delete]");
    if (taskDeleteButton) {
      await deleteTask(taskDeleteButton.dataset.taskDelete);
      return;
    }

    const activeTaskDeleteButton = event.target.closest("[data-task-delete-active]");
    if (activeTaskDeleteButton && activeTaskId) {
      await deleteTask(activeTaskId);
      activeTaskId = null;
      return;
    }

    const closeDialogButton = event.target.closest("[data-close-dialog]");
    if (closeDialogButton) {
      closeDialogButton.closest("dialog")?.close();
      return;
    }

    const reactionButton = event.target.closest("[data-post-reaction]");
    if (reactionButton) {
      const post = getPostById(activePostId);
      const reactionId = reactionButton.dataset.postReaction;
      const reactions = post?.reactions?.[reactionId];
      if (!post || !reactions) return;
      if (backendAvailable) {
        try {
          const result = await apiRequest(`/announcements/${encodeURIComponent(post.id)}/reactions`, {
            method: "POST",
            body: JSON.stringify({ reactionId }),
          });
          applyAnnouncementMutationResult(result, post.id);
          showToast("Reakcja zapisana", post.title);
        } catch (error) {
          showToast("Nie zapisano reakcji", error.message || "Backend odrzucił zmianę.");
        }
        return;
      }
      if (reactions.includes(getActiveName())) {
        post.reactions[reactionId] = reactions.filter((name) => name !== getActiveName());
      } else {
        reactions.push(getActiveName());
      }
      renderPostDialog(post);
      renderPosts(currentFeedFilter);
      showToast("Reakcja zapisana", post.title);
      return;
    }

    const conversationButton = event.target.closest("[data-conversation]");
    if (conversationButton) {
      currentConversation = conversationButton.dataset.conversation;
      clearStagedChatAttachments();
      await syncConversationMessagesFromBackend(currentConversation);
      renderChat();
      return;
    }

    const removeAttachmentButton = event.target.closest("[data-remove-chat-attachment]");
    if (removeAttachmentButton) {
      const removedAttachments = stagedChatAttachments.filter(
        (attachment) => attachment.id === removeAttachmentButton.dataset.removeChatAttachment,
      );
      releaseAttachmentUrls(removedAttachments);
      stagedChatAttachments = stagedChatAttachments.filter(
        (attachment) => attachment.id !== removeAttachmentButton.dataset.removeChatAttachment,
      );
      renderChatAttachmentPreview();
      return;
    }

    const myDayRemoveButton = event.target.closest("[data-myday-remove]");
    if (myDayRemoveButton) {
      myDayItems = myDayItems.filter((item) => String(item.id) !== String(myDayRemoveButton.dataset.mydayRemove));
      saveMyDayState();
      renderMyDay();
      showToast("Usunięto wpis z mojego dnia");
      return;
    }

    const dashboardHandoverButton = event.target.closest("[data-dashboard-handover]");
    if (dashboardHandoverButton) {
      await acceptDashboardHandover(dashboardHandoverButton);
      return;
    }

    const decisionButton = event.target.closest("[data-decision-action]");
    if (decisionButton) {
      const action = decisionButton.dataset.decisionAction;
      if (action === "approve-request") {
        const request = requests.find((item) => String(item.id) === String(decisionButton.dataset.requestId));
        if (!request) return;
        const updatedRequest = await updateRequestStatus(request.id, "Zaakceptowane");
        if (updatedRequest) {
          pushNotification("Decyzja zapisana", `${request.title}: zaakceptowane.`, { view: "time" });
          showToast("Decyzja zapisana", request.title);
        }
        return;
      }
      if (action === "create-report-task") {
        const report = getReportById(decisionButton.dataset.reportId);
        if (!report) return;
        const createdTask = await addTaskToBoard({
          title: report.title,
          owner: getActiveName(),
          ownerLogin: getActiveLogin(),
          due: "dziś",
          priority: report.status === "Nowe" ? "important" : "normal",
          description: report.detail,
          source: `Decyzja: ${report.category}`,
          createdAt: "teraz",
        });
        if (createdTask) {
          await updateReportStatus(report.id, "W realizacji");
          showToast("Utworzono zadanie", report.title);
        }
        return;
      }
      applyRole();
      return;
    }

    const requestButton = event.target.closest("[data-request-action]");
    if (requestButton) {
      const request = requests[Number(requestButton.dataset.requestIndex)];
      const status = requestButton.dataset.requestAction === "approve" ? "Zaakceptowane" : "Odrzucone";
      const updatedRequest = await updateRequestStatus(request.id, status);
      if (updatedRequest) showToast("Status wniosku zmieniony", status);
      return;
    }

    const reportTaskButton = event.target.closest("[data-report-task]");
    if (reportTaskButton) {
      const report = getReportById(reportTaskButton.dataset.reportTask);
      if (!report) return;
      const createdTask = await addTaskToBoard({
        title: report.title,
        owner: getActiveName(),
        ownerLogin: getActiveLogin(),
        due: "dziś",
        priority: report.status === "Nowe" ? "important" : "normal",
        description: report.detail,
        source: `Zgłoszenie: ${report.category}`,
        createdAt: "teraz",
      });
      if (createdTask) {
        await updateReportStatus(report.id, "W realizacji");
        renderKanban();
        showToast("Utworzono zadanie ze zgłoszenia", report.title);
      }
      return;
    }

    const reportCloseButton = event.target.closest("[data-report-close]");
    if (reportCloseButton) {
      const report = await updateReportStatus(reportCloseButton.dataset.reportClose, "Załatwione");
      if (report) showToast("Zgłoszenie zamknięte");
      return;
    }

    const handoverButton = event.target.closest("[data-handover-accept]");
    if (handoverButton) {
      const acceptedNote = await acceptHandoverNote(handoverButton.dataset.handoverAccept);
      if (acceptedNote) showToast("Notatka przyjęta");
      return;
    }

    const handoverDeleteButton = event.target.closest("[data-handover-delete]");
    if (handoverDeleteButton) {
      await deleteHandoverNote(handoverDeleteButton.dataset.handoverDelete);
      return;
    }

    const pollButton = event.target.closest("[data-poll-vote]");
    if (pollButton) {
      $("#pollMeter").style.width = pollButton.dataset.pollVote === "yes" ? "75%" : "68%";
      $("#pollResult").textContent =
        pollButton.dataset.pollVote === "yes" ? "Głos zapisany: możesz przyjść" : "Głos zapisany: nie możesz przyjść";
      showToast("Głos zapisany", "Wynik ankiety został zaktualizowany.");
      return;
    }

    const announcementFilterButton = event.target.closest("[data-announcement-filter]");
    if (announcementFilterButton) {
      currentAnnouncementFilter = announcementFilterButton.dataset.announcementFilter;
      $$("[data-announcement-filter]").forEach((button) =>
        button.classList.toggle("active", button === announcementFilterButton),
      );
      renderPosts(currentFeedFilter);
      showToast("Filtr ogłoszeń", announcementFilterButton.textContent);
      return;
    }

    const taskFilterButton = event.target.closest("[data-task-filter]");
    if (taskFilterButton) {
      currentTaskFilter = taskFilterButton.dataset.taskFilter;
      $$("[data-task-filter]").forEach((button) => button.classList.toggle("active", button === taskFilterButton));
      renderKanban();
      showToast("Filtr zadań", taskFilterButton.textContent);
      return;
    }

    const reportFilterButton = event.target.closest("[data-report-filter]");
    if (reportFilterButton) {
      currentReportFilter = reportFilterButton.dataset.reportFilter;
      $$("[data-report-filter]").forEach((button) => button.classList.toggle("active", button === reportFilterButton));
      renderReports();
      applyRole();
      showToast("Filtr zgłoszeń", reportFilterButton.textContent);
      return;
    }

    const rsvpButton = event.target.closest("[data-rsvp]");
    if (rsvpButton) {
      const calendarEvent = calendarEvents.find((eventItem) => String(eventItem.id) === String(rsvpButton.dataset.rsvp));
      if (!calendarEvent) return;
      if (backendAvailable) {
        try {
          const result = await apiRequest(`/calendar/${encodeURIComponent(calendarEvent.id)}/rsvp`, {
            method: "POST",
          });
          applyCalendarSnapshot(result);
          renderCalendarState();
          pushNotification("RSVP zapisane", calendarEvent.title, { view: "calendar" });
          showToast("Obecność potwierdzona", calendarEvent.title);
        } catch (error) {
          showToast("Nie zapisano RSVP", error.message || "Backend odrzucił zapis.");
        }
        return;
      }
      if (calendarEvent.rsvp !== "Będę") {
        calendarEvent.rsvp = "Będę";
        calendarEvent.attendees += 1;
      }
      renderCalendar();
      pushNotification("RSVP zapisane", calendarEvent.title, { view: "calendar" });
      showToast("Obecność potwierdzona", calendarEvent.title);
      return;
    }

    const statReportButton = event.target.closest("[data-stat-report]");
    if (statReportButton) {
      activateView("reports");
      currentReportFilter = "open";
      renderReports();
      showToast("Otworzono zgłoszenia", statReportButton.textContent.trim());
      return;
    }

    const confirmReadButton = event.target.closest("[data-confirm-read]");
    if (confirmReadButton) {
      const post = getPostById(activePostId);
      if (!post) return;
      if (backendAvailable) {
        await markPostRead(post.id);
        showToast("Odczyt potwierdzony", "Potwierdzenie zapisano w bazie.");
        return;
      }
      if (!post.readers.some((reader) => reader.name === getActiveName())) {
        post.readers.push({ name: getActiveName(), time: "teraz" });
      }
      post.unread = false;
      post.read = post.total;
      renderPostDialog(post);
      renderPosts(currentFeedFilter);
      showToast("Odczyt potwierdzony", "Autor widzi pełne potwierdzenie.");
    }
  });

  $("[data-feed-filter='all']").parentElement.addEventListener("click", (event) => {
    if (!event.target.matches("button")) return;
    $$("[data-feed-filter]").forEach((button) => button.classList.toggle("active", button === event.target));
    renderPosts(event.target.dataset.feedFilter);
  });

  document.addEventListener("keydown", (event) => {
    const scheduleInput = event.target.closest("[data-schedule-user][data-schedule-day]");
    if (scheduleInput && event.key === "Enter") {
      event.preventDefault();
      scheduleInput.blur();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      $("#globalSearchInput").focus();
      $("#globalSearchInput").select();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      pollAnnouncements();
      pollTasks();
      pollReports();
      pollRequests();
      pollCalendar();
      pollKnowledge();
      pollChatMessages();
      refreshPresence();
    }
  });

  window.addEventListener("focus", () => {
    pollAnnouncements();
    pollTasks();
    pollReports();
    pollRequests();
    pollCalendar();
    pollKnowledge();
    pollChatMessages();
    refreshPresence();
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

boot().catch((error) => {
  console.error(error);
  showToast("Błąd startu aplikacji", "Odśwież stronę albo uruchom backend ponownie.");
});
