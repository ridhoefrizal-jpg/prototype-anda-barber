/* ==========================================================================
   ANDA BARBER STUDIO — script.js
   Vanilla JavaScript, no dependencies, no backend.

   EDIT HERE:
   1. BUSINESS_CONFIG  → WhatsApp, TikTok, Google Maps, address, opening hours
   2. SERVICES         → service names and prices
   ========================================================================== */

/* ---------- 1. Business configuration ---------- */
const BUSINESS_CONFIG = {
  name: "ANDA BARBER STUDIO",
  tagline: "YOUR STYLE. YOUR RULES.",
  whatsapp: "6281541478281",                    // digits only, with country code (no +, no spaces)
  phoneDisplay: "+62 815-4147-8281",            // how the number is shown on the page
  tiktok: "https://www.tiktok.com/@anda_haircut?_r=1&_t=ZS-9BOoiCOBdvY",
  tiktokHandle: "@anda_haircut",
  googleMaps: "https://share.google/aBwxF6rWPq5k4GynJ",
  address: "",                                  // leave empty until the official address is confirmed
  openingHours: {
    open: "09:00",
    close: "21:00",
    display: "09.00 - 21.00 WIB",
    timezone: "Asia/Jakarta"
  }
};

/* ---------- 2. Services & prices ----------
   price: { min, max }  → max: null means a single fixed price.
   category: services with the same category are grouped together.
   To add a service, copy one line and change id (must be unique), name and price. */
const SERVICE_CATEGORIES = {
  grooming: "Haircut & Grooming",
  treatment: "Hair Treatment"
};

const SERVICES = [
  { id: "haircut",           category: "grooming",  name: "Haircut",                price: { min: 20000,  max: null } },
  { id: "haircut-keramas",   category: "grooming",  name: "Haircut + Keramas",      price: { min: 25000,  max: null } },
  { id: "shaving",           category: "grooming",  name: "Shaving",                price: { min: 5000,   max: null } },
  { id: "coloring-basic",    category: "treatment", name: "Hair Coloring Basic",    price: { min: 50000,  max: null } },
  { id: "coloring-fashion",  category: "treatment", name: "Hair Coloring Fashion",  price: { min: 150000, max: 200000 } },
  { id: "perming",           category: "treatment", name: "Perming",                price: { min: 150000, max: 200000 } },
  { id: "down-perm",         category: "treatment", name: "Down Perm",              price: { min: 100000, max: null } },
  { id: "smoothing-keratin", category: "treatment", name: "Smoothing/Keratin",      price: { min: 200000, max: 250000 } }
];

/* ==========================================================================
   Helpers
   ========================================================================== */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 150000 → "Rp150.000" */
function formatRupiah(amount) {
  return "Rp" + String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function isRange(service) {
  return service.price.max !== null && service.price.max !== service.price.min;
}

/** "Rp150.000 – Rp200.000" or "Rp20.000" */
function priceLabel(service) {
  return isRange(service)
    ? `${formatRupiah(service.price.min)} \u2013 ${formatRupiah(service.price.max)}`
    : formatRupiah(service.price.min);
}

function findService(id) {
  return SERVICES.find((s) => s.id === id) || null;
}

function whatsappBase() {
  return `https://wa.me/${BUSINESS_CONFIG.whatsapp}`;
}

/** "09:00" → minutes since midnight */
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** "21:00" → "09:00 PM" */
function to12h(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Current date (YYYY-MM-DD) and minutes-since-midnight in the business time zone. */
function nowInBusinessZone() {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: BUSINESS_CONFIG.openingHours.timezone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    const get = (type) => parts.find((p) => p.type === type).value;
    return {
      date: `${get("year")}-${get("month")}-${get("day")}`,
      minutes: Number(get("hour")) * 60 + Number(get("minute"))
    };
  } catch (err) {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      minutes: d.getHours() * 60 + d.getMinutes()
    };
  }
}

/** "2026-11-14" → "Sabtu, 14 November 2026" (Indonesian) */
function formatDateLong(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric"
  }).format(date);
}

/** True when the string is a real calendar date in YYYY-MM-DD format. */
function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/* ==========================================================================
   Apply configuration to the page
   ========================================================================== */
function applyConfig() {
  const c = BUSINESS_CONFIG;
  const { open, close } = c.openingHours;

  $$("[data-whatsapp-link], [data-phone-link]").forEach((el) => { el.href = whatsappBase(); });
  $$("[data-tiktok-link]").forEach((el) => { el.href = c.tiktok; });
  $$("[data-maps-link]").forEach((el) => { el.href = c.googleMaps; });
  $$("[data-phone-display]").forEach((el) => { el.textContent = c.phoneDisplay; });
  $$("[data-tiktok-handle]").forEach((el) => { el.textContent = c.tiktokHandle; });

  const hours = {
    hero: `${open} \u2014 ${close} WIB`,
    long: `${to12h(open)} \u2014 ${to12h(close)} WIB`,
    footer: `${open}\u2013${close} WIB`
  };
  $$("[data-hours]").forEach((el) => {
    const text = hours[el.dataset.hours];
    if (text) el.textContent = text;
  });

  // Time input limits follow the configured opening hours
  const timeInput = $("#time");
  if (timeInput) { timeInput.min = open; timeInput.max = close; }

  // Address is shown only when one has been provided
  const addressRow = $("[data-address-row]");
  if (addressRow && c.address.trim()) {
    $("[data-address]", addressRow).textContent = c.address.trim();
    addressRow.hidden = false;
  }
}

/* ==========================================================================
   Services list + select options
   ========================================================================== */
function renderServices() {
  const list = $("#services-list");
  if (!list) return;

  const frag = document.createDocumentFragment();
  let number = 0;

  Object.entries(SERVICE_CATEGORIES).forEach(([categoryId, categoryName]) => {
    const items = SERVICES.filter((s) => s.category === categoryId);
    if (!items.length) return;

    const group = document.createElement("div");
    group.className = "service-group reveal";

    const title = document.createElement("h3");
    title.className = "service-group__title";
    title.textContent = categoryName;
    const count = document.createElement("span");
    count.className = "service-group__count";
    count.textContent = `${items.length} ${items.length === 1 ? "SERVICE" : "SERVICES"}`;
    title.appendChild(count);
    group.appendChild(title);

    items.forEach((service) => {
      number += 1;
      const row = document.createElement("article");
      row.className = "service";

      const no = document.createElement("span");
      no.className = "service__no";
      no.textContent = String(number).padStart(2, "0");

      const name = document.createElement("h4");
      name.className = "service__name";
      name.textContent = service.name.replace(/\//g, "/\u200b"); // allow a line break after "/"

      const price = document.createElement("p");
      price.className = "service__price";
      if (isRange(service)) {
        const tag = document.createElement("span");
        tag.className = "service__tag";
        tag.textContent = "Price range";
        price.appendChild(tag);
      }
      price.appendChild(document.createTextNode(priceLabel(service)));

      const action = document.createElement("div");
      action.className = "service__action";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn--ghost btn--small";
      btn.textContent = "Book this service";
      btn.setAttribute("aria-label", `Book this service: ${service.name}, ${priceLabel(service)}`);
      btn.dataset.book = service.id;
      action.appendChild(btn);

      row.append(no, name, price, action);
      group.appendChild(row);
    });

    frag.appendChild(group);
  });

  list.appendChild(frag);

  // Delegated click: "BOOK THIS SERVICE"
  list.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-book]");
    if (btn) selectServiceAndScroll(btn.dataset.book);
  });
}

function populateServiceSelect() {
  const select = $("#service");
  if (!select) return;

  Object.entries(SERVICE_CATEGORIES).forEach(([categoryId, categoryName]) => {
    const items = SERVICES.filter((s) => s.category === categoryId);
    if (!items.length) return;
    const group = document.createElement("optgroup");
    group.label = categoryName;
    items.forEach((service) => {
      const option = document.createElement("option");
      option.value = service.id;
      option.textContent = `${service.name} \u2014 ${priceLabel(service)}`;
      group.appendChild(option);
    });
    select.appendChild(group);
  });
}

function updatePriceReadout() {
  const output = $("#price-readout");
  const service = findService($("#service").value);
  output.replaceChildren();

  if (!service) {
    output.textContent = "Select a service to see its price";
    output.classList.add("is-empty");
    return;
  }

  output.classList.remove("is-empty");
  output.appendChild(document.createTextNode(priceLabel(service)));
  if (isRange(service)) {
    const note = document.createElement("span");
    note.className = "price-readout__note";
    note.textContent = "Price range. The final price is confirmed by the barber.";
    output.appendChild(note);
  }
}

function selectServiceAndScroll(serviceId) {
  const select = $("#service");
  const form = $("#booking-form");
  if (!select || !findService(serviceId)) return;

  select.value = serviceId;
  clearFieldError("service");
  updatePriceReadout();

  $("#booking").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });

  form.classList.remove("is-flash");
  void form.offsetWidth; // restart the highlight animation
  form.classList.add("is-flash");

  // Move focus to the next empty field once the scroll has (mostly) finished
  window.setTimeout(() => {
    const next = ["name", "phone", "date", "time"].map((id) => $("#" + id)).find((el) => !el.value);
    if (next) next.focus({ preventScroll: true });
  }, reducedMotion ? 0 : 700);
}

/* ==========================================================================
   Navigation
   ========================================================================== */
function initNavigation() {
  const header = $("#site-header");
  const toggle = $(".nav-toggle");
  const menu = $("#primary-nav");
  const toTop = $("#to-top");
  const links = $$(".nav-link");

  // Sticky header background + back-to-top visibility (throttled with rAF)
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
      toTop.classList.toggle("is-visible", window.scrollY > 700);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu
  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (event) => { if (event.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia("(min-width: 960px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

  // Active link (scroll spy). Booking counts as "Services", social as "Location".
  const sectionToLink = { home: "home", services: "services", booking: "services", gallery: "gallery", about: "about", location: "location", social: "location" };
  const sections = Object.keys(sectionToLink).map((id) => document.getElementById(id)).filter(Boolean);

  function setActive(sectionId) {
    const target = sectionToLink[sectionId];
    links.forEach((link) => {
      if (link.getAttribute("href") === "#" + target) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((section) => spy.observe(section));
  }

  // Back to top
  toTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  });
}

/* ==========================================================================
   Scroll reveal
   ========================================================================== */
function initReveal() {
  const items = $$(".reveal");
  if (!("IntersectionObserver" in window) || reducedMotion) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  items.forEach((el) => observer.observe(el));
}

/* ==========================================================================
   Booking form → WhatsApp
   ========================================================================== */
const fieldIds = ["name", "phone", "service", "date", "time"];

/** Accepts 08xx, 628xx and +628xx styles. Returns { valid, display, digits }. */
function parsePhone(raw) {
  const value = raw.trim();
  if (!value || /[^\d\s+\-().]/.test(value)) return { valid: false };

  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (digits.startsWith("8")) digits = "62" + digits;

  if (!/^628\d{8,11}$/.test(digits)) return { valid: false };

  const rest = digits.slice(2);
  return {
    valid: true,
    digits,
    display: `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`
  };
}

const validators = {
  name(form) {
    const value = form.name.value.trim();
    if (!value) return "Please enter your name.";
    if (value.length < 2) return "Your name is too short.";
    return "";
  },
  phone(form) {
    const value = form.phone.value.trim();
    if (!value) return "Please enter your WhatsApp number.";
    if (!parsePhone(value).valid) return "Enter a valid Indonesian number, for example 0812 3456 7890 or +62 812 3456 7890.";
    return "";
  },
  service(form) {
    return findService(form.service.value) ? "" : "Please choose a service.";
  },
  date(form) {
    const value = form.date.value;
    if (!value) return "Please choose a date.";
    if (!isValidIsoDate(value)) return "That date is not valid.";
    if (value < nowInBusinessZone().date) return "The date cannot be in the past.";
    return "";
  },
  time(form) {
    const value = form.time.value;
    const { open, close } = BUSINESS_CONFIG.openingHours;
    if (!value) return "Please choose a preferred time.";
    if (!/^\d{2}:\d{2}$/.test(value)) return "That time is not valid.";
    const minutes = toMinutes(value);
    if (minutes < toMinutes(open) || minutes > toMinutes(close)) {
      return `Please pick a time between ${open} and ${close} WIB.`;
    }
    const now = nowInBusinessZone();
    if (form.date.value === now.date && minutes < now.minutes) {
      return "That time has already passed today. Please pick a later time.";
    }
    return "";
  }
};

function setFieldError(id, message) {
  const input = $("#" + id);
  const error = $("#err-" + id);
  input.setAttribute("aria-invalid", "true");
  error.textContent = message;
}

function clearFieldError(id) {
  const input = $("#" + id);
  const error = $("#err-" + id);
  if (!input || !error) return;
  input.removeAttribute("aria-invalid");
  error.textContent = "";
}

function showFormAlert(message, ok = false) {
  const alertBox = $("#form-alert");
  alertBox.textContent = message;
  alertBox.classList.toggle("form-alert--ok", ok);
  alertBox.hidden = false;
}

function hideFormAlert() {
  const alertBox = $("#form-alert");
  alertBox.hidden = true;
  alertBox.textContent = "";
}

function validateForm(form) {
  const errors = {};
  fieldIds.forEach((id) => {
    const message = validators[id](form);
    if (message) errors[id] = message;
  });
  return errors;
}

function collectBookingData(form) {
  const service = findService(form.service.value);
  const phone = parsePhone(form.phone.value);
  return {
    name: form.name.value.trim(),
    phone: phone.display,
    serviceName: service.name,
    price: priceLabel(service),
    isRange: isRange(service),
    dateIso: form.date.value,
    dateLabel: formatDateLong(form.date.value),
    time: form.time.value,
    notes: form.notes.value.trim()
  };
}

/** Builds the WhatsApp text exactly following the business template. */
function buildWhatsAppMessage(data) {
  return [
    "Halo ANDA BARBER STUDIO!",
    "",
    "Saya ingin melakukan reservasi.",
    "",
    `Nama: ${data.name}`,
    `Nomor WhatsApp: ${data.phone}`,
    `Layanan: ${data.serviceName}`,
    `Harga: ${data.price}`,
    `Tanggal: ${data.dateLabel}`,
    `Jam: ${data.time} WIB`,
    `Catatan: ${data.notes || "-"}`,
    "",
    "Mohon konfirmasi ketersediaan jadwal.",
    "",
    "Terima kasih."
  ].join("\n");
}

function buildWhatsAppUrl(data) {
  return `${whatsappBase()}?text=${encodeURIComponent(buildWhatsAppMessage(data))}`;
}

function openSummary(data) {
  const dialog = $("#summary-dialog");
  const list = $("#summary-list");
  list.replaceChildren();

  const rows = [
    ["Name", data.name],
    ["WhatsApp", data.phone],
    ["Service", data.serviceName],
    ["Price", data.isRange ? `${data.price} (final price confirmed by barber)` : data.price],
    ["Date", data.dateLabel],
    ["Time", `${data.time} WIB`],
    ["Notes", data.notes || "-"]
  ];
  rows.forEach(([label, value]) => {
    const wrap = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    wrap.append(dt, dd);
    list.appendChild(wrap);
  });

  $("#summary-send").href = buildWhatsAppUrl(data);
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeDialog(dialog) {
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

function initBooking() {
  const form = $("#booking-form");
  const dateInput = $("#date");
  if (!form) return;

  function refreshDateMin() { dateInput.min = nowInBusinessZone().date; }
  refreshDateMin();
  dateInput.addEventListener("focus", refreshDateMin);

  $("#service").addEventListener("change", () => { updatePriceReadout(); });
  updatePriceReadout();

  // Re-validate a field live once it has been flagged as invalid
  fieldIds.forEach((id) => {
    const input = $("#" + id);
    const handler = () => {
      hideFormAlert();
      if (input.getAttribute("aria-invalid") === "true") {
        const message = validators[id](form);
        if (message) setFieldError(id, message); else clearFieldError(id);
      }
      // Date and time depend on each other (today's past times)
      if (id === "date" && $("#time").getAttribute("aria-invalid") === "true") {
        const m = validators.time(form);
        if (m) setFieldError("time", m); else clearFieldError("time");
      }
    };
    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    hideFormAlert();

    const errors = validateForm(form);
    fieldIds.forEach((id) => { if (errors[id]) setFieldError(id, errors[id]); else clearFieldError(id); });

    const failed = fieldIds.filter((id) => errors[id]);
    if (failed.length) {
      showFormAlert(failed.length === 1
        ? "Please fix the highlighted field."
        : `Please fix the ${failed.length} highlighted fields.`);
      $("#" + failed[0]).focus();
      return;
    }

    openSummary(collectBookingData(form));
  });

  // Summary dialog actions
  const dialog = $("#summary-dialog");
  $("#summary-edit").addEventListener("click", () => closeDialog(dialog));
  $("#summary-send").addEventListener("click", () => {
    closeDialog(dialog);
    showFormAlert("WhatsApp is opening with your message. Your booking is NOT confirmed yet. Please wait for our admin to reply.", true);
  });
  dialog.addEventListener("click", (event) => { if (event.target === dialog) closeDialog(dialog); });
}

/* ==========================================================================
   Gallery lightbox
   ========================================================================== */
function initLightbox() {
  const triggers = $$("[data-full]");
  const box = $("#lightbox");
  if (!triggers.length || !box) return;

  const img = $("#lb-img");
  const caption = $("#lb-caption");
  let index = 0;
  let lastTrigger = null;

  function show(i) {
    index = (i + triggers.length) % triggers.length;
    const trigger = triggers[index];
    const thumb = $("img", trigger);
    img.src = trigger.dataset.full;
    img.alt = thumb ? thumb.alt : "";
    caption.textContent = trigger.dataset.caption || "";
  }

  function open(i) {
    lastTrigger = triggers[i];
    show(i);
    if (typeof box.showModal === "function") box.showModal(); else box.setAttribute("open", "");
    $("#lb-close").focus();
  }

  function close() {
    closeDialog(box);
    if (lastTrigger) lastTrigger.focus();
  }

  triggers.forEach((trigger, i) => trigger.addEventListener("click", () => open(i)));
  $("#lb-close").addEventListener("click", close);
  $("#lb-prev").addEventListener("click", () => show(index - 1));
  $("#lb-next").addEventListener("click", () => show(index + 1));
  box.addEventListener("click", (event) => { if (event.target === box) close(); });
  box.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") show(index - 1);
    if (event.key === "ArrowRight") show(index + 1);
  });
  box.addEventListener("close", () => { img.removeAttribute("src"); });
}

/* ==========================================================================
   Init
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  applyConfig();
  renderServices();
  populateServiceSelect();
  initNavigation();
  initBooking();
  initLightbox();
  initReveal(); // last, so dynamically rendered .reveal elements are observed
});
