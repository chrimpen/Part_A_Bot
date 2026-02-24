(() => {
  const ROOT_ID = "sl-quiz-bot";

  // ✅ σημαντικό: relative paths για GitHub Pages (δουλεύει και σε /REPO/)
  const QUESTIONS_URL = "./quiz/questions_124_with_answers.json";

  // Supabase settings (από το index.html)
  const SUPABASE_URL = window.SUPABASE_URL;
  const SUPABASE_KEY = window.SUPABASE_KEY;

  const elRoot = document.getElementById(ROOT_ID);
  if (!elRoot) return;

  // --- UI ---
  elRoot.innerHTML = `
    <style>
      .qb-card { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; border: 1px solid #ddd; border-radius: 14px; padding: 16px; max-width: 720px; }
      .qb-title { font-size: 16px; font-weight: 700; margin: 0 0 10px; }
      .qb-q { font-size: 15px; margin: 0 0 12px; line-height: 1.35; }
      .qb-choices { display: grid; gap: 8px; margin: 10px 0 14px; }
      .qb-choice { border: 1px solid #ccc; border-radius: 10px; padding: 10px 12px; cursor: pointer; background: #fff; text-align:left; }
      .qb-choice:hover { background: #f6f6f6; }
      .qb-choice[aria-disabled="true"] { opacity: .7; cursor: not-allowed; }
      .qb-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
      .qb-btn { border: 1px solid #111; background: #111; color: #fff; border-radius: 10px; padding: 9px 12px; cursor: pointer; }
      .qb-btn.secondary { background: #fff; color: #111; }
      .qb-btn:disabled { opacity: .5; cursor: not-allowed; }
      .qb-feedback { margin-top: 12px; padding: 10px 12px; border-radius: 10px; }
      .qb-ok { background: #ecfdf3; border: 1px solid #b7f0c6; }
      .qb-bad { background: #fff1f2; border: 1px solid #fecdd3; }
      .qb-meta { color: #555; font-size: 12px; margin-top: 12px; display:flex; gap:12px; flex-wrap: wrap;}
      .qb-badge { border: 1px solid #ddd; border-radius: 999px; padding: 4px 8px; background: #fafafa; }
      textarea.qb-choice { cursor:auto; }
      select.qb-choice { cursor:auto; }
      input.qb-choice { cursor:auto; }
    </style>

    <div class="qb-card" role="region" aria-label="Quiz Bot">
      <p class="qb-title">Quiz Bot</p>

      <!-- ✅ Βήμα 1: Login (Όνομα/Επώνυμο) -->
      <div id="qb-login" style="margin-bottom:12px;">
        <div style="font-weight:700; margin-bottom:6px;">Στοιχεία χρήστη</div>
        <div class="qb-row">
          <input id="qb-first" class="qb-choice" placeholder="Όνομα" />
          <input id="qb-last" class="qb-choice" placeholder="Επώνυμο" />
          <button class="qb-btn secondary" id="qb-start">Έναρξη</button>
        </div>
        <div id="qb-login-status" style="font-size:12px; color:#555; margin-top:6px;"></div>
      </div>

      <p class="qb-q" id="qb-question">Φόρτωση…</p>

      <div id="qb-area"></div>

      <div class="qb-row">
        <button class="qb-btn secondary" id="qb-next" disabled>Επόμενη ερώτηση</button>
        <button class="qb-btn secondary" id="qb-reset">Reset</button>
      </div>

      <div id="qb-feedback"></div>

      <div id="qb-feedback-box" style="margin-top:12px; border-top:1px solid #eee; padding-top:12px;">
        <div style="font-weight:700; margin-bottom:6px;">Feedback για την ερώτηση</div>
        <div class="qb-row">
          <select id="qb-fb-cat" class="qb-choice">
            <option value="">Κατηγορία…</option>
            <option value="typo">Τυπογραφικό</option>
            <option value="ambiguous">Ασαφής</option>
            <option value="wrong_answer">Λάθος απάντηση</option>
            <option value="other">Άλλο</option>
          </select>

          <select id="qb-fb-rating" class="qb-choice">
            <option value="">Rating…</option>
            <option value="1">1/5</option>
            <option value="2">2/5</option>
            <option value="3">3/5</option>
            <option value="4">4/5</option>
            <option value="5">5/5</option>
          </select>

          <button class="qb-btn secondary" id="qb-fb-send">Αποστολή</button>
        </div>

        <textarea id="qb-fb-msg" class="qb-choice" style="width:100%; min-height:80px; margin-top:8px;"
          placeholder="Γράψε τι να διορθώσω (π.χ. ασάφεια, λάθος επιλογές, κ.λπ.)"></textarea>

        <div id="qb-fb-status" style="font-size:12px; color:#555; margin-top:6px;"></div>
      </div>

      <div class="qb-meta">
        <span class="qb-badge" id="qb-score">Σκορ: 0/0</span>
        <span class="qb-badge" id="qb-last">Τελευταία: —</span>
        <span class="qb-badge" id="qb-sb">Supabase: —</span>
      </div>
    </div>
  `;

  const $ = (sel) => elRoot.querySelector(sel);

  const elQuestion = $("#qb-question");
  const elArea = $("#qb-area");
  const elFeedback = $("#qb-feedback");
  const btnNext = $("#qb-next");
  const btnReset = $("#qb-reset");
  const elScore = $("#qb-score");
  const elLast = $("#qb-last");
  const elSb = $("#qb-sb");

  const fbBox = $("#qb-feedback-box");
  const fbCat = $("#qb-fb-cat");
  const fbRating = $("#qb-fb-rating");
  const fbMsg = $("#qb-fb-msg");
  const fbSend = $("#qb-fb-send");
  const fbStatus = $("#qb-fb-status");

  // --- login controls ---
  const loginBox = $("#qb-login");
  const firstIn = $("#qb-first");
  const lastIn = $("#qb-last");
  const startBtn = $("#qb-start");
  const loginStatus = $("#qb-login-status");

  // --- session id ---
  const sessionId = (() => {
    const k = "sl_quiz_session_id_v1";
    let v = localStorage.getItem(k);
    if (!v) {
      v = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + "_" + Math.random());
      localStorage.setItem(k, v);
    }
    return v;
  })();

  // --- supabase client ---
  const sb = (window.supabase && SUPABASE_URL && SUPABASE_KEY)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

  elSb.textContent = sb ? "Supabase: connected" : "Supabase: not connected";

  async function logAttempt(payload) {
    if (!sb) return;
    const { error } = await sb.from("quiz_attempts").insert([payload]);
    if (error) console.warn("logAttempt error:", error);
  }

  async function logFeedback(payload) {
    if (!sb) return;
    const { error } = await sb.from("quiz_feedback").insert([payload]);
    if (error) console.warn("logFeedback error:", error);
  }

  // --- NEW: register session (name/surname) ---
  async function registerSessionIfNeeded(firstName, lastName) {
    if (!sb) return;
    const { error } = await sb.from("quiz_sessions").insert([{
      session_id: sessionId,
      first_name: firstName,
      last_name: lastName
    }]);

    if (error && !String(error.message || "").toLowerCase().includes("duplicate")) {
      console.warn("quiz_sessions insert error:", error);
    }
  }

  // --- state ---
  const STORAGE_KEY = "sl_quiz_bot_state_v1";
  const state = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { correct: 0, total: 0 }; }
    catch { return { correct: 0, total: 0 }; }
  })();

  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function setScore() { elScore.textContent = `Σκορ: ${state.correct}/${state.total}`; saveState(); }

  let questions = [];
  let current = null;
  let locked = false;

  function pickRandomQuestion() {
    return questions[Math.floor(Math.random() * questions.length)];
  }

  function lockChoices() {
    locked = true;
    elArea.querySelectorAll(".qb-choice").forEach(b => b.setAttribute("aria-disabled", "true"));
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  function feedback(ok, msg, explanation) {
    const cls = ok ? "qb-feedback qb-ok" : "qb-feedback qb-bad";
    elFeedback.innerHTML = `
      <div class="${cls}">
        <div style="font-weight:700; margin-bottom:6px;">${ok ? "✅ Σωστό" : "❌ Λάθος"}</div>
        <div>${escapeHtml(msg)}</div>
        ${explanation ? `<div style="margin-top:8px; color:#333;"><b>Εξήγηση:</b> ${escapeHtml(explanation)}</div>` : ""}
      </div>
    `;
    btnNext.disabled = false;
  }

  function renderQuestion(q) {
    current = { ...q, _startTs: performance.now() };
    locked = false;
    btnNext.disabled = true;
    elFeedback.innerHTML = "";
    elQuestion.textContent = q.question;

    if (q.type === "tf") {
      elArea.innerHTML = `
        <div class="qb-choices">
          <button class="qb-choice" data-val="true">Σωστό</button>
          <button class="qb-choice" data-val="false">Λάθος</button>
        </div>
      `;
      elArea.querySelectorAll(".qb-choice").forEach(btn => {
        btn.addEventListener("click", () => {
          if (locked) return;
          const userVal = btn.dataset.val === "true";
          gradeTF(userVal);
        });
      });
    } else if (q.type === "mcq") {
      elArea.innerHTML = `
        <div class="qb-choices">
          ${q.choices.map((c, i) => `<button class="qb-choice" data-idx="${i}">${escapeHtml(c)}</button>`).join("")}
        </div>
      `;
      elArea.querySelectorAll(".qb-choice").forEach(btn => {
        btn.addEventListener("click", () => {
          if (locked) return;
          gradeMCQ(Number(btn.dataset.idx));
        });
      });
    } else {
      elArea.innerHTML = `<p style="color:#b00">Άγνωστος τύπος: ${escapeHtml(String(q.type))}</p>`;
    }
  }

  function gradeTF(userVal) {
    lockChoices();
    state.total += 1;

    const ok = userVal === current.answer;
    if (ok) state.correct += 1;

    elLast.textContent = `Τελευταία: ${ok ? "Σωστό" : "Λάθος"}`;
    setScore();

    const rt = Math.round(performance.now() - current._startTs);
    logAttempt({
      session_id: sessionId,
      question_id: current.id,
      q_type: current.type,
      is_correct: ok,
      response_time_ms: rt,
      user_answer: String(userVal)
    });

    feedback(ok, `Η σωστή απάντηση είναι: ${current.answer ? "Σωστό" : "Λάθος"}.`, current.explanation || "");
  }

  function gradeMCQ(userIdx) {
    lockChoices();
    state.total += 1;

    const ok = userIdx === current.answerIndex;
    if (ok) state.correct += 1;

    elLast.textContent = `Τελευταία: ${ok ? "Σωστό" : "Λάθος"}`;
    setScore();

    const rt = Math.round(performance.now() - current._startTs);
    logAttempt({
      session_id: sessionId,
      question_id: current.id,
      q_type: current.type,
      is_correct: ok,
      response_time_ms: rt,
      user_answer: String(userIdx)
    });

    const correctText = current.choices[current.answerIndex];
    const chosenText = current.choices[userIdx];
    feedback(ok, `Επέλεξες: "${chosenText}". Σωστό: "${correctText}".`, current.explanation || "");
  }

  // feedback submit
  fbSend.addEventListener("click", async () => {
    if (!current) return;
    fbStatus.textContent = "Αποστολή…";

    await logFeedback({
      session_id: sessionId,
      question_id: current.id,
      rating: fbRating.value ? Number(fbRating.value) : null,
      category: fbCat.value || null,
      message: fbMsg.value?.trim() || null
    });

    fbStatus.textContent = "Ελήφθη ✅";
    fbMsg.value = "";
    fbCat.value = "";
    fbRating.value = "";
  });

  btnNext.addEventListener("click", () => renderQuestion(pickRandomQuestion()));
  btnReset.addEventListener("click", () => {
    state.correct = 0; state.total = 0; saveState(); setScore();
    elLast.textContent = "Τελευταία: —";
    if (questions.length) renderQuestion(pickRandomQuestion());
  });

  // --- login gate helpers ---
  function setQuizEnabled(enabled) {
    elQuestion.style.display = enabled ? "" : "none";
    elArea.style.display = enabled ? "" : "none";
    btnNext.style.display = enabled ? "" : "none";
    btnReset.style.display = enabled ? "" : "none";
    elFeedback.style.display = enabled ? "" : "none";
    fbBox.style.display = enabled ? "" : "none";
  }

  const USER_KEY = "sl_quiz_user_v1";
  let user = null;
  try { user = JSON.parse(localStorage.getItem(USER_KEY)); } catch { user = null; }

  // αρχικά κλείδωσε μέχρι να γίνει login
  setQuizEnabled(false);

  // αν υπάρχει ήδη user, auto-start
  if (user?.first_name && user?.last_name) {
    loginBox.style.display = "none";
    setQuizEnabled(true);
    registerSessionIfNeeded(user.first_name, user.last_name);
  }

  startBtn.addEventListener("click", async () => {
    const firstName = (firstIn.value || "").trim();
    const lastName = (lastIn.value || "").trim();

    if (!firstName || !lastName) {
      loginStatus.textContent = "Συμπλήρωσε Όνομα και Επώνυμο.";
      return;
    }

    user = { first_name: firstName, last_name: lastName };
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    loginStatus.textContent = "Αποθήκευση…";
    await registerSessionIfNeeded(firstName, lastName);

    loginBox.style.display = "none";
    setQuizEnabled(true);

    if (questions.length) renderQuestion(pickRandomQuestion());
  });

  // init
  (async () => {
    try {
      const res = await fetch(QUESTIONS_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) throw new Error("Empty questions");
      questions = data;
      setScore();

      // Μόνο αν έχει γίνει login, δείχνουμε ερώτηση (αλλιώς περιμένουμε)
      if (loginBox.style.display === "none") {
        renderQuestion(pickRandomQuestion());
      } else {
        elQuestion.textContent = "Συμπλήρωσε στοιχεία για να ξεκινήσεις.";
      }
    } catch (e) {
      console.error(e);
      elQuestion.textContent = "Αποτυχία φόρτωσης ερωτήσεων.";
      elArea.innerHTML = `<p style="color:#b00">Έλεγξε το ${escapeHtml(QUESTIONS_URL)} και το format του JSON.</p>`;
    }
  })();
})();