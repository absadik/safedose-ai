const GROQ_API_KEY = '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';
const MODEL = 'llama-3.3-70b-versatile';

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

async function askAI(question){
  if(!GROQ_API_KEY || GROQ_API_KEY === 'PASTE_YOUR_GROQ_KEY_HERE') {
    return '⚠️ API key missing. Put your gsk_... key at the top of app.js.';
  }
  const sys = "You are SafeDose AI, an educational assistant. RULES: Never prescribe, never calculate doses, never diagnose. Answer general safety questions only. Keep under 100 words.";
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {'Authorization': 'Bearer ' + GROQ_API_KEY, 'Content-Type': 'application/json'},
      body: JSON.stringify({ model: MODEL, messages: [{role: 'system', content: sys}, {role: 'user', content: question}], max_tokens: 300 })
    });
    const d = await res.json();
    if(d.choices && d.choices[0]?.message?.content) return d.choices[0].message.content.trim();
    return '⚠️ Error: ' + (d.error?.message || 'No response');
  } catch(e) { return '⚠️ Network error.'; }
}

function addMsg(text, who){
  const box = document.getElementById('chat-box');
  const div = document.createElement('div');
  div.className = 'msg ' + who;
  div.innerHTML = text.replace(/\n/g,'<br>');
  box.appendChild(div); box.scrollTop = box.scrollHeight;
}

function sendChat(){
  const inp = document.getElementById('chat-input');
  const t = inp.value.trim(); if(!t) return;
  addMsg(t, 'user'); inp.value = '';
  const typing = document.createElement('div');
  typing.className = 'msg ai'; typing.textContent = 'Thinking...';
  document.getElementById('chat-box').appendChild(typing);
  askAI(t).then(r => { typing.remove(); addMsg(r, 'ai'); });
}
function askSuggestion(q){ document.getElementById('chat-input').value=q; sendChat(); }

function runVerification(){
  const pId = document.getElementById('p-id').value.trim().toUpperCase();
  const pConf = document.getElementById('p-confirm').value.trim().toUpperCase();
  const mId = document.getElementById('m-id').value.trim().toUpperCase();
  const box = document.getElementById('verify-result');
  if(!pId || !mId || !pConf){ box.innerHTML = '<div class="status warn">⚠️ Please fill in all boxes.</div>'; return; }
  if(pConf !== pId){ stats.warnings++; updateDashboard(); box.innerHTML = '<div class="status error"><strong>❌ Identity Mismatch!</strong> The typed IDs do not match.</div>'; return; }
  if(!MEDS[mId]){ box.innerHTML = '<div class="status error"><strong>❌ Unknown Medication!</strong> Try typing MED-ART-01, MED-AMX-05, or MED-INS-03.</div>'; return; }
  const m = MEDS[mId];
  document.getElementById('md-batch').textContent = m.batch;
  document.getElementById('md-expiry').textContent = m.expiry;
  document.getElementById('med-details').classList.remove('hidden');
  stats.verifications++;
  box.innerHTML = '<div class="status ok"><strong>✅ Verification Successful.</strong> Patient and medication match.</div>';
  updateDashboard();
}

function updateChecklist(){
  const boxes = document.querySelectorAll('#view-injection input[type="checkbox"]');
  let checked = 0;
  boxes.forEach(b => { if(b.checked) checked++; });
  document.getElementById('chk-progress').textContent = checked + ' / 5';
  const status = document.getElementById('chk-status');
  if(checked === 5){ stats.checks++; updateDashboard(); status.innerHTML = '<div class="status ok"><strong>✅ Checklist Complete.</strong> Final clinical judgement remains with the professional.</div>'; }
  else if(checked > 0){ status.innerHTML = '<div class="status warn">⚠️ Incomplete: ' + (5-checked) + ' steps remaining.</div>'; }
  else { status.innerHTML = ''; }
}

let obsHistory = [];
function recordObs(){
  const t = parseFloat(document.getElementById('o-temp').value);
  const hr = parseInt(document.getElementById('o-hr').value);
  const spo2 = parseInt(document.getElementById('o-spo2').value);
  const rx = document.getElementById('o-rx').value;
  const box = document.getElementById('obs-result');
  if(isNaN(t) || isNaN(hr)){ box.innerHTML = '<div class="status error">❌ Please enter valid numbers.</div>'; return; }
  let flags = [];
  if(t >= 38.0) flags.push("High Temp");
  if(hr > 100 || hr < 50) flags.push("Abnormal HR");
  if(spo2 < 94) flags.push("Low SpO₂");
  if(rx !== 'none') flags.push("Reaction");
  stats.observations++;
  if(flags.length > 0){ stats.warnings++; box.innerHTML = '<div class="status error"><strong>🚨 WARNING FLAGS:</strong> ' + flags.join(', ') + '. Escalate immediately.</div>'; }
  else { box.innerHTML = '<div class="status ok"><strong>✅ Recorded.</strong> No warning thresholds triggered.</div>'; }
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
