document.addEventListener('DOMContentLoaded', () => {
  const actionBtn = document.getElementById('actionBtn');
  const statusBadge = document.getElementById('statusBadge');
  const counter = document.getElementById('counter');
  const progressBar = document.getElementById('progressBar');
  const logBox = document.getElementById('logBox');
  const openSearchLink = document.getElementById('openSearchLink');

  let isRunning = false;

  function appendLog(msg, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type === 'success' ? 'log-success' : type === 'warn' ? 'log-warn' : type === 'error' ? 'log-error' : ''}`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.innerText = `[${time}] ${msg}`;
    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
  }

  function updateUI(running, count) {
    isRunning = running;
    counter.innerText = `${count} / 20`;
    const pct = Math.min(100, Math.round((count / 20) * 100));
    progressBar.style.width = `${pct}%`;

    if (running) {
      statusBadge.innerText = 'RUNNING';
      statusBadge.style.color = '#34d399';
      statusBadge.style.borderColor = '#34d399';
      actionBtn.innerText = 'PAUSE AUTO-APPLY';
      actionBtn.classList.add('btn-stop');
    } else {
      statusBadge.innerText = count >= 20 ? 'COMPLETED' : 'READY';
      statusBadge.style.color = count >= 20 ? '#10b981' : '#22d3ee';
      statusBadge.style.borderColor = count >= 20 ? '#10b981' : '#22d3ee';
      actionBtn.innerText = count >= 20 ? 'DAILY LIMIT REACHED (20)' : 'START AUTO-APPLY';
      actionBtn.classList.remove('btn-stop');
      actionBtn.disabled = count >= 20;
    }
  }

  // Poll current tab status
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'GET_STATUS' }, (res) => {
        if (chrome.runtime.lastError || !res) {
          // Tab might not have script injected yet
          chrome.storage.local.get(['jobflow_today_count'], (st) => {
            updateUI(false, st.jobflow_today_count || 0);
          });
        } else {
          updateUI(res.isRunning, res.todayCount);
        }
      });
    }
  });

  // Toggle Action Button
  actionBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab || !activeTab.url.includes('linkedin.com/jobs')) {
        appendLog('Please open a LinkedIn Jobs search page first!', 'warn');
        return;
      }

      if (!isRunning) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'START' }, (res) => {
          if (chrome.runtime.lastError) {
            appendLog('Could not connect to LinkedIn page. Refresh the page and try again.', 'error');
          } else {
            updateUI(true, parseInt(counter.innerText));
            appendLog('Autonomous agent started.');
          }
        });
      } else {
        chrome.tabs.sendMessage(activeTab.id, { action: 'STOP' }, (res) => {
          updateUI(false, parseInt(counter.innerText));
          appendLog('Agent paused by user.', 'warn');
        });
      }
    });
  });

  // Open Search Link
  openSearchLink.addEventListener('click', (e) => {
    e.preventDefault();
    const url = 'https://www.linkedin.com/jobs/search/?keywords=Continuous%20Improvement&f_AL=true';
    chrome.tabs.create({ url });
  });

  // Listen for live log events from content script
  chrome.runtime.onMessage.addListener((req) => {
    if (req.type === 'LOG') {
      appendLog(req.message, req.status);
      chrome.storage.local.get(['jobflow_today_count'], (st) => {
        const count = st.jobflow_today_count || 0;
        counter.innerText = `${count} / 20`;
        progressBar.style.width = `${Math.min(100, Math.round((count / 20) * 100))}%`;
      });
    }
  });
});
