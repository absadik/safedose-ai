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
let stats = { verifications: 0, warnings: 0, checks: 0, observations: 0 };
const MEDS = {
  'MED-ART-01': { batch: 'SIM-ART-041', expiry: '2027-08' },
  'MED-AMX-05': { batch: 'SIM-AMX-118', expiry: '2027-02' },
  'MED-INS-03': { batch: 'SIM-INS-009', expiry: '2026-12' }
};

function go(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+id).classList.add('active');
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.v===id));
  window.scrollTo({top:0,behavior:'smooth'});
}

function runVerification(){
  const pId = document.getElementById('p-id').value.trim().toUpperCase();
  const pConf = document.getElementById('p-confirm').value.trim().toUpperCase();
  const mId = document.getElementById('m-id').value.trim().toUpperCase();
  const box = document.getElementById('verify-result');
  
  if(!pId || !mId || !pConf){
    box.innerHTML = '<div class="status warn">⚠️ Please fill in all boxes.</div>'; return;
  }
  
  if(pConf !== pId){
    stats.warnings++;
    updateDashboard();
    box.innerHTML = '<div class="status error"><strong>❌ Identity Mismatch!</strong> The typed IDs do not match. In a real system, this would halt the procedure.</div>';
    return;
  }

  if(!MEDS[mId]){
    box.innerHTML = '<div class="status error"><strong>❌ Unknown Medication!</strong> Try typing MED-ART-01, MED-AMX-05, or MED-INS-03.</div>';
    return;
  }

  const m = MEDS[mId];
  document.getElementById('md-batch').textContent = m.batch;
  document.getElementById('md-expiry').textContent = m.expiry;
  document.getElementById('med-details').classList.remove('hidden');

  stats.verifications++;
  box.innerHTML = '<div class="status ok"><strong>✅ Verification Successful.</strong> Patient and medication match. Safety check complete. This does not authorise administration.</div>';
  updateDashboard();
}

function updateChecklist(){
  const boxes = document.querySelectorAll('#view-injection input[type="checkbox"]');
  let checked = 0;
  boxes.forEach(b => { if(b.checked) checked++; });
  
  document.getElementById('chk-progress').textContent = checked + ' / 5';
  const status = document.getElementById('chk-status');
  
  if(checked === 5){
    stats.checks++;
    updateDashboard();
    status.innerHTML = '<div class="status ok"><strong>✅ Checklist Complete.</strong> All safety steps marked. This does NOT authorise injection. Final clinical judgement remains with the professional.</div>';
  } else if(checked > 0){
    status.innerHTML = '<div class="status warn">⚠️ Incomplete: ' + (5-checked) + ' steps remaining. Do not proceed until all checks are complete.</div>';
  } else {
    status.innerHTML = '';
  }
}

let obsHistory = [];
function recordObs(){
  const t = parseFloat(document.getElementById('o-temp').value);
  const hr = parseInt(document.getElementById('o-hr').value);
  const bp = parseInt(document.getElementById('o-bp').value);
  const spo2 = parseInt(document.getElementById('o-spo2').value);
  const rx = document.getElementById('o-rx').value;
  const box = document.getElementById('obs-result');
  
  if(isNaN(t) || isNaN(hr)){
    box.innerHTML = '<div class="status error">❌ Please enter valid numbers for vitals.</div>'; return;
  }
  
  let flags = [];
  if(t >= 38.0) flags.push("High Temp");
  if(hr > 100 || hr < 50) flags.push("Abnormal HR");
  if(spo2 < 94) flags.push("Low SpO₂");
  if(rx !== 'none') flags.push("Reaction");
  
  stats.observations++;
  
  if(flags.length > 0){
    stats.warnings++;
    box.innerHTML = '<div class="status error"><strong>🚨 WARNING FLAGS DETECTED:</strong> ' + flags.join(', ') + '. Escalate to a qualified professional immediately (Simulation).</div>';
  } else {
    box.innerHTML = '<div class="status ok"><strong>✅ Recorded.</strong> No warning thresholds triggered in this simulation.</div>';
  }
  
  const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  obsHistory.unshift({ time, t, hr, flags });
  renderHistory();
  updateDashboard();
}

function renderHistory(){
  const list = document.getElementById('obs-history');
  if(obsHistory.length === 0) return;
  list.innerHTML = obsHistory.map(h => `
    <div class="log-item">
      <span>${h.time} — ${h.t}°C, ${h.hr} bpm</span>
      <span class="log-tag ${h.flags.length > 0 ? 'warn' : 'ok'}">${h.flags.length > 0 ? 'Warnings' : 'Normal'}</span>
    </div>
  `).join('');
}

function updateDashboard(){
  document.getElementById('dash-verify').textContent = stats.verifications;
  document.getElementById('dash-incidents').textContent = stats.warnings;
  document.getElementById('dash-check').textContent = stats.checks;
}

function resetSession(){
  stats = { verifications: 0, warnings: 0, checks: 0, observations: 0 };
  obsHistory = [];
  document.getElementById('obs-history').innerHTML = '<p style="font-size:.8rem;color:var(--muted)">No records yet.</p>';
  document.getElementById('verify-result').innerHTML = '';
  document.getElementById('chk-status').innerHTML = '';
  document.getElementById('obs-result').innerHTML = '';
  document.querySelectorAll('#view-injection input[type="checkbox"]').forEach(b => b.checked = false);
  document.getElementById('chk-progress').textContent = '0 / 5';
  updateDashboard();
  alert("Session data reset to 0.");
  }
