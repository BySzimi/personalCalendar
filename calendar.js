const STORAGE_KEY = "bySzimiPersonalCalendar";

const state = {
  currentDate: new Date(),
  selectedDate: null,
  entries: loadEntries()
};

const calendarGrid = document.getElementById("calendarGrid");
const monthTitle = document.getElementById("monthTitle");
const selectedDateTitle = document.getElementById("selectedDateTitle");
const dayNotes = document.getElementById("dayNotes");
const saveStatus = document.getElementById("saveStatus");
const addModal = document.getElementById("addModal");
const eventDate = document.getElementById("eventDate");
const eventCategory = document.getElementById("eventCategory");
const eventText = document.getElementById("eventText");

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatMonth(date) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function isSameDate(a, b) {
  return dateKey(a) === dateKey(b);
}

function getMonthDays(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);

  // JavaScript starts weeks on Sunday. Convert this to a UK Monday-first week.
  const mondayIndex = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayIndex);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }

  return days;
}

function categoryLabel(category) {
  const labels = {
    work: "Work",
    personal: "Personal",
    appointment: "Appointment",
    important: "Important",
    youtube: "YouTube"
  };

  return labels[category] || "Note";
}

function renderCalendar() {
  monthTitle.textContent = formatMonth(state.currentDate);
  calendarGrid.innerHTML = "";

  const today = new Date();
  const days = getMonthDays(state.currentDate);

  days.forEach(day => {
    const key = dateKey(day);
    const entry = state.entries[key] || {};

    const cell = document.createElement("div");
    cell.className = "day";

    if (day.getMonth() !== state.currentDate.getMonth()) {
      cell.classList.add("other-month");
    }

    if (day.getDay() === 0 || day.getDay() === 6) {
      cell.classList.add("weekend");
    }

    if (isSameDate(day, today)) {
      cell.classList.add("today");
    }

    if (state.selectedDate === key) {
      cell.classList.add("selected");
    }

    const number = document.createElement("div");
    number.className = "date-number";
    number.textContent = day.getDate();

    const note = document.createElement("textarea");
    note.className = "day-note";
    note.value = entry.text || "";
    note.placeholder = "Write here…";
    note.setAttribute("aria-label", `Notes for ${formatLongDate(day)}`);

    note.addEventListener("input", () => {
      state.entries[key] = {
        ...(state.entries[key] || {}),
        text: note.value
      };

      saveEntries();
      updateSaveStatus("Saved automatically");
      updateSummary();
    });

    note.addEventListener("focus", () => {
      selectDay(key);
    });

    note.addEventListener("keydown", event => {
      if (event.key === "Tab") {
        event.preventDefault();
        moveToAdjacentDay(key, 1);
      }
    });

    cell.append(number);

    if (entry.category) {
      const marker = document.createElement("span");
      marker.className = `category-marker ${entry.category}`;
      marker.textContent = categoryLabel(entry.category);
      cell.append(marker);
    }

    cell.append(note);

    cell.addEventListener("click", () => selectDay(key));

    calendarGrid.append(cell);
  });

  updateSummary();
}

function selectDay(key) {
  state.selectedDate = key;

  const date = dateFromKey(key);
  selectedDateTitle.textContent = formatLongDate(date);
  dayNotes.value = state.entries[key]?.text || "";

  document.querySelectorAll(".day").forEach(cell => {
    cell.classList.remove("selected");
  });

  const dayIndex = getMonthDays(state.currentDate)
    .findIndex(day => dateKey(day) === key);

  if (dayIndex >= 0) {
    const cell = calendarGrid.children[dayIndex];
    if (cell) {
      cell.classList.add("selected");
    }
  }
}

dayNotes.addEventListener("input", () => {
  if (!state.selectedDate) return;

  state.entries[state.selectedDate] = {
    ...(state.entries[state.selectedDate] || {}),
    text: dayNotes.value
  };

  saveEntries();
  updateSaveStatus("Saved automatically");
  renderCalendar();
  selectDay(state.selectedDate);
});

function updateSaveStatus(message) {
  saveStatus.textContent = message;
}

function moveToAdjacentDay(key, offset) {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + offset);

  if (date.getMonth() !== state.currentDate.getMonth()) {
    state.currentDate = new Date(date.getFullYear(), date.getMonth(), 1);
    renderCalendar();
  }

  const newKey = dateKey(date);
  selectDay(newKey);

  const index = getMonthDays(state.currentDate)
    .findIndex(day => dateKey(day) === newKey);

  const cell = calendarGrid.children[index];
  const textarea = cell?.querySelector(".day-note");

  textarea?.focus();
}

function changeMonth(offset) {
  state.currentDate = new Date(
    state.currentDate.getFullYear(),
    state.currentDate.getMonth() + offset,
    1
  );

  state.selectedDate = dateKey(state.currentDate);

  renderCalendar();
  selectDay(state.selectedDate);
}

function goToday() {
  const today = new Date();

  state.currentDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  state.selectedDate = dateKey(today);

  renderCalendar();
  selectDay(state.selectedDate);
}

function openAddModal(category = "work") {
  const date = state.selectedDate
    ? dateFromKey(state.selectedDate)
    : new Date();

  eventDate.value = dateKey(date);
  eventCategory.value = category;
  eventText.value = "";

  addModal.classList.remove("hidden");
  eventText.focus();
}

function closeAddModal() {
  addModal.classList.add("hidden");
}

function saveEvent() {
  const key = eventDate.value;
  const text = eventText.value.trim();

  if (!key || !text) return;

  state.entries[key] = {
    ...(state.entries[key] || {}),
    text,
    category: eventCategory.value
  };

  saveEntries();
  closeAddModal();

  const date = dateFromKey(key);

  state.currentDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );

  state.selectedDate = key;

  renderCalendar();
  selectDay(key);
}

function updateSummary() {
  const month = state.currentDate.getMonth();
  const year = state.currentDate.getFullYear();

  let appointments = 0;
  let tasks = 0;
  let important = 0;

  Object.entries(state.entries).forEach(([key, entry]) => {
    const date = dateFromKey(key);

    if (
      date.getMonth() !== month ||
      date.getFullYear() !== year
    ) {
      return;
    }

    if (entry.category === "appointment") {
      appointments++;
    }

    if (entry.category === "important") {
      important++;
    }

    const text = entry.text || "";
    tasks += (text.match(/☐/g) || []).length;
  });

  document.getElementById("appointmentCount").textContent = appointments;
  document.getElementById("taskCount").textContent = tasks;
  document.getElementById("importantCount").textContent = important;
}

document.getElementById("prevMonthBtn")
  .addEventListener("click", () => changeMonth(-1));

document.getElementById("nextMonthBtn")
  .addEventListener("click", () => changeMonth(1));

document.getElementById("todayBtn")
  .addEventListener("click", goToday);

document.getElementById("addBtn")
  .addEventListener("click", () => openAddModal());

document.getElementById("closeDetailsBtn")
  .addEventListener("click", () => {
    state.selectedDate = null;

    document.querySelectorAll(".day").forEach(cell => {
      cell.classList.remove("selected");
    });

    selectedDateTitle.textContent = "Select a day";
    dayNotes.value = "";
  });

document.getElementById("modalCloseBtn")
  .addEventListener("click", closeAddModal);

document.getElementById("saveEventBtn")
  .addEventListener("click", saveEvent);

document.querySelectorAll(".quick-actions button")
  .forEach(button => {
    button.addEventListener("click", () => {
      openAddModal(button.dataset.category);
    });
  });

addModal.addEventListener("click", event => {
  if (event.target === addModal) {
    closeAddModal();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeAddModal();
  }
});

// Start on the current month.
goToday();
