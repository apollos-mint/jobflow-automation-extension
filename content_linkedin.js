// JobFlow AI - LinkedIn Easy Apply Automation Content Script

let isRunning = false;
let appliedToday = 0;
const MAX_DAILY = 20;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomDelay = (minMs, maxMs) => delay(Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs);

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

async function loadState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['jobflow_applied_history', 'jobflow_today_date', 'jobflow_today_count'], (res) => {
      const today = getTodayString();
      let count = res.jobflow_today_count || 0;
      if (res.jobflow_today_date !== today) {
        count = 0;
        chrome.storage.local.set({ jobflow_today_date: today, jobflow_today_count: 0 });
      }
      resolve({
        history: res.jobflow_applied_history || [],
        todayCount: count
      });
    });
  });
}

async function recordApplication(company, title) {
  const { history, todayCount } = await loadState();
  const today = getTodayString();
  history.push({
    company,
    title,
    appliedAt: new Date().toISOString(),
    platform: 'LinkedIn'
  });
  const newCount = todayCount + 1;
  await new Promise((resolve) => {
    chrome.storage.local.set({
      jobflow_applied_history: history,
      jobflow_today_count: newCount,
      jobflow_today_date: today
    }, resolve);
  });
  logToPopup(`✅ APPLIED: ${title} at ${company} [${newCount}/${MAX_DAILY} today]`, 'success');
  return newCount;
}

function hasAlreadyApplied(company, history) {
  if (!company) return false;
  const cleanComp = company.trim().toLowerCase();
  return history.some((h) => h.company && h.company.trim().toLowerCase() === cleanComp);
}

function logToPopup(message, type = 'info') {
  console.log(`[JobFlow] ${message}`);
  chrome.runtime.sendMessage({
    type: 'LOG',
    message,
    status: type
  }).catch(() => {});
}

// Auto-fills form elements in the modal
function fillCurrentModalStep() {
  const modal = document.querySelector('.jobs-easy-apply-modal, [role="dialog"]');
  if (!modal) return;

  const p = window.USER_PROFILE || {
    firstName: "Alex",
    lastName: "Taylor",
    fullName: "Alex Taylor",
    email: "candidate@example.com",
    phone: "600000000",
    phoneFull: "+34600000000",
    city: "Valencia, Spain",
    address: "Valencia, Spain",
    postalCode: "46001",
    experienceMap: { default: "5" },
    booleanAnswers: [],
    dropdownMap: {}
  };

  // 1. Text Inputs
  const textInputs = modal.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"], input[type="number"]');
  textInputs.forEach((input) => {
    if (input.value && input.value.trim() !== '') return; // Don't overwrite existing valid data
    const labelText = (input.labels?.[0]?.innerText || input.placeholder || input.name || input.id || '').toLowerCase();

    if (labelText.includes('phone') || labelText.includes('teléfono') || labelText.includes('mobile') || labelText.includes('móvil')) {
      setInputVal(input, p.phone);
    } else if (labelText.includes('email') || labelText.includes('correo')) {
      setInputVal(input, p.email);
    } else if (labelText.includes('first name') || labelText.includes('nombre')) {
      setInputVal(input, p.firstName);
    } else if (labelText.includes('last name') || labelText.includes('apellido')) {
      setInputVal(input, p.lastName);
    } else if (labelText.includes('city') || labelText.includes('ciudad') || labelText.includes('location')) {
      setInputVal(input, p.city);
    } else if (labelText.includes('portfolio') || labelText.includes('website') || labelText.includes('web')) {
      setInputVal(input, p.portfolio);
    } else if (labelText.includes('linkedin')) {
      setInputVal(input, p.linkedin);
    } else if (input.type === 'number' || labelText.includes('years') || labelText.includes('años') || labelText.includes('experiencia')) {
      // Find matching experience keyword
      let expYears = p.experienceMap.default;
      for (const [key, val] of Object.entries(p.experienceMap)) {
        if (labelText.includes(key)) {
          expYears = val;
          break;
        }
      }
      setInputVal(input, expYears);
    }
  });

  // 2. Radio Buttons
  const fieldsets = modal.querySelectorAll('fieldset');
  fieldsets.forEach((fs) => {
    const legend = (fs.querySelector('legend')?.innerText || '').toLowerCase();
    let targetVal = 'yes';
    for (const rule of p.booleanAnswers) {
      if (rule.patterns.some((pat) => legend.includes(pat))) {
        targetVal = rule.answer;
        break;
      }
    }

    const radios = fs.querySelectorAll('input[type="radio"]');
    for (const radio of radios) {
      const radioLabel = (radio.labels?.[0]?.innerText || radio.value || '').toLowerCase();
      if (targetVal === 'yes' && (radioLabel.includes('yes') || radioLabel.includes('sí') || radioLabel.includes('si') || radioLabel === '1')) {
        radio.click();
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      } else if (targetVal === 'no' && (radioLabel.includes('no') || radioLabel === '0')) {
        radio.click();
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  });

  // 3. Dropdowns (Select elements)
  const selects = modal.querySelectorAll('select');
  selects.forEach((sel) => {
    if (sel.value && sel.selectedIndex > 0) return;
    const label = (sel.labels?.[0]?.innerText || sel.name || '').toLowerCase();
    
    // Choose the best option
    let chosenOption = null;
    const options = Array.from(sel.options);

    if (label.includes('english') || label.includes('inglés')) {
      chosenOption = options.find(o => p.dropdownMap.english.some(w => o.text.toLowerCase().includes(w)));
    } else if (label.includes('spanish') || label.includes('español')) {
      chosenOption = options.find(o => p.dropdownMap.spanish.some(w => o.text.toLowerCase().includes(w)));
    } else if (label.includes('education') || label.includes('educación') || label.includes('degree')) {
      chosenOption = options.find(o => p.dropdownMap.education.some(w => o.text.toLowerCase().includes(w)));
    } else if (label.includes('notice') || label.includes('disponibilidad')) {
      chosenOption = options.find(o => p.dropdownMap.notice.some(w => o.text.toLowerCase().includes(w)));
    }

    if (!chosenOption && options.length > 1) {
      // Pick first affirmative/meaningful option if not matched
      chosenOption = options.find(o => o.text.toLowerCase().includes('yes') || o.text.toLowerCase().includes('sí')) || options[1];
    }

    if (chosenOption) {
      sel.value = chosenOption.value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

function setInputVal(input, value) {
  input.focus();
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.blur();
}

// Steps through the Easy Apply modal until submitted or abandoned
async function processEasyApplyModal(company, title) {
  logToPopup(`Processing application for: ${title} at ${company}...`);
  let maxSteps = 8;

  while (maxSteps > 0 && isRunning) {
    maxSteps--;
    await delay(1200);

    const modal = document.querySelector('.jobs-easy-apply-modal, [role="dialog"]');
    if (!modal) {
      logToPopup('Modal closed or not detected.', 'warn');
      return false;
    }

    // Auto-fill all inputs in this step
    fillCurrentModalStep();
    await delay(800);

    // Look for Submit button
    const submitBtn = Array.from(modal.querySelectorAll('button')).find((b) => {
      const txt = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase();
      return txt.includes('submit application') || txt.includes('enviar solicitud');
    });

    if (submitBtn) {
      logToPopup(`Submitting application for ${company}...`);
      submitBtn.click();
      await delay(2500);

      // Dismiss confirmation dialog if shown
      const dismissBtn = document.querySelector('button[aria-label="Dismiss"], button[aria-label="Cerrar"], .artdeco-modal__dismiss');
      if (dismissBtn) dismissBtn.click();

      await recordApplication(company, title);
      return true;
    }

    // Look for Review button
    const reviewBtn = Array.from(modal.querySelectorAll('button')).find((b) => {
      const txt = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase();
      return txt.includes('review') || txt.includes('revisar');
    });

    if (reviewBtn) {
      reviewBtn.click();
      continue;
    }

    // Look for Next / Continue button
    const nextBtn = Array.from(modal.querySelectorAll('button')).find((b) => {
      const txt = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase();
      return txt.includes('next') || txt.includes('siguiente') || txt.includes('continue');
    });

    if (nextBtn) {
      nextBtn.click();
      continue;
    }

    // If no progress buttons found, break
    logToPopup('No next/submit button available or step requires manual input.', 'warn');
    break;
  }

  // If stuck, gracefully discard to prevent blocking the user
  const closeBtn = document.querySelector('.jobs-easy-apply-modal button[aria-label="Dismiss"], .jobs-easy-apply-modal button[aria-label="Cerrar"]');
  if (closeBtn) {
    closeBtn.click();
    await delay(500);
    const discardBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('discard') || b.innerText.toLowerCase().includes('descartar'));
    if (discardBtn) discardBtn.click();
  }

  return false;
}

async function startAutoApplying() {
  if (isRunning) return;
  isRunning = true;

  logToPopup('🚀 JobFlow Agent started. Scanning job cards...');

  while (isRunning) {
    const { history, todayCount } = await loadState();
    if (todayCount >= MAX_DAILY) {
      logToPopup(`🛑 Daily limit of ${MAX_DAILY} applications reached for today! Stopping.`, 'success');
      isRunning = false;
      break;
    }

    const jobCards = Array.from(document.querySelectorAll('.job-card-container, .jobs-search-results__list-item'));
    if (jobCards.length === 0) {
      logToPopup('No job cards found on current view. Please ensure you are on a LinkedIn Jobs search page.', 'error');
      isRunning = false;
      break;
    }

    let appliedInBatch = false;

    for (const card of jobCards) {
      if (!isRunning) break;

      const titleEl = card.querySelector('.job-card-list__title, a.job-card-container__link, strong');
      const companyEl = card.querySelector('.job-card-container__primary-description, .artdeco-entity-lockup__subtitle');

      const title = titleEl ? titleEl.innerText.trim() : 'Unknown Position';
      const company = companyEl ? companyEl.innerText.trim() : 'Unknown Company';

      // Deduplication check
      if (hasAlreadyApplied(company, history)) {
        logToPopup(`⏭️ Skipping "${title}" at "${company}" (already applied to this company).`);
        continue;
      }

      // Click card to view details
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.click();
      await delay(2000);

      // Check for Easy Apply button
      const applyBtn = document.querySelector('.jobs-apply-button');
      if (!applyBtn) {
        logToPopup(`⏭️ Skipping "${title}" (External ATS link, not Easy Apply).`);
        continue;
      }

      const btnText = (applyBtn.innerText || '').toLowerCase();
      if (!btnText.includes('easy apply') && !btnText.includes('solicitud sencilla')) {
        logToPopup(`⏭️ Skipping "${title}" (Not an Easy Apply position).`);
        continue;
      }

      // Found a matching Easy Apply job at a new company!
      logToPopup(`🎯 Target found: "${title}" at "${company}". Initiating application...`);
      applyBtn.click();
      await delay(1500);

      const success = await processEasyApplyModal(company, title);
      if (success) {
        appliedInBatch = true;
        // Natural human delay between applications (12-25 seconds)
        const pauseSec = Math.floor(Math.random() * 14) + 12;
        logToPopup(`⏳ Cooling down for ${pauseSec}s before next application (Account Safety)...`);
        await delay(pauseSec * 1000);
      } else {
        await delay(3000);
      }

      // Check daily limit again
      const current = await loadState();
      if (current.todayCount >= MAX_DAILY) {
        logToPopup(`🏁 Daily limit of ${MAX_DAILY} applications reached!`, 'success');
        isRunning = false;
        break;
      }
    }

    // If finished current page, try clicking next page button
    if (isRunning) {
      const nextPageBtn = document.querySelector('.artdeco-pagination__button--next, button[aria-label="View next page"]');
      if (nextPageBtn && !nextPageBtn.disabled) {
        logToPopup('📄 Moving to next search results page...');
        nextPageBtn.click();
        await delay(4000);
      } else {
        logToPopup('No more pages or jobs found in this query.', 'warn');
        isRunning = false;
        break;
      }
    }
  }

  isRunning = false;
  logToPopup('JobFlow Agent stopped.');
}

function stopAutoApplying() {
  isRunning = false;
  logToPopup('JobFlow Agent received STOP signal.', 'warn');
}

// Message Listener from Popup
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === 'START') {
    startAutoApplying();
    sendResponse({ status: 'STARTED' });
  } else if (req.action === 'STOP') {
    stopAutoApplying();
    sendResponse({ status: 'STOPPED' });
  } else if (req.action === 'GET_STATUS') {
    loadState().then((st) => {
      sendResponse({ isRunning, todayCount: st.todayCount, history: st.history });
    });
    return true; // Keep channel open for async response
  }
});
