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

let inventoryItems = [];
let inventorySearchQuery = "";
let currentInventoryFilter = "all";
let storeShortages = [];
let currentStoreShortageFilter = "all";

let calendarEvents = [];
let timeSummary = null;
let quickPolls = [];
let weeklyKudos = [];
let activityEntries = [];
let selectedActivityDate = "";
let selectedActivityType = "all";
let selectedActivitySort = "time-desc";
let currentNotificationFilter = "all";
let selectedScheduleWeekStart = "";
let activeScheduleEdit = null;
let activeAdminTimeEdit = null;
let wageRates = {};
let wageSaturdayEntries = {};
let selectedWageLogin = "";
let userPreferences = { theme: "light", accent: "indigo" };
let userPreferencesSaveSeq = 0;

const columnLabels = {
  todo: "Do zrobienia",
  doing: "W trakcie",
  review: "Do sprawdzenia",
  done: "Zrobione",
};

let role = "employee";
let clockedIn = false;
let breakActive = false;
let startedAt = null;
let elapsedBefore = 0;
let timerId = null;
let currentAnnouncementFilter = "all";
let currentFeedFilter = "all";
let currentFeedTypeFilter = "all";
let currentTaskFilter = "all";
let currentReportFilter = "open";
let currentLeaveFilter = "all";
let kbSearchQuery = "";
let activePostId = null;
let activeTaskId = null;
let openReportCommentId = null;
let activeFeedItemId = null;
let activeKnowledgeArticleId = null;
let backendAvailable = false;
let announcementPollTimer = null;
let announcementPollInFlight = false;
const announcementPollIntervalMs = 6000;
let feedStateLogin = "";
let feedSeenInitialized = false;
let feedSeenTimer = null;
const pinnedFeedItemIds = new Set();
const seenFeedItemIds = new Set();
const freshFeedItemIds = new Set();
const expandedFeedCommentIds = new Set();
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
let quickPollTimer = null;
let quickPollInFlight = false;
const quickPollIntervalMs = 8000;
let kudosPollTimer = null;
let kudosPollInFlight = false;
const kudosPollIntervalMs = 8000;
let presencePollTimer = null;
let presencePollInFlight = false;
const presencePollIntervalMs = 5000;
let sharedDataPollTimer = null;
let sharedDataPollInFlight = false;
const sharedDataPollIntervalMs = 2500;
let statsAnimationTimer = null;

const storageKeys = {
  accounts: "prokom-accounts-v3",
  myDay: "prokom-myday-v2",
  requests: "prokom-requests-v2",
  tasks: "prokom-tasks-v2",
  dashboardLayout: "prokom-dashboard-layout-v2",
  chatGroups: "prokom-chat-groups-v2",
  chatMessages: "prokom-chat-messages-v2",
  notificationReadIds: "prokom-notification-read-ids-v2",
  quickPolls: "prokom-quick-polls-v1",
  weeklyKudos: "prokom-weekly-kudos-v1",
  wageRates: "prokom-wage-rates-v1",
  wageSaturday: "prokom-wage-saturday-v1",
  inventory: "prokom-inventory-v1",
  storeShortages: "prokom-store-shortages-v1",
  feedPinnedIds: "prokom-feed-pinned-ids-v1",
  feedSeenIds: "prokom-feed-seen-ids-v1",
  userPreferences: "prokom-user-preferences-v1",
};

const defaultNotificationPreferences = {
  chat: true,
  tasks: true,
  inventory: true,
  storeShortages: true,
  reports: true,
  announcements: true,
  time: true,
  leaves: true,
  calendar: true,
  knowledge: true,
  team: true,
  dashboard: true,
};

const defaultUserPreferences = {
  theme: "light",
  accent: "indigo",
  notifications: { ...defaultNotificationPreferences },
};

const accentOptions = {
  indigo: { label: "Granatowy", themeColor: "#4f46e5" },
  blue: { label: "Niebieski", themeColor: "#2563eb" },
  green: { label: "Zielony", themeColor: "#0f9f6e" },
  red: { label: "Czerwony", themeColor: "#dc2626" },
};

const viewTitles = {
  dashboard: "Pulpit",
  announcements: "Ogłoszenia",
  tasks: "Zadania",
  time: "Czas pracy",
  leaves: "Urlopy",
  calendar: "Kalendarz",
  reports: "Zgłoszenia",
  chat: "Czat",
  storeShortages: "Braki na sklepie",
  inventory: "Magazyn",
  knowledge: "Dokumenty",
  team: "Zespół",
  stats: "Raporty",
  activity: "Historia aktywności",
  settings: "Ustawienia",
};

const viewAliases = {};

const notificationFilters = [
  { id: "all", label: "Wszystkie" },
  { id: "chat", label: "Czat" },
  { id: "tasks", label: "Zadania" },
  { id: "reports", label: "Zgłoszenia" },
  { id: "announcements", label: "Ogłoszenia" },
  { id: "time", label: "Czas pracy" },
  { id: "leaves", label: "Urlopy" },
  { id: "calendar", label: "Kalendarz" },
  { id: "inventory", label: "Magazyn" },
  { id: "storeShortages", label: "Braki na sklepie" },
  { id: "knowledge", label: "Baza wiedzy" },
  { id: "team", label: "Zespół" },
  { id: "dashboard", label: "Inne" },
];

const notificationSourceOptions = [
  { id: "chat", label: "Wiadomości czatu" },
  { id: "tasks", label: "Nowe zadania" },
  { id: "inventory", label: "Niskie stany magazynu" },
  { id: "storeShortages", label: "Braki na sklepie" },
  { id: "reports", label: "Zgłoszenia" },
  { id: "announcements", label: "Ogłoszenia" },
  { id: "time", label: "Czas pracy" },
  { id: "leaves", label: "Urlopy" },
  { id: "calendar", label: "Kalendarz" },
  { id: "knowledge", label: "Baza wiedzy" },
];

const feedTypeFilters = [
  { id: "all", label: "Wszystkie typy" },
  { id: "announcements", label: "Ogłoszenia" },
  { id: "reports", label: "Zgłoszenia" },
  { id: "tasks", label: "Zadania" },
  { id: "calendar", label: "Kalendarz" },
];

const calendarSources = [
  { id: "inventory", label: "Magazyn", className: "source-inventory" },
  { id: "calendar", label: "Wydarzenia", className: "source-calendar" },
  { id: "announcements", label: "Ogłoszenia", className: "source-announcements" },
  { id: "reports", label: "Zgłoszenia", className: "source-reports" },
  { id: "tasks", label: "Zadania", className: "source-tasks" },
  { id: "knowledge", label: "Baza wiedzy", className: "source-knowledge" },
  { id: "time", label: "Czas pracy", className: "source-time" },
  { id: "leaves", label: "Urlopy", className: "source-leaves" },
];
const calendarSourceMap = Object.fromEntries(calendarSources.map((source) => [source.id, source]));
const hiddenCalendarSourceIds = new Set();
let activeCalendarDay = null;

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

function escapeSelectorValue(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
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

function normalizeUserPreferences(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const theme = source.theme === "dark" ? "dark" : "light";
  const accent = Object.prototype.hasOwnProperty.call(accentOptions, source.accent) ? source.accent : defaultUserPreferences.accent;
  const sourceNotifications =
    source.notifications && typeof source.notifications === "object" ? source.notifications : {};
  const notifications = Object.fromEntries(
    Object.entries(defaultNotificationPreferences).map(([key, fallback]) => [
      key,
      Object.prototype.hasOwnProperty.call(sourceNotifications, key) ? Boolean(sourceNotifications[key]) : fallback,
    ]),
  );
  return { theme, accent, notifications };
}

function userPreferenceStorageKey(login = getActiveLogin()) {
  return normalizeLogin(login || "guest") || "guest";
}

function readLocalUserPreferences(login = getActiveLogin()) {
  const stored = readStorage(storageKeys.userPreferences, {});
  const key = userPreferenceStorageKey(login);
  return normalizeUserPreferences(stored && typeof stored === "object" ? stored[key] : null);
}

function writeLocalUserPreferences(login = getActiveLogin(), preferences = userPreferences) {
  const stored = readStorage(storageKeys.userPreferences, {});
  const next = stored && typeof stored === "object" ? stored : {};
  next[userPreferenceStorageKey(login)] = normalizeUserPreferences(preferences);
  writeStorage(storageKeys.userPreferences, next);
}

function updateThemeMeta(preferences = userPreferences) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  meta.content = preferences.theme === "dark" ? "#080d18" : accentOptions[preferences.accent]?.themeColor || "#4f46e5";
}

function updateCurrentAccountPreferences(preferences = userPreferences) {
  if (!currentUser) return;
  currentUser = { ...currentUser, preferences: normalizeUserPreferences(preferences) };
  const index = accounts.findIndex((account) => account.login === currentUser.login);
  if (index >= 0) {
    accounts[index] = { ...accounts[index], preferences: currentUser.preferences };
  }
}

function setSettingsStatus(label = "Gotowe", tone = "green") {
  const status = $("#settingsSaveStatus");
  if (!status) return;
  status.textContent = label;
  status.className = `pill ${tone}`.trim();
}

function applyUserPreferences(preferences = userPreferences) {
  userPreferences = normalizeUserPreferences(preferences);
  document.documentElement.dataset.theme = userPreferences.theme;
  document.documentElement.dataset.accent = userPreferences.accent;
  updateThemeMeta(userPreferences);
  const toggle = $("#themeToggle");
  if (toggle) {
    toggle.textContent = userPreferences.theme === "dark" ? "Tryb jasny" : "Tryb ciemny";
  }
  renderSettings();
}

function renderSettings() {
  const themeBadge = $("#settingsThemeBadge");
  const accentBadge = $("#settingsAccentBadge");
  const userBadge = $("#settingsUserBadge");
  const notificationsBadge = $("#settingsNotificationsBadge");
  if (themeBadge) {
    themeBadge.textContent = userPreferences.theme === "dark" ? "Ciemny" : "Jasny";
    themeBadge.className = `pill ${userPreferences.theme === "dark" ? "teal" : ""}`.trim();
  }
  if (accentBadge) {
    accentBadge.textContent = accentOptions[userPreferences.accent]?.label || "Granatowy";
    accentBadge.className = "pill teal";
  }
  if (userBadge) userBadge.textContent = currentUser?.label || "Moje konto";
  $$("[data-settings-theme]").forEach((input) => {
    input.checked = input.value === userPreferences.theme;
  });
  $$("[data-settings-accent]").forEach((input) => {
    input.checked = input.value === userPreferences.accent;
  });
  $$("[data-settings-notification]").forEach((input) => {
    input.checked = notificationSourceEnabled(input.value);
  });
  if (notificationsBadge) {
    const enabledCount = notificationSourceOptions.filter((source) => notificationSourceEnabled(source.id)).length;
    notificationsBadge.textContent =
      enabledCount === notificationSourceOptions.length ? "Wszystkie" : `${enabledCount} z ${notificationSourceOptions.length}`;
    notificationsBadge.className = `pill ${enabledCount ? "teal" : "amber"}`;
  }
}

async function saveUserPreferences(partial = {}) {
  const saveSeq = ++userPreferencesSaveSeq;
  const next = normalizeUserPreferences({
    ...userPreferences,
    ...partial,
    notifications: {
      ...(userPreferences.notifications || {}),
      ...(partial.notifications || {}),
    },
  });
  applyUserPreferences(next);
  if (currentUser) {
    updateCurrentAccountPreferences(next);
    writeLocalUserPreferences(currentUser.login, next);
  }
  setSettingsStatus("Zapisywanie", "teal");

  if (!backendAvailable || !currentUser) {
    setSettingsStatus("Zapisano", "green");
    return;
  }

  try {
    const result = await apiRequest("/me/preferences", {
      method: "PATCH",
      body: JSON.stringify(next),
    });
    const saved = normalizeUserPreferences(result.preferences || result.user?.preferences || next);
    if (saveSeq !== userPreferencesSaveSeq) return;
    applyUserPreferences(saved);
    updateCurrentAccountPreferences(saved);
    writeLocalUserPreferences(currentUser.login, saved);
    setSettingsStatus("Zapisano", "green");
  } catch (error) {
    if (saveSeq !== userPreferencesSaveSeq) return;
    setSettingsStatus("Zapis lokalny", "amber");
    showToast("Ustawienia zapisane lokalnie", error.message || "Backend nie przyjął zmian.");
  }
}

function localDateFromInput(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getWeekStartDate(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - dayOffset);
  return start;
}

function getScheduleWeekStart() {
  if (!selectedScheduleWeekStart) selectedScheduleWeekStart = formatDateInput(getWeekStartDate());
  return selectedScheduleWeekStart;
}

function getCurrentWeekStartValue() {
  return formatDateInput(getWeekStartDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addWeeksToDateInput(value, weeks) {
  return formatDateInput(addDays(localDateFromInput(value) || getWeekStartDate(), weeks * 7));
}

function weekInputValueFromDate(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function weekStartFromWeekInput(value) {
  const match = /^(\d{4})-W(\d{2})$/.exec(String(value || ""));
  if (!match) return getScheduleWeekStart();
  const year = Number(match[1]);
  const week = Number(match[2]);
  const janFourth = new Date(year, 0, 4);
  return formatDateInput(addDays(getWeekStartDate(janFourth), (week - 1) * 7));
}

function formatScheduleDate(value) {
  const date = localDateFromInput(value);
  if (!date) return value || "";
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit" }).format(date);
}

function formatScheduleWeekRange(weekStart) {
  const start = localDateFromInput(weekStart) || getWeekStartDate();
  const end = addDays(start, 4);
  return `${formatScheduleDate(formatDateInput(start))} - ${formatScheduleDate(formatDateInput(end))}`;
}

const scheduleDayKeys = ["mon", "tue", "wed", "thu", "fri"];
const scheduleDayLabels = ["Pon", "Wt", "Sr", "Czw", "Pt"];

function scheduleDaysForWeek(weekStart) {
  return scheduleDayKeys.map((key, index) => {
    const date = addDays(localDateFromInput(weekStart) || getWeekStartDate(), index);
    return {
      key,
      label: scheduleDayLabels[index],
      date: formatScheduleDate(formatDateInput(date)),
      isoDate: formatDateInput(date),
    };
  });
}

function getRenderedScheduleDays() {
  const weekStart = getScheduleWeekStart();
  const schedule = timeSummary?.schedule;
  if (schedule?.weekStart === weekStart && schedule.days?.length) return schedule.days;
  return scheduleDaysForWeek(weekStart);
}

function formatMoney(value) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(Number(value) || 0);
}

function formatHourlyRate(value) {
  return `${new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)} zł/h`;
}

const scheduleNoteLabels = {
  wolne: "Wolne",
  urlop: "Urlop",
  l4: "L4",
  szkolenie: "Szkolenie",
};

function timeToMinutes(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value || ""));
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function parseScheduleValue(value = "") {
  const text = String(value || "").trim();
  const normalized = text.replace("–", "-").replace("—", "-");
  const workMatch = /^([01]?\d|2[0-3]):([0-5]\d)\s*-\s*([01]?\d|2[0-3]):([0-5]\d)$/.exec(normalized);
  if (workMatch) {
    return {
      mode: "work",
      start: `${String(Number(workMatch[1])).padStart(2, "0")}:${workMatch[2]}`,
      end: `${String(Number(workMatch[3])).padStart(2, "0")}:${workMatch[4]}`,
    };
  }
  const note = normalizeSearch(text);
  if (scheduleNoteLabels[note]) return { mode: note, start: "", end: "" };
  return { mode: "work", start: "", end: "" };
}

function scheduleDisplayValue(value = "") {
  const text = String(value || "").trim();
  if (!text) return "Dodaj wpis";
  const parsed = parseScheduleValue(text);
  if (parsed.mode === "work" && parsed.start && parsed.end) return `${parsed.start} - ${parsed.end}`;
  return scheduleNoteLabels[parsed.mode] || text;
}

function scheduleCellClass(value = "") {
  const parsed = parseScheduleValue(value);
  if (!String(value || "").trim()) return "empty";
  return parsed.mode === "work" ? "work" : "note";
}

function scheduleValueSeconds(value = "") {
  const parsed = parseScheduleValue(value);
  if (parsed.mode !== "work" || !parsed.start || !parsed.end) return 0;
  const start = timeToMinutes(parsed.start);
  const end = timeToMinutes(parsed.end);
  return start !== null && end !== null && end > start ? (end - start) * 60 : 0;
}

function currentWorkdayIndex() {
  const index = (new Date().getDay() + 6) % 7;
  return index >= 0 && index < scheduleDayKeys.length ? index : -1;
}

function effectiveTodaySeconds() {
  return Math.floor(displayedTodayMs() / 1000);
}

function activeScheduleRow() {
  const rows = timeSummary?.schedule?.rows || [];
  return rows.find((row) => normalizeLogin(row.login) === getActiveLogin()) || null;
}

function weeklyPresenceSeries() {
  const personal = timeSummary?.personal || {};
  const days = getRenderedScheduleDays();
  const row = activeScheduleRow();
  const todayIndex = currentWorkdayIndex();
  const isCurrentWeek = getScheduleWeekStart() === getCurrentWeekStartValue();
  return days.map((day, index) => {
    const cell = row?.cells?.find((item) => item.day === day.key);
    const scheduleSeconds = scheduleValueSeconds(cell?.value || "");
    const seconds = isCurrentWeek && index === todayIndex ? Math.max(scheduleSeconds, effectiveTodaySeconds()) : scheduleSeconds;
    return {
      key: day.key,
      label: day.label,
      date: day.date || formatScheduleDate(day.isoDate),
      seconds,
      value: cell?.value || "",
      selected: isCurrentWeek && index === todayIndex,
      monthSeconds: Number(personal.monthSeconds || 0),
    };
  });
}

function renderTimeKpiTiles() {
  const personal = timeSummary?.personal || {};
  const pulse = timeSummary?.pulse || {};
  const todaySeconds = effectiveTodaySeconds();
  const weekSeconds = Math.max(Number(personal.weekSeconds || 0), todaySeconds);
  const monthSeconds = Math.max(Number(personal.monthSeconds || 0), todaySeconds);
  const overtimeSeconds = Number(pulse.overtimeWeekSeconds || 0);
  const values = {
    timeTodayTile: todaySeconds,
    timeWeekTile: weekSeconds,
    timeMonthTile: monthSeconds,
    timeOvertimeTile: overtimeSeconds,
  };
  Object.entries(values).forEach(([id, seconds]) => {
    const node = $(`#${id}`);
    if (node) node.textContent = formatWorkDuration(seconds);
  });
}

function renderTopbarWorkCounter() {
  const timer = $("#topbarWorkTimer");
  if (!timer) return;
  const todaySeconds = effectiveTodaySeconds();
  timer.textContent = formatTimer(todaySeconds * 1000);
  const state = $("#topbarWorkState");
  if (state) state.textContent = clockedIn ? (breakActive ? "Przerwa ·" : "W pracy ·") : todaySeconds ? "Dziś ·" : "Dziś";
  const counter = $("#topbarWorkCounter");
  if (counter) {
    counter.dataset.clockState = clockedIn ? (breakActive ? "break" : "in") : todaySeconds ? "done" : "out";
  }
}

function renderTimeWeekChart() {
  const chart = $("#timeWeekChart");
  if (!chart) return;
  const series = weeklyPresenceSeries();
  const maxHours = Math.max(10, Math.ceil(Math.max(1, ...series.map((item) => item.seconds)) / 3600));
  const axisTicks = Array.from({ length: 6 }, (_, index) => maxHours - (maxHours / 5) * index);
  const shortWeekLabels = ["Pn", "Wt", "\u015ar", "Cz", "Pt"];
  const formatAxisHour = (value) => `${Number.isInteger(value) ? value : value.toFixed(1).replace(".0", "")}h`;
  const totalSeconds = series.reduce((sum, item) => sum + item.seconds, 0);
  const total = $("#timeWeekChartTotal");
  if (total) total.textContent = formatWorkDuration(totalSeconds);
  chart.innerHTML = `
    <div class="time-week-chart-frame" role="img" aria-label="Wykres godzin obecności w tygodniu">
      <div class="time-week-yaxis">
        ${axisTicks.map((tick) => `<span>${escapeHtml(formatAxisHour(tick))}</span>`).join("")}
      </div>
      <div class="time-week-plot">
        ${axisTicks
          .map((_, index) => `<span class="time-week-grid-line" style="--line-y: ${(index / (axisTicks.length - 1)) * 100}%"></span>`)
          .join("")}
        <div class="time-week-bars">
          ${series
            .map((item) => {
              const hours = item.seconds / 3600;
              const percent = item.seconds ? Math.max(3, Math.min(100, Math.round((hours / maxHours) * 100))) : 0;
              const label = `${item.label} ${item.date || ""}`.trim();
              return `
                <article class="time-week-bar ${item.selected ? "is-today" : ""}" style="--bar-height: ${percent}%; --bar-width: ${percent}%" title="${escapeHtml(
                  `${label}: ${formatWorkDuration(item.seconds)}`,
                )}">
                  <span></span>
                  <strong>${escapeHtml(formatWorkDuration(item.seconds))}</strong>
                </article>
              `;
            })
            .join("")}
        </div>
      </div>
    </div>
    <div class="time-week-xaxis">
      <span></span>
      <div class="time-week-labels">
        ${series
          .map((item, index) => `<span>${escapeHtml(shortWeekLabels[index] || item.label)}</span>`)
          .join("")}
      </div>
    </div>
  `;
}

function todayScheduleCell() {
  const index = currentWorkdayIndex();
  if (index < 0) return null;
  const day = getRenderedScheduleDays()[index];
  const row = activeScheduleRow();
  const cell = row?.cells?.find((item) => item.day === day?.key);
  return day ? { day, value: cell?.value || "" } : null;
}

function renderTimeDayLog() {
  const list = $("#timeDayLog");
  if (!list) return;
  const personal = timeSummary?.personal || {};
  const entries = Array.isArray(personal.dayLog) ? personal.dayLog : [];
  const person = getPersonByLogin(getActiveLogin()) || {};
  const scheduleCell = todayScheduleCell();
  const todaySeconds = effectiveTodaySeconds();
  const badge = $("#timeDayLogBadge");
  if (badge) {
    badge.textContent = person.status || "Dzisiaj";
    badge.className = `pill ${["work", "break"].includes(person.state) ? "green" : todaySeconds ? "teal" : ""}`;
  }
  const stateForEntry = (label = "") => {
    const normalized = String(label).toLowerCase();
    if (normalized.includes("przerw") || normalized.includes("pauz")) return { className: "s-todo", label: "Pauza" };
    if (normalized.includes("w toku") || normalized.includes("aktywn")) return { className: "s-new", label: "Aktywne" };
    return { className: "s-ok", label: "Start" };
  };
  const renderRows = (rows) => `
    <table class="tbl time-day-table">
      <tbody>
        ${rows
          .map((entry) => {
            const state = stateForEntry(entry.title || entry.status);
            return `
              <tr>
                <td>${escapeHtml(entry.time)}</td>
                <td>
                  <strong>${escapeHtml(entry.title)}</strong>
                  <span>${escapeHtml(entry.detail)}</span>
                </td>
                <td><span class="state ${state.className}">${escapeHtml(state.label)}</span></td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;

  if (entries.length) {
    list.innerHTML = renderRows(
      entries.map((entry) => ({
        time: `${entry.start || "--:--"}${entry.end ? ` - ${entry.end}` : ""}`,
        title: entry.status || "Obecność",
        detail: `${formatWorkDuration(entry.durationSeconds || 0)}${
          entry.breakSeconds ? ` · przerwa ${formatWorkDuration(entry.breakSeconds)}` : ""
        }`,
      })),
    );
    return;
  }

  const fallback = [];
  if (scheduleCell?.value) {
    fallback.push({
      time: scheduleCell.day.date || "Dzisiaj",
      title: "Wpis z grafiku",
      detail: `${scheduleDisplayValue(scheduleCell.value)} · ${formatWorkDuration(scheduleValueSeconds(scheduleCell.value))}`,
    });
  }
  if (todaySeconds) {
    fallback.push({
      time: "Dzisiaj",
      title: ["work", "break"].includes(person.state) ? person.status : "Zarejestrowana obecność",
      detail: formatWorkDuration(todaySeconds),
    });
  }
  list.innerHTML = fallback.length
    ? renderRows(fallback)
    : `<div class="empty-state">Brak zarejestrowanej obecności dla dzisiejszego dnia.</div>`;
}

function timeInputFromIso(value) {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "";
  return `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
}

function dateInputFromIso(value) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? formatDateInput(parsed) : "";
}

function adminTimePeople() {
  const source = timeSummary?.people?.length ? timeSummary.people : activePeople();
  return source.filter((person) => person.login && person.active !== false);
}

function latestAdminTimeEntry(person) {
  const entries = Array.isArray(person?.dayLog) ? person.dayLog : [];
  return entries.find((entry) => entry.status === "W toku") || entries.at(-1) || null;
}

function adminTimeEntryDate(entry) {
  return dateInputFromIso(entry?.startedAt) || formatDateInput(new Date());
}

function adminTimeEntrySummary(person) {
  const entry = latestAdminTimeEntry(person);
  if (!entry) {
    const todaySeconds = Number(person?.todaySeconds || 0);
    return todaySeconds ? `Dzisiaj: ${formatWorkDuration(todaySeconds)}` : "Brak wpisu dzisiaj";
  }
  const end = entry.end ? ` - ${entry.end}` : " - w toku";
  const breakLabel = Number(entry.breakSeconds || 0) ? ` · przerwa ${formatWorkDuration(entry.breakSeconds)}` : "";
  return `${entry.start || "--:--"}${end} · ${formatWorkDuration(entry.durationSeconds || 0)}${breakLabel}`;
}

function renderAdminTimeControl() {
  const list = $("#adminTimeEntries");
  if (!list) return;
  if (role !== "admin") {
    list.innerHTML = "";
    return;
  }
  const peopleList = adminTimePeople();
  list.innerHTML = peopleList.length
    ? peopleList
        .map((person) => {
          const entry = latestAdminTimeEntry(person);
          const active = ["work", "break"].includes(person.state);
          const statusClass = active ? "green" : Number(person.todaySeconds || 0) ? "teal" : "";
          return `
            <article class="admin-time-entry-card">
              <span class="avatar team-avatar-${escapeHtml(slugifyLogin(person.login || person.name))}">${escapeHtml(
                getInitialsByLogin(person.login, person.name),
              )}</span>
              <div>
                <strong>${escapeHtml(person.name)}</strong>
                <small>${escapeHtml(adminTimeEntrySummary(person))}</small>
              </div>
              <span class="pill ${statusClass}">${escapeHtml(person.status || "Niewbity")}</span>
              <button class="secondary-button" data-admin-time-edit-person="${escapeHtml(person.login)}" type="button">${
                entry ? "Edytuj" : "Dodaj"
              }</button>
            </article>
          `;
        })
        .join("")
    : `<div class="empty-state">Brak aktywnych pracowników do edycji czasu.</div>`;
}

function populateAdminTimeUserOptions(selectedLogin = "") {
  const select = $("#adminTimeUserSelect");
  if (!select) return "";
  const peopleList = adminTimePeople();
  const preferred = normalizeLogin(selectedLogin || peopleList.find((person) => person.login !== getActiveLogin())?.login || peopleList[0]?.login || "");
  select.innerHTML = peopleList
    .map(
      (person) => `
        <option value="${escapeHtml(person.login)}" ${normalizeLogin(person.login) === preferred ? "selected" : ""}>
          ${escapeHtml(person.name)}
        </option>
      `,
    )
    .join("");
  return select.value || preferred;
}

function fillAdminTimeFormFromPerson(login, options = {}) {
  const selectedLogin = normalizeLogin(login || $("#adminTimeUserSelect")?.value);
  const person = getPersonByLogin(selectedLogin);
  const entry = latestAdminTimeEntry(person);
  const today = formatDateInput(new Date());
  const dateValue = options.keepDate ? $("#adminTimeDateInput")?.value || today : adminTimeEntryDate(entry);
  const isEntryDate = entry && adminTimeEntryDate(entry) === dateValue;
  $("#adminTimeDateInput").value = dateValue;
  $("#adminTimeSessionInput").value = isEntryDate ? entry?.id || "" : "";
  $("#adminTimeStartInput").value = isEntryDate ? entry?.start || timeInputFromIso(entry?.startedAt) || "08:00" : "08:00";
  $("#adminTimeEndInput").value = isEntryDate ? entry?.end || timeInputFromIso(entry?.endedAt) || "" : "";
  $("#adminTimeBreakInput").value = isEntryDate ? Math.round(Number(entry?.breakSeconds || 0) / 60) : 0;
  const context = $("#adminTimeEditContext");
  if (context) context.textContent = person?.name ? `Ewidencja czasu · ${person.name}` : "Ewidencja czasu";
}

function openAdminTimeEdit(login = "", options = {}) {
  if (role !== "admin") return;
  const selectedLogin = populateAdminTimeUserOptions(login);
  activeAdminTimeEdit = { userLogin: selectedLogin };
  if (options.blank) {
    $("#adminTimeDateInput").value = formatDateInput(new Date());
    $("#adminTimeSessionInput").value = "";
    $("#adminTimeStartInput").value = "08:00";
    $("#adminTimeEndInput").value = "";
    $("#adminTimeBreakInput").value = 0;
    const person = getPersonByLogin(selectedLogin);
    const context = $("#adminTimeEditContext");
    if (context) context.textContent = person?.name ? `Nowy wpis · ${person.name}` : "Nowy wpis";
  } else {
    fillAdminTimeFormFromPerson(selectedLogin);
  }
  openDialog("#adminTimeEditDialog");
  window.setTimeout(() => $("#adminTimeStartInput")?.focus(), 0);
}

function refreshAdminTimeFormForDate() {
  const login = normalizeLogin($("#adminTimeUserSelect")?.value || activeAdminTimeEdit?.userLogin || "");
  const person = getPersonByLogin(login);
  const entry = latestAdminTimeEntry(person);
  const selectedDate = $("#adminTimeDateInput")?.value || formatDateInput(new Date());
  const entryDate = adminTimeEntryDate(entry);
  if (entry && selectedDate === entryDate) {
    $("#adminTimeSessionInput").value = entry.id || "";
    $("#adminTimeStartInput").value = entry.start || timeInputFromIso(entry.startedAt) || $("#adminTimeStartInput").value || "08:00";
    $("#adminTimeEndInput").value = entry.end || timeInputFromIso(entry.endedAt) || "";
    $("#adminTimeBreakInput").value = Math.round(Number(entry.breakSeconds || 0) / 60);
    return;
  }
  $("#adminTimeSessionInput").value = "";
}

async function saveAdminTimeEdit(event) {
  event.preventDefault();
  if (role !== "admin") return;
  const userLogin = normalizeLogin($("#adminTimeUserSelect")?.value || "");
  const date = $("#adminTimeDateInput")?.value || "";
  const startTime = $("#adminTimeStartInput")?.value || "";
  const endTime = $("#adminTimeEndInput")?.value || "";
  const breakMinutes = Math.max(0, Number($("#adminTimeBreakInput")?.value || 0) || 0);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = endTime ? timeToMinutes(endTime) : null;
  if (!userLogin) {
    showToast("Wybierz pracownika", "Nie ma użytkownika do edycji.");
    return;
  }
  if (!date || startMinutes === null) {
    showToast("Uzupełnij wpis", "Wybierz datę i godzinę wbicia.");
    return;
  }
  if (endTime && (endMinutes === null || endMinutes <= startMinutes)) {
    showToast("Popraw godziny", "Wybicie musi być późniejsze niż wbicie.");
    return;
  }
  try {
    const result = await apiRequest("/time/admin-entry", {
      method: "PATCH",
      body: JSON.stringify({
        userLogin,
        date,
        startTime,
        endTime,
        breakMinutes,
        sessionId: $("#adminTimeSessionInput")?.value || "",
      }),
    });
    applyTimeSummary(result);
    $("#adminTimeEditDialog")?.close();
    showToast("Czas zapisany", `${getDisplayNameByLogin(userLogin)} · ${startTime}${endTime ? `-${endTime}` : " · wbity"}`);
  } catch (error) {
    showToast("Nie zapisano czasu", error.message || "Backend odrzucił ręczną edycję.");
    await syncTimeSummaryFromBackend({ silent: true });
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
    preferences: normalizeUserPreferences(account.preferences),
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
          pushNotification(
            "Nowa wiadomość",
            `${getDisplayNameByLogin(message.authorLogin)}: ${message.body}`,
            {
              view: "chat",
              conversationId,
              messageId: message.id,
            },
            { id: `chat:${conversationId}:${message.id}` },
          );
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
  return getUnreadIncomingMessages(conversationId).length > 0;
}

function getUnreadIncomingMessages(conversationId) {
  const login = getActiveLogin();
  return (directMessages.get(conversationId) || []).filter(
    (message) => message.authorLogin !== login && !(message.readBy || []).includes(login),
  );
}

function unreadIncomingCount(conversationId) {
  return getUnreadIncomingMessages(conversationId).length;
}

function clearChatNotificationsForReadMessages(conversationId, readMessagesOrIds = []) {
  const readIds = new Set(
    readMessagesOrIds
      .map((item) => (typeof item === "string" ? item : item?.id))
      .map(String)
      .filter(Boolean),
  );
  let changed = false;
  notifications = notifications.filter((item) => {
    const notification = normalizeNotification(item);
    const target = notification.target || {};
    const isSameConversation = target.view === "chat" && target.conversationId === conversationId;
    const matchesReadMessage = !target.messageId || !readIds.size || readIds.has(String(target.messageId));
    if (!isSameConversation || !matchesReadMessage) return true;
    notificationReadIds.add(String(notification.id));
    changed = true;
    return false;
  });
  if (changed) saveNotificationReadState();
  return changed;
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
  const unreadMessages = getUnreadIncomingMessages(conversationId);
  if (!unreadMessages.length) return clearChatNotificationsForReadMessages(conversationId);

  if (!backendAvailable) {
    const readIds = unreadMessages.map((message) => message.id);
    const changed = applyLocalReadReceipt(conversationId, readIds);
    if (changed) {
      saveChatMessageState();
      clearChatNotificationsForReadMessages(conversationId, readIds);
    }
    return changed;
  }

  if (chatReadInFlight.has(conversationId)) return false;
  chatReadInFlight.add(conversationId);
  try {
    const result = await apiRequest("/chat/messages/read", {
      method: "POST",
      body: JSON.stringify({ conversationId }),
    });
    const readIds = result.readMessageIds || unreadMessages.map((message) => message.id);
    const changed = applyLocalReadReceipt(conversationId, readIds);
    if (changed) clearChatNotificationsForReadMessages(conversationId, readIds);
    return changed;
  } catch {
    return false;
  } finally {
    chatReadInFlight.delete(conversationId);
  }
}

function markCurrentConversationRead() {
  const conversationId = currentConversation;
  window.setTimeout(async () => {
    const changed = await markConversationRead(conversationId);
    if (changed) {
      saveChatMessageState();
      renderConversationUnreadBadges();
      renderNotifications();
    }
  }, 0);
}

async function pollChatMessages() {
  if (chatPollInFlight || document.hidden || !backendAvailable || !isLoggedIn()) return;
  chatPollInFlight = true;
  try {
    const changed = await syncVisibleChatMessagesFromBackend({ notify: true });
    if (changed) {
      renderChat();
      renderDashboardRecentChats();
      renderNavNotificationBadges();
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
  if (snapshot.schedule?.weekStart) {
    selectedScheduleWeekStart = snapshot.schedule.weekStart;
  }
  if (Array.isArray(snapshot.people)) {
    const byLogin = new Map(snapshot.people.map((person) => [person.login, person]));
    people = people.map((person) => ({ ...person, ...(byLogin.get(person.login) || {}) }));
  }
  syncClockStateFromCurrentPerson();
  syncClockTimerFromTimeSummary();
  renderTimeDashboard();
  renderSchedule();
  renderWageCalculator();
  renderStats();
  return true;
}

async function syncTimeSummaryFromBackend(options = {}) {
  if (!backendAvailable || !isLoggedIn()) return false;
  try {
    const weekStart = encodeURIComponent(options.weekStart || getScheduleWeekStart());
    const snapshot = await apiRequest(`/time/summary?weekStart=${weekStart}`, { headers: {} });
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
  if (today) today.textContent = formatWorkDuration(effectiveTodaySeconds());
  if (week) week.textContent = formatWorkDuration(personal.weekSeconds);
  if (month) month.textContent = formatWorkDuration(personal.monthSeconds);
  renderTopbarWorkCounter();
  renderTimeKpiTiles();
  renderTimeWeekChart();
  renderTimeDayLog();
  renderAdminTimeControl();

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

function getWagePeople() {
  const source = timeSummary?.people?.length ? timeSummary.people : activePeople();
  if (role !== "admin") {
    return source.filter((person) => person.login === getActiveLogin() || person.name === getActiveName());
  }
  return source.filter((person) => person.active !== false);
}

function saveWageRates() {
  writeStorage(storageKeys.wageRates, wageRates);
}

function wageMonthStorageKey(login = selectedWageLogin) {
  const safeLogin = normalizeLogin(login || getActiveLogin());
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `${safeLogin}:${month}`;
}

function decimalHoursToSeconds(value) {
  return Math.max(0, Number(String(value || "").replace(",", ".")) || 0) * 3600;
}

function hoursInputValueFromSeconds(seconds = 0) {
  const hours = Math.max(0, Number(seconds) || 0) / 3600;
  return hours ? String(Number(hours.toFixed(2))) : "";
}

function defaultSaturdayDateInput() {
  const today = new Date();
  const daysUntilSaturday = (6 - today.getDay() + 7) % 7;
  return formatDateInput(addDays(today, daysUntilSaturday));
}

function normalizeSaturdayWageEntry(entry = {}, index = 0, login = selectedWageLogin) {
  const source = entry && typeof entry === "object" ? entry : {};
  const storageKey = wageMonthStorageKey(login).replace(/[^a-z0-9-]/gi, "-");
  const parsedDate = localDateFromInput(source.date);
  const rawRate = source.rate;
  const rawMultiplier = Number(source.multiplier);
  return {
    id: String(source.id || `saturday-${storageKey}-${index}`),
    date: parsedDate ? formatDateInput(parsedDate) : defaultSaturdayDateInput(),
    seconds: Math.max(0, Number(source.seconds) || 0),
    rate: rawRate === null || rawRate === undefined || rawRate === "" ? null : Math.max(0, Number(rawRate) || 0),
    multiplier: rawMultiplier > 0 ? rawMultiplier : 1,
    note: String(source.note || "").slice(0, 80),
  };
}

function getSaturdayWageEntries(login = selectedWageLogin) {
  const key = wageMonthStorageKey(login);
  const stored = wageSaturdayEntries[key];
  let entries = [];
  if (Array.isArray(stored)) {
    entries = stored;
  } else if (stored && Array.isArray(stored.entries)) {
    entries = stored.entries;
  } else if (stored && typeof stored === "object" && (Number(stored.seconds) || stored.rate !== undefined)) {
    entries = [stored];
  }
  return entries.map((entry, index) => normalizeSaturdayWageEntry(entry, index, login)).filter((entry) => entry.seconds > 0);
}

function saveSaturdayWageEntries(login, entries) {
  const key = wageMonthStorageKey(login);
  const normalized = entries.map((entry, index) => normalizeSaturdayWageEntry(entry, index, login)).filter((entry) => entry.seconds > 0);
  wageSaturdayEntries[key] = { entries: normalized };
  writeStorage(storageKeys.wageSaturday, wageSaturdayEntries);
  return normalized;
}

function effectiveSaturdayRate(entry, baseRate = 0) {
  if (entry.rate !== null && entry.rate !== undefined) return Math.max(0, Number(entry.rate) || 0);
  return Math.max(0, Number(baseRate) || 0) * (Math.max(0, Number(entry.multiplier) || 1) || 1);
}

function summarizeSaturdayWage(login = selectedWageLogin, baseRate = 0) {
  const entries = getSaturdayWageEntries(login);
  return entries.reduce(
    (summary, entry) => {
      const seconds = Math.max(0, Number(entry.seconds) || 0);
      const pay = (seconds / 3600) * effectiveSaturdayRate(entry, baseRate);
      summary.seconds += seconds;
      summary.pay += pay;
      return summary;
    },
    { entries, seconds: 0, pay: 0 },
  );
}

function formatSaturdayEntryDate(value) {
  const date = localDateFromInput(value);
  if (!date) return "Sobota";
  return new Intl.DateTimeFormat("pl-PL", { weekday: "short", day: "2-digit", month: "short" }).format(date);
}

function renderSaturdayWageList(summary, baseRate = 0) {
  const list = $("#wageSaturdayEntriesList");
  if (!list) return;
  const entries = [...summary.entries].sort((first, second) => String(second.date).localeCompare(String(first.date)));
  if (!entries.length) {
    list.innerHTML = '<div class="saturday-wage-empty">Brak wpisów sobotnich w bieżącym miesiącu.</div>';
    return;
  }
  list.innerHTML = entries
    .map((entry) => {
      const effectiveRate = effectiveSaturdayRate(entry, baseRate);
      const pay = (entry.seconds / 3600) * effectiveRate;
      const rateLabel =
        entry.rate === null || entry.rate === undefined
          ? entry.multiplier > 1
            ? `${entry.multiplier}x podstawowa`
            : "Stawka podstawowa"
          : formatHourlyRate(entry.rate);
      const note = entry.note ? `<small>${escapeHtml(entry.note)}</small>` : "";
      return `
        <div class="saturday-wage-entry">
          <time>${escapeHtml(formatSaturdayEntryDate(entry.date))}</time>
          <div>
            <strong>${escapeHtml(formatWorkDuration(entry.seconds))}</strong>
            <span>${escapeHtml(rateLabel)} · ${escapeHtml(formatMoney(pay))}</span>
            ${note}
          </div>
          <button class="secondary-button icon-button" type="button" title="Usuń wpis" data-delete-saturday-wage="${escapeHtml(entry.id)}">×</button>
        </div>
      `;
    })
    .join("");
}

function addSaturdayWageEntry(event) {
  event.preventDefault();
  const login = selectedWageLogin || getActiveLogin();
  const dateInput = $("#wageSaturdayDateInput");
  const hoursInput = $("#wageSaturdayHoursInput");
  const rateInput = $("#wageSaturdayRateInput");
  const noteInput = $("#wageSaturdayNoteInput");
  const seconds = decimalHoursToSeconds(hoursInput?.value);
  if (!seconds) {
    showToast("Czas pracy w sobotę", "Wpisz liczbę godzin sobotnich.");
    hoursInput?.focus();
    return;
  }
  const rawRate = String(rateInput?.value || "").trim();
  const entry = {
    id: `saturday-${Date.now()}`,
    date: localDateFromInput(dateInput?.value) ? dateInput.value : defaultSaturdayDateInput(),
    seconds,
    rate: rawRate ? Math.max(0, Number(rawRate.replace(",", ".")) || 0) : null,
    multiplier: 1,
    note: String(noteInput?.value || "").trim(),
  };
  saveSaturdayWageEntries(login, [entry, ...getSaturdayWageEntries(login)]);
  if (hoursInput) hoursInput.value = "";
  if (rateInput) rateInput.value = "";
  if (noteInput) noteInput.value = "";
  if (dateInput) dateInput.value = defaultSaturdayDateInput();
  showToast("Dodano sobotę", "Wpis trafił do kalkulatora stawki.");
  renderWageCalculator();
}

function removeSaturdayWageEntry(entryId) {
  const login = selectedWageLogin || getActiveLogin();
  const nextEntries = getSaturdayWageEntries(login).filter((entry) => entry.id !== entryId);
  saveSaturdayWageEntries(login, nextEntries);
  showToast("Usunięto sobotę", "Podsumowanie wynagrodzenia zostało przeliczone.");
  renderWageCalculator();
}

function renderWageCalculator() {
  const select = $("#wageUserSelect");
  const rateInput = $("#wageRateInput");
  const saturdayHoursInput = $("#wageSaturdayHoursInput");
  const saturdayRateInput = $("#wageSaturdayRateInput");
  const saturdayDateInput = $("#wageSaturdayDateInput");
  if (!select || !rateInput) return;
  const wagePeople = getWagePeople();
  const fallbackLogin = role === "admin" ? wagePeople[0]?.login : getActiveLogin();
  selectedWageLogin = wagePeople.some((person) => person.login === selectedWageLogin)
    ? selectedWageLogin
    : fallbackLogin || getActiveLogin();
  select.innerHTML = wagePeople
    .map((person) => `<option value="${escapeHtml(person.login)}">${escapeHtml(person.name)}</option>`)
    .join("");
  if (selectedWageLogin) select.value = selectedWageLogin;
  select.disabled = role !== "admin";

  const rate = Math.max(0, Number(wageRates[selectedWageLogin]) || 0);
  if (document.activeElement !== rateInput) {
    rateInput.value = rate ? String(rate.toFixed(2)) : "";
  }
  const person = wagePeople.find((item) => item.login === selectedWageLogin) || {};
  const scheduledMonthSeconds = Number(person.scheduledMonthSeconds ?? timeSummary?.personal?.scheduledMonthSeconds ?? 0);
  const trackedMonthSeconds = Number(person.monthSeconds ?? timeSummary?.personal?.monthSeconds ?? 0);
  const monthSeconds = Math.max(scheduledMonthSeconds, trackedMonthSeconds);
  const saturdaySummary = summarizeSaturdayWage(selectedWageLogin, rate);
  const saturdayAverageRate = saturdaySummary.seconds ? saturdaySummary.pay / (saturdaySummary.seconds / 3600) : 0;
  const basePay = (monthSeconds / 3600) * rate;
  $("#wageMonthHours").textContent = formatWorkDuration(monthSeconds);
  $("#wageRateDisplay").textContent = formatHourlyRate(rate);
  $("#wageSaturdayPayDisplay").textContent = formatMoney(saturdaySummary.pay);
  $("#wageTotalDisplay").textContent = formatMoney(basePay + saturdaySummary.pay);
  const saturdayHoursBadge = $("#wageSaturdayHoursBadge");
  if (saturdayHoursBadge) saturdayHoursBadge.textContent = formatWorkDuration(saturdaySummary.seconds);
  const saturdayPanelPay = $("#wageSaturdayPanelPay");
  const saturdayEntriesCount = $("#wageSaturdayEntriesCount");
  const saturdayAverageRateNode = $("#wageSaturdayAverageRate");
  if (saturdayPanelPay) saturdayPanelPay.textContent = formatMoney(saturdaySummary.pay);
  if (saturdayEntriesCount) saturdayEntriesCount.textContent = String(saturdaySummary.entries.length);
  if (saturdayAverageRateNode) saturdayAverageRateNode.textContent = formatHourlyRate(saturdayAverageRate);
  if (saturdayDateInput && !saturdayDateInput.value && document.activeElement !== saturdayDateInput) {
    saturdayDateInput.value = defaultSaturdayDateInput();
  }
  if (saturdayRateInput) {
    saturdayRateInput.placeholder = rate ? `Podstawowa ${rate.toFixed(2)}` : "Jak podstawowa";
  }
  if (saturdayHoursInput && document.activeElement !== saturdayHoursInput && Number(saturdayHoursInput.value) < 0) {
    saturdayHoursInput.value = "";
  }
  renderSaturdayWageList(saturdaySummary, rate);
  const monthLabel = $("#wageMonthLabel");
  if (monthLabel) {
    monthLabel.textContent = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" }).format(new Date());
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
    reactions: normalizeEntityReactions(post.reactions),
    comments: normalizeEntityComments(post.comments),
    fileName: post.fileName || post.file_name || "",
    fileMime: post.fileMime || post.file_mime || "",
    fileSize: Number(post.fileSize || post.file_size || 0),
    fileUrl: post.fileUrl || post.file_url || "",
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
      fileName: post.fileName,
      fileSize: post.fileSize,
    })),
  );
}

function makeEntityComment(body) {
  return {
    id: `comment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    authorLogin: getActiveLogin(),
    author: getActiveName(),
    body,
    time: new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }),
    createdAt: new Date().toISOString(),
  };
}

function normalizeEntityComment(comment = {}) {
  const authorLogin = normalizeLogin(comment.authorLogin || comment.author_login || "");
  return {
    id: comment.id || `comment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    authorLogin,
    author: comment.author || getDisplayNameByLogin(authorLogin) || "Uzytkownik",
    body: comment.body || "",
    time: comment.time || comment.time_label || "teraz",
    createdAt: comment.createdAt || comment.created_at || "",
  };
}

function normalizeEntityComments(comments) {
  return Array.isArray(comments) ? comments.map(normalizeEntityComment).filter((comment) => comment.body) : [];
}

function normalizeEntityReactions(reactions = {}) {
  const normalized = {};
  postReactionTypes.forEach((reaction) => {
    normalized[reaction.id] = Array.isArray(reactions?.[reaction.id]) ? reactions[reaction.id].filter(Boolean) : [];
  });
  return normalized;
}

function reactionSignature(reactions = {}) {
  const normalized = normalizeEntityReactions(reactions);
  return postReactionTypes.map((reaction) => [reaction.id, normalized[reaction.id]]);
}

function commentSignature(comments = []) {
  return normalizeEntityComments(comments).map((comment) => [
    comment.id,
    comment.authorLogin,
    comment.author,
    comment.body,
    comment.time,
    comment.createdAt,
  ]);
}

function renderEntityComments(comments, emptyText) {
  const normalizedComments = normalizeEntityComments(comments);
  if (!normalizedComments.length) return `<p class="muted">${escapeHtml(emptyText)}</p>`;
  return normalizedComments
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
    .join("");
}

function renderEntityReactionButtons(reactions, entityType, entityId, extraClass = "") {
  const normalizedReactions = normalizeEntityReactions(reactions);
  return postReactionTypes
    .map((reaction) => {
      const names = normalizedReactions[reaction.id] || [];
      const active = names.includes(getActiveName());
      return `
        <button class="entity-reaction-button ${extraClass} ${active ? "active" : ""}" data-${entityType}-reaction="${escapeHtml(
          entityId,
        )}" data-reaction-id="${escapeHtml(reaction.id)}" type="button" aria-pressed="${active ? "true" : "false"}" title="${escapeHtml(
          names.join(", ") || reaction.label,
        )}">
          <span>${escapeHtml(reaction.icon)}</span>
          <span>${names.length}</span>
        </button>
      `;
    })
    .join("");
}

function applyAnnouncementSnapshot(snapshot) {
  if (!Array.isArray(snapshot.posts)) return false;
  posts = snapshot.posts.map(normalizePost);
  return true;
}

function renderAnnouncementState() {
  renderPosts(currentFeedFilter);
  renderStats();
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
    updatedAt: task.updatedAt || task.updated_at || "",
    reactions: normalizeEntityReactions(task.reactions),
    comments: normalizeEntityComments(task.comments),
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
        task.updatedAt,
        reactionSignature(task.reactions),
        commentSignature(task.comments),
      ]),
    ),
  );
}

function renderTaskState() {
  renderKanban();
  renderPosts(currentFeedFilter);
  renderStats();
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

function normalizeReportStatus(status) {
  const normalized = String(status || "Nowe").trim();
  if (normalized === "W realizacji") return "Przyjęte";
  return normalized || "Nowe";
}

function normalizeReport(report) {
  const fileName = report.fileName || report.file_name || "";
  const fileMime = report.fileMime || report.file_mime || "";
  return {
    id: report.id || makeReportId(),
    category: report.category || "Sprawa organizacyjna",
    title: report.title || report.category || "Zgłoszenie",
    detail: report.detail || "",
    status: normalizeReportStatus(report.status),
    priority: report.priority || "normal",
    owner: report.owner || getDisplayNameByLogin(report.ownerLogin || report.owner_login) || getActiveName(),
    ownerLogin: normalizeLogin(report.ownerLogin || report.owner_login || ""),
    createdAt: report.createdAt || report.created_at || "teraz",
    updatedAt: report.updatedAt || report.updated_at || "",
    fileName,
    fileMime,
    fileSize: Number(report.fileSize || report.file_size || 0),
    fileUrl: report.fileUrl || report.file_url || "",
    reactions: normalizeEntityReactions(report.reactions),
    comments: normalizeEntityComments(report.comments),
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
  renderPosts(currentFeedFilter);
  renderStats();
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
          pushNotification("Nowy wniosek", request.title, {
            view: request.kind === "leave" ? "leaves" : "time",
            requestId: request.id,
          });
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
      report.fileName,
      report.fileSize,
      reactionSignature(report.reactions),
      commentSignature(report.comments),
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
  renderPosts(currentFeedFilter);
  renderStats();
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
  renderPosts(currentFeedFilter);
  renderStats();
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
    linkUrl: article.linkUrl || article.link_url || "",
    category: article.category || "",
    tags: article.tags || "",
    versionLabel: article.versionLabel || article.version_label || "",
    visibility: article.visibility || "all",
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
      article.linkUrl,
      article.category,
      article.tags,
      article.versionLabel,
      article.visibility,
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
  renderPosts(currentFeedFilter);
  renderStats();
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
          pushNotification("Baza wiedzy", `Dodano dokument: ${article.title}`, { view: "knowledge", articleId: article.id });
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

function makeInventoryItemId() {
  return `inventory-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeInventoryNumber(value) {
  if (typeof value === "string") value = value.replace(",", ".").trim();
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
}

function formatInventoryNumber(value) {
  const number = normalizeInventoryNumber(value);
  return new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function inventoryStatus(item) {
  const quantity = normalizeInventoryNumber(item.quantity);
  const minimum = normalizeInventoryNumber(item.minimum);
  if (minimum > 0 && quantity <= minimum) return { id: "low", label: "Niski", className: "s-todo", barClass: "low" };
  if (minimum > 0 && quantity <= minimum * 1.5) return { id: "mid", label: "Uwaga", className: "s-new", barClass: "mid" };
  return { id: "ok", label: "OK", className: "s-ok", barClass: "hi" };
}

function normalizeInventoryItem(item) {
  if (!item || typeof item !== "object") return null;
  const name = String(item.name || item.title || "").trim();
  if (!name) return null;
  const quantity = normalizeInventoryNumber(item.quantity);
  const minimum = normalizeInventoryNumber(item.minimum);
  return {
    id: String(item.id || makeInventoryItemId()),
    name,
    sku: String(item.sku || item.code || "").trim(),
    category: String(item.category || "Towar").trim() || "Towar",
    location: String(item.location || "").trim(),
    quantity,
    unit: String(item.unit || "szt.").trim() || "szt.",
    minimum,
    status: item.status || inventoryStatus({ quantity, minimum }).label,
    owner: String(item.owner || item.ownerName || "").trim() || getActiveName(),
    ownerLogin: normalizeLogin(item.ownerLogin || item.owner_login || getActiveLogin()),
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    updatedAt: item.updatedAt || item.updated_at || item.createdAt || item.created_at || new Date().toISOString(),
  };
}

function saveInventoryState() {
  inventoryItems = inventoryItems.map(normalizeInventoryItem).filter(Boolean);
  writeStorage(storageKeys.inventory, inventoryItems);
}

function inventorySignature(value = inventoryItems) {
  return JSON.stringify(
    value.map((item) => [
      item.id,
      item.name,
      item.sku,
      item.category,
      item.location,
      item.quantity,
      item.unit,
      item.minimum,
      item.updatedAt,
    ]),
  );
}

function applyInventorySnapshot(snapshot) {
  if (!Array.isArray(snapshot?.items)) return false;
  inventoryItems = snapshot.items.map(normalizeInventoryItem).filter(Boolean);
  saveInventoryState();
  return true;
}

function inventoryItemMatchesSearch(item) {
  const query = normalizeSearch(inventorySearchQuery);
  if (!query) return true;
  return [item.name, item.sku, item.category, item.location, item.owner].some((value) => normalizeSearch(value).includes(query));
}

function inventoryItemMatchesFilter(item) {
  const status = inventoryStatus(item);
  if (currentInventoryFilter === "low") return status.id === "low" || status.id === "mid";
  if (currentInventoryFilter === "mine") return item.ownerLogin === getActiveLogin();
  return true;
}

function inventoryStockPercent(item) {
  const quantity = normalizeInventoryNumber(item.quantity);
  const minimum = normalizeInventoryNumber(item.minimum);
  if (minimum <= 0) return quantity > 0 ? 100 : 0;
  return Math.min(100, Math.round((quantity / (minimum * 2)) * 100));
}

function renderInventory() {
  inventoryItems = inventoryItems.map(normalizeInventoryItem).filter(Boolean);
  const totalItems = inventoryItems.length;
  const lowItems = inventoryItems.filter((item) => inventoryStatus(item).id === "low").length;
  const availableItems = inventoryItems.filter((item) => normalizeInventoryNumber(item.quantity) > 0).length;
  const todayKey = formatDateInput(new Date());
  const todayMoves = inventoryItems.filter((item) => String(item.updatedAt || "").startsWith(todayKey)).length;
  const totalEl = $("#inventoryTotalItems");
  if (totalEl) totalEl.textContent = String(totalItems);
  const lowEl = $("#inventoryLowItems");
  if (lowEl) lowEl.textContent = String(lowItems);
  const availableEl = $("#inventoryAvailableItems");
  if (availableEl) availableEl.textContent = String(availableItems);
  const movesEl = $("#inventoryTodayMoves");
  if (movesEl) movesEl.textContent = String(todayMoves);
  const trend = $("#inventoryLowTrend");
  if (trend) trend.textContent = lowItems ? "wymaga zamówienia" : "pod kontrolą";
  const searchInput = $("#inventorySearchInput");
  if (searchInput && searchInput.value !== inventorySearchQuery) searchInput.value = inventorySearchQuery;
  $$("[data-inventory-filter-button]").forEach((button) => {
    button.classList.toggle("on", button.dataset.inventoryFilterButton === currentInventoryFilter);
  });
  const visibleItems = inventoryItems
    .filter(inventoryItemMatchesFilter)
    .filter(inventoryItemMatchesSearch)
    .sort((a, b) => {
      const rank = { low: 0, mid: 1, ok: 2 };
      return rank[inventoryStatus(a).id] - rank[inventoryStatus(b).id] || a.name.localeCompare(b.name, "pl");
    });
  const body = $("#stockBody");
  if (!body) return;
  body.innerHTML = visibleItems.length
    ? visibleItems
        .map((item) => {
          const status = inventoryStatus(item);
          return `
            <tr data-inventory-item="${escapeHtml(item.id)}">
              <td><b>${escapeHtml(item.name)}</b><div class="inventory-row-meta">${escapeHtml(item.category)}</div></td>
              <td style="color:var(--muted)">${escapeHtml(item.sku || "-")}</td>
              <td>${escapeHtml(item.location || "-")}</td>
              <td>
                <b>${escapeHtml(formatInventoryNumber(item.quantity))}</b> ${escapeHtml(item.unit)}
                <div class="bar stockbar"><i class="${status.barClass}" style="width:${inventoryStockPercent(item)}%"></i></div>
              </td>
              <td style="color:var(--muted)">min. ${escapeHtml(formatInventoryNumber(item.minimum))}</td>
              <td><span class="state ${status.className}">${escapeHtml(status.label)}</span></td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="6"><div class="empty-state">Brak towarów pasujących do widoku magazynu.</div></td></tr>`;
}

function renderInventoryState() {
  renderInventory();
  renderPosts(currentFeedFilter);
  renderStats();
  renderNotifications();
}

function makeStoreShortageId() {
  return `store-shortage-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function storeShortageStatus(status) {
  if (status === "ordered") {
    return { id: "ordered", label: "Zamówione", className: "is-ordered", dotClass: "amber" };
  }
  if (status === "delivered") {
    return { id: "delivered", label: "Uzupełnione", className: "is-delivered", dotClass: "green" };
  }
  return { id: "todo", label: "Do zamówienia", className: "is-todo", dotClass: "red" };
}

function storeShortagePriority(priority) {
  if (priority === "urgent") return { id: "urgent", label: "Pilne", className: "urgent" };
  if (priority === "normal") return { id: "normal", label: "Zwykłe", className: "normal" };
  return { id: "important", label: "Ważne", className: "important" };
}

function normalizeStoreShortage(item) {
  if (!item || typeof item !== "object") return null;
  const name = String(item.name || item.title || "").trim();
  if (!name) return null;
  return {
    id: String(item.id || makeStoreShortageId()),
    name,
    quantity: String(item.quantity || item.amount || "").trim(),
    source: String(item.source || item.vendor || "").trim(),
    note: String(item.note || "").trim(),
    priority: storeShortagePriority(item.priority).id,
    status: storeShortageStatus(item.status).id,
    owner: String(item.owner || item.ownerName || item.owner_name || "").trim() || getActiveName(),
    ownerLogin: normalizeLogin(item.ownerLogin || item.owner_login || getActiveLogin()),
    orderedBy: String(item.orderedBy || item.ordered_by || "").trim(),
    deliveredBy: String(item.deliveredBy || item.delivered_by || "").trim(),
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    updatedAt: item.updatedAt || item.updated_at || item.createdAt || item.created_at || new Date().toISOString(),
  };
}

function saveStoreShortageState() {
  storeShortages = storeShortages.map(normalizeStoreShortage).filter(Boolean);
  if (backendAvailable) return;
  writeStorage(storageKeys.storeShortages, storeShortages);
}

function storeShortageSignature(value = storeShortages) {
  return JSON.stringify(
    value.map((item) => [
      item.id,
      item.name,
      item.quantity,
      item.source,
      item.note,
      item.priority,
      item.status,
      item.ownerLogin,
      item.orderedBy,
      item.deliveredBy,
      item.updatedAt,
    ]),
  );
}

function applyStoreShortageSnapshot(snapshot) {
  if (!Array.isArray(snapshot?.items)) return false;
  storeShortages = snapshot.items.map(normalizeStoreShortage).filter(Boolean);
  saveStoreShortageState();
  return true;
}

function storeShortageMatchesFilter(item) {
  return currentStoreShortageFilter === "all" || item.status === currentStoreShortageFilter;
}

function storeShortageActions(item) {
  if (item.status === "delivered") {
    return `<button class="secondary-button" data-store-shortage-status="${escapeHtml(item.id)}" data-status="ordered" type="button">Cofnij</button>`;
  }
  const orderedButton =
    item.status === "ordered"
      ? `<button class="secondary-button" data-store-shortage-status="${escapeHtml(item.id)}" data-status="todo" type="button">Cofnij</button>`
      : `<button class="secondary-button" data-store-shortage-status="${escapeHtml(item.id)}" data-status="ordered" type="button">✓ Zamówione</button>`;
  return `
    ${orderedButton}
    <button class="secondary-button" data-store-shortage-status="${escapeHtml(item.id)}" data-status="delivered" type="button">✓✓ Uzupełnione</button>
  `;
}

function renderStoreShortages() {
  storeShortages = storeShortages.map(normalizeStoreShortage).filter(Boolean);
  const list = $("#storeShortagesList");
  const summary = $("#storeShortagesSummary");
  if (!list || !summary) return;
  $$("[data-store-shortage-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.storeShortageFilter === currentStoreShortageFilter);
  });
  const counts = {
    todo: storeShortages.filter((item) => item.status === "todo").length,
    ordered: storeShortages.filter((item) => item.status === "ordered").length,
    delivered: storeShortages.filter((item) => item.status === "delivered").length,
  };
  const badge = $("#storeShortagesNavBadge");
  if (badge) {
    badge.textContent = counts.todo;
    badge.classList.toggle("hidden", counts.todo === 0);
  }
  const visibleItems = storeShortages
    .filter(storeShortageMatchesFilter)
    .sort((a, b) => {
      const statusRank = { todo: 0, ordered: 1, delivered: 2 };
      const priorityRank = { urgent: 0, important: 1, normal: 2 };
      return (
        statusRank[a.status] - statusRank[b.status] ||
        priorityRank[a.priority] - priorityRank[b.priority] ||
        String(b.updatedAt).localeCompare(String(a.updatedAt))
      );
    });
  list.innerHTML = visibleItems.length
    ? visibleItems
        .map((item) => {
          const status = storeShortageStatus(item.status);
          const priority = storeShortagePriority(item.priority);
          const timeLabel = activityTimeLabel(item.updatedAt || item.createdAt, "dziś");
          const statusActor =
            item.status === "delivered" && item.deliveredBy
              ? ` · uzupełnił: ${escapeHtml(item.deliveredBy)}`
              : item.status === "ordered" && item.orderedBy
                ? ` · zamówił: ${escapeHtml(item.orderedBy)}`
                : "";
          return `
            <article class="store-shortage-card ${status.className}" data-store-shortage-item="${escapeHtml(item.id)}">
              <div class="store-shortage-top">
                <div>
                  <h3>${escapeHtml(item.name)}</h3>
                  <p>Ilość: <strong>${escapeHtml(item.quantity || "-")}</strong>${item.source ? ` · Skąd: <strong>${escapeHtml(item.source)}</strong>` : ""} · <span class="store-shortage-status ${status.className}">${escapeHtml(status.label)}</span></p>
                </div>
                <span class="store-shortage-priority ${priority.className}">${escapeHtml(priority.label)}</span>
              </div>
              ${item.note ? `<div class="store-shortage-note">${escapeHtml(item.note)}</div>` : ""}
              <div class="store-shortage-footer">
                <span>dodał: ${escapeHtml(item.owner)} · ${escapeHtml(timeLabel)}${statusActor}</span>
                <div class="store-shortage-actions">${storeShortageActions(item)}</div>
              </div>
            </article>
          `;
        })
        .join("")
    : `<div class="empty-state">Brak pozycji pasujących do wybranego filtra.</div>`;
  summary.innerHTML = `
    <div class="store-summary-row"><span class="summary-count red">${counts.todo}</span><div><strong>Do zamówienia</strong><small>czeka na zamówienie</small></div></div>
    <div class="store-summary-row"><span class="summary-count amber">${counts.ordered}</span><div><strong>Zamówione</strong><small>w drodze</small></div></div>
    <div class="store-summary-row"><span class="summary-count green">${counts.delivered}</span><div><strong>Uzupełnione</strong><small>są na sklepie</small></div></div>
  `;
}

function renderStoreShortageState() {
  renderStoreShortages();
  renderNotifications();
}

function focusStoreShortage(itemId) {
  if (!itemId) return;
  currentStoreShortageFilter = "all";
  renderStoreShortages();
  window.setTimeout(() => {
    const safeItemId = window.CSS?.escape ? CSS.escape(String(itemId)) : String(itemId).replace(/["\\]/g, "\\$&");
    const card = document.querySelector(`[data-store-shortage-item="${safeItemId}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("is-highlighted");
    window.setTimeout(() => card.classList.remove("is-highlighted"), 1800);
  }, 80);
}

async function syncStoreShortagesFromBackend(options = {}) {
  if (!backendAvailable || !isLoggedIn()) return false;
  const previousIds = new Set(storeShortages.map((item) => String(item.id)));
  const previousSignature = storeShortageSignature();
  try {
    const snapshot = await apiRequest("/store-shortages", { headers: {} });
    applyStoreShortageSnapshot(snapshot);
    const changed = previousSignature !== storeShortageSignature();
    if (changed && options.notify) {
      storeShortages
        .filter((item) => !previousIds.has(String(item.id)))
        .filter((item) => item.ownerLogin !== getActiveLogin())
        .forEach((item) => {
          pushNotification("Braki na sklepie", `Nowy brak: ${item.name}`, { view: "storeShortages", shortageId: item.id });
        });
    }
    return changed;
  } catch (error) {
    if (!options.silent) showToast("Braki na sklepie", "Nie udało się pobrać wspólnej listy braków.");
    return false;
  }
}

async function pollStoreShortages() {
  const changed = await syncStoreShortagesFromBackend({ notify: true, silent: true });
  if (changed) renderStoreShortageState();
}

function focusInventoryItem(itemId) {
  if (!itemId) return;
  currentInventoryFilter = "all";
  inventorySearchQuery = "";
  renderInventory();
  window.setTimeout(() => {
    const safeItemId = window.CSS?.escape
      ? CSS.escape(String(itemId))
      : String(itemId).replace(/["\\]/g, "\\$&");
    const row = document.querySelector(`[data-inventory-item="${safeItemId}"]`);
    if (!row) return;
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    row.classList.add("inventory-row-highlight");
    window.setTimeout(() => row.classList.remove("inventory-row-highlight"), 1800);
  }, 80);
}

async function syncInventoryFromBackend(options = {}) {
  if (!backendAvailable || !isLoggedIn()) return false;
  const previousIds = new Set(inventoryItems.map((item) => String(item.id)));
  const previousSignature = inventorySignature();
  try {
    const snapshot = await apiRequest("/inventory", { headers: {} });
    applyInventorySnapshot(snapshot);
    const changed = previousSignature !== inventorySignature();
    if (changed && options.notify) {
      inventoryItems
        .filter((item) => !previousIds.has(String(item.id)))
        .filter((item) => item.ownerLogin !== getActiveLogin())
        .filter((item) => inventoryStatus(item).id === "low")
        .forEach((item) => {
          pushNotification("Magazyn", `Niski stan: ${item.name}`, { view: "inventory", itemId: item.id });
        });
    }
    return changed;
  } catch (error) {
    if (String(error?.message || "").includes("Nie znaleziono endpointu")) return false;
    if (!options.silent) showToast("Magazyn", "Nie udało się pobrać stanów magazynowych.");
    return false;
  }
}

async function pollInventory() {
  if (!backendAvailable || !isLoggedIn()) return false;
  const changed = await syncInventoryFromBackend({ notify: true, silent: true });
  if (changed) renderInventoryState();
  return changed;
}

function openInventoryForm() {
  const form = $("#inventoryForm");
  if (!form) return;
  form.reset();
  $("#inventoryQuantityInput").value = "0";
  $("#inventoryMinimumInput").value = "0";
  $("#inventoryUnitInput").value = "szt.";
  openDialog("#inventoryFormDialog");
  window.setTimeout(() => $("#inventoryNameInput")?.focus(), 0);
}

async function createInventoryItem(event) {
  event.preventDefault();
  const payload = {
    name: $("#inventoryNameInput").value.trim(),
    sku: $("#inventorySkuInput").value.trim(),
    category: $("#inventoryCategoryInput").value.trim(),
    quantity: normalizeInventoryNumber($("#inventoryQuantityInput").value),
    minimum: normalizeInventoryNumber($("#inventoryMinimumInput").value),
    unit: $("#inventoryUnitInput").value.trim() || "szt.",
    location: $("#inventoryLocationInput").value.trim(),
  };
  if (!payload.name) {
    showToast("Magazyn", "Podaj nazwę towaru.");
    $("#inventoryNameInput").focus();
    return;
  }
  if (backendAvailable && isLoggedIn()) {
    try {
      const snapshot = await apiRequest("/inventory", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      applyInventorySnapshot(snapshot);
      $("#inventoryFormDialog").close();
      event.target.reset();
      renderInventoryState();
      showToast("Towar dodany", payload.name);
      return;
    } catch (error) {
      showToast("Nie dodano towaru", error.message || "Backend odrzucił zapis.");
      return;
    }
  }
  inventoryItems.unshift(
    normalizeInventoryItem({
      ...payload,
      id: makeInventoryItemId(),
      owner: getActiveName(),
      ownerLogin: getActiveLogin(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  );
  saveInventoryState();
  $("#inventoryFormDialog").close();
  event.target.reset();
  renderInventoryState();
  showToast("Towar dodany lokalnie", payload.name);
}

async function createStoreShortage(event) {
  event.preventDefault();
  const form = event.target;
  const payload = {
    name: $("#storeShortageNameInput").value.trim(),
    quantity: $("#storeShortageQuantityInput").value.trim(),
    source: $("#storeShortageSourceInput").value.trim(),
    note: $("#storeShortageNoteInput").value.trim(),
    priority: $("#storeShortagePriorityInput").value || "important",
  };
  if (!payload.name || !payload.quantity) return;
  if (backendAvailable) {
    try {
      const result = await apiRequest("/store-shortages", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      applyStoreShortageSnapshot(result);
      form.reset();
      $("#storeShortagePriorityInput").value = "important";
      currentStoreShortageFilter = "all";
      renderStoreShortageState();
      showToast("Brak dodany", "Pozycja jest widoczna dla zespołu.");
      return;
    } catch (error) {
      showToast("Nie dodano braku", error.message || "Backend odrzucił zapis.");
      return;
    }
  }
  const item = normalizeStoreShortage({
    id: makeStoreShortageId(),
    ...payload,
    status: "todo",
    owner: getActiveName(),
    ownerLogin: getActiveLogin(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  storeShortages.unshift(item);
  saveStoreShortageState();
  form.reset();
  $("#storeShortagePriorityInput").value = "important";
  currentStoreShortageFilter = "all";
  renderStoreShortageState();
  showToast("Brak dodany lokalnie", payload.name);
}

async function updateStoreShortageStatus(itemId, status) {
  const item = storeShortages.find((entry) => String(entry.id) === String(itemId));
  if (!item) return;
  const nextStatus = storeShortageStatus(status).id;
  if (backendAvailable) {
    try {
      const result = await apiRequest(`/store-shortages/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      applyStoreShortageSnapshot(result);
      renderStoreShortageState();
      showToast("Status zaktualizowany", `${item.name}: ${storeShortageStatus(nextStatus).label}.`);
      return;
    } catch (error) {
      showToast("Nie zmieniono statusu", error.message || "Backend odrzucił zmianę.");
      return;
    }
  }
  item.status = nextStatus;
  item.updatedAt = new Date().toISOString();
  if (nextStatus === "ordered") item.orderedBy = getActiveName();
  if (nextStatus === "delivered") item.deliveredBy = getActiveName();
  saveStoreShortageState();
  renderStoreShortageState();
  showToast("Status zaktualizowany", `${item.name}: ${storeShortageStatus(nextStatus).label}.`);
}

async function shareStoreShortagesList() {
  const rows = storeShortages
    .filter((item) => item.status !== "delivered")
    .map((item) => {
      const status = storeShortageStatus(item.status).label;
      return `- ${item.name} | ${item.quantity || "-"} | ${item.source || "brak źródła"} | ${status}${item.note ? ` | ${item.note}` : ""}`;
    });
  const text = rows.length ? `Braki na sklepie:\n${rows.join("\n")}` : "Braki na sklepie: brak otwartych pozycji.";
  try {
    await navigator.clipboard.writeText(text);
    showToast("Lista skopiowana", "Możesz wkleić ją w wiadomości lub zamówieniu.");
  } catch {
    showToast("Lista gotowa", text.slice(0, 120));
  }
}

async function refreshSharedCompanyData(options = {}) {
  if (sharedDataPollInFlight || !backendAvailable || !isLoggedIn()) return false;
  if (document.hidden && !options.force) return false;
  sharedDataPollInFlight = true;
  try {
    await Promise.allSettled([
      pollAnnouncements(),
      pollTasks(),
      pollReports(),
      pollRequests(),
      pollCalendar(),
      pollKnowledge(),
      pollInventory(),
      pollStoreShortages(),
      pollQuickPolls(),
      pollKudos(),
    ]);
    if (options.includePresence) await refreshPresence();
    return true;
  } finally {
    sharedDataPollInFlight = false;
  }
}

function startSharedDataPolling() {
  if (sharedDataPollTimer || !backendAvailable || !isLoggedIn()) return;
  refreshSharedCompanyData({ force: true });
  sharedDataPollTimer = window.setInterval(refreshSharedCompanyData, sharedDataPollIntervalMs);
}

function stopSharedDataPolling() {
  if (!sharedDataPollTimer) return;
  window.clearInterval(sharedDataPollTimer);
  sharedDataPollTimer = null;
  sharedDataPollInFlight = false;
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
  const storedQuickPolls = readStorage(storageKeys.quickPolls, []);
  quickPolls = Array.isArray(storedQuickPolls) ? storedQuickPolls.map(normalizeQuickPoll).filter(Boolean) : [];
  const storedKudos = readStorage(storageKeys.weeklyKudos, []);
  weeklyKudos = Array.isArray(storedKudos) ? storedKudos.map(normalizeKudosEntry).filter(Boolean) : [];
  const storedWageRates = readStorage(storageKeys.wageRates, {});
  wageRates = storedWageRates && typeof storedWageRates === "object" ? storedWageRates : {};
  const storedSaturdayWage = readStorage(storageKeys.wageSaturday, {});
  wageSaturdayEntries = storedSaturdayWage && typeof storedSaturdayWage === "object" ? storedSaturdayWage : {};
  const storedInventory = readStorage(storageKeys.inventory, []);
  inventoryItems = Array.isArray(storedInventory) ? storedInventory.map(normalizeInventoryItem).filter(Boolean) : [];
  const storedStoreShortages = readStorage(storageKeys.storeShortages, []);
  storeShortages = Array.isArray(storedStoreShortages) ? storedStoreShortages.map(normalizeStoreShortage).filter(Boolean) : [];
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

function makeKudosId() {
  return `kudos-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeKudosEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const reason = String(entry.reason || entry.text || "").trim();
  const recipientLogin = normalizeLogin(entry.recipientLogin || entry.recipient_login || "");
  const recipientName =
    String(entry.recipientName || entry.recipient_name || "").trim() ||
    getDisplayNameByLogin(recipientLogin) ||
    "Użytkownik";
  if (!reason || !recipientLogin) return null;
  return {
    id: String(entry.id || makeKudosId()),
    recipientLogin,
    recipientName,
    reason,
    weekStart: entry.weekStart || entry.week_start || getCurrentWeekStartValue(),
    createdBy: normalizeLogin(entry.createdBy || entry.created_by || getActiveLogin()),
    creatorName:
      String(entry.creatorName || entry.creator_name || "").trim() ||
      getDisplayNameByLogin(entry.createdBy || entry.created_by || getActiveLogin()) ||
      getActiveName(),
    createdAt: entry.createdAt || entry.created_at || new Date().toISOString(),
  };
}

function saveKudosState() {
  weeklyKudos = weeklyKudos.map(normalizeKudosEntry).filter(Boolean);
  writeStorage(storageKeys.weeklyKudos, weeklyKudos);
}

function kudosSignature(value = weeklyKudos) {
  return JSON.stringify(
    value.map((entry) => [entry.id, entry.recipientLogin, entry.recipientName, entry.reason, entry.weekStart, entry.createdAt]),
  );
}

function applyKudosSnapshot(snapshot) {
  if (!Array.isArray(snapshot?.kudos)) return false;
  weeklyKudos = snapshot.kudos.map(normalizeKudosEntry).filter(Boolean);
  saveKudosState();
  return true;
}

function missingKudosEndpoint(error) {
  return String(error?.message || "").includes("Nie znaleziono endpointu");
}

async function syncKudosFromBackend(options = {}) {
  if (!backendAvailable || !isLoggedIn()) return false;
  const previousIds = new Set(weeklyKudos.map((entry) => String(entry.id)));
  const previousSignature = kudosSignature();
  try {
    const weekStart = encodeURIComponent(options.weekStart || getCurrentWeekStartValue());
    const snapshot = await apiRequest(`/kudos?weekStart=${weekStart}`, { headers: {} });
    applyKudosSnapshot(snapshot);
    const changed = previousSignature !== kudosSignature();
    if (changed && options.notify) {
      weeklyKudos
        .filter((entry) => !previousIds.has(String(entry.id)))
        .filter((entry) => entry.createdBy !== getActiveLogin())
        .forEach((entry) => {
          pushNotification("Wyróżnienie tygodnia", `${entry.recipientName}: ${entry.reason}`, { view: "dashboard" });
        });
    }
    return changed;
  } catch (error) {
    if (missingKudosEndpoint(error)) return false;
    if (!options.silent) showToast("Wyróżnienia", "Nie udało się pobrać wyróżnień tygodnia.");
    return false;
  }
}

async function pollKudos() {
  if (kudosPollInFlight || document.hidden || !backendAvailable || !isLoggedIn()) return;
  kudosPollInFlight = true;
  try {
    const changed = await syncKudosFromBackend({ notify: true, silent: true });
    if (changed) renderKudos();
  } finally {
    kudosPollInFlight = false;
  }
}

function startKudosPolling() {
  if (kudosPollTimer || !backendAvailable || !isLoggedIn()) return;
  kudosPollTimer = window.setInterval(pollKudos, kudosPollIntervalMs);
}

function stopKudosPolling() {
  if (!kudosPollTimer) return;
  window.clearInterval(kudosPollTimer);
  kudosPollTimer = null;
  kudosPollInFlight = false;
}

function renderKudosPersonOptions() {
  const select = $("#kudosPersonSelect");
  if (!select) return;
  const users = activePeople();
  select.innerHTML = users
    .map((person) => `<option value="${escapeHtml(person.login)}">${escapeHtml(person.name)}</option>`)
    .join("");
  const activeLogin = getActiveLogin();
  if (users.some((person) => person.login === activeLogin)) select.value = activeLogin;
}

function renderKudos() {
  weeklyKudos = weeklyKudos.map(normalizeKudosEntry).filter(Boolean);
  const currentWeek = getCurrentWeekStartValue();
  const visibleKudos = weeklyKudos.filter((entry) => entry.weekStart === currentWeek).slice(0, 5);
  const count = $("#kudosCount");
  if (count) count.textContent = String(visibleKudos.length);
  const list = $("#kudosList");
  if (!list) return;
  list.innerHTML = visibleKudos.length
    ? visibleKudos
        .map(
          (entry) => `
            <article class="kudos-card">
              <span class="avatar">${escapeHtml(makeInitials(entry.recipientName))}</span>
              <div>
                <div class="card-line">
                  <strong>${escapeHtml(entry.recipientName)}</strong>
                  <span class="pill violet">Wyróżnienie</span>
                </div>
                <p class="note">${escapeHtml(entry.reason)}</p>
                <span class="muted">Dodał: ${escapeHtml(entry.creatorName)} · ${escapeHtml(
                  activityTimeLabel(entry.createdAt, "teraz"),
                )}</span>
              </div>
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">Brak wyróżnień w tym tygodniu.</div>`;
}

function openKudosForm() {
  renderKudosPersonOptions();
  $("#kudosForm").reset();
  renderKudosPersonOptions();
  openDialog("#kudosFormDialog");
  window.setTimeout(() => $("#kudosReasonInput")?.focus(), 0);
}

async function createKudosEntry(event) {
  event.preventDefault();
  const recipientLogin = normalizeLogin($("#kudosPersonSelect").value || "");
  const reason = $("#kudosReasonInput").value.trim();
  const recipient = activePeople().find((person) => person.login === recipientLogin);
  if (!recipientLogin || !recipient) {
    showToast("Wyróżnienie", "Wybierz osobę z listy.");
    return;
  }
  if (!reason) {
    showToast("Wyróżnienie", "Dodaj krótki opis wyróżnienia.");
    $("#kudosReasonInput").focus();
    return;
  }
  if (backendAvailable && isLoggedIn()) {
    try {
      const snapshot = await apiRequest("/kudos", {
        method: "POST",
        body: JSON.stringify({ recipientLogin, reason, weekStart: getCurrentWeekStartValue() }),
      });
      applyKudosSnapshot(snapshot);
      renderKudos();
      $("#kudosFormDialog").close();
      event.target.reset();
      showToast("Wyróżnienie dodane", recipient.name);
      return;
    } catch (error) {
      if (!missingKudosEndpoint(error)) {
        showToast("Nie dodano wyróżnienia", error.message || "Backend odrzucił zapis.");
        return;
      }
    }
  }
  weeklyKudos.unshift(
    normalizeKudosEntry({
      id: makeKudosId(),
      recipientLogin,
      recipientName: recipient.name,
      reason,
      weekStart: getCurrentWeekStartValue(),
      createdBy: getActiveLogin(),
      creatorName: getActiveName(),
      createdAt: new Date().toISOString(),
    }),
  );
  saveKudosState();
  renderKudos();
  $("#kudosFormDialog").close();
  event.target.reset();
  showToast("Wyróżnienie dodane", recipient.name);
}

function makeQuickPollId() {
  return `poll-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeQuickPoll(poll) {
  if (!poll || typeof poll !== "object") return null;
  const options = Array.isArray(poll.options)
    ? poll.options.map((option) => String(option || "").trim()).filter(Boolean).slice(0, 4)
    : [];
  if (!poll.question || options.length < 2) return null;
  const votes = poll.votes && typeof poll.votes === "object" ? poll.votes : {};
  return {
    id: String(poll.id || makeQuickPollId()),
    question: String(poll.question).trim(),
    options,
    votes: Object.fromEntries(
      Object.entries(votes)
        .map(([login, optionIndex]) => [normalizeLogin(login), Number(optionIndex)])
        .filter(([login, optionIndex]) => login && Number.isInteger(optionIndex) && optionIndex >= 0 && optionIndex < options.length),
    ),
    createdBy: normalizeLogin(poll.createdBy || getActiveLogin()),
    createdAt: poll.createdAt || new Date().toISOString(),
  };
}

function saveQuickPollState() {
  quickPolls = quickPolls.map(normalizeQuickPoll).filter(Boolean);
  writeStorage(storageKeys.quickPolls, quickPolls);
}

function quickPollVoteCounts(poll) {
  const counts = poll.options.map(() => 0);
  Object.values(poll.votes || {}).forEach((optionIndex) => {
    if (Number.isInteger(optionIndex) && counts[optionIndex] !== undefined) counts[optionIndex] += 1;
  });
  return counts;
}

function votesLabel(count) {
  if (count === 1) return "1 głos";
  if (count > 1 && count < 5) return `${count} głosy`;
  return `${count} głosów`;
}

function renderQuickPollCard(poll) {
  const counts = quickPollVoteCounts(poll);
  const total = counts.reduce((sum, count) => sum + count, 0);
  const userVote = poll.votes?.[getActiveLogin()];
  const creator = getDisplayNameByLogin(poll.createdBy) || poll.createdBy || "Użytkownik";
  return `
    <article class="poll-card">
      <div class="widget-header">
        <strong>${escapeHtml(poll.question)}</strong>
        <span class="pill teal">${escapeHtml(votesLabel(total))}</span>
      </div>
      <span class="muted">Autor: ${escapeHtml(creator)} · ${escapeHtml(activityTimeLabel(poll.createdAt, "teraz"))}</span>
      <div class="poll-options">
        ${poll.options
          .map((option, index) => {
            const percent = total ? Math.round((counts[index] / total) * 100) : 0;
            const active = Number(userVote) === index;
            return `
              <button class="poll-option ${active ? "active" : ""}" data-poll-vote="${escapeHtml(
                poll.id,
              )}" data-poll-option="${index}" type="button">
                <span class="poll-option-row">
                  <strong>${escapeHtml(option)}</strong>
                  <span>${counts[index]} · ${percent}%</span>
                </span>
                <span class="poll-meter"><span style="width: ${percent}%"></span></span>
              </button>
            `;
          })
          .join("")}
      </div>
      ${Number.isInteger(Number(userVote)) ? `<span class="muted">Twój głos: ${escapeHtml(poll.options[userVote])}</span>` : ""}
    </article>
  `;
}

function renderQuickPoll() {
  const box = $("#quickPollBox");
  if (!box) return;
  const visiblePolls = quickPolls.slice(0, 3);
  box.innerHTML = visiblePolls.length
    ? visiblePolls.map(renderQuickPollCard).join("")
    : `<div class="empty-state">Brak aktywnych ankiet.</div>`;
}

function quickPollSignature(value = quickPolls) {
  return JSON.stringify(
    value.map((poll) => [
      poll.id,
      poll.question,
      poll.options.join("|"),
      Object.entries(poll.votes || {})
        .sort(([loginA], [loginB]) => loginA.localeCompare(loginB))
        .map(([login, optionIndex]) => `${login}:${optionIndex}`)
        .join("|"),
    ]),
  );
}

function applyQuickPollSnapshot(snapshot) {
  if (!Array.isArray(snapshot?.polls)) return false;
  quickPolls = snapshot.polls.map(normalizeQuickPoll).filter(Boolean);
  saveQuickPollState();
  return true;
}

function missingPollEndpoint(error) {
  return String(error?.message || "").includes("Nie znaleziono endpointu");
}

async function syncQuickPollsFromBackend(options = {}) {
  if (!backendAvailable || !isLoggedIn()) return false;
  const previousSignature = quickPollSignature();
  try {
    const snapshot = await apiRequest("/polls", { headers: {} });
    applyQuickPollSnapshot(snapshot);
    return previousSignature !== quickPollSignature();
  } catch (error) {
    if (missingPollEndpoint(error)) return false;
    if (!options.silent) showToast("Ankiety", "Nie udało się pobrać wspólnych ankiet.");
    return false;
  }
}

async function pollQuickPolls() {
  if (quickPollInFlight || document.hidden || !backendAvailable || !isLoggedIn()) return;
  quickPollInFlight = true;
  try {
    const changed = await syncQuickPollsFromBackend({ silent: true });
    if (changed) renderQuickPoll();
  } finally {
    quickPollInFlight = false;
  }
}

function startQuickPollPolling() {
  if (quickPollTimer || !backendAvailable || !isLoggedIn()) return;
  quickPollTimer = window.setInterval(pollQuickPolls, quickPollIntervalMs);
}

function stopQuickPollPolling() {
  if (!quickPollTimer) return;
  window.clearInterval(quickPollTimer);
  quickPollTimer = null;
  quickPollInFlight = false;
}

function openPollForm() {
  $("#pollForm").reset();
  openDialog("#pollFormDialog");
  window.setTimeout(() => $("#pollQuestionInput")?.focus(), 0);
}

async function createQuickPoll(event) {
  event.preventDefault();
  const question = $("#pollQuestionInput").value.trim();
  const options = [$("#pollOptionOneInput").value.trim(), $("#pollOptionTwoInput").value.trim()].filter(Boolean);
  if (!question || options.length < 2) return;
  if (normalizeSearch(options[0]) === normalizeSearch(options[1])) {
    showToast("Ankieta", "Podaj dwie różne odpowiedzi.");
    return;
  }
  if (backendAvailable && isLoggedIn()) {
    try {
      const snapshot = await apiRequest("/polls", {
        method: "POST",
        body: JSON.stringify({ question, options }),
      });
      applyQuickPollSnapshot(snapshot);
      renderQuickPoll();
      $("#pollFormDialog").close();
      event.target.reset();
      showToast("Ankieta utworzona", question);
      return;
    } catch (error) {
      if (!missingPollEndpoint(error)) {
        showToast("Nie utworzono ankiety", error.message || "Backend odrzucił zapis.");
        return;
      }
    }
  }
  quickPolls.unshift(
    normalizeQuickPoll({
      id: makeQuickPollId(),
      question,
      options,
      votes: {},
      createdBy: getActiveLogin(),
      createdAt: new Date().toISOString(),
    }),
  );
  saveQuickPollState();
  renderQuickPoll();
  $("#pollFormDialog").close();
  event.target.reset();
  showToast("Ankieta utworzona", question);
}

async function voteQuickPoll(pollId, optionIndex) {
  const poll = quickPolls.find((item) => item.id === pollId);
  if (!poll || !Number.isInteger(optionIndex) || !poll.options[optionIndex]) return;
  if (backendAvailable && isLoggedIn()) {
    try {
      const snapshot = await apiRequest(`/polls/${encodeURIComponent(poll.id)}/vote`, {
        method: "POST",
        body: JSON.stringify({ optionIndex }),
      });
      applyQuickPollSnapshot(snapshot);
      renderQuickPoll();
      showToast("Głos zapisany", poll.options[optionIndex]);
      return;
    } catch (error) {
      if (!missingPollEndpoint(error)) {
        showToast("Nie zapisano głosu", error.message || "Backend odrzucił głos.");
        return;
      }
    }
  }
  poll.votes[getActiveLogin()] = optionIndex;
  saveQuickPollState();
  renderQuickPoll();
  showToast("Głos zapisany", poll.options[optionIndex]);
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
      updatedAt: task.updatedAt || task.updated_at || "",
      reactions: normalizeEntityReactions(task.reactions),
      comments: normalizeEntityComments(task.comments),
    }));
  });
}

function saveTaskState() {
  normalizeTasks();
  if (backendAvailable) return;
  writeStorage(storageKeys.tasks, tasks);
}

function saveReportState() {
  normalizeReports();
  if (backendAvailable) return;
  writeStorage(storageKeys.reports, reports);
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
  const topbarAvatar = $("#topbarUserAvatar");
  if (topbarAvatar) topbarAvatar.textContent = getActiveInitials();
  $("#currentUserName").textContent = currentUser.label;
  $("#currentUserRole").textContent = currentUser.isRoot
    ? "root / SQL"
    : currentUser.login === "tadeusz"
      ? "szef"
    : currentUser.role === "admin"
      ? "admin"
      : "pracownik";
  $("#dashboardGreeting").textContent = `Dzień dobry, ${getActiveName()} 👋`;
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
  renderKudos();
  renderQuickPoll();
  renderKanban();
  renderRequests();
  renderReports();
  renderStats();
  renderTimeDashboard();
  renderCalendar();
  renderChat();
  renderInventory();
  renderStoreShortages();
  renderKnowledge();
  renderWageCalculator();
  renderSettings();
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

function renderAccountOptions(preferredLogin = $("#accountSelect")?.value || "") {
  const select = $("#accountSelect");
  if (!select) return;
  const accounts = activeAccounts();
  select.innerHTML = accounts
    .map((account) => {
      const label =
        account.login === "tadeusz" ? "szef" : account.isRoot ? "root" : account.role === "admin" ? "administrator" : "pracownik";
      return `<option value="${escapeHtml(account.login)}">${escapeHtml(account.login)} - ${label}</option>`;
    })
    .join("");
  const fallbackLogin = accounts.find((account) => !account.isRoot)?.login || accounts[0]?.login;
  const nextLogin = accounts.some((account) => account.login === preferredLogin) ? preferredLogin : fallbackLogin;
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
      applyUserPreferences(currentUser.preferences || readLocalUserPreferences(currentUser.login));
      await syncAccountsFromBackend(currentUser.login, { silent: true });
      await syncTimeSummaryFromBackend({ silent: true });
      await syncAnnouncementsFromBackend({ silent: true });
      await syncTasksFromBackend({ silent: true });
      await syncReportsFromBackend({ silent: true });
      await syncRequestsFromBackend({ silent: true });
      await syncCalendarFromBackend({ silent: true });
      await syncKnowledgeFromBackend({ silent: true });
      await syncInventoryFromBackend({ silent: true });
      await syncStoreShortagesFromBackend({ silent: true });
      await syncQuickPollsFromBackend({ silent: true });
      await syncKudosFromBackend({ silent: true });
      await syncChatGroupsFromBackend({ silent: true });
      await syncVisibleChatMessagesFromBackend();
      startSharedDataPolling();
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
  applyUserPreferences(readLocalUserPreferences(account.login));
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
  stopQuickPollPolling();
  stopKudosPolling();
  stopSharedDataPolling();
  stopChatPolling();
  stopPresencePolling();
  if (backendAvailable) {
    apiRequest("/logout", { method: "POST" }).catch(() => {});
  }
  if (feedSeenTimer) {
    window.clearTimeout(feedSeenTimer);
    feedSeenTimer = null;
  }
  feedStateLogin = "";
  feedSeenInitialized = false;
  pinnedFeedItemIds.clear();
  seenFeedItemIds.clear();
  freshFeedItemIds.clear();
  currentUser = null;
  role = "employee";
  applyUserPreferences(defaultUserPreferences);
  localStorage.removeItem("prokom-user");
  renderAccountOptions($("#accountSelect")?.value || "");
  $("#passwordInput").value = "";
  updateLoginFields();
  updateAuthUi();
}

async function prepareLoggedOutSession() {
  currentUser = null;
  role = "employee";
  localStorage.removeItem("prokom-user");
  if (backendAvailable) {
    try {
      await apiRequest("/logout", { method: "POST" });
    } catch {
      // The login screen should still be shown when the backend cannot clear a stale cookie.
    }
  }
  applyUserPreferences(defaultUserPreferences);
  renderAccountOptions($("#accountSelect")?.value || "");
  $("#passwordInput").value = "";
  updateLoginFields();
  updateAuthUi();
}

function formatTimer(ms) {
  const total = Math.floor(ms / 1000);
  const hours = String(Math.floor(total / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function backendTodayMs() {
  return Math.max(0, Number(timeSummary?.personal?.todaySeconds || 0) * 1000);
}

function currentElapsed() {
  if (!clockedIn || breakActive || !startedAt) return elapsedBefore;
  return elapsedBefore + Date.now() - startedAt;
}

function displayedTodayMs() {
  if (clockedIn && !breakActive && startedAt) return Math.max(0, currentElapsed());
  return backendTodayMs();
}

function setLocalTodaySeconds(seconds) {
  if (!timeSummary || typeof timeSummary !== "object") return;
  if (!timeSummary.personal || typeof timeSummary.personal !== "object") timeSummary.personal = {};
  timeSummary.personal.todaySeconds = Math.max(0, Math.floor(Number(seconds) || 0));
}

function updateClockTicking() {
  const shouldTick = clockedIn && !breakActive;
  if (shouldTick && !timerId) {
    timerId = setInterval(renderTimer, 500);
  }
  if (!shouldTick && timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function currentClockState() {
  if (clockedIn) return breakActive ? "break" : "in";
  return displayedTodayMs() ? "done" : "out";
}

function updateClockCardState() {
  $$(".clock-card").forEach((card) => {
    card.dataset.clockState = currentClockState();
  });
}

function renderDashboardClockMeta() {
  const meta = $("#dashboardClockMeta");
  if (!meta) return;
  const entries = Array.isArray(timeSummary?.personal?.dayLog) ? timeSummary.personal.dayLog : [];
  const activeEntry = entries.find((entry) => entry.status === "W toku") || entries.at(-1);
  const parts = [];
  if (activeEntry?.start) parts.push(`Start ${activeEntry.start}`);
  const breakSeconds = Number(activeEntry?.breakSeconds || 0);
  if (breakSeconds) parts.push(`Przerwa ${formatWorkDuration(breakSeconds)}`);
  parts.push(`Dziś ${formatTimer(displayedTodayMs())}`);
  parts.push("cel 8h");
  meta.textContent = parts.join(" · ");
}

function renderTimer() {
  const value = formatTimer(displayedTodayMs());
  $("#liveTimer").textContent = value;
  $("#timeHeroTimer").textContent = value;
  updateClockCardState();
  renderDashboardClockMeta();
  renderTopbarWorkCounter();
  renderTimeKpiTiles();
  renderTimeWeekChart();
  renderTimeDayLog();
}

function updateClockControls() {
  updateClockCardState();
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

function toggleSidebarNavigation() {
  const sidebar = $(".sidebar");
  const button = $("#menuToggle");
  const isMobile = window.matchMedia("(max-width: 820px)").matches;
  if (isMobile) {
    const opened = sidebar.classList.toggle("open");
    document.body.classList.remove("sidebar-collapsed");
    button?.setAttribute("aria-expanded", String(opened));
    return;
  }
  sidebar.classList.remove("open");
  const collapsed = document.body.classList.toggle("sidebar-collapsed");
  button?.setAttribute("aria-expanded", String(!collapsed));
}

function resetDesktopSidebarStateOnResize() {
  if (window.matchMedia("(max-width: 820px)").matches) {
    document.body.classList.remove("sidebar-collapsed");
    $("#menuToggle")?.setAttribute("aria-expanded", String($(".sidebar")?.classList.contains("open")));
  }
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
    const currentMs = displayedTodayMs();
    clockedIn = nextClockedIn;
    breakActive = nextBreakActive;
    elapsedBefore = Math.max(backendTodayMs(), currentMs);
    if (clockedIn && !breakActive) {
      startedAt = Date.now();
    } else {
      startedAt = null;
    }
    if (!clockedIn) {
      elapsedBefore = Math.max(elapsedBefore, backendTodayMs());
    }
  }
  updateClockTicking();
  updateClockControls();
  renderTimer();
}

function syncClockTimerFromTimeSummary() {
  const backendMs = backendTodayMs();
  if (clockedIn && !breakActive) {
    elapsedBefore = backendMs;
    startedAt = Date.now();
  } else {
    elapsedBefore = backendMs;
    startedAt = null;
  }
  updateClockTicking();
  updateClockControls();
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
    elapsedBefore = Math.max(elapsedBefore, backendTodayMs());
    clockedIn = true;
    breakActive = false;
    startedAt = Date.now();
    updateClockTicking();
    setCurrentPersonPresence("work");
  } else {
    elapsedBefore = displayedTodayMs();
    setLocalTodaySeconds(elapsedBefore / 1000);
    clockedIn = false;
    breakActive = false;
    startedAt = null;
    updateClockTicking();
    setCurrentPersonPresence("out");
  }
  updateClockControls();
  renderTimer();
  await savePresenceState();
}

async function toggleBreak() {
  if (!clockedIn) return;
  if (!breakActive) {
    elapsedBefore = displayedTodayMs();
    setLocalTodaySeconds(elapsedBefore / 1000);
    breakActive = true;
    startedAt = null;
  } else {
    breakActive = false;
    startedAt = Date.now();
  }
  updateClockTicking();
  setCurrentPersonPresence(breakActive ? "break" : "work");
  updateClockControls();
  renderTimer();
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

function personAcceptedLeaveRequests(person) {
  const login = normalizeLogin(person?.login || "");
  const name = String(person?.name || "").trim();
  return leaveRequests().filter((request) => {
    const sameLogin = login && normalizeLogin(request.ownerLogin || "") === login;
    const sameName = name && request.owner === name;
    return request.status === "Zaakceptowane" && (sameLogin || sameName);
  });
}

function personUsedLeaveDays(person) {
  return personAcceptedLeaveRequests(person).reduce((sum, request) => sum + parseLeaveDetail(request.detail).days, 0);
}

function personIsOnLeaveToday(person) {
  const today = formatDateInput(new Date());
  const status = String(person?.status || "").toLowerCase();
  if (status.includes("urlop")) return true;
  return personAcceptedLeaveRequests(person).some((request) => {
    const detail = parseLeaveDetail(request.detail);
    return detail.from && detail.to && detail.from <= today && today <= detail.to;
  });
}

function teamStatusInfo(person) {
  if (personIsOnLeaveToday(person)) return { label: "Urlop", className: "leave" };
  if (person?.state === "work") return { label: "W pracy", className: "on" };
  if (person?.state === "break") return { label: "Przerwa", className: "break" };
  return { label: presenceStatusForState(person?.state, person?.active), className: "off" };
}

function renderPeople() {
  const visiblePeople = activePeople();
  const workingPeople = visiblePeople.filter((person) => ["work", "break"].includes(person.state));
  const leavePeople = visiblePeople.filter((person) => personIsOnLeaveToday(person));
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
  const teamPeopleCount = $("#teamPeopleCount");
  if (teamPeopleCount) teamPeopleCount.textContent = String(visiblePeople.length);
  const teamWorkingPeopleCount = $("#teamWorkingPeopleCount");
  if (teamWorkingPeopleCount) teamWorkingPeopleCount.textContent = String(workingPeople.length);
  const teamLeavePeopleCount = $("#teamLeavePeopleCount");
  if (teamLeavePeopleCount) teamLeavePeopleCount.textContent = String(leavePeople.length);
  $("#teamGrid").innerHTML = visiblePeople
    .map(
      (person) => {
        const status = teamStatusInfo(person);
        const usedLeaveDays = Math.min(26, personUsedLeaveDays(person));
        return `
        <article class="team-card">
          <div class="avatar team-avatar-${escapeHtml(slugifyLogin(person.login || person.name))}">${escapeHtml(person.initials)}</div>
          <div class="meta">
            <strong>${escapeHtml(person.name)}</strong>
            <span class="muted">${escapeHtml(person.role)}</span>
            <span class="muted">Urlop: ${usedLeaveDays}/26 dni</span>
          </div>
          <span class="team-status-pill ${status.className}">${escapeHtml(status.label)}</span>
        </article>
      `;
      },
    )
    .join("");

  renderAnnouncementRecipientOptions();

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
          <div class="avatar team-avatar-${escapeHtml(slugifyLogin(account.login || account.name))}">${escapeHtml(account.initials)}</div>
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

function postPriorityClass(priority) {
  if (priority === "urgent") return "is-urgent";
  if (priority === "important") return "is-important";
  return "is-normal";
}

function postReadClass(post) {
  return post.unread ? "is-unread" : "is-read";
}

function postAuthorInitials(post) {
  return getInitialsByLogin(post.authorLogin, post.author);
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

function announcementPostMatchesFilter(post) {
  if (currentAnnouncementFilter === "urgent") return post.priority === "urgent";
  if (currentAnnouncementFilter === "important") return post.priority === "important";
  if (currentAnnouncementFilter === "mine") {
    return normalizeLogin(post.authorLogin) === getActiveLogin() || post.author === getActiveName();
  }
  if (currentAnnouncementFilter === "unread") return Boolean(post.unread);
  return true;
}

function isPinnedAnnouncementPost(post) {
  return post.priority === "urgent" || (post.priority === "important" && post.unread);
}

function renderAnnouncementReactionChips(post) {
  ensurePostSocial(post);
  return [
    ...postReactionTypes.map(
      (reaction) =>
        `<span class="announcement-reaction-chip">${escapeHtml(reaction.icon)} ${post.reactions[reaction.id].length}</span>`,
    ),
    `<span class="announcement-reaction-chip">💬 ${post.comments.length}</span>`,
  ].join("");
}

function activitySortValue(value, fallback) {
  const text = String(value || "").trim();
  if (!text) return fallback;
  if (text.toLowerCase() === "teraz") return Date.now();
  const parsed = Date.parse(text.includes("T") ? text : text.replace(" ", "T"));
  return Number.isNaN(parsed) ? fallback : parsed;
}

function activityTimeLabel(value, fallback = "teraz") {
  const text = String(value || "").trim();
  if (!text) return fallback;
  const parsed = Date.parse(text.includes("T") ? text : text.replace(" ", "T"));
  if (Number.isNaN(parsed)) return text;
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(parsed));
}

function isAdminLogin(login) {
  const normalized = normalizeLogin(login);
  return accounts.some((account) => account.login === normalized && account.role === "admin");
}

function renderFileAttachment(file, buttonLabel = "Otwórz załącznik") {
  if (file?.linkUrl) {
    return `
      <div class="post-attachment report-attachment">
        <span class="pill">LINK</span>
        <span>${escapeHtml(file.linkUrl)}</span>
        <a class="secondary-button" href="${escapeHtml(file.linkUrl)}" target="_blank" rel="noopener">Otwórz link</a>
      </div>
    `;
  }
  if (!file?.fileName) return "";
  const fileMeta = [file.fileName, file.fileSize ? formatFileSize(file.fileSize) : ""].filter(Boolean).join(" · ");
  return `
    <div class="post-attachment report-attachment">
      <span class="pill">${escapeHtml(fileIcon(file.fileMime, file.fileName))}</span>
      <span>${escapeHtml(fileMeta)}</span>
      ${
        file.fileUrl
          ? `<a class="secondary-button" href="${escapeHtml(file.fileUrl)}" target="_blank" rel="noopener">${escapeHtml(buttonLabel)}</a>`
          : `<span class="muted">Brak pliku na serwerze</span>`
      }
    </div>
  `;
}

function renderPostAttachment(post) {
  return renderFileAttachment(post);
}

function feedStorageKey(baseKey) {
  return `${baseKey}:${normalizeLogin(getActiveLogin() || "guest")}`;
}

function replaceSetContents(targetSet, values = []) {
  targetSet.clear();
  values.map(String).filter(Boolean).forEach((value) => targetSet.add(value));
}

function ensureFeedBoardStateForActiveUser(force = false) {
  if (!isLoggedIn()) return;
  const login = normalizeLogin(getActiveLogin());
  if (!force && feedStateLogin === login) return;
  if (feedSeenTimer) {
    window.clearTimeout(feedSeenTimer);
    feedSeenTimer = null;
  }
  feedStateLogin = login;
  freshFeedItemIds.clear();

  const pinned = readStorage(feedStorageKey(storageKeys.feedPinnedIds), []);
  replaceSetContents(pinnedFeedItemIds, Array.isArray(pinned) ? pinned : []);

  const seen = readStorage(feedStorageKey(storageKeys.feedSeenIds), null);
  feedSeenInitialized = Array.isArray(seen);
  replaceSetContents(seenFeedItemIds, feedSeenInitialized ? seen : []);
}

function savePinnedFeedItems() {
  if (!isLoggedIn()) return;
  writeStorage(feedStorageKey(storageKeys.feedPinnedIds), [...pinnedFeedItemIds]);
}

function saveSeenFeedItems() {
  if (!isLoggedIn()) return;
  feedSeenInitialized = true;
  writeStorage(feedStorageKey(storageKeys.feedSeenIds), [...seenFeedItemIds].slice(-500));
}

function feedTypeLabel(typeId) {
  return feedTypeFilters.find((filter) => filter.id === typeId)?.label || "Inne";
}

function renderFeedTypeFilterOptions(items) {
  const container = $("#feedTypeFilter");
  if (!container) return;
  const counts = new Map();
  items.forEach((item) => {
    counts.set(item.category, (counts.get(item.category) || 0) + 1);
  });
  if (!feedTypeFilters.some((filter) => filter.id === currentFeedTypeFilter)) currentFeedTypeFilter = "all";
  container.innerHTML = feedTypeFilters
    .map((filter) => {
      const count = filter.id === "all" ? items.length : counts.get(filter.id) || 0;
      const active = filter.id === currentFeedTypeFilter;
      const disabled = filter.id !== "all" && count === 0;
      return `
        <button class="chip feed-type-chip ${active ? "active on" : ""}" data-feed-type-filter="${escapeHtml(
          filter.id,
        )}" type="button" aria-pressed="${active ? "true" : "false"}" ${disabled ? "disabled" : ""}>
          <span>${escapeHtml(filter.label)}</span>
          <small>${count}</small>
        </button>
      `;
    })
    .join("");
}

function decorateFeedItems(items) {
  return items.map((item) => {
    const pinned = pinnedFeedItemIds.has(item.id);
    const isNew = feedSeenInitialized && !seenFeedItemIds.has(item.id);
    if (isNew && $("#dashboard")?.classList.contains("active-view")) freshFeedItemIds.add(item.id);
    return {
      ...item,
      pinned,
      fresh: freshFeedItemIds.has(item.id),
    };
  });
}

function sortFeedItems(items) {
  return items.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.sortValue - a.sortValue;
  });
}

function scheduleFeedItemsSeen(items, allItems) {
  if (!isLoggedIn() || !$("#dashboard")?.classList.contains("active-view")) return;
  const targetItems = feedSeenInitialized ? items : allItems;
  const ids = targetItems.map((item) => item.id).filter(Boolean);
  if (!ids.length) return;
  if (feedSeenTimer) window.clearTimeout(feedSeenTimer);
  feedSeenTimer = window.setTimeout(() => {
    ids.forEach((id) => seenFeedItemIds.add(id));
    saveSeenFeedItems();
    feedSeenTimer = null;
  }, 1800);
}

function toggleFeedItemPin(itemId) {
  if (!itemId || !isLoggedIn()) return;
  ensureFeedBoardStateForActiveUser();
  if (pinnedFeedItemIds.has(itemId)) {
    pinnedFeedItemIds.delete(itemId);
    showToast("Tablica", "Wpis odpięty.");
  } else {
    pinnedFeedItemIds.add(itemId);
    showToast("Tablica", "Wpis przypięty na górze tablicy.");
  }
  savePinnedFeedItems();
  renderPosts(currentFeedFilter);
}

function buildActivityFeedItems() {
  const fallbackBase = Date.now();
  const fallbackSort = (index) => fallbackBase - index;
  const taskItems = Object.entries(tasks).flatMap(([column, items]) =>
    (items || []).map((task) => ({ ...task, column })),
  );
  const rawItems = [
    ...posts.map((post, index) => {
      ensurePostSocial(post);
      const [label, color] = priorityLabel(post.priority);
      return {
        id: `post:${post.id}`,
        category: "announcements",
        type: "Ogłoszenie",
        title: post.title,
        body: post.body,
        meta: `${post.author} · odczytali ${post.read}/${post.total}`,
        time: activityTimeLabel(post.createdAt, post.unread ? "nieodczytane" : "ogłoszenie"),
        sortValue: activitySortValue(post.createdAt, fallbackSort(index)),
        pill: label,
        color,
        unread: post.unread,
        attention: post.priority === "urgent",
        fromAdmin: isAdminLogin(post.authorLogin),
        actorLogin: post.authorLogin,
        target: { view: "announcements", postId: post.id },
        actionLabel: "Otwórz ogłoszenie",
        extraHtml: renderPostAttachment(post),
      };
    }),
    ...reports.map((report, index) => ({
      id: `report:${report.id}`,
      category: "reports",
      type: "Zgłoszenie",
      title: report.title,
      body: report.detail,
      meta: `${report.category} · ${report.owner} · ${report.status}`,
      time: activityTimeLabel(report.updatedAt || report.createdAt, "zgłoszenie"),
      sortValue: activitySortValue(report.updatedAt || report.createdAt, fallbackSort(100 + index)),
      pill: report.status,
      color: reportStatusColor(report),
      unread: report.status === "Nowe",
      attention: !reportIsClosed(report),
      fromAdmin: isAdminLogin(report.ownerLogin),
      actorLogin: report.ownerLogin,
      target: { view: "reports", reportId: report.id },
      actionLabel: "Przejdź do zgłoszeń",
      extraHtml: renderFileAttachment(report),
    })),
    ...kbArticles.map((article, index) => ({
      id: `knowledge:${article.id}`,
      category: "knowledge",
      type: "Baza wiedzy",
      title: article.title,
      body: article.detail,
      meta: [
        article.linkUrl || article.fileName,
        article.fileSize ? formatFileSize(article.fileSize) : "",
        getDisplayNameByLogin(article.createdBy),
      ]
        .filter(Boolean)
        .join(" · "),
      time: activityTimeLabel(article.createdAt, "dokument"),
      sortValue: activitySortValue(article.createdAt, fallbackSort(200 + index)),
      pill: article.type || "PLIK",
      color: "green",
      unread: false,
      attention: false,
      fromAdmin: isAdminLogin(article.createdBy),
      actorLogin: article.createdBy,
      target: { view: "knowledge", articleId: article.id },
      actionLabel: "Przejdź do wiedzy",
      extraHtml: renderFileAttachment(article, "Otwórz dokument"),
    })),
    ...inventoryItems.map((item, index) => {
      const status = inventoryStatus(item);
      return {
        id: `inventory:${item.id}`,
        category: "inventory",
        type: "Magazyn",
        title: item.name,
        body: `${item.category} Â· ${item.location || "brak lokalizacji"}`,
        meta: `Stan: ${formatInventoryNumber(item.quantity)} ${item.unit} Â· min. ${formatInventoryNumber(item.minimum)}`,
        time: activityTimeLabel(item.updatedAt || item.createdAt, "magazyn"),
        sortValue: activitySortValue(item.updatedAt || item.createdAt, fallbackSort(250 + index)),
        pill: status.label,
        color: status.id === "low" ? "red" : status.id === "mid" ? "amber" : "green",
        unread: status.id === "low",
        attention: status.id === "low",
        fromAdmin: isAdminLogin(item.ownerLogin),
        actorLogin: item.ownerLogin,
        target: { view: "inventory", itemId: item.id },
        actionLabel: "PrzejdĹş do magazynu",
      };
    }),
    ...calendarEvents.map((event, index) => ({
      id: `calendar:${event.id}`,
      category: "calendar",
      type: "Kalendarz",
      title: event.title,
      body: `${event.date || "Data nieustalona"} · ${event.time || "Godzina nieustalona"}`,
      meta: `${event.attendees} potwierdzeń · ${event.rsvp}`,
      time: activityTimeLabel(event.createdAt, event.date || "wydarzenie"),
      sortValue: activitySortValue(event.createdAt, fallbackSort(300 + index)),
      pill: event.rsvp === "Będę" ? "Potwierdzone" : "RSVP",
      color: event.rsvp === "Będę" ? "green" : "amber",
      unread: event.rsvp !== "Będę",
      attention: event.rsvp !== "Będę",
      fromAdmin: isAdminLogin(event.createdBy),
      actorLogin: event.createdBy,
      target: { view: "calendar", eventId: event.id },
      actionLabel: "Przejdź do kalendarza",
    })),
    ...requests.filter((request) => !["correction", "leave"].includes(request.kind)).map((request, index) => ({
      id: `request:${request.id}`,
      category: request.kind === "leave" ? "leaves" : "time",
      type: request.kind === "correction" ? "Korekta czasu" : "Wniosek",
      title: request.title,
      body: request.detail,
      meta: `${request.owner} · ${request.status}`,
      time: activityTimeLabel(request.updatedAt || request.createdAt, "wniosek"),
      sortValue: activitySortValue(request.updatedAt || request.createdAt, fallbackSort(400 + index)),
      pill: request.status,
      color: requestNeedsDecision(request) ? "amber" : request.status === "Zaakceptowane" ? "green" : "red",
      unread: requestNeedsDecision(request),
      attention: requestNeedsDecision(request),
      fromAdmin: isAdminLogin(request.ownerLogin),
      actorLogin: request.ownerLogin,
      target: { view: request.kind === "leave" ? "leaves" : "time", requestId: request.id },
      actionLabel: request.kind === "leave" ? "Przejdź do urlopów" : "Przejdź do czasu pracy",
    })),
    ...taskItems.map((task, index) => ({
      id: `task:${task.id}`,
      category: "tasks",
      type: "Zadanie",
      title: task.title,
      body: task.description,
      meta: `${task.owner} · ${columnLabels[task.column] || "Zadania"} · termin: ${task.due}`,
      time: activityTimeLabel(task.createdAt, "zadanie"),
      sortValue: activitySortValue(task.createdAt, fallbackSort(500 + index)),
      pill: columnLabels[task.column] || "Zadanie",
      color: task.column === "done" ? "green" : task.priority === "urgent" ? "red" : "teal",
      unread: task.column !== "done" && (task.ownerLogin === getActiveLogin() || task.owner === getActiveName()),
      attention: task.priority === "urgent" && task.column !== "done",
      fromAdmin: isAdminLogin(task.ownerLogin),
      actorLogin: task.ownerLogin,
      target: { view: "tasks", taskId: task.id },
      actionLabel: "Otwórz zadanie",
    })),
    ...handoverNotes.map((note, index) => ({
      id: `handover:${note.id}`,
      category: "handover",
      type: "Zeszyt zmiany",
      title: `Notatka od ${note.author}`,
      body: note.text,
      meta: `${note.accepted ? "Przyjęte" : "Nowe"} · przyjęło ${note.acceptedCount}`,
      time: activityTimeLabel(note.createdAt || note.time, note.time || "notatka"),
      sortValue: activitySortValue(note.createdAt, fallbackSort(600 + index)),
      pill: note.accepted ? "Przyjęte" : "Nowe",
      color: note.accepted ? "green" : "amber",
      unread: !note.accepted,
      attention: !note.accepted,
      fromAdmin: isAdminLogin(note.authorLogin),
      actorLogin: note.authorLogin,
      target: { view: "knowledge", noteId: note.id },
      actionLabel: "Przejdź do notatki",
    })),
  ];
  return rawItems
    .filter((item) => !["inventory", "knowledge"].includes(item.category))
    .sort((a, b) => b.sortValue - a.sortValue);
}

function feedItemMatchesModeFilter(item) {
  if (currentFeedFilter === "boss") return item.fromAdmin;
  if (currentFeedFilter === "urgent") return item.attention || item.color === "red" || /piln/i.test(item.pill || "");
  if (currentFeedFilter === "important") return item.color === "amber" || /ważn|wazn/i.test(item.pill || item.meta || "");
  if (currentFeedFilter === "mine") return normalizeLogin(item.actorLogin || "") === getActiveLogin();
  if (currentFeedFilter === "unread") return item.unread || item.attention;
  return true;
}

function feedItemMatchesTypeFilter(item) {
  return currentFeedTypeFilter === "all" || item.category === currentFeedTypeFilter;
}

function feedStatusTagClass(item) {
  const color = String(item.color || "").toLowerCase();
  if (["red", "amber", "green", "teal", "violet"].includes(color)) return `status-${color}`;
  const label = normalizeSearch(item.pill || "");
  if (label.includes("zalatw") || label.includes("zrob") || label.includes("potwierdz") || label.includes("ok")) {
    return "status-green";
  }
  if (label.includes("przyj") || label.includes("trakcie") || label.includes("rsvp")) return "status-teal";
  if (label.includes("oczek") || label.includes("sprawdz") || label.includes("uwag")) return "status-amber";
  if (label.includes("piln") || label.includes("niski") || label.includes("nowe")) return "status-red";
  return "status-violet";
}

function renderActivityFeedItemLegacy(item) {
  const authorName = item.actorLogin ? getDisplayNameByLogin(item.actorLogin) : item.type || "PRO-KOM";
  const initials = getInitialsByLogin(item.actorLogin, authorName || item.type || "PK");
  const statusLabel = item.pill || (item.unread ? "Do odczytu" : "Aktualne");
  const statusClass = feedStatusTagClass(item);
  const tagClass =
    item.category === "announcements"
      ? "t-ann"
      : item.category === "reports"
        ? "t-rep"
        : item.category === "tasks"
          ? "t-task"
          : item.category === "calendar" || item.category === "time"
            ? "t-cal"
            : item.category === "knowledge"
              ? "t-ann"
              : "t-mag";
  return `
    <article class="item feed-card ${item.unread || item.attention ? "attention" : ""} ${item.pinned ? "pinned" : ""}">
      <div class="item-top feed-card-top">
        <div class="av source-feed-avatar" aria-label="Autor: ${escapeHtml(authorName)}" title="${escapeHtml(authorName)}">${escapeHtml(initials)}</div>
        <div class="source-feed-author">
          <strong>${escapeHtml(authorName)}</strong>
          <span>${escapeHtml(item.time)}</span>
        </div>
        <span class="tag ${tagClass}">${escapeHtml(item.type)}</span>
        <span class="tag source-status-tag ${statusClass}">${escapeHtml(statusLabel)}</span>
        ${item.fresh ? `<span class="feed-new-indicator" title="Nowy wpis od ostatniej wizyty" aria-label="Nowy wpis"></span>` : ""}
        ${item.pinned ? `<span class="state s-todo">Przypięte</span>` : ""}
        <span class="source-card-menu">...</span>
      </div>
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.body)}</p>
      <div class="source-card-line"></div>
      <div class="feed-meta sub">${escapeHtml(item.meta)}</div>
      ${item.extraHtml || ""}
      <div class="item-actions feed-card-actions">
        <button class="rbtn" data-feed-pin="${escapeHtml(item.id)}" type="button" title="${item.pinned ? "Odepnij" : "Przypnij"}">${item.pinned ? "📌" : "📍"}</button>
        <button class="rbtn" data-feed-detail="${escapeHtml(item.id)}" type="button">💬 0</button>
        <span class="rbtn ${item.unread ? "" : "on"}">${item.unread ? "Do odczytu" : "✓ Odczytane"}</span>
        <button class="mini" data-feed-source="${escapeHtml(item.id)}" type="button">Przejdź do źródła</button>
        <button class="mini" data-feed-detail="${escapeHtml(item.id)}" type="button">Otwórz szczegóły</button>
      </div>
    </article>
  `;
  return `
    <article class="feed-card ${item.unread || item.attention ? "attention" : ""} ${item.pinned ? "pinned" : ""}">
      <div class="feed-card-top">
        <span class="feed-type-row">
          <span class="pill ${item.color || ""}">${escapeHtml(item.type)}</span>
          ${item.fresh ? `<span class="feed-new-indicator" title="Nowy wpis od ostatniej wizyty" aria-label="Nowy wpis"></span>` : ""}
          ${item.pinned ? `<span class="pill amber">Przypięte</span>` : ""}
        </span>
        <span class="muted">${escapeHtml(item.time)}</span>
      </div>
      <div class="widget-header">
        <strong>${escapeHtml(item.title)}</strong>
        <span class="pill ${item.color || ""}">${escapeHtml(item.pill)}</span>
      </div>
      <p class="note">${escapeHtml(item.body)}</p>
      <div class="feed-meta">${escapeHtml(item.meta)}</div>
      ${item.extraHtml || ""}
      <div class="feed-card-actions">
        <button class="secondary-button" data-feed-pin="${escapeHtml(item.id)}" type="button" title="${item.pinned ? "Odepnij" : "Przypnij"}">${
          item.pinned ? "Odepnij" : "Przypnij"
        }</button>
        <button class="secondary-button" data-feed-source="${escapeHtml(item.id)}" type="button">Przejdź do źródła</button>
        <button class="secondary-button" data-feed-detail="${escapeHtml(item.id)}" type="button">Otwórz szczegóły</button>
      </div>
    </article>
  `;
}

function getFeedAnnouncementPost(item) {
  if (item?.category !== "announcements") return null;
  const postId = item.target?.postId || String(item.id || "").replace(/^post:/, "");
  return getPostById(postId);
}

function getFeedCommentContext(item) {
  if (!item) return null;
  const post = getFeedAnnouncementPost(item);
  if (post) {
    return {
      kind: "announcement",
      entityId: post.id,
      title: post.title,
      comments: normalizeEntityComments(post.comments),
      emptyText: "Brak komentarzy pod ogloszeniem.",
      placeholder: "Dodaj komentarz do ogloszenia",
    };
  }
  if (item.category === "tasks") {
    const task = getTaskRef(item.target?.taskId)?.task;
    if (task) {
      return {
        kind: "task",
        entityId: task.id,
        title: task.title,
        comments: normalizeEntityComments(task.comments),
        emptyText: "Brak komentarzy do zadania.",
        placeholder: "Dodaj komentarz do zadania",
      };
    }
  }
  if (item.category === "reports") {
    const report = getReportById(item.target?.reportId);
    if (report) {
      return {
        kind: "report",
        entityId: report.id,
        title: report.title,
        comments: normalizeEntityComments(report.comments),
        emptyText: "Brak komentarzy do zgloszenia.",
        placeholder: "Dodaj komentarz do zgloszenia",
      };
    }
  }
  return null;
}

function isFeedCommentsOpen(itemId) {
  return expandedFeedCommentIds.has(String(itemId));
}

function renderFeedInlineComments(item) {
  if (!isFeedCommentsOpen(item.id)) return "";
  const context = getFeedCommentContext(item);
  if (!context) return "";
  return `
    <section class="feed-inline-comments is-open" data-feed-inline-comments="${escapeHtml(item.id)}">
      <div class="feed-inline-comments-head">
        <h5>Komentarze</h5>
        <span class="pill">${context.comments.length}</span>
      </div>
      <div class="comment-list">
        ${renderEntityComments(context.comments, context.emptyText)}
      </div>
      <form class="comment-form feed-inline-comment-form" data-feed-comment-form="${escapeHtml(item.id)}">
        <input name="body" type="text" placeholder="${escapeHtml(context.placeholder)}" autocomplete="off" required />
        <button class="primary-button" type="submit">Dodaj</button>
      </form>
    </section>
  `;
}

function toggleFeedInlineComments(itemId) {
  const key = String(itemId || "");
  if (!key || !getActivityFeedItemById(key)) return;
  if (expandedFeedCommentIds.has(key)) {
    expandedFeedCommentIds.delete(key);
  } else {
    expandedFeedCommentIds.add(key);
  }
  renderPosts(currentFeedFilter);
  if (expandedFeedCommentIds.has(key)) {
    window.setTimeout(() => {
      $(`[data-feed-comment-form="${escapeSelectorValue(key)}"] input[name="body"]`)?.focus();
    }, 40);
  }
}

async function submitFeedInlineComment(event) {
  event.preventDefault();
  const form = event.target;
  const itemId = form?.dataset.feedCommentForm;
  const item = getActivityFeedItemById(itemId);
  const context = getFeedCommentContext(item);
  const input = form?.querySelector("input[name='body']");
  const body = input?.value.trim();
  if (!context || !body) return;
  expandedFeedCommentIds.add(String(itemId));

  let savedCommentTarget = null;
  if (context.kind === "announcement") {
    savedCommentTarget = await addAnnouncementCommentById(context.entityId, body, { skipNotification: true });
  } else if (context.kind === "task") {
    savedCommentTarget = await addTaskCommentById(context.entityId, body);
  } else if (context.kind === "report") {
    savedCommentTarget = await addReportCommentById(context.entityId, body);
  }
  if (!savedCommentTarget) return;

  expandedFeedCommentIds.add(String(itemId));
  if (input) input.value = "";
  renderPosts(currentFeedFilter);
  window.setTimeout(() => {
    $(`[data-feed-comment-form="${escapeSelectorValue(itemId)}"] input[name="body"]`)?.focus();
  }, 40);
}

function renderActivityFeedReactions(item) {
  const pinButton = `<button class="rbtn feed-pin-button" data-feed-pin="${escapeHtml(item.id)}" type="button" aria-label="${
    item.pinned ? "Odepnij wpis" : "Przypnij wpis"
  }" title="${item.pinned ? "Odepnij" : "Przypnij"}">${item.pinned ? "&#128204;" : "&#128205;"}</button>`;
  const post = getFeedAnnouncementPost(item);
  if (!post) {
    const task = item.category === "tasks" ? getTaskRef(item.target?.taskId)?.task : null;
    const report = item.category === "reports" ? getReportById(item.target?.reportId) : null;
    if (task) {
      const commentsCount = normalizeEntityComments(task.comments).length;
      return `${pinButton}${renderEntityReactionButtons(
        task.reactions,
        "task",
        task.id,
        "rbtn feed-reaction-button",
      )}<button class="rbtn feed-comment-count ${isFeedCommentsOpen(item.id) ? "is-open" : ""}" data-feed-comment-toggle="${escapeHtml(
        item.id,
      )}" type="button" aria-expanded="${isFeedCommentsOpen(item.id) ? "true" : "false"}" aria-label="Rozwin komentarze zadania">&#128172; ${commentsCount}</button>`;
    }
    if (report) {
      const commentsCount = normalizeEntityComments(report.comments).length;
      return `${pinButton}${renderEntityReactionButtons(
        report.reactions,
        "report",
        report.id,
        "rbtn feed-reaction-button",
      )}<button class="rbtn feed-comment-count ${isFeedCommentsOpen(item.id) ? "is-open" : ""}" data-feed-comment-toggle="${escapeHtml(
        item.id,
      )}" type="button" aria-label="Dodaj komentarz do zgłoszenia">&#128172; ${commentsCount}</button>`;
    }
    return `${pinButton}<button class="rbtn feed-comment-count" data-feed-detail="${escapeHtml(
      item.id,
    )}" type="button" aria-label="Komentarze">&#128172; 0</button>`;
  }
  const reactionButtons = postReactionTypes
    .map((reaction) => {
      const names = post.reactions?.[reaction.id] || [];
      const active = names.includes(getActiveName());
      return `
        <button class="rbtn feed-reaction-button ${active ? "on" : ""}" data-feed-post="${escapeHtml(
          post.id,
        )}" data-feed-reaction="${escapeHtml(reaction.id)}" type="button" aria-pressed="${active ? "true" : "false"}" title="${escapeHtml(
          names.join(", ") || reaction.label,
        )}">
          <span>${escapeHtml(reaction.icon)}</span>
          <span>${names.length}</span>
        </button>
      `;
    })
    .join("");
  const commentsCount = post.comments?.length || 0;
  return `${pinButton}${reactionButtons}<button class="rbtn feed-comment-count ${isFeedCommentsOpen(item.id) ? "is-open" : ""}" data-feed-comment-toggle="${escapeHtml(
    item.id,
  )}" type="button" aria-label="Dodaj komentarz">&#128172; ${commentsCount}</button>`;
}

function renderActivityFeedReadAction(item) {
  const post = getFeedAnnouncementPost(item);
  if (!post) {
    return `<span class="rbtn readr ${item.unread ? "" : "on"}">${item.unread ? "Do odczytu" : "✓ Odczytane"}</span>`;
  }
  const isRead = !post.unread;
  if (isRead) {
    return `<span class="rbtn readr on">✓ Odczytane</span>`;
  }
  return `
    <span class="rbtn readr">Do odczytu</span>
    <button class="mini feed-read-button" data-feed-read="${escapeHtml(post.id)}" type="button">
      Potwierdź odczyt
    </button>
  `;
}

function renderActivityFeedItem(item) {
  const authorName = item.actorLogin ? getDisplayNameByLogin(item.actorLogin) : item.type || "PRO-KOM";
  const initials = getInitialsByLogin(item.actorLogin, authorName || item.type || "PK");
  const statusLabel = item.pill || (item.unread ? "Do odczytu" : "Aktualne");
  const statusClass = feedStatusTagClass(item);
  const tagClass =
    item.category === "announcements"
      ? "t-ann"
      : item.category === "reports"
        ? "t-rep"
        : item.category === "tasks"
          ? "t-task"
          : item.category === "calendar" || item.category === "time"
            ? "t-cal"
            : item.category === "knowledge"
              ? "t-ann"
              : "t-mag";
  return `
    <article class="item feed-card ${item.unread || item.attention ? "attention" : ""} ${item.pinned ? "pinned" : ""}">
      <div class="item-top feed-card-top">
        <div class="av source-feed-avatar" aria-label="Autor: ${escapeHtml(authorName)}" title="${escapeHtml(authorName)}">${escapeHtml(initials)}</div>
        <div class="source-feed-author">
          <strong>${escapeHtml(authorName)}</strong>
          <span>${escapeHtml(item.time)}</span>
        </div>
        <span class="tag ${tagClass}">${escapeHtml(item.type)}</span>
        <span class="tag source-status-tag ${statusClass}">${escapeHtml(statusLabel)}</span>
        ${item.fresh ? `<span class="feed-new-indicator" title="Nowy wpis od ostatniej wizyty" aria-label="Nowy wpis"></span>` : ""}
        ${item.pinned ? `<span class="state s-todo">Przypięte</span>` : ""}
        <span class="source-card-menu">...</span>
      </div>
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.body)}</p>
      <div class="source-card-line"></div>
      <div class="feed-meta sub">${escapeHtml(item.meta)}</div>
      ${item.extraHtml || ""}
      <div class="item-actions feed-card-actions">
        <div class="feed-reaction-group">
          ${renderActivityFeedReactions(item)}
        </div>
        <div class="feed-card-action-group">
          ${renderActivityFeedReadAction(item)}
          <button class="mini" data-feed-source="${escapeHtml(item.id)}" type="button">Przejdź do źródła</button>
          <button class="mini" data-feed-detail="${escapeHtml(item.id)}" type="button">Otwórz szczegóły</button>
        </div>
      </div>
      ${renderFeedInlineComments(item)}
    </article>
  `;
}

function getActivityFeedItemById(itemId) {
  return buildActivityFeedItems().find((entry) => String(entry.id) === String(itemId));
}

function openFeedItemDetails(itemId) {
  const item = getActivityFeedItemById(itemId);
  if (!item) return;
  activeFeedItemId = item.id;
  $("#feedDialogType").textContent = item.type || "Tablica";
  $("#feedDialogTitle").textContent = item.title || "Szczegóły";
  $("#feedDialogBody").textContent = item.body || "";
  $("#feedDialogSource").textContent = item.actionLabel || "Źródło";
  $("#feedDialogTime").textContent = item.time || "";
  $("#feedDialogPill").textContent = item.pill || "";
  $("#feedDialogPill").className = `pill ${item.color || ""}`;
  $("#feedDialogMeta").textContent = item.meta || "";
  $("#feedDialogExtra").innerHTML = item.extraHtml || "";
  openDialog("#feedItemDialog");
}

function renderPostDialog(post = getPostById(activePostId)) {
  if (!post) return;
  const [label, color] = priorityLabel(post.priority);
  $("#postDialogPriority").textContent = `Ogłoszenie ${label.toLowerCase()}`;
  $("#postDialogPriority").className = `eyebrow ${color}`;
  $("#postDialogTitle").textContent = post.title;
  $("#postDialogBody").textContent = post.body;
  $("#postDialogAttachment").innerHTML = renderPostAttachment(post);
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
  ensureFeedBoardStateForActiveUser();
  const allFeedItems = decorateFeedItems(buildActivityFeedItems());
  const modeFilteredItems = allFeedItems.filter(feedItemMatchesModeFilter);
  renderFeedTypeFilterOptions(modeFilteredItems);
  const feedItems = sortFeedItems(modeFilteredItems.filter(feedItemMatchesTypeFilter)).slice(0, 16);
  const pinnedFeedItems = feedItems.filter((item) => item.pinned);
  const regularFeedItems = feedItems.filter((item) => !item.pinned);
  $("#feedList").innerHTML = feedItems.length
    ? [
        pinnedFeedItems.length
          ? `<div class="pinbar source-generated-pinbar">📌 PRZYPIĘTE <span class="ln"></span></div>${pinnedFeedItems
              .map(renderActivityFeedItem)
              .join("")}`
          : "",
        regularFeedItems.length
          ? `${pinnedFeedItems.length ? `<div class="pinbar source-generated-pinbar">POZOSTAŁE <span class="ln"></span></div>` : ""}${regularFeedItems
              .map(renderActivityFeedItem)
              .join("")}`
          : "",
      ].join("")
    : `<div class="empty-state">Brak aktywności pasującej do wybranego filtra.</div>`;
  scheduleFeedItemsSeen(feedItems, allFeedItems);
  renderUrgentStrip();
  $$("[data-announcement-composer-avatar]").forEach((avatar) => {
    const activeName = getActiveName();
    avatar.textContent = getInitialsByLogin(getActiveLogin(), activeName);
    avatar.title = activeName;
    avatar.setAttribute("aria-label", `Autor ogłoszenia: ${activeName}`);
  });

  const announcementPosts = posts.map(ensurePostSocial).filter(announcementPostMatchesFilter);
  const pinnedAnnouncementPosts = announcementPosts.filter(isPinnedAnnouncementPost);
  const regularAnnouncementPosts = announcementPosts.filter((post) => !isPinnedAnnouncementPost(post));
  const renderAnnouncementPost = (post) => {
    const [label, color] = priorityLabel(post.priority);
    const attachmentHtml = renderPostAttachment(post);
    const authorName = post.author || getDisplayNameByLogin(post.authorLogin);
    const timeLabel = activityTimeLabel(post.createdAt, post.unread ? "nieodczytane" : "ogłoszenie");
    const likeCount = post.reactions.like?.length || 0;
    const doneCount = post.reactions.done?.length || 0;
    const questionCount = post.reactions.question?.length || 0;
    const commentsCount = post.comments.length;
    const readActionLabel = post.unread ? "Potwierdź odczyt" : "Odczytane";
    const discussionLabel = post.unread || commentsCount ? "Odczyty i komentarze" : "Komentarze";
    return `
      <article class="announcement-card announcement-item ${postPriorityClass(post.priority)} ${postReadClass(post)} ${
        isPinnedAnnouncementPost(post) ? "is-pinned" : ""
      }" data-announcement-time="${escapeHtml(timeLabel)}">
        <div class="announcement-reference-top">
          <span class="pill ${color}">${escapeHtml(label)}</span>
          <time>${escapeHtml(timeLabel)}</time>
        </div>
        <h3>${escapeHtml(post.title)}</h3>
        <p class="note">${escapeHtml(post.body)}</p>
        <div class="announcement-reference-meta">
          <span>${escapeHtml(authorName)}</span>
          <span>odczytali ${post.read}/${post.total}</span>
          <span>👍 ${likeCount}</span>
          <span>✅ ${doneCount} potwierdzenia</span>
          <span>❔ ${questionCount}</span>
          <span>💬 ${commentsCount}</span>
        </div>
        ${attachmentHtml}
        <div class="announcement-reference-actions">
          <button class="announcement-read-chip ${post.unread ? "" : "is-read"}" data-open-post="${post.id}" type="button">${escapeHtml(
            readActionLabel,
          )}</button>
          <button class="announcement-read-chip" data-open-post="${post.id}" type="button">${escapeHtml(discussionLabel)}</button>
        </div>
      </article>
    `;
  };
  const renderAnnouncementSection = (label, items, pinned = false) =>
    items.length
      ? `
        <div class="announcement-section-divider ${pinned ? "is-pinned" : ""}">
          <span>${pinned ? "📌 " : ""}${label}</span>
        </div>
        ${items.map(renderAnnouncementPost).join("")}
      `
      : "";

  $("#announcementList").innerHTML = announcementPosts.length
    ? `${renderAnnouncementSection("Przypięte", pinnedAnnouncementPosts, true)}${renderAnnouncementSection(
        pinnedAnnouncementPosts.length ? "Pozostałe" : "Ogłoszenia",
        regularAnnouncementPosts,
      )}`
    : `<div class="empty-state">Brak ogłoszeń pasujących do wybranego filtra.</div>`;
  renderNotifications();
}

function renderKanban() {
  normalizeTasks();
  $("#kanban").innerHTML = Object.entries(tasks)
    .map(
      ([column, items]) => `
        <section class="kanban-column" data-column="${column}">
          <header class="kanban-column-header">
            <div class="kanban-column-title">
              <span class="task-column-dot" aria-hidden="true"></span>
              <h3>${columnLabels[column]} <span class="kanban-count">${
                items.filter((task) => taskMatchesFilter(task)).length
              }</span></h3>
            </div>
            <button class="task-column-add" data-open-task-form data-task-column="${column}" type="button" aria-label="Dodaj zadanie">+</button>
          </header>
          ${items
            .map((task, index) => ({ task, index }))
            .filter(({ task }) => taskMatchesFilter(task))
            .map(({ task, index }) => {
              const [label, color] = priorityLabel(task.priority);
              const isDone = column === "done";
              const taskClasses = ["task-card", isDone ? "is-complete" : ""].filter(Boolean).join(" ");
              const doneActions = isDone
                ? `<button class="secondary-button" data-task-reopen="${task.id}" type="button">Cofnij</button>`
                : "";
              const ownerInitials = getInitialsByLogin(task.ownerLogin, task.owner);
              const visibleCount = items.filter((visibleTask) => taskMatchesFilter(visibleTask)).length;
              const progressLabel = `${Math.min(index + 1, Math.max(visibleCount, 1))}/${Math.max(visibleCount, 1)}`;
              return `
                <article class="${taskClasses}" draggable="true" data-column="${column}" data-index="${index}" data-task-id="${
                  task.id
                }">
                  <button class="task-title-button" data-task-detail="${task.id}" type="button">
                    <strong>${escapeHtml(task.title)}</strong>
                  </button>
                  <p class="task-summary">${escapeHtml(task.description)}</p>
                  <div class="task-meta">
                    <span class="task-owner-avatar" aria-label="Właściciel: ${escapeHtml(task.owner)}" title="${escapeHtml(
                      task.owner,
                    )}">${escapeHtml(ownerInitials)}</span>
                    <span class="task-due">${escapeHtml(task.due)}</span>
                    <span class="task-progress">${escapeHtml(progressLabel)}</span>
                    <button class="entity-comment-button task-comments" data-task-comment="${escapeHtml(
                      task.id,
                    )}" type="button" title="Dodaj komentarz">&#128172; ${normalizeEntityComments(task.comments).length}</button>
                    <span class="pill task-priority-pill ${color}">${label}</span>
                  </div>
                  <div class="entity-social-row task-social-row">
                    ${renderEntityReactionButtons(task.reactions, "task", task.id)}
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
                    ${doneActions}
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
    const index = items.findIndex((task) => String(task.id) === String(taskId));
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

function openTaskForm(column = "todo") {
  const targetColumn = typeof column === "string" && tasks[column] ? column : "todo";
  renderTaskOwnerOptions();
  $("#taskForm").reset();
  $("#taskOwnerInput").value = activePeople().some((person) => person.login === getActiveLogin())
    ? getActiveLogin()
    : activePeople()[0]?.login || "";
  $("#taskColumnInput").value = targetColumn;
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
    updatedAt: "teraz",
    reactions: normalizeEntityReactions(),
    comments: [],
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
    reactions: normalizeEntityReactions(task.reactions),
    comments: [],
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
  $("#taskReactionBar").innerHTML = renderEntityReactionButtons(ref.task.reactions, "task", ref.task.id);
  const taskComments = normalizeEntityComments(ref.task.comments);
  $("#taskCommentCount").textContent = taskComments.length;
  $("#taskComments").innerHTML = renderEntityComments(taskComments, "Brak komentarzy do zadania.");
  const taskCommentInput = $("#taskCommentInput");
  if (taskCommentInput.dataset.taskId !== String(ref.task.id)) taskCommentInput.value = "";
  taskCommentInput.dataset.taskId = String(ref.task.id);
  const taskCommentForm = $("#taskCommentForm");
  if (taskCommentForm) taskCommentForm.dataset.taskCommentForm = String(ref.task.id);
  const activeReopenButton = $("[data-task-reopen-active]");
  if (activeReopenButton) activeReopenButton.classList.toggle("hidden", ref.column !== "done");
  openDialog("#taskDialog");
}

function focusTaskCommentInput() {
  window.setTimeout(() => $("#taskCommentInput")?.focus(), 80);
}

function openTaskComments(taskId) {
  openTaskDetails(taskId);
  focusTaskCommentInput();
}

function openReportComments(reportId) {
  openReportCommentId = String(reportId);
  const focusForm = () => {
    const form = $$("[data-report-comment-form]").find((item) => String(item.dataset.reportCommentForm) === String(reportId));
    if (!form) return false;
    const reportsView = $("#reports");
    if (!reportsView?.classList.contains("active-view")) return false;
    const card = form.closest(".report-card");
    const section = form.closest(".report-comment-section");
    section?.classList.add("is-open");
    card?.classList.add("comment-focus");
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => form.querySelector("input[name='body']")?.focus(), 120);
    window.setTimeout(() => card?.classList.remove("comment-focus"), 1400);
    return true;
  };
  const report = getReportById(reportId);
  currentReportFilter = report && reportIsClosed(report) ? "closed" : "open";
  $$("[data-report-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.reportFilter === currentReportFilter);
  });
  activateView("reports");
  renderReportState();
  if (!focusForm()) window.setTimeout(focusForm, 180);
}

function toggleLocalEntityReaction(entity, reactionId) {
  entity.reactions = normalizeEntityReactions(entity.reactions);
  const reactions = entity.reactions[reactionId];
  if (!reactions) return false;
  const activeName = getActiveName();
  if (reactions.includes(activeName)) {
    entity.reactions[reactionId] = reactions.filter((name) => name !== activeName);
  } else {
    reactions.push(activeName);
  }
  entity.updatedAt = "teraz";
  return true;
}

async function toggleTaskReaction(taskId, reactionId) {
  const ref = getTaskRef(taskId);
  if (!ref) return;
  if (backendAvailable) {
    try {
      const result = await apiRequest(`/tasks/${encodeURIComponent(ref.task.id)}/reactions`, {
        method: "POST",
        body: JSON.stringify({ reactionId }),
      });
      applyTaskSnapshot(result);
      renderTaskState();
      showToast("Reakcja zapisana", ref.task.title);
      return;
    } catch (error) {
      showToast("Nie zapisano reakcji", error.message || "Backend odrzucil zmiane.");
      return;
    }
  }
  if (!toggleLocalEntityReaction(ref.task, reactionId)) return;
  saveTaskState();
  renderTaskState();
  showToast("Reakcja zapisana", ref.task.title);
}

async function addTaskCommentById(taskId, body) {
  const ref = getTaskRef(taskId);
  if (!ref || !body) return null;
  activeTaskId = ref.task.id;

  if (backendAvailable) {
    try {
      const result = await apiRequest(`/tasks/${encodeURIComponent(ref.task.id)}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      applyTaskSnapshot(result);
      renderTaskState();
      showToast("Komentarz dodany", "Jest zapisany przy zadaniu.");
      return getTaskRef(ref.task.id)?.task || null;
    } catch (error) {
      showToast("Nie dodano komentarza", error.message || "Backend odrzucil zapis.");
      return null;
    }
  }

  ref.task.comments = normalizeEntityComments(ref.task.comments);
  ref.task.comments.push(makeEntityComment(body));
  ref.task.updatedAt = "teraz";
  saveTaskState();
  renderTaskState();
  showToast("Komentarz dodany", "Widac go w szczegolach zadania.");
  return ref.task;
}

async function createTaskComment(event) {
  event.preventDefault();
  const form = event.currentTarget || event.target;
  const input = $("#taskCommentInput");
  const taskId = form?.dataset.taskCommentForm || input?.dataset.taskId || activeTaskId;
  const ref = getTaskRef(taskId);
  const body = input?.value.trim();
  if (!ref || !body) return;
  activeTaskId = ref.task.id;

  if (backendAvailable) {
    try {
      const result = await apiRequest(`/tasks/${encodeURIComponent(ref.task.id)}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      input.value = "";
      applyTaskSnapshot(result);
      renderTaskState();
      showToast("Komentarz dodany", "Jest zapisany przy zadaniu.");
      return;
    } catch (error) {
      showToast("Nie dodano komentarza", error.message || "Backend odrzucil zapis.");
      return;
    }
  }

  ref.task.comments = normalizeEntityComments(ref.task.comments);
  ref.task.comments.push(makeEntityComment(body));
  ref.task.updatedAt = "teraz";
  input.value = "";
  saveTaskState();
  renderTaskState();
  showToast("Komentarz dodany", "Widać go w szczegółach zadania.");
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
  if (currentTaskFilter === "urgent") return task.priority === "urgent";
  if (currentTaskFilter === "person") return task.ownerLogin === "kuba" || task.owner === "Kuba";
  return true;
}

function formatCompactWorkDuration(seconds = 0) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  if (!hours && !minutes) return "—";
  if (!minutes) return `${hours}h`;
  return `${hours}h${String(minutes).padStart(2, "0")}`;
}

function scheduleCellDisplayValue(value = "") {
  const text = String(value || "").trim();
  if (!text) return "—";
  const parsed = parseScheduleValue(text);
  if (parsed.mode === "work") return formatCompactWorkDuration(scheduleValueSeconds(text));
  return scheduleNoteLabels[parsed.mode] || text;
}

function scheduleHeaderLabel(day) {
  const date = localDateFromInput(day.isoDate);
  const dayNumber = date ? String(date.getDate()).padStart(2, "0") : String(day.date || "").split(".")[0] || "";
  return `${String(day.label || "").toUpperCase()} ${dayNumber}`.trim();
}

function renderSchedule() {
  const requestedWeekStart = getScheduleWeekStart();
  const schedule = timeSummary?.schedule;
  const scheduleMatchesSelection = schedule?.weekStart === requestedWeekStart;
  const weekStart = scheduleMatchesSelection ? schedule.weekStart : requestedWeekStart;
  selectedScheduleWeekStart = weekStart;
  const days = scheduleMatchesSelection && schedule?.days?.length
    ? schedule.days
    : ["mon", "tue", "wed", "thu", "fri"].map((key, index) => {
        const date = addDays(localDateFromInput(weekStart) || getWeekStartDate(), index);
        return {
          key,
          label: ["Pon", "Wt", "Śr", "Czw", "Pt"][index],
          date: formatScheduleDate(formatDateInput(date)),
          isoDate: formatDateInput(date),
        };
      });
  const rows = scheduleMatchesSelection && schedule?.rows?.length
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
  const weekInput = $("#scheduleWeekInput");
  const weekLabel = $("#scheduleWeekLabel");
  const visibleWeekInput = $("[data-time-week-input]");
  const weekInputValue = weekInputValueFromDate(localDateFromInput(weekStart) || getWeekStartDate());
  const weekRangeLabel = formatScheduleWeekRange(weekStart);
  if (weekInput) weekInput.value = weekInputValue;
  if (visibleWeekInput) visibleWeekInput.value = weekInputValue;
  if (weekLabel) weekLabel.textContent = weekRangeLabel;
  $$("[data-schedule-week-label]").forEach((label) => {
    label.textContent = weekRangeLabel;
  });
  const canEdit = role === "admin";
  const headerCells = days
    .map((day) => `<div class="schedule-reference-head-cell">${escapeHtml(scheduleHeaderLabel(day))}</div>`)
    .join("");
  const bodyRows = rows
    .map((row) => {
      const rowCells = days
        .map((day) => {
          const cell = row.cells?.find((item) => item.day === day.key) || { value: "" };
          const value = cell.value || "";
          const displayValue = scheduleCellDisplayValue(value);
          const fullDisplayValue = scheduleDisplayValue(value);
          const cellClass = scheduleCellClass(value);
          const label = day.isoDate || day.date || day.label;
          return `${
            canEdit
              ? `<button class="schedule-day-box schedule-cell-button ${cellClass}" data-schedule-edit type="button" data-schedule-user="${escapeHtml(
                  row.login,
                )}" data-schedule-user-name="${escapeHtml(row.name)}" data-schedule-day="${escapeHtml(
                  day.key,
                )}" data-schedule-week="${escapeHtml(weekStart)}" value="${escapeHtml(
                  value,
                )}" data-schedule-value="${escapeHtml(value)}" data-schedule-label="${escapeHtml(
                  label,
                )}" aria-label="Grafik ${escapeHtml(row.name)} ${escapeHtml(label)}">
                  <strong>${escapeHtml(displayValue)}</strong>
                  <small>${escapeHtml(value ? fullDisplayValue : "Dodaj")}</small>
                </button>`
              : `<div class="schedule-day-box readonly ${cellClass}">
                  <strong class="${value ? "" : "muted"}">${escapeHtml(displayValue)}</strong>
                  ${value ? `<small>${escapeHtml(fullDisplayValue)}</small>` : ""}
                </div>`
          }`;
        })
        .join("");
      const sumSeconds = days.reduce((sum, day) => {
        const cell = row.cells?.find((item) => item.day === day.key) || { value: "" };
        return sum + scheduleValueSeconds(cell.value || "");
      }, 0);
      const initials = getInitialsByLogin(row.login, row.name);
      return `
        <article class="schedule-week-row">
          <div class="schedule-week-person">
            <span class="avatar team-avatar-${escapeHtml(slugifyLogin(row.login || row.name))}">${escapeHtml(initials)}</span>
            <strong>${escapeHtml(row.name)}</strong>
          </div>
          <div class="schedule-week-days">
            ${rowCells}
          </div>
          <div class="schedule-week-total">
            <strong>${escapeHtml(formatCompactWorkDuration(sumSeconds))}</strong>
          </div>
        </article>
      `;
    })
    .join("");
  $("#scheduleTable").innerHTML = `
    <div class="schedule-week-board schedule-reference-board">
      <div class="schedule-reference-row schedule-reference-head">
        <div>Osoba</div>
        ${headerCells}
        <div>Suma</div>
      </div>
      ${bodyRows}
    </div>
  `;
}

async function saveScheduleValue({ userLogin, day, weekStart, value }) {
  if (!backendAvailable || role !== "admin") return;
  try {
    const result = await apiRequest("/time/schedule", {
      method: "PATCH",
      body: JSON.stringify({ userLogin, day, value, weekStart }),
    });
    applyTimeSummary(result);
    showToast("Grafik zapisany", value ? scheduleDisplayValue(value) : "Komórka wyczyszczona.");
    return true;
  } catch (error) {
    showToast("Nie zapisano grafiku", error.message || "Backend odrzucił zmianę.");
    await syncTimeSummaryFromBackend({ silent: true });
    return false;
  }
}

async function saveScheduleCell(input) {
  const userLogin = input.dataset.scheduleUser;
  const day = input.dataset.scheduleDay;
  const weekStart = input.dataset.scheduleWeek || getScheduleWeekStart();
  const value = input.value.trim();
  input.disabled = true;
  try {
    await saveScheduleValue({ userLogin, day, weekStart, value });
  } finally {
    input.disabled = false;
  }
}

function updateScheduleEditorMode() {
  const mode = $("#scheduleEditorMode").value;
  const workFields = $("#scheduleEditorWorkFields");
  const startInput = $("#scheduleStartInput");
  const endInput = $("#scheduleEndInput");
  const isWork = mode === "work";
  workFields.classList.toggle("hidden", !isWork);
  startInput.required = isWork;
  endInput.required = isWork;
  if (!isWork) {
    startInput.value = "";
    endInput.value = "";
  }
}

function openScheduleEditor(button) {
  if (!button || role !== "admin") return;
  const value = button.dataset.scheduleValue || "";
  const parsed = parseScheduleValue(value);
  activeScheduleEdit = {
    userLogin: normalizeLogin(button.dataset.scheduleUser),
    userName: button.dataset.scheduleUserName || "",
    day: button.dataset.scheduleDay || "",
    weekStart: button.dataset.scheduleWeek || getScheduleWeekStart(),
  };
  $("#scheduleEditorTitle").textContent = activeScheduleEdit.userName || "Edytuj wpis";
  $("#scheduleEditorContext").textContent = button.dataset.scheduleLabel || "Grafik pracy";
  $("#scheduleEditorMode").value = parsed.mode;
  $("#scheduleStartInput").value = parsed.start || "08:00";
  $("#scheduleEndInput").value = parsed.end || "16:00";
  updateScheduleEditorMode();
  openDialog("#scheduleEditorDialog");
  window.setTimeout(() => {
    const focusTarget = parsed.mode === "work" ? $("#scheduleStartInput") : $("#scheduleEditorMode");
    focusTarget?.focus();
  }, 0);
}

function scheduleEditorValue() {
  const mode = $("#scheduleEditorMode").value;
  if (mode !== "work") return mode;
  const start = $("#scheduleStartInput").value;
  const end = $("#scheduleEndInput").value;
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (startMinutes === null || endMinutes === null) {
    showToast("Uzupełnij godziny", "Wybierz godzinę rozpoczęcia i zakończenia pracy.");
    return null;
  }
  if (endMinutes <= startMinutes) {
    showToast("Popraw godziny", "Godzina zakończenia musi być późniejsza niż rozpoczęcia.");
    return null;
  }
  return `${start}-${end}`;
}

async function saveScheduleEditor(event) {
  event.preventDefault();
  if (!activeScheduleEdit) return;
  const value = scheduleEditorValue();
  if (value === null) return;
  const saved = await saveScheduleValue({ ...activeScheduleEdit, value });
  if (saved) $("#scheduleEditorDialog").close();
}

async function clearScheduleEditor() {
  if (!activeScheduleEdit) return;
  const saved = await saveScheduleValue({ ...activeScheduleEdit, value: "" });
  if (saved) $("#scheduleEditorDialog").close();
}

function renderBulkSchedulePeople() {
  const box = $("#bulkSchedulePeople");
  if (!box) return;
  const source = timeSummary?.schedule?.rows?.length
    ? timeSummary.schedule.rows.map((row) => ({ login: row.login, name: row.name }))
    : activePeople();
  box.innerHTML = source
    .filter((person) => person.login && person.active !== false)
    .map(
      (person) => `
        <label>
          <input data-bulk-schedule-user type="checkbox" value="${escapeHtml(person.login)}" checked />
          <span>${escapeHtml(person.name)}</span>
        </label>
      `,
    )
    .join("");
}

function renderBulkScheduleDays() {
  const box = $("#bulkScheduleDays");
  if (!box) return;
  box.innerHTML = getRenderedScheduleDays()
    .map(
      (day) => `
        <label>
          <input data-bulk-schedule-day type="checkbox" value="${escapeHtml(day.key)}" checked />
          <span>${escapeHtml(day.date || day.label)} ${day.isoDate ? `<small>${escapeHtml(day.isoDate)}</small>` : ""}</span>
        </label>
      `,
    )
    .join("");
}

function updateBulkScheduleMode() {
  const mode = $("#bulkScheduleMode")?.value || "work";
  const workFields = $("#bulkScheduleWorkFields");
  const startInput = $("#bulkScheduleStartInput");
  const endInput = $("#bulkScheduleEndInput");
  const isWork = mode === "work";
  workFields?.classList.toggle("hidden", !isWork);
  if (startInput) startInput.required = isWork;
  if (endInput) endInput.required = isWork;
  if (!isWork) {
    if (startInput) startInput.value = "";
    if (endInput) endInput.value = "";
  }
}

function openBulkScheduleForm() {
  if (role !== "admin") return;
  const form = $("#bulkScheduleForm");
  form?.reset();
  const context = $("#bulkScheduleContext");
  if (context) context.textContent = `Grafik: ${formatScheduleWeekRange(getScheduleWeekStart())}`;
  renderBulkSchedulePeople();
  renderBulkScheduleDays();
  const mode = $("#bulkScheduleMode");
  const startInput = $("#bulkScheduleStartInput");
  const endInput = $("#bulkScheduleEndInput");
  if (mode) mode.value = "work";
  if (startInput) startInput.value = "08:00";
  if (endInput) endInput.value = "16:00";
  updateBulkScheduleMode();
  openDialog("#bulkScheduleDialog");
  window.setTimeout(() => startInput?.focus(), 0);
}

function selectedBulkScheduleLogins() {
  return $$("[data-bulk-schedule-user]:checked").map((input) => normalizeLogin(input.value)).filter(Boolean);
}

function selectedBulkScheduleDays() {
  return $$("[data-bulk-schedule-day]:checked").map((input) => input.value).filter(Boolean);
}

function bulkScheduleEditorValue() {
  const mode = $("#bulkScheduleMode")?.value || "work";
  if (mode !== "work") return mode;
  const start = $("#bulkScheduleStartInput")?.value || "";
  const end = $("#bulkScheduleEndInput")?.value || "";
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (startMinutes === null || endMinutes === null) {
    showToast("Uzupelnij godziny", "Wybierz godzine startu i konca pracy.");
    return null;
  }
  if (endMinutes <= startMinutes) {
    showToast("Popraw godziny", "Godzina konca musi byc pozniejsza niz start.");
    return null;
  }
  return `${start}-${end}`;
}

async function saveBulkScheduleValue(value) {
  if (!backendAvailable || role !== "admin") return false;
  const userLogins = selectedBulkScheduleLogins();
  const days = selectedBulkScheduleDays();
  if (!userLogins.length) {
    showToast("Wpis zbiorczy", "Wybierz co najmniej jedna osobe.");
    return false;
  }
  if (!days.length) {
    showToast("Wpis zbiorczy", "Wybierz co najmniej jeden dzien.");
    return false;
  }
  try {
    const result = await apiRequest("/time/schedule/bulk", {
      method: "PATCH",
      body: JSON.stringify({ weekStart: getScheduleWeekStart(), userLogins, days, value }),
    });
    applyTimeSummary(result);
    showToast(
      value ? "Grafik zapisany zbiorczo" : "Grafik wyczyszczony",
      `${userLogins.length} osob, ${days.length} dni.`,
    );
    return true;
  } catch (error) {
    showToast("Nie zapisano grafiku", error.message || "Backend odrzucil wpis zbiorczy.");
    await syncTimeSummaryFromBackend({ silent: true });
    return false;
  }
}

async function saveBulkScheduleForm(event) {
  event.preventDefault();
  const value = bulkScheduleEditorValue();
  if (value === null) return;
  const saved = await saveBulkScheduleValue(value);
  if (saved) $("#bulkScheduleDialog")?.close();
}

async function clearBulkScheduleForm() {
  const saved = await saveBulkScheduleValue("");
  if (saved) $("#bulkScheduleDialog")?.close();
}

async function copyPreviousScheduleWeek() {
  if (!backendAvailable || role !== "admin") return;
  const weekStart = getScheduleWeekStart();
  const confirmed = window.confirm(
    `Skopiowac grafik z poprzedniego tygodnia do ${formatScheduleWeekRange(
      weekStart,
    )}? Obecne wpisy w tym tygodniu zostana zastapione.`,
  );
  if (!confirmed) return;
  try {
    const result = await apiRequest("/time/schedule/copy-previous", {
      method: "POST",
      body: JSON.stringify({ weekStart }),
    });
    applyTimeSummary(result);
    showToast("Grafik skopiowany", `Skopiowano ${result.copiedCells || 0} wpisow z poprzedniego tygodnia.`);
  } catch (error) {
    showToast("Nie skopiowano grafiku", error.message || "Backend odrzucil kopiowanie.");
  }
}

async function setScheduleWeek(weekStart) {
  selectedScheduleWeekStart = formatDateInput(getWeekStartDate(localDateFromInput(weekStart) || getWeekStartDate()));
  renderSchedule();
  renderTimeWeekChart();
  renderTimeDayLog();
  if (backendAvailable && isLoggedIn()) {
    await syncTimeSummaryFromBackend({ silent: true, weekStart: selectedScheduleWeekStart });
  }
}

async function shiftScheduleWeek(weekDelta) {
  await setScheduleWeek(addWeeksToDateInput(getScheduleWeekStart(), weekDelta));
}

function visibleCalendarDate() {
  return new Date();
}

function normalizeCalendarDayValue(day) {
  const numericDay = Number(day);
  if (!Number.isInteger(numericDay) || numericDay < 1 || numericDay > 31) return null;
  return numericDay;
}

function calendarDayFromDateObject(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const visible = visibleCalendarDate();
  if (date.getFullYear() !== visible.getFullYear() || date.getMonth() !== visible.getMonth()) return null;
  return normalizeCalendarDayValue(date.getDate());
}

function calendarDayFromText(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const normalized = normalizeSearch(text);
  const today = visibleCalendarDate();
  if (["dzis", "dzisiaj"].includes(normalized)) return normalizeCalendarDayValue(today.getDate());
  if (normalized.includes("jutro")) return calendarDayFromDateObject(addDays(today, 1));

  const weekdayIndex = {
    pn: 0,
    pon: 0,
    poniedzialek: 0,
    wt: 1,
    wto: 1,
    wtorek: 1,
    sr: 2,
    sro: 2,
    sroda: 2,
    czw: 3,
    czwartek: 3,
    pt: 4,
    pia: 4,
    piatek: 4,
    sob: 5,
    sobota: 5,
    nd: 6,
    niedziela: 6,
  };
  const weekdayKey = Object.keys(weekdayIndex).find((key) => normalized === key || normalized.startsWith(`${key} `));
  if (weekdayKey) return calendarDayFromDateObject(addDays(getWeekStartDate(today), weekdayIndex[weekdayKey]));

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (isoMatch) {
    return calendarDayFromDateObject(new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])));
  }

  const shortDateMatch = /(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/.exec(text);
  if (shortDateMatch) {
    const visible = visibleCalendarDate();
    const yearPart = shortDateMatch[3];
    const year = yearPart ? Number(yearPart.length === 2 ? `20${yearPart}` : yearPart) : visible.getFullYear();
    return calendarDayFromDateObject(new Date(year, Number(shortDateMatch[2]) - 1, Number(shortDateMatch[1])));
  }

  const parsed = Date.parse(text.includes("T") ? text : text.replace(" ", "T"));
  return Number.isNaN(parsed) ? null : calendarDayFromDateObject(new Date(parsed));
}

function calendarDateLabelForDay(day) {
  const visible = visibleCalendarDate();
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit" }).format(
    new Date(visible.getFullYear(), visible.getMonth(), day),
  );
}

function calendarTimeSortValue(time) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(time || ""));
  if (!match) return 24 * 60;
  return Number(match[1]) * 60 + Number(match[2]);
}

function compactCalendarBody(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.length > 92 ? `${text.slice(0, 89)}...` : text;
}

function makeUnifiedCalendarItem(item) {
  const day =
    normalizeCalendarDayValue(item.day) ||
    calendarDayFromText(item.date) ||
    calendarDayFromText(item.due) ||
    calendarDayFromText(item.createdAt) ||
    normalizeCalendarDayValue(visibleCalendarDate().getDate());
  if (!day) return null;
  const source = calendarSourceMap[item.source] || calendarSourceMap.calendar;
  const time = item.time || "";
  return {
    id: item.id,
    sourceId: source.id,
    sourceLabel: source.label,
    sourceClass: source.className,
    nativeEventId: item.nativeEventId || "",
    feedId: item.feedId || "",
    day,
    dateLabel: item.dateLabel || calendarDateLabelForDay(day),
    time,
    title: item.title || source.label,
    body: compactCalendarBody(item.body),
    meta: item.meta || "",
    rsvp: item.rsvp || "",
    attendees: Number(item.attendees || 0),
    sortValue: day * 2000 + calendarTimeSortValue(time),
  };
}

function getUnifiedCalendarItems() {
  const taskItems = Object.entries(tasks).flatMap(([column, items]) =>
    (items || []).map((task) => ({ ...task, column })),
  );
  return [
    ...calendarEvents.map((event) =>
      makeUnifiedCalendarItem({
        source: "calendar",
        id: `calendar:${event.id}`,
        nativeEventId: event.id,
        feedId: `calendar:${event.id}`,
        day: event.day,
        date: event.date,
        dateLabel: event.date,
        time: event.time,
        title: event.title,
        body: `${event.attendees || 0} potwierdzeń · ${event.rsvp || "RSVP"}`,
        meta: event.rsvp || "RSVP",
        rsvp: event.rsvp,
        attendees: event.attendees,
        createdAt: event.createdAt,
      }),
    ),
    ...posts.map((post) =>
      makeUnifiedCalendarItem({
        source: "announcements",
        id: `post:${post.id}`,
        feedId: `post:${post.id}`,
        date: post.createdAt,
        title: post.title,
        body: post.body,
        meta: post.priority === "urgent" ? "Pilne ogłoszenie" : "Ogłoszenie",
        createdAt: post.createdAt,
      }),
    ),
    ...reports.map((report) =>
      makeUnifiedCalendarItem({
        source: "reports",
        id: `report:${report.id}`,
        feedId: `report:${report.id}`,
        date: report.updatedAt || report.createdAt,
        title: report.title,
        body: report.detail,
        meta: `${report.category} · ${report.status}`,
        createdAt: report.updatedAt || report.createdAt,
      }),
    ),
    ...taskItems.map((task) =>
      makeUnifiedCalendarItem({
        source: "tasks",
        id: `task:${task.id}`,
        feedId: `task:${task.id}`,
        due: task.due,
        date: task.due,
        title: task.title,
        body: task.description,
        meta: `${columnLabels[task.column] || "Zadania"} · ${task.owner} · termin: ${task.due}`,
        createdAt: task.createdAt,
      }),
    ),
    ...kbArticles.map((article) =>
      makeUnifiedCalendarItem({
        source: "knowledge",
        id: `knowledge:${article.id}`,
        feedId: `knowledge:${article.id}`,
        date: article.createdAt,
        title: article.title,
        body: article.detail,
        meta: article.fileName || article.type || "Dokument",
        createdAt: article.createdAt,
      }),
    ),
    ...inventoryItems.map((item) =>
      makeUnifiedCalendarItem({
        source: "inventory",
        id: `inventory:${item.id}`,
        feedId: `inventory:${item.id}`,
        date: item.updatedAt || item.createdAt,
        title: item.name,
        body: `${item.category} Â· ${item.location || "brak lokalizacji"}`,
        meta: `${inventoryStatus(item).label} Â· ${formatInventoryNumber(item.quantity)} ${item.unit}`,
        createdAt: item.updatedAt || item.createdAt,
      }),
    ),
    ...requests.filter((request) => request.kind !== "correction").map((request) =>
      makeUnifiedCalendarItem({
        source: request.kind === "leave" ? "leaves" : "time",
        id: `request:${request.id}`,
        feedId: `request:${request.id}`,
        date: request.updatedAt || request.createdAt,
        title: request.title,
        body: request.detail,
        meta: request.status,
        createdAt: request.updatedAt || request.createdAt,
      }),
    ),
  ]
    .filter(Boolean)
    .sort((a, b) => a.sortValue - b.sortValue || a.sourceLabel.localeCompare(b.sourceLabel) || a.title.localeCompare(b.title));
}

function renderCalendarLegend(items) {
  const legend = $("#calendarLegend");
  if (!legend) return;
  const activeSources = items.reduce((counts, item) => {
    counts.set(item.sourceId, (counts.get(item.sourceId) || 0) + 1);
    return counts;
  }, new Map());
  legend.innerHTML = calendarSources
    .filter((source) => activeSources.has(source.id))
    .map((source) => {
      const hidden = hiddenCalendarSourceIds.has(source.id);
      return `<button class="calendar-legend-item ${source.className} ${hidden ? "is-hidden" : ""}" type="button" data-calendar-source-filter="${escapeHtml(
        source.id,
      )}" aria-pressed="${hidden ? "false" : "true"}" title="${hidden ? "Pokaż" : "Ukryj"}: ${escapeHtml(
        source.label,
      )}">${escapeHtml(source.label)} <small>${activeSources.get(source.id)}</small></button>`;
    })
    .join("");
}

function toggleCalendarSourceFilter(sourceId) {
  const source = calendarSourceMap[sourceId];
  if (!source) return;
  if (hiddenCalendarSourceIds.has(sourceId)) {
    hiddenCalendarSourceIds.delete(sourceId);
  } else {
    hiddenCalendarSourceIds.add(sourceId);
  }
  renderCalendar();
}

function calendarEntryCountLabel(count) {
  if (count === 1) return "1 wpis";
  if (count > 1 && count < 5) return `${count} wpisy`;
  return `${count} wpisów`;
}

function calendarVisibleItems() {
  return getUnifiedCalendarItems().filter((item) => !hiddenCalendarSourceIds.has(item.sourceId));
}

function renderCalendarDayDetailItem(event) {
  return `
    <article class="calendar-day-detail-card ${event.sourceClass}">
      <header>
        <span>${escapeHtml(event.sourceLabel)}</span>
        <strong>${escapeHtml(event.title)}</strong>
      </header>
      <div class="calendar-day-detail-meta">
        <span>${escapeHtml(event.dateLabel)}${event.time ? `, ${escapeHtml(event.time)}` : ""}</span>
        ${event.meta ? `<span>${escapeHtml(event.meta)}</span>` : ""}
      </div>
      ${event.body ? `<p>${escapeHtml(event.body)}</p>` : ""}
      <div class="calendar-event-actions">
        ${
          event.nativeEventId
            ? `<button class="secondary-button" data-rsvp="${escapeHtml(event.nativeEventId)}" type="button" ${
                event.rsvp === "Będę" ? "disabled" : ""
              }>${event.rsvp === "Będę" ? "Potwierdzono" : "Będę"}</button>`
            : ""
        }
        ${event.feedId ? `<button class="secondary-button" data-calendar-day-source="${escapeHtml(event.feedId)}" type="button">Przejdź do źródła</button>` : ""}
      </div>
    </article>
  `;
}

function renderCalendarDayDetails(day) {
  const safeDay = normalizeCalendarDayValue(day);
  if (!safeDay) return;
  activeCalendarDay = safeDay;
  const allItems = getUnifiedCalendarItems().filter((item) => item.day === safeDay);
  const visibleItems = allItems.filter((item) => !hiddenCalendarSourceIds.has(item.sourceId));
  const title = $("#calendarDayTitle");
  const meta = $("#calendarDayMeta");
  const list = $("#calendarDayList");
  if (title) title.textContent = `${calendarDateLabelForDay(safeDay)} · szczegóły dnia`;
  if (meta) {
    meta.textContent = visibleItems.length
      ? `${calendarEntryCountLabel(visibleItems.length)} widocznych w kalendarzu.`
      : allItems.length
        ? "Wpisy z tego dnia są ukryte przez filtry legendy."
        : "Tego dnia nie ma jeszcze żadnych wpisów.";
  }
  if (list) {
    list.innerHTML = visibleItems.length
      ? visibleItems.map(renderCalendarDayDetailItem).join("")
      : `<div class="empty-state">${allItems.length ? "Kliknij wyłączony kolor w legendzie, aby przywrócić wpisy." : "Brak wpisów dla tego dnia."}</div>`;
  }
}

function openCalendarDayDetails(day) {
  renderCalendarDayDetails(day);
  openDialog("#calendarDayDialog");
}

function renderCalendar() {
  calendarEvents = calendarEvents.map(normalizeCalendarEvent).sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  const allUnifiedItems = getUnifiedCalendarItems();
  const unifiedItems = calendarVisibleItems();
  $("#calendarGrid").innerHTML = Array.from({ length: 31 }, (_, index) => {
    const day = index + 1;
    const dayEvents = unifiedItems.filter((item) => item.day === day);
    const hiddenCount = Math.max(0, dayEvents.length - 4);
    return `
      <button class="calendar-day ${dayEvents.length ? "has-events" : ""}" data-calendar-day="${day}" type="button" aria-label="${escapeHtml(
        `${calendarDateLabelForDay(day)}: ${calendarEntryCountLabel(dayEvents.length)}`,
      )}">
        <span class="calendar-day-head">
          <strong>${day}</strong>
          <small>${escapeHtml(calendarEntryCountLabel(dayEvents.length))}</small>
        </span>
        ${dayEvents
          .slice(0, 4)
          .map(
            (event) =>
              `<span class="event-chip ${event.sourceClass}" title="${escapeHtml(
                `${event.sourceLabel}: ${event.title}`,
              )}"><em>${escapeHtml(event.sourceLabel)}</em>${escapeHtml(event.title)}</span>`,
          )
          .join("")}
        ${hiddenCount ? `<span class="event-chip muted-chip">+${hiddenCount} więcej</span>` : ""}
      </button>
    `;
  }).join("");

  renderCalendarLegend(allUnifiedItems);

  $("#eventList").innerHTML = unifiedItems.length
    ? unifiedItems
        .map(
          (event) => `
            <article class="calendar-list-item ${event.sourceClass}">
              <strong>${escapeHtml(event.title)}</strong>
              <span>${escapeHtml(event.sourceLabel)} · ${escapeHtml(event.dateLabel)}${
                event.time ? `, ${escapeHtml(event.time)}` : ""
              }${event.meta ? ` · ${escapeHtml(event.meta)}` : ""}</span>
              ${event.body ? `<p>${escapeHtml(event.body)}</p>` : ""}
              <div class="calendar-event-actions">
                ${
                  event.nativeEventId
                    ? `<button class="secondary-button" data-rsvp="${escapeHtml(event.nativeEventId)}" type="button" ${
                        event.rsvp === "Będę" ? "disabled" : ""
                      }>${event.rsvp === "Będę" ? "Potwierdzono" : "Będę"}</button>`
                    : ""
                }
                ${event.feedId ? `<button class="secondary-button" data-feed-source="${escapeHtml(event.feedId)}" type="button">Przejdź</button>` : ""}
              </div>
            </article>
          `,
        )
        .join("")
    : allUnifiedItems.length
      ? `<div class="empty-state">Wybrane typy wpisów są teraz ukryte w legendzie.</div>`
      : `<div class="empty-state">Brak wydarzeń w kalendarzu.</div>`;
  renderDashboardUpcoming();
  if ($("#calendarDayDialog")?.open && activeCalendarDay) renderCalendarDayDetails(activeCalendarDay);
}

function dashboardUpcomingDateParts(event) {
  const visible = visibleCalendarDate();
  const day = normalizeCalendarDayValue(event.day) || visible.getDate();
  const date = new Date(visible.getFullYear(), visible.getMonth(), day);
  const month = new Intl.DateTimeFormat("pl-PL", { month: "short" })
    .format(date)
    .replace(".", "")
    .toUpperCase();
  return {
    day: String(day).padStart(2, "0"),
    month,
  };
}

function dashboardUpcomingMeta(event) {
  const details = [];
  if (event.time) details.push(event.time);
  if (event.meta) details.push(event.meta);
  else if (event.body) details.push(event.body);
  else if (event.sourceLabel) details.push(event.sourceLabel.toLowerCase());
  return details.join(" · ");
}

function renderDashboardUpcoming() {
  const list = $("#dashboardUpcomingList");
  if (!list) return;
  const todayDay = normalizeCalendarDayValue(visibleCalendarDate().getDate()) || 1;
  const upcoming = getUnifiedCalendarItems()
    .filter((event) => event.day >= todayDay)
    .slice(0, 3);
  list.innerHTML = upcoming.length
    ? upcoming
        .map(
          (event) => {
            const date = dashboardUpcomingDateParts(event);
            const meta = dashboardUpcomingMeta(event);
            return `<li class="source-upcoming-item">
              <time class="source-upcoming-date" datetime="${escapeHtml(event.dateLabel || "")}">
                <strong>${escapeHtml(date.day)}</strong>
                <span>${escapeHtml(date.month)}</span>
              </time>
              <span class="source-upcoming-copy">
                <strong>${escapeHtml(event.title)}</strong>
                <small>${escapeHtml(meta || event.sourceLabel || "")}</small>
              </span>
            </li>`;
          },
        )
        .join("")
    : `<li class="empty-state">Brak nadchodzących wydarzeń.</li>`;
}

function leaveRequests() {
  normalizeRequests();
  return requests.filter((request) => request.kind === "leave");
}

function correctionRequests() {
  normalizeRequests();
  return requests.filter((request) => request.kind === "correction");
}

function timeInputMinutes(value = "") {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(value || "").trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function formatTimeInputFromDate(date = new Date()) {
  const roundedMinutes = Math.floor(date.getMinutes() / 5) * 5;
  return `${String(date.getHours()).padStart(2, "0")}:${String(roundedMinutes).padStart(2, "0")}`;
}

function correctionDurationMinutes(start = "", end = "") {
  const startMinutes = timeInputMinutes(start);
  const endMinutes = timeInputMinutes(end);
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return 0;
  return endMinutes - startMinutes;
}

function parseCorrectionDetail(detail = "") {
  const text = String(detail || "");
  const dateMatch = /(\d{4}-\d{2}-\d{2})/.exec(text);
  const timeMatch = /([01]?\d|2[0-3]):([0-5]\d)\s*[-–—]\s*([01]?\d|2[0-3]):([0-5]\d)/.exec(text);
  const breakMatch = /Przerwa\s+(\d{1,4})\s*min/i.exec(text);
  const reasonMatch = /Powód:\s*(.+)$/i.exec(text);
  return {
    date: dateMatch?.[1] || "",
    start: timeMatch ? `${String(Number(timeMatch[1])).padStart(2, "0")}:${timeMatch[2]}` : "",
    end: timeMatch ? `${String(Number(timeMatch[3])).padStart(2, "0")}:${timeMatch[4]}` : "",
    breakMinutes: breakMatch ? Number(breakMatch[1]) || 0 : 0,
    reason: reasonMatch?.[1]?.trim() || "",
    raw: text,
  };
}

function correctionDetailText({ date, start, end, breakMinutes, reason }) {
  const safeBreak = Math.max(0, Number(breakMinutes) || 0);
  const safeReason = String(reason || "").trim();
  return `Korekta czasu · ${date} · ${start}-${end} · Przerwa ${safeBreak} min${safeReason ? ` · Powód: ${safeReason}` : ""}`;
}

function correctionSummaryHtml(request) {
  const detail = parseCorrectionDetail(request.detail);
  if (!detail.date || !detail.start || !detail.end) {
    return `<span class="muted">${escapeHtml(request.detail)}</span>`;
  }
  const breakLabel = detail.breakMinutes ? `${detail.breakMinutes} min` : "brak";
  return `
    <div class="correction-summary">
      <div><span>Data</span><strong>${escapeHtml(formatScheduleDate(detail.date))}</strong></div>
      <div><span>Godziny</span><strong>${escapeHtml(`${detail.start}-${detail.end}`)}</strong></div>
      <div><span>Przerwa</span><strong>${escapeHtml(breakLabel)}</strong></div>
      <div><span>Pracownik</span><strong>${escapeHtml(request.owner || getDisplayNameByLogin(request.ownerLogin) || "-")}</strong></div>
    </div>
    ${detail.reason ? `<p class="correction-reason">${escapeHtml(detail.reason)}</p>` : ""}
  `;
}

function openCorrectionForm() {
  const form = $("#correctionForm");
  if (!form) return;
  form.reset();
  const dateInput = $("#correctionDateInput");
  const startInput = $("#correctionStartInput");
  const endInput = $("#correctionEndInput");
  const breakInput = $("#correctionBreakInput");
  const reasonInput = $("#correctionReasonInput");
  const latestLog = Array.isArray(timeSummary?.personal?.dayLog) ? timeSummary.personal.dayLog.at(-1) : null;
  const now = new Date();
  if (dateInput) dateInput.value = formatDateInput(now);
  if (startInput) startInput.value = latestLog?.start || "08:00";
  if (endInput) {
    const proposedEnd = latestLog?.end || formatTimeInputFromDate(now);
    endInput.value = correctionDurationMinutes(startInput?.value, proposedEnd) ? proposedEnd : "16:00";
  }
  if (breakInput) breakInput.value = String(Math.max(0, Math.floor(Number(latestLog?.breakSeconds || 0) / 60)));
  if (reasonInput) reasonInput.value = "";
  openDialog("#correctionFormDialog");
  window.setTimeout(() => dateInput?.focus(), 50);
}

async function createCorrectionRequest(event) {
  event.preventDefault();
  const date = $("#correctionDateInput")?.value || "";
  const start = $("#correctionStartInput")?.value || "";
  const end = $("#correctionEndInput")?.value || "";
  const breakMinutes = Math.max(0, Number($("#correctionBreakInput")?.value || 0) || 0);
  const reason = $("#correctionReasonInput")?.value.trim() || "";
  const duration = correctionDurationMinutes(start, end);
  if (!date || !duration) {
    showToast("Uzupełnij korektę", "Podaj datę oraz poprawny zakres godzin.");
    return;
  }
  if (breakMinutes >= duration) {
    showToast("Sprawdź przerwę", "Przerwa musi być krótsza niż cały czas pracy.");
    return;
  }
  const title = `Korekta czasu: ${getActiveName()}`;
  const detail = correctionDetailText({ date, start, end, breakMinutes, reason });
  if (backendAvailable) {
    try {
      const result = await apiRequest("/requests", {
        method: "POST",
        body: JSON.stringify({ kind: "correction", title, detail }),
      });
      applyRequestSnapshot(result);
      renderRequestState();
      $("#correctionFormDialog")?.close();
      $("#correctionForm")?.reset();
      pushNotification("Korekta czasu", "Nowa korekta czeka na decyzję.", { view: "time" });
      showToast("Korekta wysłana", "Admin może ją zaakceptować i zapisać w czasie pracy.");
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
    owner: getActiveName(),
    ownerLogin: getActiveLogin(),
    createdAt: "teraz",
  });
  saveRequestsState();
  $("#correctionFormDialog")?.close();
  $("#correctionForm")?.reset();
  renderRequestState();
  applyRole();
  pushNotification("Korekta czasu", "Nowa korekta czeka na decyzję.", { view: "time" });
  showToast("Korekta wysłana", "Trafiła do listy wniosków i korekt.");
  activateView("time");
}

function leaveStatusClass(status = "") {
  if (status === "Zaakceptowane") return "s-ok";
  if (status === "Odrzucone") return "s-new";
  return "s-todo";
}

function leaveStatusLabel(status = "") {
  if (status === "Zaakceptowane") return "Zatwierdzony";
  if (status === "Odrzucone") return "Odrzucony";
  return status || "Oczekuje";
}

function leaveAvatarClass(login = "", name = "") {
  const slug = slugifyLogin(login || name);
  return slug ? `leave-avatar-${slug}` : "leave-avatar-default";
}

function parseLeaveDetail(detail = "") {
  const text = String(detail || "").trim();
  const match = /^(\d{4}-\d{2}-\d{2})-(\d{4}-\d{2}-\d{2})(?:\s*·\s*(.*))?$/.exec(text);
  if (!match) {
    const parts = text.split("·").map((part) => part.trim()).filter(Boolean);
    return {
      from: "",
      to: "",
      type: parts[0] || "Urlop",
      comment: parts.slice(1).join(" · "),
      term: parts[0] || "-",
      days: 0,
    };
  }
  const from = match[1];
  const to = match[2];
  const rest = (match[3] || "").split("·").map((part) => part.trim()).filter(Boolean);
  const startDate = localDateFromInput(from);
  const endDate = localDateFromInput(to);
  const days = startDate && endDate
    ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1)
    : 0;
  return {
    from,
    to,
    type: rest[0] || "Urlop",
    comment: rest.slice(1).join(" · "),
    term: `${formatScheduleDate(from)} – ${formatScheduleDate(to)}`,
    days,
  };
}

function renderLeaveStats(source = leaveRequests()) {
  const mine = source.filter((request) => request.ownerLogin === getActiveLogin() || request.owner === getActiveName());
  const accepted = mine.filter((request) => request.status === "Zaakceptowane");
  const usedDays = accepted.reduce((sum, request) => sum + parseLeaveDetail(request.detail).days, 0);
  const pending = source.filter((request) => request.status === "Oczekuje").length;
  const onDemandDays = mine
    .filter((request) => parseLeaveDetail(request.detail).type.toLowerCase().includes("żądanie"))
    .filter((request) => request.status !== "Odrzucone")
    .reduce((sum, request) => sum + parseLeaveDetail(request.detail).days, 0);
  const availableDays = Math.max(0, 26 - usedDays);
  const setText = (selector, value) => {
    const node = $(selector);
    if (node) node.textContent = String(value);
  };
  setText("#leaveAvailableDays", availableDays);
  setText("#leaveUsedDays", usedDays);
  setText("#leavePendingCount", pending);
  setText("#leaveOnDemandDays", Math.min(4, onDemandDays));
  const note = $("#leaveAvailableNote");
  if (note) note.textContent = `z 26 · ${getActiveName()}`;
}

function renderLeaves() {
  const list = $("#leaveRequestList");
  if (!list) return;
  const allLeaves = leaveRequests();
  renderLeaveStats(allLeaves);
  const visibleLeaves = allLeaves.filter((request) => {
    if (currentLeaveFilter === "pending") return request.status === "Oczekuje";
    if (currentLeaveFilter === "mine") return request.ownerLogin === getActiveLogin() || request.owner === getActiveName();
    return true;
  });
  list.innerHTML = visibleLeaves.length
    ? visibleLeaves
        .map((request) => {
          const detail = parseLeaveDetail(request.detail);
          const ownerName = request.owner || getDisplayNameByLogin(request.ownerLogin) || "Pracownik";
          const avatarClass = leaveAvatarClass(request.ownerLogin, ownerName);
          const actionButtons = request.status === "Oczekuje"
            ? `<div class="leave-row-actions">
                <button class="mini admin-widget" data-request-action="approve" data-request-id="${escapeHtml(
                  request.id,
                )}" type="button">Akceptuj</button>
                <button class="mini admin-widget leave-reject-button" data-request-action="reject" data-request-id="${escapeHtml(
                  request.id,
                )}" type="button">Odrzuć</button>
              </div>`
            : "";
          return `
            <tr>
              <td><div class="who"><div class="av ${escapeHtml(avatarClass)}">${escapeHtml(
                getInitialsByLogin(request.ownerLogin, ownerName),
              )}</div>${escapeHtml(ownerName)}</div></td>
              <td>${escapeHtml(detail.type)}</td>
              <td>
                <strong>${escapeHtml(detail.term)}</strong>
                ${detail.comment ? `<span class="muted">${escapeHtml(detail.comment)}</span>` : ""}
              </td>
              <td>${escapeHtml(detail.days || "-")}</td>
              <td><span class="state ${leaveStatusClass(request.status)}">${escapeHtml(leaveStatusLabel(request.status))}</span></td>
              <td>${actionButtons}</td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="6"><div class="empty-state">Brak wniosków urlopowych w tym widoku.</div></td></tr>`;

  $$("[data-leave-filter]").forEach((button) => {
    button.classList.toggle("on", button.dataset.leaveFilter === currentLeaveFilter);
  });
}

function renderRequests() {
  normalizeRequests();
  const requestList = $("#requestList");
  if (requestList) {
    const corrections = correctionRequests();
    requestList.innerHTML = corrections.length
      ? corrections
          .map(
            (request) => `
        <article class="request-card correction-request-card ${requestNeedsDecision(request) ? "" : "resolved"}">
          <div class="card-line">
            <strong>${request.title}</strong>
            <span class="pill amber">${request.status}</span>
          </div>
          ${correctionSummaryHtml(request)}
          ${
            requestNeedsDecision(request)
              ? `<div class="card-actions admin-widget">
                  <button class="secondary-button" data-request-action="approve" data-request-id="${escapeHtml(request.id)}" type="button">Zastosuj korektę</button>
                  <button class="secondary-button" data-request-action="reject" data-request-id="${escapeHtml(request.id)}" type="button">Odrzuć</button>
                </div>`
              : ""
          }
        </article>
      `,
          )
          .join("")
      : `<div class="empty-state">Brak korekt czasu do pokazania.</div>`;
  }
  renderLeaves();
  renderDecisions();
  renderNotifications();
}

function reportIsClosed(report) {
  return report.status === "Załatwione";
}

function reportIsAccepted(report) {
  return report.status === "Przyjęte";
}

function reportStatusColor(report) {
  if (report.status === "Nowe") return "red";
  if (reportIsClosed(report)) return "green";
  return "teal";
}

function reportCategoryAccent(report) {
  const category = normalizeSearch(report.category);
  if (category.includes("braki") || category.includes("towar")) return "is-stock";
  if (category.includes("awaria") || category.includes("sprzet")) return "is-equipment";
  if (category.includes("organiz")) return "is-company";
  return "is-general";
}

function reportStateAccent(report) {
  if (reportIsClosed(report)) return "is-done";
  if (reportIsAccepted(report)) return "is-accepted";
  return "is-new";
}

function reportPriorityAccent(report) {
  if (report.priority === "urgent") return "is-priority-urgent";
  if (report.priority === "important") return "is-priority-important";
  return "is-priority-normal";
}

function reportDisplayTitle(report) {
  const title = String(report.title || "").trim();
  const category = String(report.category || "").trim();
  if (title && title !== category) return title;
  const firstLine = String(report.detail || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (!firstLine) return title || category || "Zgłoszenie";
  return firstLine.length > 74 ? `${firstLine.slice(0, 71).trim()}...` : firstLine;
}

function renderReports() {
  normalizeReports();
  const visibleReports = reports
    .map((report) => ({ report }))
    .filter(({ report }) => {
      if (currentReportFilter === "mine") return report.ownerLogin === getActiveLogin() || report.owner === getActiveName();
      if (currentReportFilter === "closed") return reportIsClosed(report);
      return true;
    })
    .sort(({ report: first }, { report: second }) => {
      if (currentReportFilter === "closed") return 0;
      return Number(reportIsClosed(first)) - Number(reportIsClosed(second));
    });

  $("#reportList").innerHTML = visibleReports
    .map(({ report }) => {
      const fileMeta = [report.fileName, report.fileSize ? formatFileSize(report.fileSize) : ""].filter(Boolean).join(" · ");
      const isClosed = reportIsClosed(report);
      const reportComments = normalizeEntityComments(report.comments);
      const commentsCount = reportComments.length;
      const commentsOpen = String(openReportCommentId) === String(report.id);
      const actions = isClosed
        ? `
            <button class="secondary-button" data-report-reopen="${report.id}" type="button">Cofnij</button>
            <button class="secondary-button danger-button" data-report-delete="${report.id}" type="button">Usuń</button>
          `
        : `
            <button class="secondary-button admin-widget" data-report-task="${report.id}" type="button">Utwórz zadanie</button>
            <button class="secondary-button" data-report-accept="${report.id}" type="button" ${reportIsAccepted(report) ? "disabled" : ""}>${reportIsAccepted(report) ? "Przyjęte" : "Przyjmij"}</button>
            <button class="secondary-button" data-report-close="${report.id}" type="button">Oznacz załatwione</button>
          `;
      return `
        <article class="report-card report-item ${isClosed ? "is-complete" : ""} ${reportIsAccepted(report) ? "is-accepted" : ""} ${reportPriorityAccent(report)}">
          <div class="report-item-top">
            <span class="report-tag ${reportCategoryAccent(report)}">${escapeHtml(report.category)}</span>
            <span class="report-state ${reportStateAccent(report)}">${escapeHtml(report.status)}</span>
            <span class="report-time">${escapeHtml(activityTimeLabel(report.updatedAt || report.createdAt, report.createdAt || "teraz"))}</span>
          </div>
          <h3>${escapeHtml(reportDisplayTitle(report))}</h3>
          <p class="report-detail">${escapeHtml(report.detail)}</p>
          <div class="report-sub">Zgłosił: ${escapeHtml(report.owner)}</div>
          ${
            report.fileName
              ? `<div class="report-attachment">
                  <span class="pill">${escapeHtml(fileIcon(report.fileMime, report.fileName))}</span>
                  <span>${escapeHtml(fileMeta)}</span>
                  ${
                    report.fileUrl
                      ? `<a class="secondary-button" href="${escapeHtml(report.fileUrl)}" target="_blank" rel="noopener">Otwórz załącznik</a>`
                      : `<span class="muted">Brak pliku na serwerze</span>`
                  }
                </div>`
              : ""
          }
          <div class="entity-social-row report-social-row">
            ${renderEntityReactionButtons(report.reactions, "report", report.id)}
            <button class="entity-comment-button report-comment-count ${commentsOpen ? "is-open" : ""}" data-report-comment="${escapeHtml(
              report.id,
            )}" type="button" aria-expanded="${commentsOpen ? "true" : "false"}" title="Dodaj komentarz">&#128172; ${commentsCount}</button>
          </div>
          <section class="comment-section report-comment-section ${commentsOpen ? "is-open" : ""}">
            <div class="comment-section-header">
              <h4>Komentarze</h4>
              <span class="pill">${commentsCount}</span>
            </div>
            <div class="comment-list">${renderEntityComments(reportComments, "Brak komentarzy do zgłoszenia.")}</div>
            <form class="comment-form" data-report-comment-form="${escapeHtml(report.id)}">
              <input name="body" type="text" placeholder="Dodaj komentarz do zgłoszenia" required />
              <button class="secondary-button" type="submit">Dodaj</button>
            </form>
          </section>
          <div class="card-actions report-actions">
            ${actions}
          </div>
        </article>
      `;
    })
    .join("");
  renderDecisions();
  renderStats();
  renderNotifications();
}

function statPercent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / total) * 100);
}

function statsPeopleSource() {
  const source = timeSummary?.people?.length ? timeSummary.people : activePeople();
  return source.filter((person) => person.active !== false);
}

function statsWorkSeconds(person, range) {
  if (!person) return 0;
  if (range === "today") return Number(person.todaySeconds || person.scheduledTodaySeconds || 0);
  if (range === "week") return Math.max(Number(person.weekSeconds || 0), Number(person.scheduledWeekSeconds || 0));
  if (range === "month") return Math.max(Number(person.monthSeconds || 0), Number(person.scheduledMonthSeconds || 0));
  return 0;
}

function monthShortLabel(date) {
  return new Intl.DateTimeFormat("pl-PL", { month: "short" }).format(date).replace(".", "");
}

function buildStatsActivityBuckets(peopleStats = statsPeopleSource()) {
  const today = new Date();
  const buckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (6 - index));
    return {
      key: formatDateInput(date),
      label: new Intl.DateTimeFormat("pl-PL", { weekday: "short" }).format(date),
      seconds: 0,
      hours: 0,
    };
  });
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  const schedule = timeSummary?.schedule || {};
  const dayDateByKey = new Map((schedule.days || []).map((day) => [day.key, day.isoDate || ""]));
  (schedule.rows || []).forEach((row) => {
    (row.cells || []).forEach((cell) => {
      const isoDate = dayDateByKey.get(cell.day);
      const bucket = byKey.get(isoDate);
      if (!bucket) return;
      bucket.seconds += scheduleValueSeconds(cell.value || "");
    });
  });

  const todayKey = formatDateInput(today);
  const todayBucket = byKey.get(todayKey);
  if (todayBucket) {
    const todaySeconds = peopleStats.reduce((sum, person) => sum + statsWorkSeconds(person, "today"), 0);
    todayBucket.seconds = Math.max(todayBucket.seconds, todaySeconds);
  }

  buckets.forEach((bucket) => {
    bucket.hours = Number((bucket.seconds / 3600).toFixed(1));
  });
  return buckets;
}

function statsMonthKeyFromValue(value, fallback) {
  const timestamp = typeof value === "number" ? value : activitySortValue(value, fallback);
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildStatsTrendBuckets(taskItems = [], peopleStats = statsPeopleSource()) {
  const today = new Date();
  const buckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: monthShortLabel(date),
      tasks: 0,
      attendance: 0,
      activeUsers: new Set(),
    };
  });
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  const now = Date.now();
  taskItems.forEach((task, index) => {
    const key = statsMonthKeyFromValue(task.updatedAt || task.createdAt, now - index * 3600000);
    const bucket = byKey.get(key);
    if (!bucket) return;
    bucket.tasks += 1;
    const ownerLogin = normalizeLogin(task.ownerLogin || "");
    if (ownerLogin) bucket.activeUsers.add(ownerLogin);
  });
  buildActivityFeedItems().forEach((item) => {
    const key = statsMonthKeyFromValue(item.sortValue, now);
    const bucket = byKey.get(key);
    if (!bucket) return;
    const actorLogin = normalizeLogin(item.actorLogin || "");
    if (actorLogin) bucket.activeUsers.add(actorLogin);
  });

  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const activeCount = Math.max(1, peopleStats.length);
  const currentActualSeconds = peopleStats.reduce((sum, person) => sum + statsWorkSeconds(person, "month"), 0);
  const currentScheduledSeconds = peopleStats.reduce(
    (sum, person) => sum + Number(person.scheduledMonthSeconds || 0),
    0,
  );
  const currentAttendance = currentScheduledSeconds
    ? Math.min(100, statPercent(currentActualSeconds, currentScheduledSeconds))
    : statPercent(peopleStats.filter((person) => person.state === "work" || person.state === "break").length, peopleStats.length);
  buckets.forEach((bucket) => {
    const activityAttendance = statPercent(bucket.activeUsers.size, activeCount);
    bucket.tasks = Math.round(bucket.tasks);
    bucket.attendance = bucket.key === currentMonthKey ? Math.max(activityAttendance, currentAttendance) : activityAttendance;
    delete bucket.activeUsers;
  });
  return buckets;
}

function statsNiceMax(value, step = 5, minimum = step) {
  return Math.max(minimum, Math.ceil((Number(value) || 0) / step) * step);
}

function statsPoint(value, max, index, total, width, height, padding) {
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const x = padding.left + (total <= 1 ? plotWidth / 2 : (plotWidth / (total - 1)) * index);
  const y = padding.top + plotHeight - (Math.max(0, Number(value) || 0) / Math.max(1, max)) * plotHeight;
  return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
}

function statsLinePath(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  const command = [`M ${points[0].x} ${points[0].y}`];
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] || points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    command.push(
      `C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x} ${p2.y}`,
    );
  }
  return command.join(" ");
}

function statsAreaPath(points, height, padding) {
  if (!points.length) return "";
  const bottom = height - padding.bottom;
  const body = points.map((point) => `L ${point.x} ${point.y}`).join(" ");
  return `M ${points[0].x} ${bottom} ${body} L ${points[points.length - 1].x} ${bottom} Z`;
}

function renderStatsActivityLineChart(buckets) {
  const width = 1040;
  const height = 270;
  const padding = { top: 24, right: 22, bottom: 34, left: 38 };
  const maxHours = statsNiceMax(Math.max(...buckets.map((bucket) => bucket.hours), 0), 5, 5);
  const points = buckets.map((bucket, index) => statsPoint(bucket.hours, maxHours, index, buckets.length, width, height, padding));
  const gridLines = Array.from({ length: 6 }, (_, index) => {
    const value = maxHours - (maxHours / 5) * index;
    const y = padding.top + ((height - padding.top - padding.bottom) / 5) * index;
    return `
      <line class="stats-chart-grid" x1="${padding.left}" x2="${width - padding.right}" y1="${y}" y2="${y}" />
      <text class="stats-axis-label" x="${padding.left - 9}" y="${y + 4}" text-anchor="end">${Number(value.toFixed(0))}</text>
    `;
  }).join("");
  return `
    <svg class="stats-line-chart stats-activity-line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Godziny pracy firmy z ostatnich 7 dni">
      <g>${gridLines}</g>
      <path class="stats-line-area" d="${statsAreaPath(points, height, padding)}"></path>
      <path class="stats-line-path stats-line-primary" pathLength="1" d="${statsLinePath(points)}"></path>
      ${points
        .map(
          (point, index) => `
            <circle class="stats-line-dot stats-line-dot-primary" cx="${point.x}" cy="${point.y}" r="4.5">
              <title>${escapeHtml(buckets[index].label)}: ${buckets[index].hours}h</title>
            </circle>
          `,
        )
        .join("")}
      ${buckets
        .map((bucket, index) => {
          const point = points[index];
          return `<text class="stats-x-label" x="${point.x}" y="${height - 7}" text-anchor="middle">${escapeHtml(bucket.label)}</text>`;
        })
        .join("")}
    </svg>
  `;
}

function renderStatsTrendLineChart(buckets) {
  const width = 1040;
  const height = 270;
  const padding = { top: 45, right: 40, bottom: 34, left: 38 };
  const maxTasks = statsNiceMax(Math.max(...buckets.map((bucket) => bucket.tasks), 0), 5, 5);
  const taskPoints = buckets.map((bucket, index) => statsPoint(bucket.tasks, maxTasks, index, buckets.length, width, height, padding));
  const attendancePoints = buckets.map((bucket, index) =>
    statsPoint(bucket.attendance, 100, index, buckets.length, width, height, padding),
  );
  const gridLines = Array.from({ length: 5 }, (_, index) => {
    const leftValue = maxTasks - (maxTasks / 4) * index;
    const rightValue = 100 - 5 * index;
    const y = padding.top + ((height - padding.top - padding.bottom) / 4) * index;
    return `
      <line class="stats-chart-grid" x1="${padding.left}" x2="${width - padding.right}" y1="${y}" y2="${y}" />
      <text class="stats-axis-label" x="${padding.left - 9}" y="${y + 4}" text-anchor="end">${Number(leftValue.toFixed(0))}</text>
      <text class="stats-axis-label" x="${width - padding.right + 9}" y="${y + 4}" text-anchor="start">${Number(rightValue.toFixed(0))}</text>
    `;
  }).join("");
  return `
    <svg class="stats-line-chart stats-trend-line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Trend zadań i frekwencji z ostatnich 6 miesięcy">
      <g class="stats-chart-legend">
        <rect class="stats-legend-square primary" x="${width / 2 - 82}" y="15" width="9" height="9" />
        <text class="stats-legend-label" x="${width / 2 - 67}" y="23">Zadania</text>
        <rect class="stats-legend-square secondary" x="${width / 2 - 4}" y="15" width="9" height="9" />
        <text class="stats-legend-label" x="${width / 2 + 11}" y="23">Frekwencja %</text>
      </g>
      <g>${gridLines}</g>
      <path class="stats-line-area" d="${statsAreaPath(taskPoints, height, padding)}"></path>
      <path class="stats-line-path stats-line-primary" pathLength="1" d="${statsLinePath(taskPoints)}"></path>
      <path class="stats-line-path stats-line-secondary" pathLength="1" d="${statsLinePath(attendancePoints)}"></path>
      ${taskPoints
        .map(
          (point, index) => `
            <circle class="stats-line-dot stats-line-dot-primary" cx="${point.x}" cy="${point.y}" r="4">
              <title>${escapeHtml(buckets[index].label)}: ${buckets[index].tasks} zadań</title>
            </circle>
          `,
        )
        .join("")}
      ${attendancePoints
        .map(
          (point, index) => `
            <circle class="stats-line-dot stats-line-dot-secondary" cx="${point.x}" cy="${point.y}" r="4">
              <title>${escapeHtml(buckets[index].label)}: ${buckets[index].attendance}% frekwencji</title>
            </circle>
          `,
        )
        .join("")}
      ${buckets
        .map((bucket, index) => {
          const point = taskPoints[index];
          return `<text class="stats-x-label" x="${point.x}" y="${height - 7}" text-anchor="middle">${escapeHtml(bucket.label)}</text>`;
        })
        .join("")}
    </svg>
  `;
}

function triggerStatsChartsAnimation() {
  const statsView = $("#stats");
  if (!statsView) return;
  statsView.classList.remove("stats-animate");
  void statsView.offsetWidth;
  statsView.classList.add("stats-animate");
  if (statsAnimationTimer) window.clearTimeout(statsAnimationTimer);
  statsAnimationTimer = window.setTimeout(() => {
    statsView.classList.remove("stats-animate");
  }, 1500);
}

function statsDonutPoint(cx, cy, radius, angle) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function statsDonutPath(cx, cy, outerRadius, innerRadius, startAngle, endAngle) {
  const outerStart = statsDonutPoint(cx, cy, outerRadius, startAngle);
  const outerEnd = statsDonutPoint(cx, cy, outerRadius, endAngle);
  const innerStart = statsDonutPoint(cx, cy, innerRadius, endAngle);
  const innerEnd = statsDonutPoint(cx, cy, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x.toFixed(3)} ${outerStart.y.toFixed(3)}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x.toFixed(3)} ${outerEnd.y.toFixed(3)}`,
    `L ${innerStart.x.toFixed(3)} ${innerStart.y.toFixed(3)}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerEnd.x.toFixed(3)} ${innerEnd.y.toFixed(3)}`,
    "Z",
  ].join(" ");
}

function renderTaskStatusDonut(segments, total) {
  const center = 120;
  const outerRadius = 94;
  const innerRadius = 46;
  let offset = 0;

  const slices = total
    ? segments
        .filter((segment) => segment.value > 0)
        .map((segment) => {
          const start = (offset / total) * 360;
          offset += segment.value;
          const rawEnd = (offset / total) * 360;
          const end = rawEnd - start >= 360 ? start + 359.99 : rawEnd;
          const mid = start + (end - start) / 2;
          const radians = ((mid - 90) * Math.PI) / 180;
          const hoverX = Math.cos(radians) * 8;
          const hoverY = Math.sin(radians) * 8;
          const tipX = Math.cos(radians) >= 0 ? 150 : -74;
          const tipY = Math.max(14, Math.min(148, center + Math.sin(radians) * 74 - 36));
          const percent = statPercent(segment.value, total);
          const path = statsDonutPath(center, center, outerRadius, innerRadius, start, end);
          const tooltip = `${segment.label}: ${segment.value} zadań (${percent}%)`;

          return `
            <g class="stats-donut-slice ${segment.className}" tabindex="0" focusable="true" role="listitem" aria-label="${escapeHtml(tooltip)}">
              <path class="stats-donut-hit" d="${path}"></path>
              <path class="stats-donut-segment" d="${path}" style="--slice-x: ${hoverX.toFixed(2)}px; --slice-y: ${hoverY.toFixed(2)}px; fill: ${segment.color};">
                <title>${escapeHtml(tooltip)}</title>
              </path>
              <foreignObject class="stats-donut-tooltip" x="${tipX.toFixed(1)}" y="${tipY.toFixed(1)}" width="164" height="78">
                <div xmlns="http://www.w3.org/1999/xhtml" class="stats-donut-tooltip-box">
                  <strong>${escapeHtml(segment.label)}</strong>
                  <span>${segment.value} zadań · ${percent}%</span>
                  <small>${escapeHtml(segment.description)}</small>
                </div>
              </foreignObject>
            </g>
          `;
        })
        .join("")
    : `<circle class="stats-donut-empty-ring" cx="${center}" cy="${center}" r="${(outerRadius + innerRadius) / 2}"></circle>`;

  return `
    <div class="stats-donut-wrap">
      <svg class="stats-donut-svg" viewBox="0 0 240 240" role="img" aria-label="Zadania według statusu">
        <g role="list">${slices}</g>
      </svg>
      <div class="stats-donut-center" aria-hidden="true">
        <strong>${total}</strong>
        <span>zadań</span>
      </div>
    </div>
  `;
}

function bindTaskStatusDonutInteractions(chart) {
  const slices = [...chart.querySelectorAll(".stats-donut-slice")];
  const clearActive = () => slices.forEach((slice) => slice.classList.remove("is-active"));

  slices.forEach((slice) => {
    const activate = () => {
      clearActive();
      slice.classList.add("is-active");
    };
    const deactivate = () => slice.classList.remove("is-active");

    slice.addEventListener("pointerenter", activate);
    slice.addEventListener("pointerleave", deactivate);
    slice.addEventListener("focusin", activate);
    slice.addEventListener("focusout", deactivate);
    slice.addEventListener("click", () => {
      activate();
      if (typeof slice.focus === "function") slice.focus();
    });
  });
}

function renderStats() {
  const summary = $("#statsSummary");
  const activityChart = $("#statsBarChart");
  const issueList = $("#statsIssueList");
  const peopleChart = $("#statsPeopleHoursChart");
  const taskStatusChart = $("#statsTaskStatusChart");
  const trendChart = $("#statsTrendChart");
  const teamTable = $("#statsTeamTable");
  if (!summary || !activityChart || !issueList || !peopleChart || !taskStatusChart || !trendChart || !teamTable) return;

  const taskItems = Object.entries(tasks).flatMap(([column, items]) =>
    (items || []).map((task) => ({ ...task, column })),
  );
  const taskCounts = {
    todo: tasks.todo?.length || 0,
    doing: tasks.doing?.length || 0,
    review: tasks.review?.length || 0,
    done: tasks.done?.length || 0,
  };
  const totalTasks = taskItems.length;
  const doneTasks = taskCounts.done;
  const openReports = reports.filter((report) => !reportIsClosed(report));
  const acceptedReports = reports.filter(reportIsAccepted).length;
  const closedReports = reports.filter(reportIsClosed).length;
  const unreadUrgent = posts.filter((post) => post.priority === "urgent" && post.unread).length;
  const peopleStats = statsPeopleSource();
  const presentPeople = peopleStats.filter((person) => person.state === "work" || person.state === "break").length;
  const attendance = statPercent(presentPeople, peopleStats.length);
  const totalTodaySeconds = peopleStats.reduce((sum, person) => sum + statsWorkSeconds(person, "today"), 0);
  const totalWeekSeconds = peopleStats.reduce((sum, person) => sum + statsWorkSeconds(person, "week"), 0);
  const totalMonthSeconds = peopleStats.reduce((sum, person) => sum + statsWorkSeconds(person, "month"), 0);

  $("#statsMonthHours").textContent = formatWorkDuration(totalMonthSeconds);
  $("#statsDoneTasks").textContent = String(doneTasks);
  $("#statsOpenReports").textContent = String(openReports.length);
  $("#statsAttendance").textContent = `${attendance}%`;
  $("#statsMonthTrend").textContent = `Tydzień: ${formatWorkDuration(totalWeekSeconds)}`;
  $("#statsDoneTrend").textContent = totalTasks ? `${statPercent(doneTasks, totalTasks)}% wszystkich zadań` : "Brak zadań";
  $("#statsReportTrend").textContent = `${acceptedReports} przyjęte, ${closedReports} zamknięte`;
  $("#statsAttendanceTrend").textContent = `${presentPeople}/${peopleStats.length || 0} osób w pracy`;
  $("#statsOpenReportsBadge").textContent = String(openReports.length);
  $("#statsTeamCount").textContent = `${peopleStats.length} osób`;

  if (!taskItems.length && !reports.length && !posts.length && !kbArticles.length && !calendarEvents.length && !inventoryItems.length) {
    summary.textContent = "Brak danych do raportu.";
  } else {
    summary.textContent = `Dziś: ${formatWorkDuration(totalTodaySeconds)} pracy, ${doneTasks} zadań ukończonych, ${openReports.length} zgłoszeń otwartych, ${unreadUrgent} pilnych ogłoszeń do odczytu.`;
  }

  const maxPersonSeconds = Math.max(1, ...peopleStats.map((person) => statsWorkSeconds(person, "month")));
  peopleChart.innerHTML = peopleStats.length
    ? peopleStats
        .map((person) => {
          const seconds = statsWorkSeconds(person, "month");
          const width = Math.max(4, Math.round((seconds / maxPersonSeconds) * 100));
          return `
            <div class="stats-person-row">
              <span class="avatar">${escapeHtml(person.initials || makeInitials(person.name))}</span>
              <div>
                <strong>${escapeHtml(person.name || person.login)}</strong>
                <div class="stats-track"><span style="width: ${width}%"></span></div>
              </div>
              <em>${escapeHtml(formatWorkDuration(seconds))}</em>
            </div>
          `;
        })
        .join("")
    : `<div class="empty-state">Brak danych czasu pracy.</div>`;

  const donutSegments = [
    {
      label: "Do zrobienia",
      value: taskCounts.todo,
      color: "#f59e0b",
      className: "amber",
      description: "Czeka na rozpoczęcie",
    },
    {
      label: "W trakcie",
      value: taskCounts.doing,
      color: "#3b82f6",
      className: "teal",
      description: "Aktualnie realizowane",
    },
    {
      label: "Do sprawdzenia",
      value: taskCounts.review,
      color: "#8b5cf6",
      className: "blue",
      description: "Wymaga sprawdzenia",
    },
    {
      label: "Zrobione",
      value: taskCounts.done,
      color: "#10b981",
      className: "green",
      description: "Zakończone zadania",
    },
  ];
  taskStatusChart.innerHTML = `
    ${renderTaskStatusDonut(donutSegments, totalTasks)}
    <div class="stats-status-legend">
      ${donutSegments
        .map(
          (segment) => `
            <div>
              <span class="stats-dot ${segment.className}"></span>
              <p>${escapeHtml(segment.label)}</p>
              <strong>${segment.value}</strong>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
  bindTaskStatusDonutInteractions(taskStatusChart);

  const activityBuckets = buildStatsActivityBuckets(peopleStats);
  const activityTotalHours = activityBuckets.reduce((sum, bucket) => sum + bucket.hours, 0);
  $("#statsActivityBadge").textContent = `${activityTotalHours.toLocaleString("pl-PL", {
    maximumFractionDigits: 1,
  })}h`;
  activityChart.innerHTML = renderStatsActivityLineChart(activityBuckets);

  const trendBuckets = buildStatsTrendBuckets(taskItems, peopleStats);
  const trendTotal = trendBuckets.reduce((sum, bucket) => sum + bucket.tasks, 0);
  $("#statsTrendBadge").textContent = `${trendTotal} zadań`;
  trendChart.innerHTML = renderStatsTrendLineChart(trendBuckets);

  teamTable.innerHTML = peopleStats.length
    ? peopleStats
        .map((person) => {
          const login = normalizeLogin(person.login);
          const taskCount = taskItems.filter((task) => {
            const taskLogin = normalizeLogin(task.ownerLogin || "");
            return taskLogin ? taskLogin === login : normalizeSearch(task.owner) === normalizeSearch(person.name);
          }).length;
          const status = presenceStatusForState(person.state, person.active !== false);
          return `
            <tr>
              <td>
                <div class="stats-user-cell">
                  <span class="avatar">${escapeHtml(person.initials || makeInitials(person.name))}</span>
                  <strong>${escapeHtml(person.name || person.login)}</strong>
                </div>
              </td>
              <td>${escapeHtml(formatWorkDuration(statsWorkSeconds(person, "today")))}</td>
              <td>${escapeHtml(formatWorkDuration(statsWorkSeconds(person, "week")))}</td>
              <td>${escapeHtml(formatWorkDuration(statsWorkSeconds(person, "month")))}</td>
              <td>${taskCount}</td>
              <td><span class="pill ${person.state === "work" ? "green" : person.state === "break" ? "amber" : ""}">${escapeHtml(status)}</span></td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="6"><div class="empty-state">Brak aktywnych użytkowników.</div></td></tr>`;

  issueList.innerHTML = openReports.length
    ? openReports
        .slice(0, 8)
        .map(
          (report) => `
            <button data-stat-report="${escapeHtml(report.id)}" type="button">
              <span>
                <strong>${escapeHtml(report.title)}</strong>
                <small>${escapeHtml(report.category || "Zgłoszenie")} · ${escapeHtml(report.owner || "Użytkownik")}</small>
              </span>
              <span class="pill ${escapeHtml(reportStatusColor(report))}">${escapeHtml(report.status || "Nowe")}</span>
            </button>
          `,
        )
        .join("")
    : `<div class="empty-state">Brak otwartych zgłoszeń.</div>`;
}

const activityActionLabels = {
  LOGIN: "Logowanie",
  UPDATE_PRESENCE: "Zmiana obecności",
  CLEAR_SCHEDULE: "Wyczyszczenie grafiku",
  UPDATE_SCHEDULE: "Aktualizacja grafiku",
  CREATE_USER: "Utworzenie konta",
  UPDATE_USER: "Aktualizacja konta",
  DELETE_USER: "Usunięcie konta",
  CHANGE_PASSWORD: "Zmiana hasła",
  CREATE_ANNOUNCEMENT: "Dodanie ogłoszenia",
  CREATE_ANNOUNCEMENT_COMMENT: "Komentarz pod ogłoszeniem",
  CREATE_TASK: "Dodanie zadania",
  UPDATE_TASK: "Aktualizacja zadania",
  DELETE_TASK: "Usunięcie zadania",
  CREATE_REPORT: "Dodanie zgłoszenia",
  UPDATE_REPORT: "Aktualizacja zgłoszenia",
  DELETE_REPORT: "Usunięcie zgłoszenia",
  CREATE_REQUEST: "Dodanie wniosku",
  UPDATE_REQUEST: "Aktualizacja wniosku",
  CREATE_CALENDAR_EVENT: "Dodanie wydarzenia",
  CALENDAR_RSVP: "Potwierdzenie wydarzenia",
  CREATE_KNOWLEDGE_ARTICLE: "Dodanie dokumentu",
  CREATE_HANDOVER_NOTE: "Dodanie notatki",
  ACCEPT_HANDOVER_NOTE: "Przyjęcie notatki",
  DELETE_HANDOVER_NOTE: "Usunięcie notatki",
  CREATE_WEEKLY_KUDOS: "Dodanie wyróżnienia",
  CREATE_POLL: "Dodanie ankiety",
  VOTE_POLL: "Głos w ankiecie",
  CREATE_CHAT_GROUP: "Utworzenie grupy czatu",
  CREATE_CHAT_MESSAGE: "Wiadomość czatu",
  DELETE_ANNOUNCEMENT: "Usunięcie ogłoszenia",
};

function activityActionLabel(action) {
  return activityActionLabels[action] || action || "Akcja";
}

function getActivityDate() {
  if (!selectedActivityDate) selectedActivityDate = formatDateInput(new Date());
  return selectedActivityDate;
}

function activityCountLabel(count) {
  if (count === 1) return "1 akcja";
  if (count > 1 && count < 5) return `${count} akcje`;
  return `${count} akcji`;
}

function formatActivityDateLabel(value) {
  const date = localDateFromInput(value);
  if (!date) return value || "Wybrany dzień";
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatActivityTime(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const parsed = Date.parse(text.includes("T") ? text : text.replace(" ", "T"));
  if (Number.isNaN(parsed)) return text;
  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(parsed));
}

function formatActivityDetails(details) {
  const text = String(details || "").trim();
  if (!text) return "Brak szczegółów";
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`)
        .join(" · ");
    }
  } catch {
    return text;
  }
  return text;
}

function activityTimestamp(entry) {
  const text = String(entry?.createdAt || "").trim();
  const parsed = Date.parse(text.includes("T") ? text : text.replace(" ", "T"));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function activitySortLabel(entry) {
  return normalizeSearch(activityActionLabel(entry?.action));
}

function renderActivityTypeOptions() {
  const select = $("#activityTypeSelect");
  if (!select) return;
  const options = [...new Set(activityEntries.map((entry) => entry.action).filter(Boolean))]
    .sort((a, b) => activityActionLabel(a).localeCompare(activityActionLabel(b), "pl"));
  const isAvailable = selectedActivityType === "all" || options.includes(selectedActivityType);
  if (!isAvailable) selectedActivityType = "all";
  select.innerHTML = [
    `<option value="all">Wszystkie typy</option>`,
    ...options.map((action) => `<option value="${escapeHtml(action)}">${escapeHtml(activityActionLabel(action))}</option>`),
  ].join("");
  select.value = selectedActivityType;
}

function getVisibleActivityEntries() {
  return activityEntries
    .filter((entry) => selectedActivityType === "all" || entry.action === selectedActivityType)
    .sort((entryA, entryB) => {
      if (selectedActivitySort === "time-asc") return activityTimestamp(entryA) - activityTimestamp(entryB);
      if (selectedActivitySort === "type") {
        const labelCompare = activitySortLabel(entryA).localeCompare(activitySortLabel(entryB), "pl");
        if (labelCompare) return labelCompare;
      }
      return activityTimestamp(entryB) - activityTimestamp(entryA);
    });
}

function renderActivityLog() {
  const dateInput = $("#activityDateInput");
  const selectedDate = getActivityDate();
  if (dateInput && dateInput.value !== selectedDate) dateInput.value = selectedDate;
  renderActivityTypeOptions();
  const sortSelect = $("#activitySortSelect");
  if (sortSelect && sortSelect.value !== selectedActivitySort) sortSelect.value = selectedActivitySort;
  const visibleEntries = getVisibleActivityEntries();
  const dateLabel = $("#activityDateLabel");
  if (dateLabel) dateLabel.textContent = formatActivityDateLabel(selectedDate);
  const count = $("#activityCount");
  if (count) {
    count.textContent =
      selectedActivityType === "all"
        ? activityCountLabel(activityEntries.length)
        : `${activityCountLabel(visibleEntries.length)} z ${activityEntries.length}`;
  }
  const list = $("#activityList");
  if (!list) return;
  list.innerHTML = visibleEntries.length
    ? visibleEntries
        .map((entry) => {
          const actionLabel = activityActionLabel(entry.action);
          return `
            <article class="activity-item">
              <time>${escapeHtml(formatActivityTime(entry.createdAt))}</time>
              <div>
                <div class="card-line">
                  <strong>${escapeHtml(actionLabel)}</strong>
                  <span class="pill">${escapeHtml(entry.actorName || entry.actorLogin || "Użytkownik")}</span>
                </div>
                <p class="note">${escapeHtml(formatActivityDetails(entry.details))}</p>
                <span class="muted">${escapeHtml(entry.action || "")}${entry.actorLogin ? ` · ${escapeHtml(entry.actorLogin)}` : ""}</span>
              </div>
            </article>
          `;
        })
        .join("")
    : `<div class="empty-state">${
        activityEntries.length
          ? "Brak akcji pasujących do wybranego typu."
          : "Brak aktywności użytkowników dla wybranego dnia."
      }</div>`;
}

async function syncActivityLogFromBackend(options = {}) {
  if (!backendAvailable || !isLoggedIn() || role !== "admin") return false;
  try {
    const date = encodeURIComponent(options.date || getActivityDate());
    const snapshot = await apiRequest(`/audit?date=${date}`, { headers: {} });
    selectedActivityDate = snapshot.date || options.date || getActivityDate();
    activityEntries = Array.isArray(snapshot.entries) ? snapshot.entries : [];
    renderActivityLog();
    return true;
  } catch (error) {
    activityEntries = [];
    renderActivityLog();
    if (!options.silent) showToast("Historia aktywności", error.message || "Nie udało się pobrać historii.");
    return false;
  }
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
    `${target.view || "dashboard"}:${
      target.postId || target.reportId || target.requestId || target.itemId || target.conversationId || ""
    }:${title}:${body}`;
  return {
    id,
    title,
    body,
    target,
    category: notification.category || notificationCategory({ title, body, target }),
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

  inventoryItems
    .map(normalizeInventoryItem)
    .filter(Boolean)
    .filter((item) => inventoryStatus(item).id === "low")
    .forEach((item) => {
      systemNotifications.push(
        normalizeNotification({
          id: `inventory:${item.id}:low`,
          title: "Niski stan magazynowy",
          body: `${item.name}: ${formatInventoryNumber(item.quantity)} ${item.unit} (min. ${formatInventoryNumber(item.minimum)})`,
          target: { view: "inventory", itemId: item.id },
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
              ? {
                  view: requests.find((request) => String(request.id) === String(decision.requestId))?.kind === "leave"
                    ? "leaves"
                    : "time",
                  requestId: decision.requestId,
                }
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
  return [...byId.values()]
    .filter(notificationAllowed)
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

function notificationCategory(notification) {
  const target = notification.target || {};
  const view = target.view || "";
  if (view === "chat") return "chat";
  if (view === "tasks") return "tasks";
  if (view === "reports") return "reports";
  if (view === "announcements") return "announcements";
  if (view === "time") return "time";
  if (view === "inventory") return "inventory";
  if (view === "storeShortages") return "storeShortages";
  if (view === "calendar") return "calendar";
  if (view === "knowledge") return "knowledge";
  if (view === "team") return "team";

  const text = normalizeSearch(`${notification.title || ""} ${notification.body || ""}`);
  if (text.includes("czat") || text.includes("wiadom")) return "chat";
  if (text.includes("zadanie") || text.includes("zadania")) return "tasks";
  if (text.includes("braki na sklepie") || text.includes("brak na sklepie")) return "storeShortages";
  if (text.includes("zglosz")) return "reports";
  if (text.includes("oglosz") || text.includes("komentarz")) return "announcements";
  if (text.includes("czas") || text.includes("wniosek") || text.includes("korekt") || text.includes("grafik")) return "time";
  if (text.includes("kalendarz") || text.includes("wydarzenie") || text.includes("rsvp")) return "calendar";
  if (text.includes("wiedzy") || text.includes("dokument") || text.includes("zeszyt")) return "knowledge";
  if (text.includes("konto") || text.includes("haslo") || text.includes("zespol")) return "team";
  return "dashboard";
}

function notificationSourceId(notification) {
  const normalized = normalizeNotification(notification);
  const category = normalized.category || notificationCategory(normalized);
  const text = normalizeSearch(`${normalized.title || ""} ${normalized.body || ""}`);
  if (category === "reports" && /(brak|braki|towar|magazyn|stan|stany)/.test(text)) return "inventory";
  return Object.prototype.hasOwnProperty.call(defaultNotificationPreferences, category) ? category : "dashboard";
}

function notificationSourceEnabled(sourceId) {
  return userPreferences.notifications?.[sourceId] !== false;
}

function notificationAllowed(notification) {
  const normalized = normalizeNotification(notification);
  return normalized.persistent || notificationSourceEnabled(notificationSourceId(normalized));
}

function notificationFilterLabel(filterId) {
  return notificationFilters.find((filter) => filter.id === filterId)?.label || "Inne";
}

function notificationMatchesFilter(notification) {
  return currentNotificationFilter === "all" || notification.category === currentNotificationFilter;
}

function renderNotificationFilterOptions(allNotifications) {
  const select = $("#notificationTypeFilter");
  if (!select) return;
  const counts = new Map();
  allNotifications.forEach((notification) => {
    counts.set(notification.category, (counts.get(notification.category) || 0) + 1);
  });
  if (!notificationFilters.some((filter) => filter.id === currentNotificationFilter)) currentNotificationFilter = "all";
  select.innerHTML = notificationFilters
    .map((filter) => {
      const count = filter.id === "all" ? allNotifications.length : counts.get(filter.id) || 0;
      return `<option value="${escapeHtml(filter.id)}">${escapeHtml(filter.label)} (${count})</option>`;
    })
    .join("");
  select.value = currentNotificationFilter;
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

function renderNavNotificationBadges(sourceNotifications = getVisibleNotifications()) {
  if (!isLoggedIn()) {
    $$(".nav-item .nav-alert").forEach((badge) => badge.remove());
    return;
  }
  const counts = new Map();
  sourceNotifications
    .filter((notification) => notification.unread || notification.persistent)
    .forEach((notification) => {
      const view = notification.target?.view;
      if (!view) return;
      counts.set(view, (counts.get(view) || 0) + 1);
    });

  const unreadChatMessages = getChatConversations().reduce(
    (sum, conversation) => sum + unreadIncomingCount(conversation.id),
    0,
  );
  if (unreadChatMessages && notificationSourceEnabled("chat")) {
    counts.set("chat", Math.max(counts.get("chat") || 0, unreadChatMessages));
  }

  $$(".nav-item").forEach((button) => {
    button.querySelector(".nav-alert")?.remove();
    const count = counts.get(button.dataset.view) || 0;
    if (!count) return;
    const badge = document.createElement("span");
    badge.className = "nav-alert";
    badge.textContent = count > 9 ? "9+" : String(count);
    button.append(badge);
  });
}

function renderNotifications() {
  const allNotifications = getVisibleNotifications();
  renderNotificationFilterOptions(allNotifications);
  renderedNotifications = allNotifications.filter(notificationMatchesFilter);
  const unread = allNotifications.filter((notification) => notification.unread).length;
  const bell = $("#notificationsButton");
  if (bell) {
    bell.classList.toggle("has-unread", unread > 0);
    bell.querySelector("strong").textContent = unread > 99 ? "99+" : String(unread);
    bell.querySelector(".bell-indicator")?.classList.toggle("hidden", unread === 0);
  }
  $("#notificationList").innerHTML = renderedNotifications.length
    ? renderedNotifications
    .map(
      (notification, index) => `
        <article class="notification-card ${notification.unread || notification.persistent ? "unread" : ""}">
          <div class="card-line">
            <strong>${escapeHtml(notification.title)}</strong>
            <span class="pill teal">${escapeHtml(notificationFilterLabel(notification.category))}</span>
          </div>
          <span>${escapeHtml(notification.body)}</span>
          <div class="notification-actions">
            <span class="pill ${notification.persistent ? "red" : notification.unread ? "red" : "green"}">${
              notification.persistent ? "Wymagane" : notification.unread ? "Nowe" : "Odczytane"
            }</span>
            <button class="secondary-button" data-notification-index="${index}" type="button">Przejdź do źródła</button>
            <button class="secondary-button" data-notification-read="${index}" type="button" ${
              notification.persistent || !notification.unread ? "disabled" : ""
            }>${notification.persistent ? "Wymagane" : notification.unread ? "Oznacz jako przeczytane" : "Odczytane"}</button>
          </div>
        </article>
      `,
    )
    .join("")
    : `<div class="empty-state">Brak powiadomień.</div>`;
  renderNavNotificationBadges(allNotifications);
  renderDashboardRecentChats();
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
  if (text.includes("urlop")) return { view: "leaves" };
  if (text.includes("wniosek") || text.includes("korekt") || text.includes("grafik")) {
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
  if (!notificationAllowed(notification)) return;
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
  if (target.view === "inventory") {
    renderInventoryState();
    focusInventoryItem(target.itemId);
  }
  if (target.view === "storeShortages") {
    renderStoreShortageState();
    focusStoreShortage(target.shortageId);
  }
  if (target.taskId) openTaskDetails(target.taskId);
  renderNotifications();
}

async function openFeedItemSource(itemId) {
  const item = getActivityFeedItemById(itemId);
  if (!item) return;
  const target = item.target || {};
  if (target.view === "announcements" && target.postId) {
    activateView("announcements");
    await openPost(target.postId);
    return;
  }
  if (target.view === "reports") {
    const report = target.reportId ? getReportById(target.reportId) : null;
    currentReportFilter = report?.status === "Załatwione" ? "closed" : "open";
    activateView("reports");
    renderReportState();
    return;
  }
  if (target.view === "tasks") {
    activateView("tasks");
    if (target.taskId) openTaskDetails(target.taskId);
    return;
  }
  if (target.view === "time") {
    activateView("time");
    renderRequestState();
    return;
  }
  if (target.view === "calendar") {
    activateView("calendar");
    renderCalendarState();
    return;
  }
  if (target.view === "knowledge") {
    kbSearchQuery = "";
    activateView("knowledge");
    renderKnowledgeState();
    if (target.articleId) {
      await openKnowledgeDetails(target.articleId);
    }
    return;
  }
  if (target.view === "inventory") {
    activateView("inventory");
    renderInventoryState();
    focusInventoryItem(target.itemId);
    return;
  }
  if (target.view === "storeShortages") {
    activateView("storeShortages");
    renderStoreShortageState();
    focusStoreShortage(target.shortageId);
    return;
  }
  activateView(target.view || "dashboard");
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

function getInitialsByLogin(login, fallbackName = "") {
  const normalizedLogin = normalizeLogin(login);
  const person = normalizedLogin ? getPersonByLogin(normalizedLogin) : null;
  const account = normalizedLogin ? getAccountByLogin(normalizedLogin) : null;
  return person?.initials || account?.initials || makeInitials(fallbackName || getDisplayNameByLogin(normalizedLogin) || "PK");
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

function getVisibleConversations() {
  return getChatConversations();
}

function getConversationLastMessage(conversation) {
  return conversation.messages?.length ? conversation.messages[conversation.messages.length - 1] : null;
}

function getConversationInitials(conversation) {
  if (conversation.kind === "direct") {
    const otherLogin = conversation.memberLogins?.find((login) => login !== getActiveLogin());
    const person = getPersonByLogin(otherLogin);
    return person?.initials || makeInitials(conversation.title);
  }
  return makeInitials(String(conversation.title || "").replace(/^#\s*/, ""));
}

function getConversationPreview(conversation) {
  const lastMessage = getConversationLastMessage(conversation);
  if (!lastMessage) return conversation.subtitle || "Brak wiadomości";
  const author = isOwnMessage(lastMessage) ? "Ty" : getMessageAuthor(lastMessage);
  const body = lastMessage.body || (lastMessage.attachments?.length ? "Załącznik" : "Wiadomość");
  return `${author}: ${body}`;
}

function getRecentChatConversations(limit = 4) {
  return getChatConversations()
    .map((conversation, index) => {
      const lastMessage = getConversationLastMessage(conversation);
      return {
        ...conversation,
        lastMessage,
        unreadCount: unreadIncomingCount(conversation.id),
        sortKey: lastMessage?.createdAt || lastMessage?.time || `-${index}`,
      };
    })
    .sort((a, b) => {
      if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
      return String(b.sortKey).localeCompare(String(a.sortKey));
    })
    .slice(0, limit);
}

function renderDashboardRecentChats() {
  const list = $("#dashboardRecentChats");
  const badge = $("#dashboardChatBadge");
  if (!list || !badge || !isLoggedIn()) return;
  const conversations = getRecentChatConversations();
  const unreadTotal = getChatConversations().reduce((sum, conversation) => sum + unreadIncomingCount(conversation.id), 0);
  badge.textContent = unreadTotal ? `${unreadTotal} nowych` : "0 nowych";
  badge.className = `pill ${unreadTotal ? "red" : "green"}`;
  list.innerHTML = conversations.length
    ? conversations
        .map((conversation) => {
          const lastMessage = conversation.lastMessage;
          const preview = lastMessage
            ? `${getMessageAuthor(lastMessage)}: ${lastMessage.body || (lastMessage.attachments?.length ? "Załącznik" : "Wiadomość")}`
            : "Brak wiadomości";
          return `
            <button class="recent-chat-button ${conversation.unreadCount ? "unread" : ""}" data-dashboard-conversation="${escapeHtml(
              conversation.id,
            )}" type="button">
              <strong>${escapeHtml(conversation.title)}</strong>
              ${conversation.unreadCount ? `<span class="pill red">${conversation.unreadCount}</span>` : `<span class="pill green">OK</span>`}
              <small>${escapeHtml(preview)}</small>
            </button>
          `;
        })
        .join("")
    : `<div class="empty-state">Brak rozmów do pokazania.</div>`;
}

function conversationUnreadLabel(count) {
  return count > 9 ? "9+" : String(count);
}

function renderConversationUnreadBadges() {
  $$("#conversationList .conversation-button").forEach((button) => {
    const count = unreadIncomingCount(button.dataset.conversation);
    const badge = button.querySelector("[data-conversation-alert]");
    button.classList.toggle("unread", count > 0);
    if (!badge) return;
    badge.textContent = count ? conversationUnreadLabel(count) : "";
    badge.classList.toggle("hidden", count === 0);
    if (count) {
      badge.setAttribute("aria-label", `${count} nieodczytane wiadomości`);
    } else {
      badge.removeAttribute("aria-label");
    }
  });
}

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileIcon(fileType = "", fileName = "") {
  const normalizedType = String(fileType || "").toLowerCase();
  const normalizedName = String(fileName || "").toLowerCase();
  if (normalizedType.startsWith("image/")) return "IMG";
  if (normalizedType.startsWith("video/")) return "VID";
  if (normalizedType.includes("pdf") || normalizedName.endsWith(".pdf")) return "PDF";
  if (
    normalizedType.includes("spreadsheet") ||
    normalizedType.includes("excel") ||
    normalizedType.includes("csv") ||
    normalizedType.includes("numbers") ||
    /\.(xlsx|xls|csv|tsv|ods|numbers)$/i.test(normalizedName)
  ) return "XLS";
  if (normalizedType.includes("word") || /\.(docx|doc)$/i.test(normalizedName)) return "DOC";
  if (normalizedType.startsWith("text/") || /\.(txt|md|rtf)$/i.test(normalizedName)) return "TXT";
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
    [
      article.title,
      article.detail,
      article.type,
      article.fileName,
      article.fileMime,
      article.linkUrl,
      article.category,
      article.tags,
      article.versionLabel,
      knowledgeVisibilityLabel(article.visibility),
    ]
      .filter(Boolean)
      .join(" "),
  ).includes(query);
}

function findKnowledgeArticle(articleId) {
  return kbArticles.find((article) => String(article.id) === String(articleId)) || null;
}

function formatKnowledgeDate(value) {
  const text = String(value || "").trim();
  if (!text) return "Brak daty";
  const parsed = Date.parse(text.includes("T") ? text : text.replace(" ", "T"));
  if (Number.isNaN(parsed)) return text;
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(parsed));
}

function knowledgeTypeLabel(type = "") {
  const normalized = String(type || "").toUpperCase();
  const labels = {
    DOC: "Dokument",
    PDF: "PDF",
    TXT: "Tekst",
    XLS: "Arkusz",
    IMG: "Zdjęcie",
    VID: "Film",
    LINK: "Link",
    PLIK: "Plik",
  };
  return labels[normalized] || type || "Dokument";
}

function knowledgeVisibilityLabel(value = "all") {
  const labels = {
    all: "Cała firma",
    team: "Zespół",
    admin: "Tylko admin",
  };
  return labels[String(value || "all")] || "Cała firma";
}

function renderKnowledgeDocumentIcon(type = "PLIK") {
  const normalized = String(type || "").toUpperCase();
  if (normalized === "IMG") return "IMG";
  if (normalized === "VID") return "▶";
  if (normalized === "XLS") return "XLS";
  if (normalized === "TXT") return "TXT";
  if (normalized === "LINK") return "↗";
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
      <path d="M14 3v5h5"/>
      <path d="M9 13h6"/>
      <path d="M9 17h4"/>
    </svg>
  `;
}

function knowledgePreviewUrl(article) {
  if (!article.fileUrl) return "";
  const separator = article.fileUrl.includes("?") ? "&" : "?";
  return `${article.fileUrl}${separator}preview=1`;
}

function renderKnowledgeVisual(article, typeLabel) {
  if (String(article.type || "").toUpperCase() === "IMG" && article.fileUrl) {
    const previewUrl = knowledgePreviewUrl(article);
    return `
      <a class="kb-icon kb-thumb" href="${escapeHtml(previewUrl)}" target="_blank" rel="noopener" aria-label="Podgląd: ${escapeHtml(article.title)}" title="${escapeHtml(typeLabel)}">
        <img src="${escapeHtml(previewUrl)}" alt="${escapeHtml(article.title)}" loading="lazy" />
      </a>
    `;
  }
  if (article.linkUrl) {
    return `
      <a class="kb-icon" href="${escapeHtml(article.linkUrl)}" target="_blank" rel="noopener" aria-label="Otwórz link: ${escapeHtml(article.title)}" title="${escapeHtml(typeLabel)}">
        ${renderKnowledgeDocumentIcon(article.type)}
      </a>
    `;
  }
  return `<span class="kb-icon" aria-label="${escapeHtml(typeLabel)}" title="${escapeHtml(typeLabel)}">${renderKnowledgeDocumentIcon(article.type)}</span>`;
}

async function openKnowledgeDetails(articleId) {
  let article = findKnowledgeArticle(articleId);
  if (!article && backendAvailable && isLoggedIn()) {
    await syncKnowledgeFromBackend({ silent: true });
    article = findKnowledgeArticle(articleId);
  }
  if (!article) {
    showToast("Baza wiedzy", "Nie znaleziono dokumentu.");
    return;
  }
  activeKnowledgeArticleId = article.id;
  $("#kbDialogType").textContent = knowledgeTypeLabel(article.type);
  $("#kbDialogTitle").textContent = article.title || "Dokument";
  $("#kbDialogDescription").textContent = article.detail || "Brak opisu dokumentu.";
  $("#kbDialogAuthor").textContent = article.createdBy ? getDisplayNameByLogin(article.createdBy) : "Brak danych";
  $("#kbDialogCreated").textContent = formatKnowledgeDate(article.createdAt);
  $("#kbDialogFileName").textContent = article.fileName || "Brak pliku";
  $("#kbDialogFileSize").textContent = article.fileSize ? formatFileSize(article.fileSize) : "Brak danych";
  $("#kbDialogMime").textContent = article.fileMime || "Brak danych";
  $("#kbDialogCategory").textContent = article.category || "Bez kategorii";
  $("#kbDialogVersion").textContent = article.versionLabel || "Brak";
  $("#kbDialogVisibility").textContent = knowledgeVisibilityLabel(article.visibility);
  $("#kbDialogTags").textContent = article.tags || "Brak tagów";
  const linkRow = $("#kbDialogLinkRow");
  const linkText = $("#kbDialogLink");
  const openLink = $("#kbDialogOpenLink");
  const hasLink = Boolean(article.linkUrl);
  if (linkRow && linkText && openLink) {
    linkRow.classList.toggle("hidden", !hasLink);
    linkText.textContent = hasLink ? article.linkUrl : "";
    if (hasLink) {
      linkText.href = article.linkUrl;
      openLink.href = article.linkUrl;
      openLink.classList.remove("hidden");
    } else {
      linkText.removeAttribute("href");
      openLink.removeAttribute("href");
      openLink.classList.add("hidden");
    }
  }
  const downloadLink = $("#kbDialogDownload");
  if (article.fileUrl) {
    downloadLink.href = article.fileUrl;
    downloadLink.download = article.fileName || article.title || "dokument";
    downloadLink.classList.remove("hidden");
  } else {
    downloadLink.removeAttribute("href");
    downloadLink.removeAttribute("download");
    downloadLink.classList.add("hidden");
  }
  openDialog("#knowledgeDetailsDialog");
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

function toggleChatNewMenu(force) {
  const menu = $("#chatNewMenu");
  const button = $("[data-chat-new-toggle]");
  if (!menu || !button) return;
  const shouldOpen = typeof force === "boolean" ? force : menu.classList.contains("hidden");
  menu.classList.toggle("hidden", !shouldOpen);
  button.classList.toggle("active", shouldOpen);
  button.setAttribute("aria-expanded", String(shouldOpen));
  if (shouldOpen) {
    renderChatGroupMembers();
    window.setTimeout(() => $("#chatGroupName")?.focus(), 0);
  }
}

function closeChatNewMenu() {
  toggleChatNewMenu(false);
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
      (conversation) => {
        const unreadCount = unreadIncomingCount(conversation.id);
        const lastMessage = getConversationLastMessage(conversation);
        const metaLabel = lastMessage?.time || (conversation.kind === "direct" ? "kontakt" : "grupa");
        const initials = getConversationInitials(conversation);
        const preview = getConversationPreview(conversation);
        return `
        <button class="conversation-button ${conversation.id === currentConversation ? "active" : ""} ${
          unreadCount ? "unread" : ""
        }" data-conversation="${conversation.id}" data-initials="${escapeHtml(initials)}" data-chat-meta="${escapeHtml(metaLabel)}" type="button">
          <span class="conversation-button-top">
            <strong>${escapeHtml(conversation.title)}</strong>
            <span class="conversation-alert ${unreadCount ? "" : "hidden"}" data-conversation-alert ${
              unreadCount ? `aria-label="${unreadCount} nieodczytane wiadomości"` : ""
            }>${unreadCount ? conversationUnreadLabel(unreadCount) : ""}</span>
          </span>
          <span class="muted">${escapeHtml(preview)}</span>
        </button>
      `;
      },
    )
    .join("");

  const conversation = availableConversations.find((item) => item.id === currentConversation) || availableConversations[0];
  $("#chatTitle").textContent = conversation.title;
  $("#chatSubtitle").textContent = conversation.subtitle || "Rozmowa";
  $("#chat .chat-panel .panel-header")?.setAttribute("data-chat-initials", getConversationInitials(conversation));
  $("#messageList").innerHTML = conversation.messages.length
    ? conversation.messages
        .map((message) => {
          const ownMessage = isOwnMessage(message);
          return `
        <article class="message ${ownMessage ? "mine me" : "them"}">
          <strong>${escapeHtml(getMessageAuthor(message))}</strong>
          <span>${escapeHtml(message.body)}</span>
          ${renderAttachments(message.attachments)}
          <small>${message.time} · ${getMessageReceiptLabel(message, conversation)}</small>
        </article>
      `;
        })
        .join("")
    : `<div class="empty-state">Brak wiadomości w tej rozmowie.</div>`;
  renderDashboardRecentChats();
  renderNavNotificationBadges();
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
        const sizeLabel = article.fileName ? formatFileSize(article.fileSize) : "";
        const fileMeta = article.linkUrl ? article.linkUrl : [article.fileName, sizeLabel].filter(Boolean).join(" · ");
        const typeLabel = knowledgeTypeLabel(article.type);
        const metaNode = article.linkUrl
          ? `<a class="kb-meta-link" href="${escapeHtml(article.linkUrl)}" target="_blank" rel="noopener">${escapeHtml(article.linkUrl)}</a>`
          : `<span class="muted">${escapeHtml(fileMeta || "Brak pliku")}</span>`;
        const cardTags = String(article.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 3);
        const createdMeta = [
          article.createdBy ? `Dodał: ${getDisplayNameByLogin(article.createdBy)}` : "",
          activityTimeLabel(article.createdAt, ""),
        ]
          .filter(Boolean)
          .join(" · ");
        return `
        <article class="kb-card">
          ${renderKnowledgeVisual(article, typeLabel)}
          <div>
            <div class="card-line">
              <strong>${escapeHtml(article.title)}</strong>
              <span class="pill">${escapeHtml(typeLabel)}</span>
            </div>
            <div class="kb-meta-tags">
              ${article.category ? `<span>${escapeHtml(article.category)}</span>` : ""}
              ${article.versionLabel ? `<span>${escapeHtml(article.versionLabel)}</span>` : ""}
              <span>${escapeHtml(knowledgeVisibilityLabel(article.visibility))}</span>
              ${cardTags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}
            </div>
            <p class="note">${escapeHtml(article.detail)}</p>
            ${createdMeta ? `<span class="muted">${escapeHtml(createdMeta)}</span>` : ""}
            <div class="card-line">
              ${metaNode}
              <span class="card-actions">
                <button class="secondary-button" data-kb-details="${escapeHtml(article.id)}" type="button">Szczegóły</button>
                ${article.linkUrl ? `<a class="secondary-button" href="${escapeHtml(article.linkUrl)}" target="_blank" rel="noopener">Otwórz</a>` : ""}
                ${
                  article.fileUrl
                    ? `<a class="secondary-button" href="${escapeHtml(article.fileUrl)}" download="${escapeHtml(
                        article.fileName || article.title,
                      )}">Pobierz</a>`
                    : ""
                }
              </span>
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
  if (!isAdmin && $("#activity").classList.contains("active-view")) {
    activateView("dashboard");
  }
}

function activateView(viewId) {
  const requestedViewId = viewId;
  const actualViewId = viewAliases[viewId] || viewId;
  $$(".view").forEach((view) => view.classList.toggle("active-view", view.id === actualViewId));
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === requestedViewId));
  $("#viewTitle").textContent = viewTitles[requestedViewId] || viewTitles[actualViewId] || "Panel";
  $(".sidebar").classList.remove("open");
  if (actualViewId === "dashboard") {
    ensureFeedBoardStateForActiveUser();
  } else {
    freshFeedItemIds.clear();
  }
  if (["dashboard", "announcements"].includes(actualViewId) && backendAvailable && isLoggedIn()) {
    syncAnnouncementsFromBackend({ silent: true }).then((changed) => {
      if (changed) renderAnnouncementState();
    });
  }
  if (actualViewId === "dashboard" && backendAvailable && isLoggedIn()) {
    Promise.all([
      syncTasksFromBackend({ silent: true }),
      syncReportsFromBackend({ silent: true }),
      syncRequestsFromBackend({ silent: true }),
      syncCalendarFromBackend({ silent: true }),
      syncKnowledgeFromBackend({ silent: true }),
      syncInventoryFromBackend({ silent: true }),
      syncStoreShortagesFromBackend({ silent: true }),
      syncQuickPollsFromBackend({ silent: true }),
      syncKudosFromBackend({ silent: true }),
    ]).then((changes) => {
      if (!changes.some(Boolean)) return;
      renderKanban();
      renderRequests();
      renderReports();
      renderCalendar();
      renderKnowledge();
      renderInventory();
      renderStoreShortages();
      renderQuickPoll();
      renderKudos();
      renderPosts(currentFeedFilter);
      applyRole();
    });
  }
  if (["dashboard", "time"].includes(actualViewId) && backendAvailable && isLoggedIn()) {
    refreshPresence();
  }
  if (actualViewId === "stats") {
    renderStats();
    triggerStatsChartsAnimation();
    if (backendAvailable && isLoggedIn()) {
      Promise.all([
        syncTasksFromBackend({ silent: true }),
        syncReportsFromBackend({ silent: true }),
        syncRequestsFromBackend({ silent: true }),
        syncCalendarFromBackend({ silent: true }),
        syncKnowledgeFromBackend({ silent: true }),
        syncInventoryFromBackend({ silent: true }),
        syncTimeSummaryFromBackend({ silent: true }),
      ]).then((changes) => {
        if (changes.some(Boolean)) {
          renderStats();
          triggerStatsChartsAnimation();
        }
      });
    }
  }
  if (actualViewId === "tasks" && backendAvailable && isLoggedIn()) {
    syncTasksFromBackend({ silent: true }).then((changed) => {
      if (changed) renderTaskState();
    });
  }
  if (actualViewId === "reports" && backendAvailable && isLoggedIn()) {
    syncReportsFromBackend({ silent: true }).then((changed) => {
      if (changed) renderReportState();
    });
  }
  if (actualViewId === "time" && backendAvailable && isLoggedIn()) {
    syncRequestsFromBackend({ silent: true }).then((changed) => {
      if (changed) renderRequestState();
    });
  }
  if (actualViewId === "calendar" && backendAvailable && isLoggedIn()) {
    syncCalendarFromBackend({ silent: true }).then((changed) => {
      if (changed) renderCalendarState();
    });
  }
  if (actualViewId === "knowledge" && backendAvailable && isLoggedIn()) {
    syncKnowledgeFromBackend({ silent: true }).then((changed) => {
      if (changed) renderKnowledgeState();
    });
  }
  if (actualViewId === "inventory" && backendAvailable && isLoggedIn()) {
    syncInventoryFromBackend({ silent: true }).then((changed) => {
      if (changed) renderInventoryState();
    });
  }
  if (actualViewId === "storeShortages" && backendAvailable && isLoggedIn()) {
    syncStoreShortagesFromBackend({ silent: true }).then((changed) => {
      if (changed) renderStoreShortageState();
    });
  }
  if (actualViewId === "activity") {
    renderActivityLog();
    if (backendAvailable && isLoggedIn() && role === "admin") {
      syncActivityLogFromBackend({ silent: true });
    }
  }
  if (actualViewId === "chat") renderChat();
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
  const featureFeed = grid.querySelector(".feature-feed-widget");
  if (featureFeed) grid.prepend(featureFeed);
}

function bindDashboardDrag() {
  let dragged = null;
  $$("#dashboardGrid .widget").forEach((widget) => {
    widget.draggable = true;
    widget.addEventListener("dragstart", (event) => {
      dragged = widget;
      event.dataTransfer.effectAllowed = "move";
      widget.classList.add("dragging");
    });
    widget.addEventListener("dragend", () => {
      widget.classList.remove("dragging");
      $$("#dashboardGrid .widget.drag-over").forEach((item) => item.classList.remove("drag-over"));
      dragged = null;
    });
    widget.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (dragged && dragged !== widget) widget.classList.add("drag-over");
    });
    widget.addEventListener("dragleave", () => widget.classList.remove("drag-over"));
    widget.addEventListener("drop", () => {
      widget.classList.remove("drag-over");
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
    ...inventoryItems.map((item) => ["Magazyn", item.name, `${item.sku} ${item.category} ${item.location}`]),
    ...storeShortages.map((item) => ["Braki na sklepie", item.name, `${item.quantity} ${item.source} ${item.note}`]),
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

function announcementRecipientMarkup() {
  return people
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
}

function renderAnnouncementRecipientOptions() {
  const markup = announcementRecipientMarkup();
  const recipientGrid = $("#recipientGrid");
  if (recipientGrid) recipientGrid.innerHTML = markup;
  const dashboardRecipientGrid = $("#dashboardRecipientGrid");
  if (dashboardRecipientGrid) dashboardRecipientGrid.innerHTML = markup;
}

function updateAnnouncementRecipientsVisibility() {
  const audience = $("#postAudience");
  const fieldset = $(".announcement-recipient-fieldset");
  if (!audience || !fieldset) return;
  fieldset.classList.toggle("hidden", audience.value !== "selected");
}

function updateDashboardComposerRecipientsVisibility() {
  const audience = $("#dashboardPostAudience");
  const fieldset = $("#dashboardRecipientFieldset");
  if (!audience || !fieldset) return;
  fieldset.classList.toggle("hidden", audience.value !== "selected");
}

function updateDashboardAttachmentLabel() {
  const input = $("#dashboardPostAttachment");
  const label = $("#dashboardAttachmentName");
  if (!input || !label) return;
  label.textContent = input.files?.[0]?.name || "Nie wybrano pliku";
}

function openDashboardComposer() {
  $("#dashboardComposerTrigger")?.classList.add("hidden");
  $("#dashboardAnnouncementForm")?.classList.remove("hidden");
  updateDashboardComposerRecipientsVisibility();
  updateDashboardAttachmentLabel();
  window.setTimeout(() => $("#dashboardPostTitle")?.focus(), 0);
}

function closeDashboardComposer(options = {}) {
  const form = $("#dashboardAnnouncementForm");
  if (form && options.reset) form.reset();
  $("#dashboardComposerTrigger")?.classList.remove("hidden");
  form?.classList.add("hidden");
  updateDashboardComposerRecipientsVisibility();
  updateDashboardAttachmentLabel();
}

async function publishAnnouncementFromForm(form, options = {}) {
  const titleInput = form.querySelector('[name="title"]');
  const bodyInput = form.querySelector('[name="body"]');
  const priorityInput = form.querySelector('[name="priority"]');
  const audienceInput = form.querySelector('[name="audience"]');
  const attachmentInput = form.querySelector('[name="attachment"]');
  const title = titleInput?.value.trim() || "";
  const body = bodyInput?.value.trim() || "";
  const priority = priorityInput?.value || "normal";
  const audience = audienceInput?.value || "all";
  const file = attachmentInput?.files?.[0];
  const recipientLogins = [...form.querySelectorAll("[data-announcement-recipient]:checked")].map((input) =>
    normalizeLogin(input.value),
  );
  if (!title || !body) {
    showToast("Uzupełnij ogłoszenie", "Podaj tytuł i treść.");
    (title ? bodyInput : titleInput)?.focus();
    return false;
  }
  if (audience === "selected" && !recipientLogins.length) {
    showToast("Wybierz odbiorców", "Dla wybranych osób zaznacz przynajmniej jednego odbiorcę.");
    return false;
  }

  if (backendAvailable) {
    try {
      const formData = new FormData(form);
      formData.set("title", title);
      formData.set("body", body);
      formData.set("priority", priority);
      formData.set("audience", audience);
      formData.set("recipientLogins", JSON.stringify(recipientLogins));
      const result = await apiFormRequest("/announcements", formData);
      applyAnnouncementMutationResult(result, result.post?.id);
      pushNotification("Nowe ogłoszenie", title, { view: "announcements", postId: result.post?.id });
      showToast("Opublikowano ogłoszenie", "Jest zapisane w bazie i widoczne dla pozostałych użytkowników.");
      form.reset();
      updateAnnouncementRecipientsVisibility();
      updateDashboardComposerRecipientsVisibility();
      updateDashboardAttachmentLabel();
      if (options.closeDashboard) closeDashboardComposer({ reset: false });
      renderPeople();
      return true;
    } catch (error) {
      showToast("Nie opublikowano ogłoszenia", error.message || "Backend odrzucił zapis.");
      return false;
    }
  }

  const now = new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  const total = audience === "selected" ? Math.max(1, recipientLogins.length + 1) : activePeople().length;
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
    fileName: file?.name || "",
    fileMime: file?.type || "",
    fileSize: file?.size || 0,
    fileUrl: file ? URL.createObjectURL(file) : "",
  };
  posts.unshift(post);
  renderPosts();
  pushNotification("Nowe ogłoszenie", post.title, { view: "announcements", postId: post.id });
  showToast("Opublikowano ogłoszenie", "Pojawiło się w strumieniu i na liście ogłoszeń.");
  form.reset();
  updateAnnouncementRecipientsVisibility();
  updateDashboardComposerRecipientsVisibility();
  updateDashboardAttachmentLabel();
  if (options.closeDashboard) closeDashboardComposer({ reset: false });
  return true;
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
  await publishAnnouncementFromForm(event.target);
}

async function createDashboardPost(event) {
  event.preventDefault();
  await publishAnnouncementFromForm(event.target, { closeDashboard: true });
}

async function addAnnouncementCommentById(postId, body, options = {}) {
  const post = getPostById(postId);
  if (!post || !body) return null;

  if (backendAvailable) {
    try {
      const result = await apiRequest(`/announcements/${encodeURIComponent(post.id)}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      const updatedPost = applyAnnouncementMutationResult(result, post.id);
      if (!options.skipNotification) {
        pushNotification("Nowy komentarz", `${getActiveName()} skomentowal(a): ${post.title}`, {
          view: "announcements",
          postId: post.id,
        });
      }
      showToast("Komentarz dodany", "Jest zapisany w bazie ogloszen.");
      return updatedPost;
    } catch (error) {
      showToast("Nie dodano komentarza", error.message || "Backend odrzucil zapis.");
      return null;
    }
  }

  post.comments = normalizeEntityComments(post.comments);
  post.comments.push(makeEntityComment(body));
  if (activePostId && String(activePostId) === String(post.id) && $("#postDialog")?.open) {
    renderPostDialog(post);
  }
  renderPosts(currentFeedFilter);
  if (!options.skipNotification) {
    pushNotification("Nowy komentarz", `${getActiveName()} skomentowal(a): ${post.title}`, {
      view: "announcements",
      postId: post.id,
    });
  }
  showToast("Komentarz dodany", "Widac go pod ogloszeniem.");
  return post;
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

async function toggleAnnouncementReaction(postId, reactionId) {
  const post = getPostById(postId);
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
  renderAnnouncementState();
  showToast("Reakcja zapisana", post.title);
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

async function openPostComments(postId) {
  await openPost(postId);
  window.setTimeout(() => $("#postCommentInput")?.focus(), 50);
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
      if (result.timeSummary) {
        applyTimeSummary(result.timeSummary);
      } else if (request.kind === "correction" && status === "Zaakceptowane") {
        await syncTimeSummaryFromBackend({ silent: true });
      }
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
  const from = $("#leaveFrom").value;
  const to = $("#leaveTo").value;
  const type = $("#leaveType").value;
  const comment = $("#leaveComment").value.trim();
  if (!from || !to) {
    showToast("Uzupełnij termin", "Podaj datę rozpoczęcia i zakończenia nieobecności.");
    return;
  }
  const detail = `${from}-${to} · ${type}${comment ? ` · ${comment}` : ""}`;
  const title = `Urlop: ${getActiveName()}`;
  if (backendAvailable) {
    try {
      const result = await apiRequest("/requests", {
        method: "POST",
        body: JSON.stringify({ kind: "leave", title, detail }),
      });
      applyRequestSnapshot(result);
      renderRequestState();
      $("#leaveForm").reset();
      pushNotification("Nowy wniosek urlopowy", "Wniosek czeka na decyzję admina.", { view: "leaves" });
      showToast("Wniosek wysłany", "Trafił do wspólnej listy urlopów.");
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
  $("#leaveForm").reset();
  renderRequestState();
  applyRole();
  pushNotification("Nowy wniosek urlopowy", "Wniosek czeka na decyzję admina.", { view: "leaves" });
  showToast("Wniosek wysłany", "Trafił do listy urlopów.");
}

async function createReport(event) {
  event.preventDefault();
  const category = $("#reportCategory").value;
  const priority = $("#reportPriority")?.value || "normal";
  const detail = $("#reportText").value.trim();
  const file = $("#reportFileInput").files?.[0];
  if (!detail) return;
  const title = reportDisplayTitle({ title: "", category, detail });
  if (backendAvailable) {
    try {
      const formData = new FormData(event.target);
      formData.set("category", category);
      formData.set("title", title);
      formData.set("detail", detail);
      formData.set("priority", priority);
      const result = await apiFormRequest("/reports", formData);
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
    title,
    detail,
    status: "Nowe",
    priority,
    owner: getActiveName(),
    ownerLogin: getActiveLogin(),
    fileName: file?.name || "",
    fileMime: file?.type || "",
    fileSize: file?.size || 0,
    fileUrl: file ? URL.createObjectURL(file) : "",
    reactions: normalizeEntityReactions(),
    comments: [],
  });
  saveReportState();
  renderReportState();
  pushNotification("Nowe zgłoszenie", `${category}: ${detail}`, { view: "reports" });
  showToast("Zgłoszenie wysłane", "Admin zobaczy je na liście zgłoszeń.");
}

async function addReportCommentById(reportId, body) {
  const report = getReportById(reportId);
  if (!report || !body) return null;
  openReportCommentId = String(report.id);

  if (backendAvailable) {
    try {
      const result = await apiRequest(`/reports/${encodeURIComponent(report.id)}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      applyReportSnapshot(result);
      renderReportState();
      showToast("Komentarz dodany", "Jest zapisany przy zgloszeniu.");
      return getReportById(report.id) || null;
    } catch (error) {
      showToast("Nie dodano komentarza", error.message || "Backend odrzucil zapis.");
      return null;
    }
  }

  report.comments = normalizeEntityComments(report.comments);
  report.comments.push(makeEntityComment(body));
  report.updatedAt = "teraz";
  saveReportState();
  renderReportState();
  showToast("Komentarz dodany", "Widac go przy zgloszeniu.");
  return report;
}

async function createReportComment(event) {
  event.preventDefault();
  const form = event.target;
  const reportId = form.dataset.reportCommentForm;
  const report = getReportById(reportId);
  const input = form.querySelector("input[name='body']");
  const body = input?.value.trim();
  if (!report || !body) return;
  openReportCommentId = String(reportId);

  if (backendAvailable) {
    try {
      const result = await apiRequest(`/reports/${encodeURIComponent(report.id)}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      form.reset();
      applyReportSnapshot(result);
      renderReportState();
      showToast("Komentarz dodany", "Jest zapisany przy zgloszeniu.");
      return;
    } catch (error) {
      showToast("Nie dodano komentarza", error.message || "Backend odrzucil zapis.");
      return;
    }
  }

  report.comments = normalizeEntityComments(report.comments);
  report.comments.push(makeEntityComment(body));
  report.updatedAt = "teraz";
  form.reset();
  saveReportState();
  renderReportState();
  showToast("Komentarz dodany", "Widac go przy zgloszeniu.");
}

async function toggleReportReaction(reportId, reactionId) {
  const report = getReportById(reportId);
  if (!report) return;
  if (backendAvailable) {
    try {
      const result = await apiRequest(`/reports/${encodeURIComponent(report.id)}/reactions`, {
        method: "POST",
        body: JSON.stringify({ reactionId }),
      });
      applyReportSnapshot(result);
      renderReportState();
      showToast("Reakcja zapisana", report.title);
      return;
    } catch (error) {
      showToast("Nie zapisano reakcji", error.message || "Backend odrzucil zmiane.");
      return;
    }
  }
  if (!toggleLocalEntityReaction(report, reactionId)) return;
  saveReportState();
  renderReportState();
  showToast("Reakcja zapisana", report.title);
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
  saveReportState();
  renderReportState();
  return report;
}

async function deleteReport(reportId) {
  const report = getReportById(reportId);
  if (!report) return null;
  if (backendAvailable) {
    try {
      const result = await apiRequest(`/reports/${encodeURIComponent(report.id)}`, { method: "DELETE" });
      applyReportSnapshot(result);
      renderReportState();
      return report;
    } catch (error) {
      showToast("Nie usunięto zgłoszenia", error.message || "Backend odrzucił usunięcie.");
      return null;
    }
  }
  reports = reports.filter((item) => String(item.id) !== String(report.id));
  saveReportState();
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
      closeChatNewMenu();
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
  closeChatNewMenu();
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

function formatDateInputValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function calendarPayloadFromForm() {
  const title = $("#calendarTitleInput").value.trim();
  const dateValue = $("#calendarDateInput").value || formatDateInputValue();
  const selectedDate = new Date(`${dateValue}T00:00:00`);
  const safeDate = Number.isNaN(selectedDate.getTime()) ? new Date() : selectedDate;
  const day = Math.min(31, Math.max(1, safeDate.getDate()));
  const date = new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit" }).format(safeDate);
  const time = $("#calendarTimeInput").value || "09:00";
  return { day, title, date, time };
}

function openCalendarForm() {
  const today = new Date();
  $("#calendarForm").reset();
  $("#calendarDateInput").value = formatDateInputValue(today);
  $("#calendarTimeInput").value = "09:00";
  openDialog("#calendarFormDialog");
  $("#calendarTitleInput").focus();
}

async function createCalendarEvent(event) {
  event.preventDefault();
  const eventPayload = calendarPayloadFromForm();
  const { title } = eventPayload;
  if (!title) return;
  if (backendAvailable) {
    try {
      const result = await apiRequest("/calendar", {
        method: "POST",
        body: JSON.stringify(eventPayload),
      });
      applyCalendarSnapshot(result);
      renderCalendarState();
      $("#calendarFormDialog").close();
      pushNotification("Nowe wydarzenie", `${title} dodane do kalendarza.`, { view: "calendar" });
      showToast("Dodano wydarzenie w bazie", "Pojawiło się we wspólnym kalendarzu.");
      return;
    } catch (error) {
      showToast("Nie dodano wydarzenia", error.message || "Backend odrzucił zapis.");
      return;
    }
  }
  calendarEvents.push({
    id: makeCalendarEventId(),
    ...eventPayload,
    rsvp: "Niepotwierdzone",
    attendees: 1,
  });
  $("#calendarFormDialog").close();
  renderCalendar();
  pushNotification("Nowe wydarzenie", `${title} dodane do kalendarza.`, { view: "calendar" });
  showToast("Dodano wydarzenie", "Pojawiło się w kalendarzu i na liście nadchodzących.");
}

function openKnowledgeForm() {
  $("#kbForm").reset();
  updateKnowledgeFormSource();
  openDialog("#knowledgeFormDialog");
  $("#kbTitleInput").focus();
}

function updateKnowledgeFormSource() {
  const sourceType = $("#kbSourceType")?.value === "link" ? "link" : "file";
  const fileField = $("#kbFileField");
  const linkField = $("#kbLinkField");
  const fileInput = $("#kbFileInput");
  const linkInput = $("#kbLinkInput");
  fileField?.classList.toggle("hidden", sourceType !== "file");
  linkField?.classList.toggle("hidden", sourceType !== "link");
  if (fileInput) {
    fileInput.required = sourceType === "file";
    fileInput.disabled = sourceType !== "file";
  }
  if (linkInput) {
    linkInput.required = sourceType === "link";
    linkInput.disabled = sourceType !== "link";
  }
}

async function createKnowledgeArticle(event) {
  event.preventDefault();
  const form = event.target;
  const sourceType = $("#kbSourceType")?.value === "link" ? "link" : "file";
  const file = $("#kbFileInput").files?.[0];
  const linkUrl = $("#kbLinkInput")?.value.trim() || "";
  const title = $("#kbTitleInput").value.trim();
  const detail = $("#kbDetailInput").value.trim();
  const category = $("#kbCategoryInput")?.value || "";
  const tags = $("#kbTagsInput")?.value.trim() || "";
  const versionLabel = $("#kbVersionInput")?.value.trim() || "";
  const visibility = $("#kbVisibilityInput")?.value || "all";
  if (sourceType === "file" && !file) {
    showToast("Wybierz plik", "Dokument musi zawierać prawdziwy załącznik.");
    return;
  }
  if (sourceType === "link" && !linkUrl) {
    showToast("Dodaj link", "Wpisz pełny adres zaczynający się od http:// albo https://.");
    $("#kbLinkInput")?.focus();
    return;
  }
  if (sourceType === "link") {
    try {
      const parsedLink = new URL(linkUrl);
      if (!["http:", "https:"].includes(parsedLink.protocol)) throw new Error("invalid protocol");
    } catch (_error) {
      showToast("Nieprawidłowy link", "Link musi zaczynać się od http:// albo https://.");
      $("#kbLinkInput")?.focus();
      return;
    }
  }
  if (!detail) {
    showToast("Dodaj opis dokumentu", "Opis pomaga zespołowi znaleźć i poprawnie użyć pliku.");
    $("#kbDetailInput").focus();
    return;
  }
  const articlePayload = {
    type: sourceType === "link" ? "LINK" : fileIcon(file.type, file.name),
    title: title || (sourceType === "link" ? linkUrl : file.name.replace(/\.[^.]+$/, "")),
    detail,
    fileName: sourceType === "file" ? file.name : "",
    fileMime: sourceType === "file" ? file.type : "",
    fileSize: sourceType === "file" ? file.size : 0,
    linkUrl: sourceType === "link" ? linkUrl : "",
    category,
    tags,
    versionLabel,
    visibility,
  };
  if (backendAvailable) {
    try {
      const formData = new FormData(form);
      const result = await apiFormRequest("/knowledge/articles", formData);
      applyKnowledgeSnapshot(result);
      form.reset();
      $("#knowledgeFormDialog").close();
      renderKnowledgeState();
      const createdArticle = result.article || kbArticles.find((article) => article.title === articlePayload.title);
      pushNotification("Baza wiedzy", `Dodano dokument: ${articlePayload.title}`, {
        view: "knowledge",
        articleId: createdArticle?.id,
      });
      showToast("Dokument dodany w bazie", "Nowa pozycja jest widoczna dla wszystkich użytkowników.");
      return;
    } catch (error) {
      showToast("Nie dodano dokumentu", error.message || "Backend odrzucił zapis.");
      return;
    }
  }
  const articleId = makeKnowledgeArticleId();
  kbArticles.unshift({
    id: articleId,
    ...articlePayload,
    fileUrl: sourceType === "file" ? URL.createObjectURL(file) : "",
    createdBy: getActiveLogin(),
  });
  form.reset();
  $("#knowledgeFormDialog").close();
  renderKnowledgeState();
  pushNotification("Baza wiedzy", `Dodano dokument: ${articlePayload.title}`, { view: "knowledge", articleId });
  showToast("Dokument dodany", "Nowa pozycja jest widoczna w bazie wiedzy.");
}

async function boot() {
  updateTodayLabel();
  loadStoredState();
  applyUserPreferences(defaultUserPreferences);
  await syncAccountsFromBackend(undefined, { silent: true });
  renderMyDay();
  renderPeople();
  renderPosts();
  renderKudos();
  renderQuickPoll();
  renderKanban();
  renderSchedule();
  renderWageCalculator();
  renderCalendar();
  renderRequests();
  renderReports();
  renderStats();
  renderChat();
  renderInventory();
  renderStoreShortages();
  renderKnowledge();
  renderActivityLog();
  renderNotifications();
  restoreDashboardLayout();
  bindDashboardDrag();
  applyRole();
  renderTimer();
  renderAccountOptions();
  await prepareLoggedOutSession();

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
    saveUserPreferences({ theme: userPreferences.theme === "dark" ? "light" : "dark" });
  });
  $$("[data-settings-theme]").forEach((input) => {
    input.addEventListener("change", (event) => {
      if (event.target.checked) saveUserPreferences({ theme: event.target.value });
    });
  });
  $$("[data-settings-accent]").forEach((input) => {
    input.addEventListener("change", (event) => {
      if (event.target.checked) saveUserPreferences({ accent: event.target.value });
    });
  });
  $$("[data-settings-notification]").forEach((input) => {
    input.addEventListener("change", (event) => {
      saveUserPreferences({ notifications: { [event.target.value]: event.target.checked } });
      renderNotifications();
    });
  });
  $("#clockButton").addEventListener("click", toggleClock);
  $("#timeClockButton").addEventListener("click", toggleClock);
  $("#breakButton").addEventListener("click", toggleBreak);
  $("#addTaskButton").addEventListener("click", openTaskForm);
  $("#taskForm").addEventListener("submit", createTask);
  $("#taskCommentForm").addEventListener("submit", createTaskComment);
  $("#addEventButton").addEventListener("click", openCalendarForm);
  $("#calendarForm").addEventListener("submit", createCalendarEvent);
  $("#addInventoryButton").addEventListener("click", openInventoryForm);
  $("#receiveInventoryButton").addEventListener("click", openInventoryForm);
  $("#inventoryForm").addEventListener("submit", createInventoryItem);
  $("#inventorySearchInput").addEventListener("input", (event) => {
    inventorySearchQuery = event.target.value;
    renderInventory();
  });
  $$("[data-inventory-filter-button]").forEach((button) => {
    button.addEventListener("click", () => {
      currentInventoryFilter = button.dataset.inventoryFilterButton || "all";
      renderInventory();
    });
  });
  $("#storeShortageForm")?.addEventListener("submit", createStoreShortage);
  $("#shareStoreShortagesButton")?.addEventListener("click", shareStoreShortagesList);
  $$("[data-store-shortage-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      currentStoreShortageFilter = button.dataset.storeShortageFilter || "all";
      renderStoreShortages();
    });
  });
  $("[data-store-shortage-focus-form]")?.addEventListener("click", () => {
    activateView("storeShortages");
    $("#storeShortageForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => $("#storeShortageNameInput")?.focus(), 180);
  });
  $("#addKnowledgeButton").addEventListener("click", openKnowledgeForm);
  $("#addKudosButton").addEventListener("click", openKudosForm);
  $("#kudosForm").addEventListener("submit", createKudosEntry);
  $("#addPollButton").addEventListener("click", openPollForm);
  $("#pollForm").addEventListener("submit", createQuickPoll);
  $("#announcementForm").addEventListener("submit", createPost);
  $("#postAudience").addEventListener("change", updateAnnouncementRecipientsVisibility);
  updateAnnouncementRecipientsVisibility();
  $("#dashboardAnnouncementForm")?.addEventListener("submit", createDashboardPost);
  $("#dashboardPostAudience")?.addEventListener("change", updateDashboardComposerRecipientsVisibility);
  $("#dashboardPostAttachment")?.addEventListener("change", updateDashboardAttachmentLabel);
  $("[data-dashboard-attachment-button]")?.addEventListener("click", () => $("#dashboardPostAttachment")?.click());
  $("[data-dashboard-composer-toggle]")?.addEventListener("click", openDashboardComposer);
  $("[data-dashboard-composer-cancel]")?.addEventListener("click", () => closeDashboardComposer({ reset: true }));
  updateDashboardComposerRecipientsVisibility();
  updateDashboardAttachmentLabel();
  $("#postCommentForm").addEventListener("submit", createPostComment);
  $("#leaveForm").addEventListener("submit", createLeaveRequest);
  $("#reportForm").addEventListener("submit", createReport);
  $("#chatForm").addEventListener("submit", createChatMessage);
  $("#chatGroupForm").addEventListener("submit", createChatGroup);
  $("[data-chat-new-toggle]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleChatNewMenu();
  });
  $("#chatNewMenu")?.addEventListener("click", (event) => event.stopPropagation());
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".chat-new-wrap")) closeChatNewMenu();
  });
  $("#accountForm").addEventListener("submit", createAccount);
  $("#passwordForm").addEventListener("submit", changeOwnPassword);
  document.addEventListener("submit", async (event) => {
    if (event.target.matches("[data-account-password-form]")) {
      await changeManagedAccountPassword(event);
      return;
    }
    if (event.target.matches("[data-feed-comment-form]")) {
      await submitFeedInlineComment(event);
      return;
    }
    if (event.target.matches("[data-report-comment-form]")) {
      await createReportComment(event);
      return;
    }
  });
  $("[data-chat-attach]").addEventListener("click", () => $("#chatAttachmentInput").click());
  $("#chatAttachmentInput").addEventListener("change", (event) => stageChatAttachments(event.target.files));
  $("#myDayForm").addEventListener("submit", addMyDayItem);
  $("#handoverForm").addEventListener("submit", createHandoverNote);
  $("#kbForm").addEventListener("submit", createKnowledgeArticle);
  $("#kbSourceType")?.addEventListener("change", updateKnowledgeFormSource);
  updateKnowledgeFormSource();
  $("#kbSearchInput").addEventListener("input", (event) => {
    kbSearchQuery = event.target.value;
    renderKnowledge();
  });
  $("#activityFilterForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    selectedActivityDate = $("#activityDateInput").value || formatDateInput(new Date());
    await syncActivityLogFromBackend();
  });
  $("#activityTypeSelect").addEventListener("change", (event) => {
    selectedActivityType = event.target.value || "all";
    renderActivityLog();
  });
  $("#activitySortSelect").addEventListener("change", (event) => {
    selectedActivitySort = event.target.value || "time-desc";
    renderActivityLog();
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
  $("#menuToggle").addEventListener("click", toggleSidebarNavigation);
  window.addEventListener("resize", resetDesktopSidebarStateOnResize);
  $("#notificationsButton").addEventListener("click", () => openDialog("#notificationsDialog", { toggle: true }));
  $("#notificationTypeFilter").addEventListener("change", (event) => {
    currentNotificationFilter = event.target.value || "all";
    renderNotifications();
  });
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
  $("#statsExportButton").addEventListener("click", exportTimeCsv);
  $("#scheduleEditorForm").addEventListener("submit", saveScheduleEditor);
  $("#scheduleEditorMode").addEventListener("change", updateScheduleEditorMode);
  $("#scheduleClearButton").addEventListener("click", clearScheduleEditor);
  $("#copyPreviousScheduleButton").addEventListener("click", copyPreviousScheduleWeek);
  $("#bulkScheduleButton").addEventListener("click", openBulkScheduleForm);
  $("#bulkScheduleForm").addEventListener("submit", saveBulkScheduleForm);
  $("#bulkScheduleMode").addEventListener("change", updateBulkScheduleMode);
  $("#bulkScheduleClearButton").addEventListener("click", clearBulkScheduleForm);
  $("#adminTimeEditButton")?.addEventListener("click", () => openAdminTimeEdit());
  $("#adminTimeNewEntryButton")?.addEventListener("click", () => openAdminTimeEdit("", { blank: true }));
  $("#adminTimeEditForm")?.addEventListener("submit", saveAdminTimeEdit);
  $("#adminTimeUserSelect")?.addEventListener("change", (event) => {
    activeAdminTimeEdit = { userLogin: normalizeLogin(event.target.value) };
    fillAdminTimeFormFromPerson(event.target.value);
  });
  $("#adminTimeDateInput")?.addEventListener("change", refreshAdminTimeFormForDate);
  $("#schedulePrevWeek").addEventListener("click", () => shiftScheduleWeek(-1));
  $("#scheduleNextWeek").addEventListener("click", () => shiftScheduleWeek(1));
  $("#scheduleCurrentWeek").addEventListener("click", () => setScheduleWeek(formatDateInput(getWeekStartDate())));
  $("#scheduleWeekInput").addEventListener("change", (event) => setScheduleWeek(weekStartFromWeekInput(event.target.value)));
  $$("[data-time-week-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.timeWeekJump;
      if (action === "prev") return shiftScheduleWeek(-1);
      if (action === "next") return shiftScheduleWeek(1);
      return setScheduleWeek(formatDateInput(getWeekStartDate()));
    });
  });
  $("[data-time-week-input]")?.addEventListener("change", (event) => setScheduleWeek(weekStartFromWeekInput(event.target.value)));
  $("[data-time-export]")?.addEventListener("click", exportTimeCsv);
  $("#wageUserSelect").addEventListener("change", (event) => {
    selectedWageLogin = normalizeLogin(event.target.value || getActiveLogin());
    renderWageCalculator();
  });
  $("#wageRateInput").addEventListener("input", (event) => {
    const rate = Math.max(0, Number(event.target.value.replace(",", ".")) || 0);
    wageRates[selectedWageLogin || getActiveLogin()] = rate;
    saveWageRates();
    renderWageCalculator();
  });
  $("#wageSaturdayForm")?.addEventListener("submit", addSaturdayWageEntry);
  $("#wageSaturdayRateInput")?.addEventListener("input", renderWageCalculator);
  $("#wageSaturdayEntriesList")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-saturday-wage]");
    if (!button) return;
    removeSaturdayWageEntry(button.dataset.deleteSaturdayWage);
  });
  $("#correctionButton").addEventListener("click", openCorrectionForm);
  $("#correctionForm")?.addEventListener("submit", createCorrectionRequest);

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
    const addMenuButton = event.target.closest(".source-add-wrap > .add-btn");
    if (addMenuButton) {
      event.preventDefault();
      addMenuButton.closest(".source-add-wrap")?.classList.toggle("show");
      return;
    }

    if (!event.target.closest(".source-add-wrap")) {
      $$(".source-add-wrap.show").forEach((item) => item.classList.remove("show"));
    }

    const openTaskFormButton = event.target.closest("[data-open-task-form]");
    if (openTaskFormButton) {
      openTaskForm(openTaskFormButton.dataset.taskColumn || "todo");
      openTaskFormButton.closest(".source-add-wrap")?.classList.remove("show");
      return;
    }

    const openCalendarFormButton = event.target.closest("[data-open-calendar-form]");
    if (openCalendarFormButton) {
      openCalendarForm();
      openCalendarFormButton.closest(".source-add-wrap")?.classList.remove("show");
      return;
    }

    const viewShortcut = event.target.closest("[data-view-shortcut]");
    if (viewShortcut) {
      activateView(viewShortcut.dataset.viewShortcut);
      return;
    }

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

    const notificationReadButton = event.target.closest("[data-notification-read]");
    if (notificationReadButton) {
      const notification = renderedNotifications[Number(notificationReadButton.dataset.notificationRead)];
      markNotificationRead(notification);
      renderNotifications();
      return;
    }

    const scheduleEditButton = event.target.closest("[data-schedule-edit]");
    if (scheduleEditButton) {
      openScheduleEditor(scheduleEditButton);
      return;
    }

    const adminTimeEditPersonButton = event.target.closest("[data-admin-time-edit-person]");
    if (adminTimeEditPersonButton) {
      openAdminTimeEdit(adminTimeEditPersonButton.dataset.adminTimeEditPerson);
      return;
    }

    const calendarSourceFilterButton = event.target.closest("[data-calendar-source-filter]");
    if (calendarSourceFilterButton) {
      toggleCalendarSourceFilter(calendarSourceFilterButton.dataset.calendarSourceFilter);
      return;
    }

    const calendarDaySourceButton = event.target.closest("[data-calendar-day-source]");
    if (calendarDaySourceButton) {
      $("#calendarDayDialog")?.close();
      await openFeedItemSource(calendarDaySourceButton.dataset.calendarDaySource);
      return;
    }

    const calendarDayButton = event.target.closest("[data-calendar-day]");
    if (calendarDayButton) {
      openCalendarDayDetails(calendarDayButton.dataset.calendarDay);
      return;
    }

    const feedReactionButton = event.target.closest("[data-feed-reaction]");
    if (feedReactionButton) {
      await toggleAnnouncementReaction(feedReactionButton.dataset.feedPost, feedReactionButton.dataset.feedReaction);
      return;
    }

    const feedReadButton = event.target.closest("[data-feed-read]");
    if (feedReadButton) {
      const post = await markPostRead(feedReadButton.dataset.feedRead);
      if (post) showToast("Odczyt potwierdzony", post.title);
      return;
    }

    const feedInlineCommentButton = event.target.closest("[data-feed-comment-toggle]");
    if (feedInlineCommentButton) {
      toggleFeedInlineComments(feedInlineCommentButton.dataset.feedCommentToggle);
      return;
    }

    const feedCommentButton = event.target.closest("[data-feed-comment]");
    if (feedCommentButton) {
      await openPostComments(feedCommentButton.dataset.feedComment);
      return;
    }

    const taskCommentButton = event.target.closest("[data-task-comment]");
    if (taskCommentButton) {
      openTaskComments(taskCommentButton.dataset.taskComment);
      return;
    }

    const taskReactionButton = event.target.closest("[data-task-reaction]");
    if (taskReactionButton) {
      await toggleTaskReaction(taskReactionButton.dataset.taskReaction, taskReactionButton.dataset.reactionId);
      return;
    }

    const reportCommentButton = event.target.closest("[data-report-comment]");
    if (reportCommentButton) {
      openReportComments(reportCommentButton.dataset.reportComment);
      return;
    }

    const reportReactionButton = event.target.closest("[data-report-reaction]");
    if (reportReactionButton) {
      await toggleReportReaction(reportReactionButton.dataset.reportReaction, reportReactionButton.dataset.reactionId);
      return;
    }

    const feedSourceButton = event.target.closest("[data-feed-source], [data-feed-item]");
    if (feedSourceButton) {
      await openFeedItemSource(feedSourceButton.dataset.feedSource || feedSourceButton.dataset.feedItem);
      return;
    }

    const feedPinButton = event.target.closest("[data-feed-pin]");
    if (feedPinButton) {
      toggleFeedItemPin(feedPinButton.dataset.feedPin);
      return;
    }

    const feedDetailButton = event.target.closest("[data-feed-detail]");
    if (feedDetailButton) {
      openFeedItemDetails(feedDetailButton.dataset.feedDetail);
      return;
    }

    const feedDialogSourceButton = event.target.closest("[data-feed-dialog-source]");
    if (feedDialogSourceButton) {
      feedDialogSourceButton.closest("dialog")?.close();
      await openFeedItemSource(activeFeedItemId);
      return;
    }

    const quickReportButton = event.target.closest("[data-quick-report]");
    if (quickReportButton) {
      quickReportButton.closest(".source-add-wrap")?.classList.remove("show");
      activateView("reports");
      window.setTimeout(() => $("#reportText")?.focus(), 0);
      showToast("Nowe zgłoszenie", "Uzupełnij zgłoszenie w panelu.");
      return;
    }

    const quickAnnouncementButton = event.target.closest("[data-quick-announcement]");
    if (quickAnnouncementButton) {
      quickAnnouncementButton.closest(".source-add-wrap")?.classList.remove("show");
      if ($("#dashboard")?.classList.contains("active-view")) {
        openDashboardComposer();
        return;
      }
      activateView("announcements");
      window.setTimeout(() => $("#postTitle")?.focus(), 0);
      showToast("Nowe ogłoszenie", "Uzupełnij ogłoszenie w formularzu.");
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

    const taskReopenButton = event.target.closest("[data-task-reopen]");
    if (taskReopenButton) {
      await moveTask(taskReopenButton.dataset.taskReopen, "review");
      return;
    }

    const taskDeleteButton = event.target.closest("[data-task-delete]");
    if (taskDeleteButton) {
      await deleteTask(taskDeleteButton.dataset.taskDelete);
      return;
    }

    const activeTaskReopenButton = event.target.closest("[data-task-reopen-active]");
    if (activeTaskReopenButton && activeTaskId) {
      await moveTask(activeTaskId, "review");
      return;
    }

    const activeTaskDeleteButton = event.target.closest("[data-task-delete-active]");
    if (activeTaskDeleteButton && activeTaskId) {
      await deleteTask(activeTaskId);
      activeTaskId = null;
      return;
    }

    const knowledgeDetailsButton = event.target.closest("[data-kb-details]");
    if (knowledgeDetailsButton) {
      await openKnowledgeDetails(knowledgeDetailsButton.dataset.kbDetails);
      return;
    }

    const storeShortageStatusButton = event.target.closest("[data-store-shortage-status]");
    if (storeShortageStatusButton) {
      await updateStoreShortageStatus(
        storeShortageStatusButton.dataset.storeShortageStatus,
        storeShortageStatusButton.dataset.status,
      );
      return;
    }

    const closeDialogButton = event.target.closest("[data-close-dialog]");
    if (closeDialogButton) {
      closeDialogButton.closest("dialog")?.close();
      return;
    }

    const reactionButton = event.target.closest("[data-post-reaction]");
    if (reactionButton) {
      await toggleAnnouncementReaction(activePostId, reactionButton.dataset.postReaction);
      return;
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

    const dashboardConversationButton = event.target.closest("[data-dashboard-conversation]");
    if (dashboardConversationButton) {
      currentConversation = dashboardConversationButton.dataset.dashboardConversation;
      clearStagedChatAttachments();
      activateView("chat");
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
          pushNotification("Decyzja zapisana", `${request.title}: zaakceptowane.`, {
            view: request.kind === "leave" ? "leaves" : "time",
          });
          showToast(request.kind === "correction" ? "Korekta zastosowana" : "Decyzja zapisana", request.title);
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
          await updateReportStatus(report.id, "Przyjęte");
          showToast("Utworzono zadanie", report.title);
        }
        return;
      }
      applyRole();
      return;
    }

    const requestButton = event.target.closest("[data-request-action]");
    if (requestButton) {
      const request = requestButton.dataset.requestId
        ? requests.find((item) => String(item.id) === String(requestButton.dataset.requestId))
        : requests[Number(requestButton.dataset.requestIndex)];
      if (!request) return;
      const status = requestButton.dataset.requestAction === "approve" ? "Zaakceptowane" : "Odrzucone";
      const updatedRequest = await updateRequestStatus(request.id, status);
      if (updatedRequest) {
        showToast(request.kind === "correction" && status === "Zaakceptowane" ? "Korekta zastosowana" : "Status wniosku zmieniony", status);
      }
      return;
    }

    const leaveFilterButton = event.target.closest("[data-leave-filter]");
    if (leaveFilterButton) {
      currentLeaveFilter = leaveFilterButton.dataset.leaveFilter || "all";
      renderLeaves();
      applyRole();
      return;
    }

    const leaveFocusButton = event.target.closest("[data-focus-leave-form]");
    if (leaveFocusButton) {
      activateView("leaves");
      $("#leaveForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => $("#leaveType")?.focus(), 180);
      return;
    }

    const accountFormFocusButton = event.target.closest("[data-focus-account-form]");
    if (accountFormFocusButton) {
      activateView("team");
      $("#teamAccountAdmin")?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => $("#accountNameInput")?.focus(), 180);
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
        await updateReportStatus(report.id, "Przyjęte");
        renderKanban();
        showToast("Utworzono zadanie ze zgłoszenia", report.title);
      }
      return;
    }

    const reportAcceptButton = event.target.closest("[data-report-accept]");
    if (reportAcceptButton) {
      const report = await updateReportStatus(reportAcceptButton.dataset.reportAccept, "Przyjęte");
      if (report) showToast("Zgłoszenie przyjęte", report.title);
      return;
    }

    const reportCloseButton = event.target.closest("[data-report-close]");
    if (reportCloseButton) {
      const report = await updateReportStatus(reportCloseButton.dataset.reportClose, "Załatwione");
      if (report) showToast("Zgłoszenie zamknięte");
      return;
    }

    const reportReopenButton = event.target.closest("[data-report-reopen]");
    if (reportReopenButton) {
      const report = await updateReportStatus(reportReopenButton.dataset.reportReopen, "Przyjęte");
      if (report) showToast("Zgłoszenie przywrócone", report.title);
      return;
    }

    const reportDeleteButton = event.target.closest("[data-report-delete]");
    if (reportDeleteButton) {
      const report = await deleteReport(reportDeleteButton.dataset.reportDelete);
      if (report) showToast("Zgłoszenie usunięte", report.title);
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
      await voteQuickPoll(pollButton.dataset.pollVote, Number(pollButton.dataset.pollOption));
      return;
    }

    const announcementFocusButton = event.target.closest("[data-focus-announcement-form]");
    if (announcementFocusButton) {
      $("#announcementForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => $("#postTitle")?.focus(), 220);
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

  $("#feedTypeFilter").addEventListener("click", (event) => {
    const button = event.target.closest("[data-feed-type-filter]");
    if (!button || button.disabled) return;
    currentFeedTypeFilter = button.dataset.feedTypeFilter || "all";
    renderPosts(currentFeedFilter);
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
      refreshSharedCompanyData({ force: true, includePresence: true });
      pollChatMessages();
    }
  });

  window.addEventListener("focus", () => {
    refreshSharedCompanyData({ force: true, includePresence: true });
    pollChatMessages();
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

boot().catch((error) => {
  console.error(error);
  showToast("Błąd startu aplikacji", "Odśwież stronę albo uruchom backend ponownie.");
});
