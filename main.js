// Replace these placeholder values with your real Firebase project keys
const firebaseConfig = {
  apiKey: "AIzaSyCCaKoIgkyny23S35QfJLaCo" + "gJ6lNFYW3o",
  authDomain: "resumemint-52d9c" + ".firebaseapp.com",
  projectId: "resumemint-52d9c",
  storageBucket: "resumemint-52d9c" + ".firebasestorage.app",
  messagingSenderId: "891917154087",
  appId: "1:891917154087:web" + ":b5a63a9bf074e56a121b02"
};

let auth = null;
let db = null;

try {
  if (typeof firebase !== "undefined" && firebaseConfig.apiKey) {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    db = firebase.firestore();
  }
} catch (err) {
  console.warn("Firebase init error:", err.message);
}
let appConfig = {
  cvPrice: 150,
  clPrice: 50,
  bundlePrice: 180,
  mpesaNumber: "0703592418",
  promoCode: "",
  bannerText: "",
  freeMode: false
};

let currentDocMode = "cv";
let selectedPayItem = "cv";
let unlockedItems = { cv: false, cl: false };

window.addEventListener("DOMContentLoaded", () => {
  addExperienceField();
  addEducationField();
  loadSavedDraft();
  loadAdminConfigFromDB();

  const dateEl = document.getElementById("clPrevDate");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }
  updatePreview();
});

async function loadAdminConfigFromDB() {
  if (!db) {
    applyConfigToUI();
    return;
  }
  try {
    const doc = await db.collection("settings").doc("config").get();
    if (doc.exists) {
      appConfig = { ...appConfig, ...doc.data() };
    }
  } catch (err) {
    console.warn("Using local config:", err.message);
  }
  applyConfigToUI();
}

function applyConfigToUI() {
  document.querySelectorAll(".price-cv").forEach((el) => (el.textContent = appConfig.cvPrice));
  document.querySelectorAll(".price-cl").forEach((el) => (el.textContent = appConfig.clPrice));
  document.querySelectorAll(".price-bundle").forEach((el) => (el.textContent = appConfig.bundlePrice));

  const mpesaEl = document.getElementById("displayMpesaNumber");
  if (mpesaEl) mpesaEl.textContent = appConfig.mpesaNumber;

  const banner = document.getElementById("topBanner");
  const bannerText = document.getElementById("topBannerText");
  if (banner && bannerText) {
    if (appConfig.bannerText && appConfig.bannerText.trim() !== "") {
      bannerText.textContent = appConfig.bannerText;
      banner.classList.remove("hidden");
    } else {
      banner.classList.add("hidden");
    }
  }

  if (appConfig.freeMode) {
    unlockedItems.cv = true;
    unlockedItems.cl = true;
  }
  refreshLockState();
}

function switchDocMode(mode) {
  currentDocMode = mode;
  document.getElementById("tabBtnCV").classList.toggle("active", mode === "cv");
  document.getElementById("tabBtnCL").classList.toggle("active", mode === "cl");

  document.getElementById("cvFormSection").classList.toggle("hidden", mode !== "cv");
  document.getElementById("clFormSection").classList.toggle("hidden", mode !== "cl");

  document.getElementById("cvPreviewContent").classList.toggle("hidden", mode !== "cv");
  document.getElementById("clPreviewContent").classList.toggle("hidden", mode !== "cl");

  refreshLockState();
  updatePreview();
}

function addExperienceField(data = {}) {
  const container = document.getElementById("experienceInputs");
  const div = document.createElement("div");
  div.className = "dynamic-item exp-entry";
  div.innerHTML = `
    <button type="button" class="remove-item-btn" onclick="this.parentElement.remove(); updatePreview();">Remove</button>
    <div class="form-group">
      <input type="text" class="exp-role" placeholder="Job Title (e.g. Sales Clerk)" value="${data.role || ""}" oninput="updatePreview()" />
    </div>
    <div class="form-row">
      <input type="text" class="exp-company" placeholder="Company Name" value="${data.company || ""}" oninput="updatePreview()" />
      <input type="text" class="exp-dates" placeholder="e.g. Jan 2023 - Present" value="${data.dates || ""}" oninput="updatePreview()" />
    </div>
    <div class="form-group" style="margin-top:8px;">
      <textarea class="exp-desc" rows="2" placeholder="• Key duties and achievements..." oninput="updatePreview()">${data.desc || ""}</textarea>
    </div>
  `;
  container.appendChild(div);
}

function addEducationField(data = {}) {
  const container = document.getElementById("educationInputs");
  const div = document.createElement("div");
  div.className = "dynamic-item edu-entry";
  div.innerHTML = `
    <button type="button" class="remove-item-btn" onclick="this.parentElement.remove(); updatePreview();">Remove</button>
    <div class="form-group">
      <input type="text" class="edu-degree" placeholder="Certificate / Diploma / Degree" value="${data.degree || ""}" oninput="updatePreview()" />
    </div>
    <div class="form-row">
      <input type="text" class="edu-school" placeholder="Institution Name" value="${data.school || ""}" oninput="updatePreview()" />
      <input type="text" class="edu-year" placeholder="Year (e.g. 2022)" value="${data.year || ""}" oninput="updatePreview()" />
    </div>
  `;
  container.appendChild(div);
}

function autoFillCoverLetter() {
  const role = document.getElementById("jobTitle").value;
  const skills = document.getElementById("skills").value;
  if (role) document.getElementById("clRole").value = role;
  if (skills) {
    document.getElementById("clBodyExtra").value =
      `I bring practical experience in ${skills}, along with a strong work ethic and dedication to delivering reliable results.`;
  }
  updatePreview();
}

function updatePreview() {
  const sheet = document.getElementById("documentSheet");
  const tmpl = document.getElementById("templateSelect").value;
  const isUnlocked = !!unlockedItems[currentDocMode];
  sheet.className = `a4-sheet template-${tmpl} ${isUnlocked ? "unlocked" : ""}`;

  const name = document.getElementById("fullName").value || "YOUR FULL NAME";
  const title = document.getElementById("jobTitle").value || "Target Job Title";
  const phone = document.getElementById("phone").value || "Phone";
  const email = document.getElementById("email").value || "Email";
  const location = document.getElementById("location").value || "Location";

  document.getElementById("prevName").textContent = name.toUpperCase();
  document.getElementById("prevTitle").textContent = title;
  document.getElementById("prevContact").textContent = `${phone} • ${email} • ${location}`;
  document.getElementById("prevSummary").textContent =
    document.getElementById("summary").value || "Your professional summary will appear here as you type...";
  document.getElementById("prevSkills").textContent =
    document.getElementById("skills").value || "Skill 1 • Skill 2 • Skill 3";
  document.getElementById("prevReferees").textContent =
    document.getElementById("referees").value || "Available upon request.";

  const expList = document.getElementById("prevExperienceList");
  expList.innerHTML = "";
  document.querySelectorAll(".exp-entry").forEach((entry) => {
    const r = entry.querySelector(".exp-role").value;
    const c = entry.querySelector(".exp-company").value;
    const d = entry.querySelector(".exp-dates").value;
    const desc = entry.querySelector(".exp-desc").value;
    if (r || c || d || desc) {
      expList.innerHTML += `
        <div class="exp-item">
          <div class="exp-top"><span>${[r, c].filter(Boolean).join(" — ")}</span><span>${d}</span></div>
          <p>${desc}</p>
        </div>`;
    }
  });

  const eduList = document.getElementById("prevEducationList");
  eduList.innerHTML = "";
  document.querySelectorAll(".edu-entry").forEach((entry) => {
    const deg = entry.querySelector(".edu-degree").value;
    const sch = entry.querySelector(".edu-school").value;
    const yr = entry.querySelector(".edu-year").value;
    if (deg || sch || yr) {
      eduList.innerHTML += `
        <div class="edu-item">
          <div class="exp-top"><span>${[deg, sch].filter(Boolean).join(" — ")}</span><span>${yr}</span></div>
        </div>`;
    }
  });

  const clRecipient = document.getElementById("clRecipient").value || "The Human Resource Manager";
  const clCompany = document.getElementById("clCompany").value || "[Company Name]";
  const clRole = document.getElementById("clRole").value || title;
  const clExtra = document.getElementById("clBodyExtra").value;

  document.getElementById("clPrevName").textContent = name.toUpperCase();
  document.getElementById("clPrevContact").textContent = `${phone} | ${email} | ${location}`;
  document.getElementById("clPrevRecipient").innerHTML = `${clRecipient},<br/><strong>${clCompany}</strong>`;
  document.getElementById("clPrevRole").textContent = clRole.toUpperCase();
  document.getElementById("clPrevIntro").textContent =
    `I am writing to express my strong interest in the ${clRole} position at ${clCompany}. With my background as a ${title}, I am confident in my ability to contribute effectively to your team.`;
  if (clExtra) {
    document.getElementById("clPrevCustom").textContent = clExtra;
  }
  document.getElementById("clPrevSign").textContent = name;

  saveDraftLocally();
}

function saveDraftLocally() {
  const draft = {
    fullName: document.getElementById("fullName").value,
    jobTitle: document.getElementById("jobTitle").value,
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    location: document.getElementById("location").value,
    summary: document.getElementById("summary").value,
    skills: document.getElementById("skills").value,
    referees: document.getElementById("referees").value
  };
  localStorage.setItem("resumemint_draft", JSON.stringify(draft));
}

function loadSavedDraft() {
  const raw = localStorage.getItem("resumemint_draft");
  if (!raw) return;
  const d = JSON.parse(raw);
  ["fullName", "jobTitle", "phone", "email", "location", "summary", "skills", "referees"].forEach((id) => {
    if (d[id]) document.getElementById(id).value = d[id];
  });
}
function refreshLockState() {
  const isUnlocked = !!unlockedItems[currentDocMode];
  document.getElementById("watermarkOverlay").classList.toggle("hidden", isUnlocked);
  document.getElementById("printNowBtn").classList.toggle("hidden", !isUnlocked);
  document.getElementById("documentSheet").classList.toggle("unlocked", isUnlocked);

  const badge = document.getElementById("lockBadge");
  if (isUnlocked) {
    badge.textContent = "Unlocked • Ready for Clean PDF";
    badge.className = "badge-unlocked";
  } else {
    badge.textContent = "Preview Mode (Watermarked)";
    badge.className = "badge-locked";
  }
}

function openPaymentModal(itemType) {
  selectedPayItem = itemType;
  let amount = appConfig.cvPrice;
  let label = "Complete ATS CV";

  if (itemType === "cl") {
    amount = appConfig.clPrice;
    label = "Tailored Cover Letter";
  } else if (itemType === "bundle") {
    amount = appConfig.bundlePrice;
    label = "Bundle: Complete CV + Cover Letter";
  }

  if ((itemType === "cv" && unlockedItems.cv) || (itemType === "cl" && unlockedItems.cl)) {
    window.print();
    return;
  }

  document.getElementById("payItemLabel").textContent = `Selected: ${label}`;
  document.getElementById("displayPayAmount").textContent = amount;
  document.getElementById("displayMpesaNumber").textContent = appConfig.mpesaNumber;
  document.getElementById("payErrorMsg").textContent = "";
  document.getElementById("paymentModal").classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

async function verifyMpesaPayment() {
  const payerPhone = document.getElementById("payerPhone").value.trim();
  const code = document.getElementById("mpesaCodeInput").value.trim().toUpperCase();
  const errEl = document.getElementById("payErrorMsg");
  const btn = document.getElementById("verifyPayBtn");

  errEl.textContent = "";

  if (appConfig.promoCode && code === appConfig.promoCode.toUpperCase()) {
    unlockSelectedItem();
    closeModal("paymentModal");
    alert("Promo code applied! Your document is unlocked.");
    return;
  }

  const mpesaRegex = /^[A-Z0-9]{10}$/;
  if (!mpesaRegex.test(code)) {
    errEl.textContent = "Enter a valid 10-character M-Pesa transaction code (e.g. SBL48K9P2M).";
    return;
  }
  if (payerPhone.length < 9) {
    errEl.textContent = "Please enter the phone number used to send M-Pesa.";
    return;
  }

  const amount =
    selectedPayItem === "cv"
      ? appConfig.cvPrice
      : selectedPayItem === "cl"
      ? appConfig.clPrice
      : appConfig.bundlePrice;

  if (!db) {
    unlockSelectedItem();
    closeModal("paymentModal");
    alert("Unlocked in local preview mode! Connect Firebase in firebase-config.js to save & audit M-Pesa codes.");
    setTimeout(() => window.print(), 300);
    return;
  }

  btn.disabled = true;
  btn.textContent = "Verifying...";

  try {
    const txRef = db.collection("transactions").doc(code);
    const existing = await txRef.get();

    if (existing.exists) {
      errEl.textContent = "This M-Pesa code has already been used.";
      btn.disabled = false;
      btn.textContent = "Verify & Unlock Download";
      return;
    }

    await txRef.set({
      code: code,
      phone: payerPhone,
      item: selectedPayItem,
      amount: Number(amount),
      userName: document.getElementById("fullName").value || "Unknown",
      status: "Pending Review",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    unlockSelectedItem();
    closeModal("paymentModal");
    setTimeout(() => window.print(), 400);
  } catch (err) {
    errEl.textContent = "Verification error: " + err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Verify & Unlock Download";
  }
}

function unlockSelectedItem() {
  if (selectedPayItem === "cv") {
    unlockedItems.cv = true;
    switchDocMode("cv");
  } else if (selectedPayItem === "cl") {
    unlockedItems.cl = true;
    switchDocMode("cl");
  } else if (selectedPayItem === "bundle") {
    unlockedItems.cv = true;
    unlockedItems.cl = true;
  }
  refreshLockState();
}

// ================= ADMIN PANEL LOGIC =================
function openAdminModal() {
  const modal = document.getElementById("adminModal");
  modal.classList.remove("hidden");
  document.getElementById("adminAuthError").textContent = "";

  if (!auth) {
    document.getElementById("adminAuthError").textContent =
      "Firebase Auth is not configured yet. Add your Firebase keys to firebase-config.js and enable Email/Password login in Firebase Console.";
    document.getElementById("adminLoginView").classList.remove("hidden");
    document.getElementById("adminDashboardView").classList.add("hidden");
    return;
  }

  if (auth.currentUser) {
    showAdminDashboard();
  } else {
    document.getElementById("adminLoginView").classList.remove("hidden");
    document.getElementById("adminDashboardView").classList.add("hidden");
  }
}

async function adminLogin() {
  const email = document.getElementById("adminEmail").value.trim();
  const pass = document.getElementById("adminPassword").value;
  const errEl = document.getElementById("adminAuthError");
  errEl.textContent = "";

  if (!auth) {
    errEl.textContent = "Connect Firebase in firebase-config.js first to sign in.";
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, pass);
    showAdminDashboard();
  } catch (err) {
    errEl.textContent = "Login failed: " + err.message;
  }
}

function adminLogout() {
  if (auth) auth.signOut();
  document.getElementById("adminDashboardView").classList.add("hidden");
  document.getElementById("adminLoginView").classList.remove("hidden");
}

function showAdminDashboard() {
  document.getElementById("adminLoginView").classList.add("hidden");
  document.getElementById("adminDashboardView").classList.remove("hidden");

  document.getElementById("cfgCvPrice").value = appConfig.cvPrice;
  document.getElementById("cfgClPrice").value = appConfig.clPrice;
  document.getElementById("cfgBundlePrice").value = appConfig.bundlePrice;
  document.getElementById("cfgMpesaNum").value = appConfig.mpesaNumber;
  document.getElementById("cfgPromoCode").value = appConfig.promoCode || "";
  document.getElementById("cfgBannerText").value = appConfig.bannerText || "";
  document.getElementById("cfgFreeMode").checked = !!appConfig.freeMode;

  loadAdminTransactions();
}

async function saveAdminSettings() {
  const newConfig = {
    cvPrice: Number(document.getElementById("cfgCvPrice").value) || 150,
    clPrice: Number(document.getElementById("cfgClPrice").value) || 50,
    bundlePrice: Number(document.getElementById("cfgBundlePrice").value) || 180,
    mpesaNumber: document.getElementById("cfgMpesaNum").value.trim() || "0703592418",
    promoCode: document.getElementById("cfgPromoCode").value.trim().toUpperCase(),
    bannerText: document.getElementById("cfgBannerText").value.trim(),
    freeMode: document.getElementById("cfgFreeMode").checked
  };

  appConfig = newConfig;
  applyConfigToUI();

  if (!db) {
    document.getElementById("cfgSaveStatus").textContent = "Updated locally (connect Firebase to save permanently).";
    return;
  }

  try {
    await db.collection("settings").doc("config").set(newConfig, { merge: true });
    const status = document.getElementById("cfgSaveStatus");
    status.textContent = "Saved!";
    setTimeout(() => (status.textContent = ""), 2500);
  } catch (err) {
    alert("Error saving settings: " + err.message);
  }
}

async function loadAdminTransactions() {
  const tbody = document.getElementById("txTableBody");
  if (!db) {
    tbody.innerHTML = "<tr><td colspan='5'>Connect Firebase to view live transactions.</td></tr>";
    return;
  }

  tbody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

  try {
    const snap = await db.collection("transactions").orderBy("createdAt", "desc").limit(50).get();
    let totalRev = 0;
    let totalCount = 0;
    let pendingCount = 0;
    tbody.innerHTML = "";

    snap.forEach((doc) => {
      const tx = doc.data();
      totalCount++;
      if (tx.status !== "Rejected") totalRev += Number(tx.amount || 0);
      if (tx.status === "Pending Review") pendingCount++;

      tbody.innerHTML += `
        <tr>
          <td><strong>${tx.code}</strong></td>
          <td>${tx.phone}<br/><small>${tx.userName || ""}</small></td>
          <td>${tx.item.toUpperCase()} (${tx.amount} KES)</td>
          <td>${tx.status}</td>
          <td>
            <button class="btn-small" onclick="updateTxStatus('${tx.code}', 'Verified')">Verify</button>
            <button class="btn-small" style="color:#b91c1c;" onclick="updateTxStatus('${tx.code}', 'Rejected')">Flag</button>
          </td>
        </tr>
      `;
    });

    document.getElementById("statRevenue").textContent = `${totalRev} KES`;
    document.getElementById("statCount").textContent = totalCount;
    document.getElementById("statPending").textContent = pendingCount;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan='5'>Error: ${err.message}</td></tr>`;
  }
}

async function updateTxStatus(code, newStatus) {
  if (!db) return;
  await db.collection("transactions").doc(code).update({ status: newStatus });
  loadAdminTransactions();
}

