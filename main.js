const DEFAULT_SINGLE_PRICE = 50;
const DEFAULT_BUNDLE_PRICE = 80;
const DEFAULT_EBOOK_PRICE = 50;

let singleDocPrice = JSON.parse(localStorage.getItem('resumemint_single_price') || String(DEFAULT_SINGLE_PRICE));
let bundleDocPrice = JSON.parse(localStorage.getItem('resumemint_bundle_price') || String(DEFAULT_BUNDLE_PRICE));
let ebookBasePrice = JSON.parse(localStorage.getItem('resumemint_ebook_price') || String(DEFAULT_EBOOK_PRICE));

let currentDownloadType = null;
let currentEbookId = null;

let validCodes = JSON.parse(localStorage.getItem('resumemint_codes') || '[]');
let usedCodes = JSON.parse(localStorage.getItem('resumemint_used_codes') || '[]');
let downloads = JSON.parse(localStorage.getItem('resumemint_downloads') || '0');
let revenue = JSON.parse(localStorage.getItem('resumemint_revenue') || '0');
let traffic = JSON.parse(localStorage.getItem('resumemint_traffic') || '0');

let activeAnnouncement = localStorage.getItem('resumemint_announcement') || 'Special Client Offer: Get CV + Matching Cover Letter bundles at great rates!';
let activeOfferTag = localStorage.getItem('resumemint_offer_tag') || 'CLIENT OFFER';
let activeAnnFont = localStorage.getItem('resumemint_ann_font') || "'Inter', sans-serif";
let activeAnnAnim = localStorage.getItem('resumemint_ann_anim') || 'anim-bounce';

let adminPassword = localStorage.getItem('resumemint_admin_pass') || 'Edwin@1990';
let isAdmin = false;

const ebooks = [
  { id: 1, title: "Ultimate CV Writing Guide 2026", desc: "Master modern ATS-friendly CV writing techniques", priceOffset: 0, icon: "fa-file-alt" },
  { id: 2, title: "Cover Letter Secrets", desc: "Write persuasive cover letters that land interviews", priceOffset: -10, icon: "fa-envelope" },
  { id: 3, title: "Personal Branding Mastery", desc: "Build a powerful career and LinkedIn presence", priceOffset: 10, icon: "fa-user-tie" },
  { id: 4, title: "Interview Success Blueprint", desc: "Answer tough questions and negotiate higher pay", priceOffset: 5, icon: "fa-comments" }
];
function getEbookPrice(book) {
  return Math.max(10, Number(ebookBasePrice || DEFAULT_EBOOK_PRICE) + (book?.priceOffset || 0));
}

function getPriceForDownload(type) {
  if (type === 'bundle') return Number(bundleDocPrice || DEFAULT_BUNDLE_PRICE);
  if (type === 'ebook') {
    const book = ebooks.find((b) => b.id === currentEbookId);
    return getEbookPrice(book);
  }
  return Number(singleDocPrice || DEFAULT_SINGLE_PRICE);
}
function ensureBillingSection() {
  const main = document.getElementById('app');
  if (main && !document.getElementById('billing')) {
    const sec = document.createElement('section');
    sec.id = 'billing';
    sec.className = 'section';
    sec.innerHTML = `<div class="section-header"><h2><i class="fas fa-wallet"></i> Billing & Pricing</h2><p>Pay via M-Pesa and verify your transaction code</p></div><div id="billingArea"></div>`;
    const adminSec = document.getElementById('admin');
    main.insertBefore(sec, adminSec || null);
  }
  const navLinks = document.getElementById('navLinks');
  if (navLinks && !navLinks.querySelector('a[href="#billing"]')) {
    const a = document.createElement('a');
    a.href = '#billing';
    a.className = 'nav-link';
    a.textContent = 'Billing';
    const adminLink = navLinks.querySelector('a[href="#admin"]');
    navLinks.insertBefore(a, adminLink || null);
  }
}

function applyDiscreetAdminLock() {
  const adminLink = document.querySelector('#navLinks a[href="#admin"], .nav-link[href="#admin"]');
  if (!adminLink) return;
  adminLink.classList.add('admin-lock-link');
  adminLink.setAttribute('aria-label', 'Locked Admin Area');
  adminLink.setAttribute('title', 'Locked Admin Area');
  adminLink.innerHTML = '<span style="font-size:0.95rem;line-height:1;">🔒</span>';
}

function initApp() {
  ensureBillingSection();
  applyDiscreetAdminLock();
  traffic += 1;
  localStorage.setItem('resumemint_traffic', String(traffic));
  showAnnouncement();
  renderEbooks();
  renderBillingSection();
  renderCVBuilder();
  renderCoverBuilder();
  renderCardBuilder();
  renderLetterheadBuilder();

  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href') || '';
      if (href.startsWith('#')) showSection(href.slice(1));
      if (navLinks) navLinks.classList.remove('open');
    });
  });

  const modal = document.getElementById('paymentModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
function showSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  document.querySelectorAll('.section').forEach((s) => s.classList.remove('active'));
  target.classList.add('active');
  document.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-link[href="#${id}"]`);
  if (activeLink) activeLink.classList.add('active');
  if (id === 'billing') renderBillingSection();
  if (id === 'admin') {
    if (isAdmin) {
      document.getElementById('adminLogin').style.display = 'none';
      document.getElementById('adminDashboard').style.display = 'block';
      renderAdminDashboard();
    } else {
      document.getElementById('adminLogin').style.display = 'block';
      document.getElementById('adminDashboard').style.display = 'none';
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
const COLOR_THEMES = {
  indigo:  { hex: '#6366f1', rgb: [99, 102, 241],  softBg: '#e0e7ff', softText: '#4338ca', dark: '#1e1b4b' },
  emerald: { hex: '#10b981', rgb: [16, 185, 129],  softBg: '#d1fae5', softText: '#047857', dark: '#064e3b' },
  rose:    { hex: '#e11d48', rgb: [225, 29, 72],   softBg: '#ffe4e6', softText: '#be123c', dark: '#4c0519' },
  amber:   { hex: '#d97706', rgb: [217, 119, 6],   softBg: '#fef3c7', softText: '#b45309', dark: '#451a03' },
  slate:   { hex: '#334155', rgb: [51, 65, 85],    softBg: '#e2e8f0', softText: '#1e293b', dark: '#0f172a' }
};

const FONT_OPTIONS = {
  sans:  { label: 'Modern Sans (Inter)',    cssFamily: "'Inter', sans-serif",              pdfFont: 'helvetica' },
  serif: { label: 'Classic Serif (Georgia)',  cssFamily: "Georgia, 'Times New Roman', serif", pdfFont: 'times' },
  mono:  { label: 'Clean Mono (Courier)',     cssFamily: "'Courier New', Courier, monospace", pdfFont: 'courier' }
};

const designState = {
  cv:         { template: 'modern',   color: 'indigo', customHex: '#6366f1', useCustom: false, font: 'sans' },
  cover:      { template: 'standard', color: 'indigo', customHex: '#6366f1', useCustom: false, font: 'sans', autoGenerated: true },
  card:       { template: 'classic',  color: 'indigo', customHex: '#6366f1', useCustom: false, font: 'sans' },
  letterhead: { template: 'classic',  color: 'indigo', customHex: '#6366f1', useCustom: false, font: 'sans' }
};

function hexToRgb(hex) {
  const clean = (hex || '#6366f1').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function getTheme(sectionKey) {
  const st = designState[sectionKey] || { color: 'indigo', customHex: '#6366f1', useCustom: false };
  if (st.useCustom) {
    const hex = st.customHex || '#6366f1';
    const rgb = hexToRgb(hex);
    return {
      hex,
      rgb,
      softBg: `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.14)`,
      softText: hex,
      dark: `rgb(${Math.max(0, rgb[0] - 55)}, ${Math.max(0, rgb[1] - 55)}, ${Math.max(0, rgb[2] - 55)})`
    };
  }
  return COLOR_THEMES[st.color] || COLOR_THEMES.indigo;
}

function getFontConfig(sectionKey) {
  const key = designState[sectionKey]?.font || 'sans';
  return FONT_OPTIONS[key] || FONT_OPTIONS.sans;
}
function setTemplate(sectionKey, templateName, previewFn) {
  if (!designState[sectionKey]) return;
  designState[sectionKey].template = templateName;
  if (typeof previewFn === 'function') previewFn();
}

function setFontStyle(sectionKey, fontKey, previewFn) {
  if (!designState[sectionKey] || !FONT_OPTIONS[fontKey]) return;
  designState[sectionKey].font = fontKey;
  if (typeof previewFn === 'function') previewFn();
}

function setThemeColor(sectionKey, colorKey, containerId, previewFn) {
  if (!designState[sectionKey] || !COLOR_THEMES[colorKey]) return;
  designState[sectionKey].color = colorKey;
  designState[sectionKey].useCustom = false;
  const root = document.getElementById(containerId);
  if (root) {
    root.querySelectorAll('.swatch-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.color === colorKey));
    const label = root.querySelector(`[data-hex-label="${sectionKey}"]`);
    if (label) label.textContent = 'PRESET';
  }
  if (typeof previewFn === 'function') previewFn();
}

function setCustomColor(sectionKey, hexValue, containerId, previewFn) {
  if (!designState[sectionKey]) return;
  designState[sectionKey].customHex = hexValue;
  designState[sectionKey].useCustom = true;
  const root = document.getElementById(containerId);
  if (root) {
    root.querySelectorAll('.swatch-btn').forEach((btn) => btn.classList.remove('active'));
    const label = root.querySelector(`[data-hex-label="${sectionKey}"]`);
    if (label) label.textContent = hexValue.toUpperCase();
  }
  if (typeof previewFn === 'function') previewFn();
}

function buildDesignBar(sectionKey, containerId, templateOptions, previewFnName) {
  const st = designState[sectionKey];
  const optionsHtml = templateOptions.map((opt) => `<option value="${opt.value}" ${opt.value === st.template ? 'selected' : ''}>${opt.label}</option>`).join('');
  const fontHtml = Object.entries(FONT_OPTIONS).map(([key, f]) => `<option value="${key}" ${key === st.font ? 'selected' : ''}>${f.label}</option>`).join('');
  const swatchesHtml = Object.entries(COLOR_THEMES).map(([key, theme]) => `<button type="button" class="swatch-btn ${!st.useCustom && key === st.color ? 'active' : ''}" data-color="${key}" title="${key}" style="background:${theme.hex};" onclick="setThemeColor('${sectionKey}','${key}','${containerId}',${previewFnName})"></button>`).join('');

  return `
    <div class="design-controls-3">
      <div class="form-group" style="margin-bottom:0;">
        <label>Template</label>
        <select onchange="setTemplate('${sectionKey}',this.value,${previewFnName})">${optionsHtml}</select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label>Font</label>
        <select onchange="setFontStyle('${sectionKey}',this.value,${previewFnName})">${fontHtml}</select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label>Color & Hex</label>
        <div class="color-swatches">
          ${swatchesHtml}
          <input type="color" value="${st.customHex}" title="Custom hex color" style="width:30px;height:30px;padding:0;border:none;border-radius:8px;background:transparent;cursor:pointer;" oninput="setCustomColor('${sectionKey}',this.value,'${containerId}',${previewFnName})">
          <span data-hex-label="${sectionKey}" style="font-size:11px;font-family:monospace;color:var(--text-muted);">${st.useCustom ? st.customHex.toUpperCase() : 'PRESET'}</span>
        </div>
      </div>
    </div>
  `;
}
function renderCVBuilder() {
  const container = document.getElementById('cvBuilder');
  if (!container) return;
  container.innerHTML = `
    <div class="builder-grid">
      <div class="form-card">
        <h3><i class="fas fa-edit"></i> CV & Target Vacancy</h3>
        ${buildDesignBar('cv', 'cvBuilder', [{ value: 'modern', label: 'Modern Clean' },{ value: 'executive', label: 'Executive Banner' },{ value: 'minimal', label: 'Minimalist Left-Border' }], 'updateCVPreview')}
        <div class="form-row">
          <div class="form-group"><label>Target Job Vacancy</label><input type="text" id="cvTargetRole" placeholder="e.g. Operations Supervisor" oninput="syncVacancyToCover(true); updateCVPreview();"></div>
          <div class="form-group"><label>Target Company (Optional)</label><input type="text" id="cvTargetCompany" placeholder="e.g. Highlands Dairy Ltd" oninput="syncVacancyToCover(true); updateCVPreview();"></div>
        </div>
        <div class="form-group"><label>Full Name</label><input type="text" id="cvName" placeholder="John Doe" oninput="syncVacancyToCover(false); updateCVPreview();"></div>
        <div class="form-row">
          <div class="form-group"><label>Email</label><input type="email" id="cvEmail" placeholder="john@email.com" oninput="syncVacancyToCover(false); updateCVPreview();"></div>
          <div class="form-group"><label>Phone</label><input type="text" id="cvPhone" placeholder="+254 7XX XXX XXX" oninput="syncVacancyToCover(false); updateCVPreview();"></div>
        </div>
        <div class="form-group"><label>Location</label><input type="text" id="cvLocation" placeholder="Nairobi, Kenya" oninput="syncVacancyToCover(false); updateCVPreview();"></div>
        <div class="form-group"><label>Current / Core Title</label><input type="text" id="cvTitle" placeholder="Operations & Records Clerk" oninput="syncVacancyToCover(false); updateCVPreview();"></div>
        <div class="form-group"><label>Professional Summary</label><textarea id="cvSummary" placeholder="Summary of your strengths..." oninput="syncVacancyToCover(false); updateCVPreview();"></textarea></div>
        <div class="form-group"><label>Experience (one per line)</label><textarea id="cvExp" placeholder="2023–Present: Role – Key responsibilities" oninput="syncVacancyToCover(false); updateCVPreview();"></textarea></div>
        <div class="form-group"><label>Education</label><textarea id="cvEdu" placeholder="Certificate / Diploma – Institution" oninput="updateCVPreview()"></textarea></div>
        <div class="form-group"><label>Skills (comma separated)</label><input type="text" id="cvSkills" placeholder="Management, Reporting, Coordination" oninput="syncVacancyToCover(false); updateCVPreview();"></div>
        <div class="bundle-actions">
          <button type="button" class="btn outline small" style="flex:1;" onclick="generateCoverFromCV(true); showSection('cover');"><i class="fas fa-magic"></i> Preview Auto Cover Letter</button>
        </div>
        <div class="bundle-actions" style="margin-top:12px;">
          <button type="button" class="btn primary" style="flex:1;" onclick="requestDownload('cv')"><i class="fas fa-file-pdf"></i> CV Only (KES ${singleDocPrice})</button>
          <button type="button" class="btn success" style="flex:1;" onclick="requestDownload('bundle')"><i class="fas fa-layer-group"></i> Both CV + Cover (KES ${bundleDocPrice})</button>
        </div>
      </div>
      <div class="preview-card"><h3><i class="fas fa-eye"></i> Live CV Preview</h3><div class="preview-area" id="cvPreview"></div></div>
    </div>
  `;
  updateCVPreview();
}

function updateCVPreview() {
  const preview = document.getElementById('cvPreview');
  if (!preview) return;
  const t = getTheme('cv');
  const f = getFontConfig('cv');
  const tpl = designState.cv.template;

  const name = document.getElementById('cvName')?.value || 'Your Name';
  const email = document.getElementById('cvEmail')?.value || 'email@example.com';
  const phone = document.getElementById('cvPhone')?.value || '+254...';
  const location = document.getElementById('cvLocation')?.value || 'City, Country';
  const title = document.getElementById('cvTitle')?.value || 'Professional Title';
  const targetRole = document.getElementById('cvTargetRole')?.value || '';
  const summary = document.getElementById('cvSummary')?.value || 'Your professional summary will appear here.';
  const exp = document.getElementById('cvExp')?.value || '';
  const edu = document.getElementById('cvEdu')?.value || '';
  const skills = document.getElementById('cvSkills')?.value || '';

  const expHtml = exp.split('\n').filter((l) => l.trim()).map((l) => `<p style="margin:6px 0;font-size:13px;">${l}</p>`).join('');
  const eduHtml = edu.split('\n').filter((l) => l.trim()).map((l) => `<p style="margin:6px 0;font-size:13px;">${l}</p>`).join('');
  const skillsHtml = skills.split(',').filter((s) => s.trim()).map((s) => `<span style="display:inline-block;background:${t.softBg};color:${t.softText};padding:4px 10px;border-radius:20px;font-size:12px;margin:3px;font-weight:500;">${s.trim()}</span>`).join('');

  const roleBadge = targetRole ? `<p style="font-size:12px;margin:2px 0 6px;opacity:0.95;"><strong>Target Vacancy:</strong> ${targetRole}</p>` : '';

  const bodyBlocks = `
    <h3 style="font-size:13px;color:${t.hex};text-transform:uppercase;letter-spacing:1px;margin-top:14px;">Summary</h3>
    <p style="font-size:13px;">${summary}</p>
    <h3 style="font-size:13px;color:${t.hex};text-transform:uppercase;letter-spacing:1px;margin-top:14px;">Experience</h3>
    ${expHtml || '<p style="font-size:13px;color:#94a3b8;">Add experience...</p>'}
    <h3 style="font-size:13px;color:${t.hex};text-transform:uppercase;letter-spacing:1px;margin-top:14px;">Education</h3>
    ${eduHtml || '<p style="font-size:13px;color:#94a3b8;">Add education...</p>'}
    <h3 style="font-size:13px;color:${t.hex};text-transform:uppercase;letter-spacing:1px;margin-top:14px;">Skills</h3>
    <div style="margin-top:8px;">${skillsHtml || '<span style="color:#94a3b8;font-size:13px;">Add skills...</span>'}</div>
  `;

  let headerHtml = '';
  if (tpl === 'executive') {
    headerHtml = `<div style="background:${t.hex};color:#ffffff;padding:22px;border-radius:10px;margin-bottom:16px;"><h1 style="font-size:25px;margin:0;color:#ffffff;">${name}</h1><p style="font-weight:600;margin:4px 0 4px;color:#f8fafc;">${title}</p>${roleBadge}<p style="font-size:12px;opacity:0.92;">${email} | ${phone} | ${location}</p></div>`;
  } else if (tpl === 'minimal') {
    headerHtml = `<div style="border-left:4px solid ${t.hex};padding-left:16px;margin-bottom:18px;"><h1 style="font-size:25px;margin:0;color:#1e293b;">${name}</h1><p style="color:${t.hex};font-weight:600;margin:3px 0 4px;">${title}</p>${roleBadge}<p style="font-size:12px;color:#64748b;">${email} | ${phone} | ${location}</p></div>`;
  } else {
    headerHtml = `<h1 style="font-size:26px;margin:0;color:#1e293b;">${name}</h1><p style="color:${t.hex};font-weight:600;margin:4px 0 4px;">${title}</p>${roleBadge}<p style="font-size:13px;color:#64748b;margin-bottom:14px;">${email} | ${phone} | ${location}</p><hr style="border:none;border-top:2px solid ${t.hex};margin:12px 0;">`;
  }
  preview.innerHTML = `<div style="font-family:${f.cssFamily};">${headerHtml}${bodyBlocks}</div>`;
}
function buildMatchedCoverLetterText() {
  const currentTitle = (document.getElementById('cvTitle')?.value || 'experienced professional').trim();
  const vacancy = (document.getElementById('cvTargetRole')?.value || document.getElementById('clPosition')?.value || 'the advertised position').trim();
  const company = (document.getElementById('cvTargetCompany')?.value || document.getElementById('clCompany')?.value || 'the hiring team').trim();
  const summary = (document.getElementById('cvSummary')?.value || '').trim();
  const expLines = (document.getElementById('cvExp')?.value || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const skillsList = (document.getElementById('cvSkills')?.value || '').split(',').map((s) => s.trim()).filter(Boolean);

  const topExperience = expLines.slice(0, 2).join('; ');
  const topSkills = skillsList.slice(0, 5).join(', ');

  const p1 = `I am writing to apply for the ${vacancy} position at ${company}. With practical experience as a ${currentTitle}, I bring dependable execution, strong organization, and a commitment to high standards aligned with this role.`;
  const p2 = summary ? `${summary}${topExperience ? ` Highlights from my work history include ${topExperience}.` : ''}` : topExperience ? `My background includes hands-on work in ${topExperience}, where I focused on accuracy, reliability, and clear communication.` : `I take pride in consistent performance, clear reporting, and adapting quickly to team needs.`;
  const p3 = topSkills ? `Key strengths in ${topSkills} allow me to contribute smoothly from day one at ${company}. Thank you for considering my application.` : `Thank you for your time and consideration regarding my application to ${company}.`;

  return `${p1}\n\n${p2}\n\n${p3}`;
}

function generateCoverFromCV(forceOverwrite = true) {
  const nameVal = document.getElementById('cvName')?.value || '';
  const contactVal = [document.getElementById('cvEmail')?.value || '', document.getElementById('cvPhone')?.value || '', document.getElementById('cvLocation')?.value || ''].filter(Boolean).join(' | ');
  const roleVal = document.getElementById('cvTargetRole')?.value || '';
  const companyVal = document.getElementById('cvTargetCompany')?.value || '';

  const clName = document.getElementById('clName');
  const clContact = document.getElementById('clContact');
  const clCompany = document.getElementById('clCompany');
  const clPosition = document.getElementById('clPosition');
  const clBody = document.getElementById('clBody');

  if (clName && nameVal) clName.value = nameVal;
  if (clContact && contactVal) clContact.value = contactVal;
  if (clCompany && companyVal) clCompany.value = companyVal;
  if (clPosition && roleVal) clPosition.value = roleVal;

  if (clBody && (forceOverwrite || !clBody.value.trim() || designState.cover.autoGenerated)) {
    clBody.value = buildMatchedCoverLetterText();
    designState.cover.autoGenerated = true;
  }
  updateCoverPreview();
}

function syncVacancyToCover(isRoleChange) {
  if (!isRoleChange && !designState.cover.autoGenerated) return;
  generateCoverFromCV(true);
}
function renderCoverBuilder() {
  const container = document.getElementById('coverBuilder');
  if (!container) return;
  container.innerHTML = `
    <div class="builder-grid">
      <div class="form-card">
        <h3><i class="fas fa-magic"></i> Automated Cover Letter</h3>
        <div class="auto-cover-box">
          <div style="font-size:0.88rem;font-weight:700;color:#c7d2fe;">Matched Automatically to Your CV & Vacancy</div>
          <p style="font-size:0.82rem;color:var(--text-muted);margin-top:4px;">Uses your CV details and target role to draft a ready-to-send cover letter.</p>
          <div class="auto-cover-actions">
            <button type="button" class="btn outline small" onclick="generateCoverFromCV(true)"><i class="fas fa-sync-alt"></i> Re-Match From CV</button>
          </div>
        </div>
        ${buildDesignBar('cover', 'coverBuilder', [{ value: 'standard', label: 'Standard Business' },{ value: 'modern', label: 'Modern Accent' }], 'updateCoverPreview')}
        <div class="form-group"><label>Full Name</label><input type="text" id="clName" oninput="updateCoverPreview()"></div>
        <div class="form-group"><label>Contact</label><input type="text" id="clContact" oninput="updateCoverPreview()"></div>
        <div class="form-row">
          <div class="form-group"><label>Date</label><input type="text" id="clDate" value="${new Date().toLocaleDateString('en-GB')}" oninput="updateCoverPreview()"></div>
          <div class="form-group"><label>Target Job Vacancy</label><input type="text" id="clPosition" oninput="updateCoverPreview()"></div>
        </div>
        <div class="form-group"><label>Company / Organization</label><input type="text" id="clCompany" oninput="updateCoverPreview()"></div>
        <div class="form-group"><label>Cover Letter Body</label><textarea id="clBody" rows="8" oninput="designState.cover.autoGenerated = false; updateCoverPreview();"></textarea></div>
        <div class="bundle-actions">
          <button type="button" class="btn primary" style="flex:1;" onclick="requestDownload('cover')"><i class="fas fa-file-pdf"></i> Cover Only (KES ${singleDocPrice})</button>
          <button type="button" class="btn success" style="flex:1;" onclick="requestDownload('bundle')"><i class="fas fa-layer-group"></i> Both CV + Cover (KES ${bundleDocPrice})</button>
        </div>
      </div>
      <div class="preview-card"><h3><i class="fas fa-eye"></i> Live Cover Letter Preview</h3><div class="preview-area" id="coverPreview"></div></div>
    </div>
  `;
  generateCoverFromCV(true);
}

function updateCoverPreview() {
  const preview = document.getElementById('coverPreview');
  if (!preview) return;
  const f = getFontConfig('cover');
  const t = getTheme('cover');

  const name = document.getElementById('clName')?.value || 'Your Name';
  const contact = document.getElementById('clContact')?.value || 'your@email.com | +254...';
  const date = document.getElementById('clDate')?.value || '';
  const company = document.getElementById('clCompany')?.value || 'Hiring Manager';
  const position = document.getElementById('clPosition')?.value || 'the advertised position';
  const body = document.getElementById('clBody')?.value || buildMatchedCoverLetterText();

  preview.innerHTML = `
    <div style="font-family:${f.cssFamily};color:#1e293b;">
      <p style="font-size:16px;font-weight:700;margin-bottom:2px;">${name}</p>
      <p style="font-size:12px;color:#64748b;margin-bottom:14px;">${contact}</p>
      <hr style="border:none;border-top:2px solid ${t.hex};margin-bottom:14px;">
      <p style="font-size:13px;margin-bottom:10px;">${date}</p>
      <p style="font-size:13px;margin-bottom:10px;"><strong>${company}</strong></p>
      <p style="font-size:13px;color:${t.hex};margin-bottom:14px;"><strong>Application for: ${position}</strong></p>
      <div style="white-space:pre-wrap;font-size:13.5px;line-height:1.65;">${body}</div>
      <p style="margin-top:22px;font-size:13.5px;">Sincerely,<br><strong>${name}</strong></p>
    </div>
  `;
}
function renderCardBuilder() {
  const container = document.getElementById('cardBuilder');
  if (!container) return;
  container.innerHTML = `
    <div class="builder-grid">
      <div class="form-card">
        <h3><i class="fas fa-id-card"></i> Business Card</h3>
        ${buildDesignBar('card', 'cardBuilder', [{ value: 'classic', label: 'Classic Dark' },{ value: 'accent', label: 'Bold Color' },{ value: 'minimal', label: 'Light Minimal' }], 'updateCardPreview')}
        <div class="form-group"><label>Full Name</label><input type="text" id="bcName" oninput="updateCardPreview()"></div>
        <div class="form-group"><label>Job Title</label><input type="text" id="bcTitle" oninput="updateCardPreview()"></div>
        <div class="form-group"><label>Company</label><input type="text" id="bcCompany" oninput="updateCardPreview()"></div>
        <div class="form-group"><label>Phone</label><input type="text" id="bcPhone" oninput="updateCardPreview()"></div>
        <div class="form-group"><label>Email</label><input type="text" id="bcEmail" oninput="updateCardPreview()"></div>
        <div class="form-group"><label>Website / Location</label><input type="text" id="bcWeb" oninput="updateCardPreview()"></div>
        <button type="button" class="btn primary" style="width:100%;" onclick="requestDownload('card')"><i class="fas fa-download"></i> Download PDF (KES ${singleDocPrice})</button>
      </div>
      <div class="preview-card"><h3><i class="fas fa-eye"></i> Preview</h3><div id="cardPreview" style="display:flex;justify-content:center;padding:30px;"></div></div>
    </div>
  `;
  updateCardPreview();
}

function updateCardPreview() {
  const preview = document.getElementById('cardPreview');
  if (!preview) return;
  const t = getTheme('card');
  const f = getFontConfig('card');
  const tpl = designState.card.template;

  const name = document.getElementById('bcName')?.value || 'Your Name';
  const title = document.getElementById('bcTitle')?.value || 'Job Title';
  const company = document.getElementById('bcCompany')?.value || 'Company';
  const phone = document.getElementById('bcPhone')?.value || 'Phone';
  const email = document.getElementById('bcEmail')?.value || 'Email';
  const web = document.getElementById('bcWeb')?.value || 'Website';

  if (tpl === 'accent') {
    preview.innerHTML = `<div style="font-family:${f.cssFamily};width:340px;height:200px;background:linear-gradient(135deg,${t.hex},${t.dark});border-radius:12px;padding:24px;color:#ffffff;display:flex;flex-direction:column;justify-content:center;box-shadow:0 10px 30px rgba(0,0,0,0.3);"><h2 style="margin:0;font-size:22px;">${name}</h2><p style="margin:4px 0;font-weight:600;opacity:0.95;">${title}</p><p style="margin:2px 0;font-size:13px;opacity:0.88;">${company}</p><div style="margin-top:14px;font-size:12px;opacity:0.92;"><p>${phone}</p><p>${email}</p><p>${web}</p></div></div>`;
  } else if (tpl === 'minimal') {
    preview.innerHTML = `<div style="font-family:${f.cssFamily};width:340px;height:200px;background:#ffffff;border:2px solid ${t.hex};border-left:8px solid ${t.hex};border-radius:12px;padding:22px;color:#1e293b;display:flex;flex-direction:column;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,0.12);"><h2 style="margin:0;font-size:21px;color:#0f172a;">${name}</h2><p style="margin:4px 0;color:${t.hex};font-weight:600;">${title}</p><p style="margin:2px 0;font-size:13px;color:#475569;">${company}</p><div style="margin-top:14px;font-size:12px;color:#334155;"><p>${phone}</p><p>${email}</p><p>${web}</p></div></div>`;
  } else {
    preview.innerHTML = `<div style="font-family:${f.cssFamily};width:340px;height:200px;background:linear-gradient(135deg,#1e293b,#334155);border-top:5px solid ${t.hex};border-radius:12px;padding:24px;color:#ffffff;display:flex;flex-direction:column;justify-content:center;box-shadow:0 10px 30px rgba(0,0,0,0.3);"><h2 style="margin:0;font-size:22px;">${name}</h2><p style="margin:4px 0;color:${t.hex};font-weight:600;">${title}</p><p style="margin:2px 0;font-size:13px;">${company}</p><div style="margin-top:14px;font-size:12px;opacity:0.9;"><p>${phone}</p><p>${email}</p><p>${web}</p></div></div>`;
  }
}

function renderLetterheadBuilder() {
  const container = document.getElementById('letterheadBuilder');
  if (!container) return;
  container.innerHTML = `
    <div class="builder-grid">
      <div class="form-card">
        <h3><i class="fas fa-file-signature"></i> Letterhead</h3>
        ${buildDesignBar('letterhead', 'letterheadBuilder', [{ value: 'classic', label: 'Classic Underline' },{ value: 'banner', label: 'Top Header Banner' },{ value: 'sidebar', label: 'Left Accent Strip' }], 'updateLetterheadPreview')}
        <div class="form-group"><label>Company Name</label><input type="text" id="lhName" oninput="updateLetterheadPreview()"></div>
        <div class="form-group"><label>Tagline</label><input type="text" id="lhTagline" oninput="updateLetterheadPreview()"></div>
        <div class="form-group"><label>Address</label><input type="text" id="lhAddress" oninput="updateLetterheadPreview()"></div>
        <div class="form-group"><label>Phone & Email</label><input type="text" id="lhContact" oninput="updateLetterheadPreview()"></div>
        <div class="form-group"><label>Website</label><input type="text" id="lhWeb" oninput="updateLetterheadPreview()"></div>
        <button type="button" class="btn primary" style="width:100%;" onclick="requestDownload('letterhead')"><i class="fas fa-download"></i> Download PDF (KES ${singleDocPrice})</button>
      </div>
      <div class="preview-card"><h3><i class="fas fa-eye"></i> Preview</h3><div class="preview-area" id="letterheadPreview"></div></div>
    </div>
  `;
  updateLetterheadPreview();
}

function updateLetterheadPreview() {
  const preview = document.getElementById('letterheadPreview');
  if (!preview) return;
  const t = getTheme('letterhead');
  const f = getFontConfig('letterhead');
  const tpl = designState.letterhead.template;

  const name = document.getElementById('lhName')?.value || 'Your Company';
  const tagline = document.getElementById('lhTagline')?.value || 'Professional Excellence';
  const address = document.getElementById('lhAddress')?.value || 'Nairobi, Kenya';
  const contact = document.getElementById('lhContact')?.value || '+254 7XX XXX XXX | email@company.com';
  const web = document.getElementById('lhWeb')?.value || 'www.company.com';
let header = '';
  if (tpl === 'banner') {
    header = `<div style="background:${t.hex};color:#ffffff;padding:20px;border-radius:10px;margin-bottom:26px;"><h1 style="margin:0;font-size:26px;color:#ffffff;">${name}</h1><p style="margin:4px 0;opacity:0.95;font-weight:500;">${tagline}</p><p style="margin:8px 0 0;font-size:12px;opacity:0.9;">${address} | ${contact} | ${web}</p></div>`;
  } else if (tpl === 'sidebar') {
    header = `<div style="border-left:5px solid ${t.hex};padding-left:16px;padding-bottom:12px;margin-bottom:28px;"><h1 style="margin:0;font-size:27px;color:#1e293b;">${name}</h1><p style="margin:4px 0;color:${t.hex};font-weight:600;">${tagline}</p><p style="margin:8px 0 0;font-size:12px;color:#64748b;">${address} | ${contact} | ${web}</p></div>`;
  } else {
    header = `<div style="border-bottom:3px solid ${t.hex};padding-bottom:16px;margin-bottom:30px;"><h1 style="margin:0;font-size:28px;color:#1e293b;">${name}</h1><p style="margin:4px 0;color:${t.hex};font-weight:500;">${tagline}</p><p style="margin:8px 0 0;font-size:12px;color:#64748b;">${address} | ${contact} | ${web}</p></div>`;
  }
  preview.innerHTML = `<div style="font-family:${f.cssFamily};">${header}<p style="color:#94a3b8;">[Your letter content appears below]</p></div>`;
}
function renderEbooks() {
  const grid = document.getElementById('ebooksGrid');
  if (!grid) return;
  grid.innerHTML = ebooks.map((b) => {
    const price = getEbookPrice(b);
    return `<div class="ebook-card"><div class="ebook-cover"><i class="fas ${b.icon}"></i></div><div class="ebook-body"><h3>${b.title}</h3><p>${b.desc}</p><div class="ebook-price">KES ${price}</div><button type="button" class="btn primary small" onclick="requestEbookDownload(${b.id})"><i class="fas fa-download"></i> Download</button></div></div>`;
  }).join('');
}

function requestEbookDownload(id) {
  currentEbookId = id;
  const book = ebooks.find((b) => b.id === id);
  const el = document.getElementById('payAmount');
  if (book && el) el.textContent = `Amount: KES ${getEbookPrice(book)}`;
  requestDownload('ebook');
}

function renderBillingSection() {
  const area = document.getElementById('billingArea');
  if (!area) return;
  area.innerHTML = `
    <div class="features" style="margin-bottom:30px;">
      <div class="feature-card"><i class="fas fa-file-alt"></i><h3>Single Document</h3><p style="font-size:1.4rem;font-weight:800;color:#22c55e;">KES ${singleDocPrice}</p><button type="button" class="btn primary small" style="margin-top:12px;" onclick="showSection('cv')">Build CV</button></div>
      <div class="feature-card"><i class="fas fa-layer-group"></i><h3>CV + Cover Bundle</h3><p style="font-size:1.4rem;font-weight:800;color:#22c55e;">KES ${bundleDocPrice}</p><button type="button" class="btn success small" style="margin-top:12px;" onclick="showSection('cv')">Get Bundle</button></div>
      <div class="feature-card"><i class="fas fa-book-open"></i><h3>eBooks</h3><p style="font-size:1.4rem;font-weight:800;color:#22c55e;">From KES ${Math.max(10, ebookBasePrice - 10)}</p><button type="button" class="btn outline small" style="margin-top:12px;" onclick="showSection('ebooks')">Browse</button></div>
      <div class="feature-card"><i class="fas fa-mobile-alt"></i><h3>M-Pesa Pay</h3><p>Send to <strong>0703592418</strong> & enter code</p></div>
    </div>
    <div class="admin-panel" style="max-width:600px;margin:0 auto;">
      <h3><i class="fas fa-check-circle" style="color:var(--success);"></i> Verify Transaction Code</h3>
      <div style="display:flex;gap:10px;"><input type="text" id="checkCodeInput" placeholder="e.g. DEMO123" style="flex:1;padding:12px;background:var(--bg);border:1px solid var(--bg-light);border-radius:10px;color:white;"><button type="button" class="btn primary" onclick="checkCodeStatus()">Check</button></div>
      // Find this line inside renderBillingSection():
<p id="codeStatusMsg" style="margin-top:12px;font-size:0.9rem;"></p>

// ADD THIS RIGHT BELOW IT:
<div style="margin-top:15px; font-size:0.85rem; text-align:center;">
  <span style="color:#94a3b8;">Paid but didn't get a code?</span> 
  <a href="https://wa.me/254703592418?text=Hi%20ResumeMint%2C%20I%20paid%20via%20M-Pesa%20but%20haven't%20received%20my%20download%20code." 
     target="_blank" 
     style="color:#25d366; font-weight:bold; text-decoration:none;">
     <i class="fab fa-whatsapp"></i> Chat with Support
  </a>
</div>
    </div>
  `;
}

function checkCodeStatus() {
  const code = (document.getElementById('checkCodeInput')?.value || '').trim().toUpperCase();
  const msg = document.getElementById('codeStatusMsg');
  if (!msg) return;
  if (!code) msg.innerHTML = `<span style="color:var(--warning);">Enter a code first.</span>`;
  else if (validCodes.includes(code)) msg.innerHTML = `<span style="color:var(--success);">Code <strong>${code}</strong> is valid!</span>`;
  else if (usedCodes.some((u) => u.code === code)) msg.innerHTML = `<span style="color:var(--danger);">Code <strong>${code}</strong> already used.</span>`;
  else msg.innerHTML = `<span style="color:var(--danger);">Code not found.</span>`;
}
function requestDownload(type) {
  currentDownloadType = type;
  const el = document.getElementById('payAmount');
  if (type !== 'ebook' && el) {
    const label = type === 'bundle' ? 'Bundle (CV + Cover Letter)' : 'Document';
    el.textContent = `${label}: KES ${getPriceForDownload(type)}`;
  }
  const inp = document.getElementById('mpesaCode');
  if (inp) inp.value = '';
  document.getElementById('paymentModal')?.classList.add('show');
}

function closeModal() {
  document.getElementById('paymentModal')?.classList.remove('show');
}

function verifyAndDownload() {
  const code = (document.getElementById('mpesaCode')?.value || '').trim().toUpperCase();
  if (!code) return alert('Enter M-Pesa Transaction Code');
  if (!validCodes.includes(code)) return alert('Invalid or used code. Try DEMO123.');

  validCodes = validCodes.filter((c) => c !== code);
  usedCodes.unshift({ code, type: currentDownloadType || 'doc', date: new Date().toLocaleString() });
  localStorage.setItem('resumemint_codes', JSON.stringify(validCodes));
  localStorage.setItem('resumemint_used_codes', JSON.stringify(usedCodes));

  const paid = getPriceForDownload(currentDownloadType);
  downloads += 1;
  revenue += paid;
  localStorage.setItem('resumemint_downloads', String(downloads));
  localStorage.setItem('resumemint_revenue', String(revenue));
  closeModal();

  if (currentDownloadType === 'bundle') {
    generateCoverFromCV(false);
    generateCVPDF();
    setTimeout(() => generateCoverPDF(), 350);
  } else if (currentDownloadType === 'cv') {
    generateCVPDF();
  } else if (currentDownloadType === 'cover') {
    generateCoverFromCV(false);
    generateCoverPDF();
  } else if (currentDownloadType === 'card') {
    generateCardPDF();
  } else if (currentDownloadType === 'letterhead') {
    generateLetterheadPDF();
  } else if (currentDownloadType === 'ebook') {
    generateEbookPDF(currentEbookId);
  }
}
function generateCVPDF() {
  if (!window.jspdf?.jsPDF) return alert('PDF library not loaded.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const t = getTheme('cv');
  const f = getFontConfig('cv');
  const tpl = designState.cv.template;
  const [r, g, b] = t.rgb;

  const name = document.getElementById('cvName')?.value || 'CV';
  const title = document.getElementById('cvTitle')?.value || '';
  const vacancy = document.getElementById('cvTargetRole')?.value || '';
  const contact = [document.getElementById('cvEmail')?.value || '', document.getElementById('cvPhone')?.value || '', document.getElementById('cvLocation')?.value || ''].filter(Boolean).join(' | ');

  if (tpl === 'executive') {
    doc.setFillColor(r, g, b);
    doc.rect(15, 15, 180, 34, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont(f.pdfFont, 'bold');
    doc.setFontSize(19);
    doc.text(name, 22, 26);
    doc.setFont(f.pdfFont, 'normal');
    doc.setFontSize(10);
    doc.text([title, vacancy ? `Role: ${vacancy}` : '', contact].filter(Boolean).join('  •  '), 22, 35, { maxWidth: 166 });
  } else {
    if (tpl === 'minimal') {
      doc.setFillColor(r, g, b);
      doc.rect(15, 18, 3, 26, 'F');
    }
    doc.setTextColor(30, 41, 59);
    doc.setFont(f.pdfFont, 'bold');
    doc.setFontSize(20);
    doc.text(name, 22, 25);
    doc.setTextColor(r, g, b);
    doc.setFontSize(11);
    doc.text(title + (vacancy ? ` (${vacancy})` : ''), 22, 32);
    doc.setFont(f.pdfFont, 'normal');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text(contact, 22, 39);
    if (tpl === 'modern') {
      doc.setDrawColor(r, g, b);
      doc.line(20, 44, 190, 44);
    }
  }
  let y = 56;
  [['Summary', document.getElementById('cvSummary')?.value || ''], ['Experience', document.getElementById('cvExp')?.value || ''], ['Education', document.getElementById('cvEdu')?.value || ''], ['Skills', document.getElementById('cvSkills')?.value || '']].forEach(([label, text]) => {
    if (!text.trim()) return;
    doc.setFont(f.pdfFont, 'bold');
    doc.setTextColor(r, g, b);
    doc.setFontSize(11);
    doc.text(label.toUpperCase(), 20, y);
    y += 6;
    doc.setFont(f.pdfFont, 'normal');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, 170);
    doc.text(lines, 20, y);
    y += lines.length * 5 + 8;
  });
  doc.save(name.replace(/\s+/g, '_') + '_CV.pdf');
}
function generateCoverPDF() {
  if (!window.jspdf?.jsPDF) return alert('PDF library not loaded.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const f = getFontConfig('cover');
  const t = getTheme('cover');
  const [r, g, b] = t.rgb;

  const name = document.getElementById('clName')?.value || document.getElementById('cvName')?.value || 'Applicant';
  const contact = document.getElementById('clContact')?.value || '';
  const date = document.getElementById('clDate')?.value || '';
  const company = document.getElementById('clCompany')?.value || '';
  const position = document.getElementById('clPosition')?.value || '';
  const body = document.getElementById('clBody')?.value || buildMatchedCoverLetterText();

  doc.setFont(f.pdfFont, 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(name, 20, 22);
  doc.setFont(f.pdfFont, 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(contact, 20, 28);
  doc.setDrawColor(r, g, b);
  doc.line(20, 32, 190, 32);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10.5);
  doc.text([date, company, position ? `Re: ${position}` : ''].filter(Boolean).join('\n'), 20, 41);
  const lines = doc.splitTextToSize(body, 170);
  doc.text(lines, 20, 60);
  doc.text(`Sincerely,\n${name}`, 20, Math.min(265, 60 + lines.length * 5.5 + 10));
  doc.save(name.replace(/\s+/g, '_') + '_Cover_Letter.pdf');
}
function generateCardPDF() {
  if (!window.jspdf?.jsPDF) return alert('PDF library not loaded.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [90, 54] });
  const t = getTheme('card');
  const f = getFontConfig('card');
  const tpl = designState.card.template;
  const [r, g, b] = t.rgb;
  const name = document.getElementById('bcName')?.value || 'Business Card';
  const title = document.getElementById('bcTitle')?.value || '';
  const company = document.getElementById('bcCompany')?.value || '';
  const phone = document.getElementById('bcPhone')?.value || '';
  const email = document.getElementById('bcEmail')?.value || '';

  if (tpl === 'accent') {
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 90, 54, 'F');
    doc.setTextColor(255, 255, 255);
  } else if (tpl === 'minimal') {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 90, 54, 'F');
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 4, 54, 'F');
    doc.setTextColor(30, 41, 59);
  } else {
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 90, 54, 'F');
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 90, 2.5, 'F');
    doc.setTextColor(255, 255, 255);
  }
  doc.setFont(f.pdfFont, 'bold');
  doc.setFontSize(13);
  doc.text(name, 8, 16);
  doc.setFont(f.pdfFont, 'normal');
  doc.setFontSize(9);
  doc.text(title, 8, 23);
  doc.setFontSize(8);
  doc.text(company, 8, 29);
  doc.text([phone, email].filter(Boolean).join('  •  '), 8, 42);
  doc.save(name.replace(/\s+/g, '_') + '_Card.pdf');
}

function generateLetterheadPDF() {
  if (!window.jspdf?.jsPDF) return alert('PDF library not loaded.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const t = getTheme('letterhead');
  const f = getFontConfig('letterhead');
  const tpl = designState.letterhead.template;
  const [r, g, b] = t.rgb;
  const name = document.getElementById('lhName')?.value || 'Letterhead';
  const tagline = document.getElementById('lhTagline')?.value || '';
  const contactLine = [document.getElementById('lhAddress')?.value || '', document.getElementById('lhContact')?.value || '', document.getElementById('lhWeb')?.value || ''].filter(Boolean).join('  |  ');
  if (tpl === 'banner') {
    doc.setFillColor(r, g, b);
    doc.rect(15, 14, 180, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont(f.pdfFont, 'bold');
    doc.setFontSize(18);
    doc.text(name, 20, 25);
    doc.setFont(f.pdfFont, 'normal');
    doc.setFontSize(9);
    doc.text(`${tagline}  •  ${contactLine}`, 20, 34);
  } else {
    if (tpl === 'sidebar') {
      doc.setFillColor(r, g, b);
      doc.rect(15, 16, 3, 24, 'F');
    }
    doc.setTextColor(30, 41, 59);
    doc.setFont(f.pdfFont, 'bold');
    doc.setFontSize(20);
    doc.text(name, 22, 25);
    doc.setTextColor(r, g, b);
    doc.setFontSize(10);
    doc.text(tagline, 22, 32);
    doc.setFont(f.pdfFont, 'normal');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8.5);
    doc.text(contactLine, 22, 39);
    if (tpl === 'classic') {
      doc.setDrawColor(r, g, b);
      doc.line(20, 43, 190, 43);
    }
  }
  doc.save(name.replace(/\s+/g, '_') + '_Letterhead.pdf');
}

function generateEbookPDF(id) {
  if (!window.jspdf?.jsPDF) return alert('PDF library not loaded.');
  const { jsPDF } = window.jspdf;
  const book = ebooks.find((b) => b.id === id) || ebooks[0];
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text(book.title, 20, 40);
  doc.save(book.title.replace(/\s+/g, '_') + '.pdf');
}
function loginAdmin() {
  const pass = document.getElementById('adminPass')?.value || '';
  if (pass === adminPassword) {
    isAdmin = true;
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    renderAdminDashboard();
  } else {
    alert('Wrong password!');
  }
}

function logoutAdmin() {
  isAdmin = false;
  document.getElementById('adminLogin').style.display = 'block';
  document.getElementById('adminDashboard').style.display = 'none';
}

function renderAdminDashboard() {
  const dash = document.getElementById('adminDashboard');
  if (!dash) return;
  dash.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <h3>Admin Dashboard</h3>
      <button type="button" class="btn danger small" onclick="logoutAdmin()">Logout</button>
    </div>
    <div class="admin-stats">
      <div class="stat-card"><div class="number">KES ${revenue}</div><div class="label">Revenue</div></div>
      <div class="stat-card"><div class="number">${downloads}</div><div class="label">Downloads</div></div>
      <div class="stat-card"><div class="number">${validCodes.length}</div><div class="label">Valid Codes</div></div>
      <div class="stat-card"><div class="number">${traffic}</div><div class="label">Visits</div></div>
    </div>
    <div class="admin-panel">
      <h3><i class="fas fa-tags"></i> Manual Pricing Controls (KES)</h3>
      <div class="form-row">
        <div class="form-group"><label>Single Document Price</label><input type="number" id="admSinglePrice" value="${singleDocPrice}" min="1"></div>
        <div class="form-group"><label>CV + Cover Bundle Price</label><input type="number" id="admBundlePrice" value="${bundleDocPrice}" min="1"></div>
      </div>
      <div class="form-group"><label>eBook Base Price</label><input type="number" id="admEbookPrice" value="${ebookBasePrice}" min="1"></div>
      <button type="button" class="btn success" onclick="saveAdminPricing()"><i class="fas fa-save"></i> Save Prices</button>
    </div>
    <div class="admin-panel">
      <h3><i class="fas fa-bullhorn"></i> Shout-Out, Client Offer & Banner Style</h3>
      <div class="form-row">
        <div class="form-group"><label>Offer / Shout-Out Tag</label><input type="text" id="admOfferTag" value="${activeOfferTag}" placeholder="e.g. WEEKEND OFFER"></div>
        <div class="form-group"><label>Banner Animation</label>
          <select id="admAnnAnim">
            <option value="anim-bounce" ${activeAnnAnim === 'anim-bounce' ? 'selected' : ''}>Bounce & Glow</option>
            <option value="anim-none" ${activeAnnAnim === 'anim-none' ? 'selected' : ''}>Calm Glow</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label>Banner Font</label>
        <select id="admAnnFont">
          <option value="'Inter', sans-serif" ${activeAnnFont.includes('Inter') ? 'selected' : ''}>Modern Sans (Inter)</option>
          <option value="Georgia, serif" ${activeAnnFont.includes('Georgia') ? 'selected' : ''}>Classic Serif (Georgia)</option>
          <option value="'Courier New', monospace" ${activeAnnFont.includes('Courier') ? 'selected' : ''}>Clean Monospace</option>
        </select>
      </div>
      <div class="form-group"><label>Shout-Out / Offer Message</label><input type="text" id="annInput" value="${activeAnnouncement}" placeholder="Write a shout-out or client offer..."></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button type="button" class="btn primary" onclick="saveAnnouncement()">Publish Banner</button>
        <button type="button" class="btn outline" onclick="clearAnnouncement()">Hide Banner</button>
      </div>
      <div class="admin-promo-preview" style="font-family:${activeAnnFont};">
        <span class="offer-pill">${activeOfferTag || 'OFFER'}</span>
        <span style="margin-left:8px;">${activeAnnouncement || 'No active shout-out'}</span>
      </div>
    </div>
    <div class="admin-panel">
      <h3><i class="fas fa-key"></i> M-Pesa Codes</h3>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <input type="text" id="newCodeInput" placeholder="New Code" style="flex:1;padding:12px;background:var(--bg);border:1px solid var(--bg-light);border-radius:10px;color:white;text-transform:uppercase;">
        <button type="button" class="btn success" onclick="addMpesaCode()">Add</button>
        <button type="button" class="btn outline" onclick="generateRandomCode()">Random</button>
      </div>
<div class="code-list">${validCodes.map((c) => `<div class="code-item"><span>${c}</span><button type="button" class="btn danger small" onclick="removeMpesaCode('${c}')">Delete</button></div>`).join('')}</div>
    </div>
    <div class="admin-panel">
      <h3><i class="fas fa-lock"></i> Change Admin Password</h3>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <input type="password" id="newAdminPass" placeholder="New Password" style="flex:1;padding:12px;background:var(--bg);border:1px solid var(--bg-light);border-radius:10px;color:white;">
        <button type="button" class="btn primary" onclick="changeAdminPassword()">Update</button>
      </div>
    </div>
  `;
}
function saveAdminPricing() {
  const s = parseInt(document.getElementById('admSinglePrice')?.value || '', 10);
  const b = parseInt(document.getElementById('admBundlePrice')?.value || '', 10);
  const e = parseInt(document.getElementById('admEbookPrice')?.value || '', 10);

  if (s > 0) { singleDocPrice = s; localStorage.setItem('resumemint_single_price', String(s)); }
  if (b > 0) { bundleDocPrice = b; localStorage.setItem('resumemint_bundle_price', String(b)); }
  if (e > 0) { ebookBasePrice = e; localStorage.setItem('resumemint_ebook_price', String(e)); }

  renderCVBuilder();
  renderCoverBuilder();
  renderCardBuilder();
  renderLetterheadBuilder();
  renderEbooks();
  renderBillingSection();
  renderAdminDashboard();
  alert('Pricing updated across the app!');
}

function addMpesaCode() {
  const inp = document.getElementById('newCodeInput');
  const code = (inp?.value || '').trim().toUpperCase();
  if (!code || validCodes.includes(code)) return;
  validCodes.unshift(code);
  localStorage.setItem('resumemint_codes', JSON.stringify(validCodes));
  inp.value = '';
  renderAdminDashboard();
}

function generateRandomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'RM';
  for (let i = 0; i < 8; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
  validCodes.unshift(code);
  localStorage.setItem('resumemint_codes', JSON.stringify(validCodes));
  renderAdminDashboard();
}

function removeMpesaCode(code) {
  validCodes = validCodes.filter((c) => c !== code);
  localStorage.setItem('resumemint_codes', JSON.stringify(validCodes));
  renderAdminDashboard();
}

function saveAnnouncement() {
  activeAnnouncement = (document.getElementById('annInput')?.value || '').trim();
  activeOfferTag = (document.getElementById('admOfferTag')?.value || 'OFFER').trim();
  activeAnnFont = document.getElementById('admAnnFont')?.value || "'Inter', sans-serif";
  activeAnnAnim = document.getElementById('admAnnAnim')?.value || 'anim-bounce';

  localStorage.setItem('resumemint_announcement', activeAnnouncement);
  localStorage.setItem('resumemint_offer_tag', activeOfferTag);
  localStorage.setItem('resumemint_ann_font', activeAnnFont);
  localStorage.setItem('resumemint_ann_anim', activeAnnAnim);

  showAnnouncement();
  renderAdminDashboard();
}

function clearAnnouncement() {
  activeAnnouncement = '';
  localStorage.removeItem('resumemint_announcement');
  showAnnouncement();
  renderAdminDashboard();
}

function showAnnouncement() {
  const bar = document.getElementById('announcementBar');
  if (!bar) return;
  if (activeAnnouncement) {
    bar.className = 'announcement-bar ' + (activeAnnAnim || '');
    bar.className = bar.className.trim();
    bar.style.display = 'flex';
    bar.style.fontFamily = activeAnnFont;
    bar.innerHTML = `<span class="offer-pill">${activeOfferTag || 'OFFER'}</span><span class="ann-text">${activeAnnouncement}</span><span class="close-ann" onclick="document.getElementById('announcementBar').style.display='none'">&times;</span>`;
  } else {
    bar.style.display = 'none';
  }
}

function changeAdminPassword() {
  const inp = document.getElementById('newAdminPass');
  const p = (inp?.value || '').trim();
  if (p.length < 4) return alert('Min 4 characters');
  adminPassword = p;
  localStorage.setItem('resumemint_admin_pass', p);
  inp.value = '';
  alert('Password updated!');
}
// ==================== JS SECTION 6: WHATSAPP HELP BUTTON ====================
function injectWhatsAppButton() {
  // 1. Add the CSS for the floating button
  const style = document.createElement('style');
  style.innerHTML = `
    .whatsapp-float {
      position: fixed;
      width: 60px;
      height: 60px;
      bottom: 25px;
      right: 25px;
      background-color: #25d366;
      color: #FFF;
      border-radius: 50px;
      text-align: center;
      font-size: 32px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      transition: all 0.3s ease;
      animation: pulse-wa 2s infinite;
    }
    .whatsapp-float:hover {
      transform: scale(1.1);
      color: #FFF;
      background-color: #128C7E;
    }
    @keyframes pulse-wa {
      0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7); }
      70% { box-shadow: 0 0 0 15px rgba(37, 211, 102, 0); }
      100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
    }
  `;
  document.head.appendChild(style);

  // 2. Create the button element
  const waBtn = document.createElement('a');
  waBtn.href = "https://wa.me/254703592418?text=Hi%20ResumeMint%2C%20I%20need%20help%20with%20my%20document%20download.";
  waBtn.className = "whatsapp-float";
  waBtn.target = "_blank";
  waBtn.innerHTML = '<i class="fab fa-whatsapp"></i>';
  waBtn.title = "Chat with us on WhatsApp";
  
  // 3. Add it to the page
  document.body.appendChild(waBtn);
}

// Automatically run this when the app starts
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectWhatsAppButton);
} else {
  injectWhatsAppButton();
}
