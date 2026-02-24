(() => {
  const ROOT_ID = "sl-quiz-bot";

  // ✅ relative path για GitHub Pages (δουλεύει και σε /REPO/)
  const QUESTIONS_URL = "./quiz/questions_tf124_mcq50_combined.json";

  // Supabase settings (από το index.html)
  const SUPABASE_URL = window.SUPABASE_URL;
  const SUPABASE_KEY = window.SUPABASE_KEY;

  const elRoot = document.getElementById(ROOT_ID);
  if (!elRoot) return;

  // --- UI ---
  elRoot.innerHTML = `
    <style>
      .qb-card { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; border: 1px solid #ddd; border-radius: 14px; padding: 16px; max-width: 860px; }
      .qb-title { font-size: 16px; font-weight: 700; margin: 0 0 10px; }
      .qb-q { font-size: 15px; margin: 0 0 12px; line-height: 1.45; }
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
      .qb-opt-label { display:inline-flex; align-items:center; justify-content:center; width: 26px; height: 26px; border-radius: 999px; border:1px solid #bbb; font-weight:700; margin-right:10px; flex: 0 0 26px; }
      .qb-opt-wrap { display:flex; align-items:flex-start; }
      .qb-opt-text { flex: 1 1 auto; line-height:1.4; }
      textarea.qb-choice { cursor:auto; }
      select.qb-choice { cursor:auto; }
      input.qb-choice { cursor:auto; }
    </style>

    <div class="qb-card" role="region" aria-label="Quiz Bot">
      <p class="qb-title">Quiz Bot</p>

      <div id="qb-login" style="margin-bottom:12px;">
        <div style="font-weight:700; margin-bottom:6px;">Στοιχεία χρήστη</div>
        <div class="qb-row">
          <input id="qb-first" class="qb-choice" placeholder="Όνομα" />
          <input id="qb-last" class="qb-choice" placeholder="Επώνυμο" />
          <button class="qb-btn secondary" id="qb-start">Έναρξη</button>
        </div>
        <div id="qb-login-status" style="font-size:12px; color:#555; margin-top:6px;"></div>
      </div>

      <div id="qb-cats" style="margin: 10px 0 12px; display:none;">
        <div style="font-weight:700; margin-bottom:6px;">Κατηγορίες</div>
        <div id="qb-cats-list" class="qb-choices" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));"></div>
        <div style="font-size:12px; color:#555; margin-top:6px;">
          Αν δεν επιλέξεις τίποτα, θα παίζει από όλες.
        </div>
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

  const loginBox = $("#qb-login");
  const firstIn = $("#qb-first");
  const lastIn = $("#qb-last");
  const startBtn = $("#qb-start");
  const loginStatus = $("#qb-login-status");

  const catsBox = $("#qb-cats");
  const catsList = $("#qb-cats-list");

  const sessionId = (() => {
    const k = "sl_quiz_session_id_v1";
    let v = localStorage.getItem(k);
    if (!v) {
      v = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + "_" + Math.random());
      localStorage.setItem(k, v);
    }
    return v;
  })();

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

  const CAT_KEY = "sl_quiz_categories_v1";
  let selectedCats = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(CAT_KEY) || "[]");
    selectedCats = new Set(Array.isArray(saved) ? saved : []);
  } catch {}

  function saveCats() {
    localStorage.setItem(CAT_KEY, JSON.stringify([...selectedCats]));
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  function normCat(q) {
    return ((q.category || "Γενικά") + "").trim() || "Γενικά";
  }

  function getCategoriesFromQuestions(qs) {
    const set = new Set();
    qs.forEach(q => set.add(normCat(q)));
    return [...set].sort((a, b) => a.localeCompare(b, "el"));
  }

  function renderCategoriesUI(categories) {
    catsList.innerHTML = categories.map(cat => {
      const checked = selectedCats.has(cat) ? "checked" : "";
      return `
        <label class="qb-choice" style="display:flex; gap:10px; align-items:center;">
          <input type="checkbox" data-cat="${escapeHtml(cat)}" ${checked} />
          <span>${escapeHtml(cat)}</span>
        </label>
      `;
    }).join("");

    catsList.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", () => {
        const cat = cb.getAttribute("data-cat");
        if (!cat) return;
        if (cb.checked) selectedCats.add(cat);
        else selectedCats.delete(cat);
        saveCats();
      });
    });
  }

  function pickRandomQuestion() {
    const pool = (selectedCats.size === 0)
      ? questions
      : questions.filter(q => selectedCats.has(normCat(q)));

    if (!pool.length) return questions[Math.floor(Math.random() * questions.length)];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function lockChoices() {
    locked = true;
    elArea.querySelectorAll(".qb-choice").forEach(b => b.setAttribute("aria-disabled", "true"));
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

  function renderTF(q) {
    elArea.innerHTML = `
      <div class="qb-choices">
        <button class="qb-choice" data-val="true">Σωστό</button>
        <button class="qb-choice" data-val="false">Λάθος</button>
      </div>
    `;
    elArea.querySelectorAll(".qb-choice").forEach(btn => {
      btn.addEventListener("click", () => {
        if (locked) return;
        gradeTF(btn.dataset.val === "true");
      });
    });
  }

  function renderMCQ(q) {
    const labels = ["Α", "Β", "Γ", "Δ"];
    const choices = Array.isArray(q.choices) ? q.choices.slice(0, 4) : [];
    elArea.innerHTML = `
      <div class="qb-choices">
        ${choices.map((choice, i) => `
          <button class="qb-choice" data-idx="${i}">
            <span class="qb-opt-wrap">
              <span class="qb-opt-label">${labels[i] || String(i+1)}</span>
              <span class="qb-opt-text">${escapeHtml(choice)}</span>
            </span>
          </button>
        `).join("")}
      </div>
    `;
    elArea.querySelectorAll(".qb-choice").forEach(btn => {
      btn.addEventListener("click", () => {
        if (locked) return;
        gradeMCQ(Number(btn.dataset.idx));
      });
    });
  }

  function renderQuestion(q) {
    current = { ...q, _startTs: performance.now() };
    locked = false;
    btnNext.disabled = true;
    elFeedback.innerHTML = "";
    elQuestion.textContent = q.question;

    if (q.type === "tf") {
      renderTF(q);
    } else if (q.type === "mcq") {
      renderMCQ(q);
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

    const labels = ["Α", "Β", "Γ", "Δ"];
    const correctLabel = labels[current.answerIndex] || String((current.answerIndex ?? 0) + 1);
    const correctText = Array.isArray(current.choices) ? (current.choices[current.answerIndex] || "") : "";
    const chosenLabel = labels[userIdx] || String(userIdx + 1);
    const chosenText = Array.isArray(current.choices) ? (current.choices[userIdx] || "") : "";

    feedback(
      ok,
      `Επέλεξες: ${chosenLabel}. ${chosenText} | Σωστό: ${correctLabel}. ${correctText}`,
      current.explanation || ""
    );
  }

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
    state.correct = 0;
    state.total = 0;
    saveState();
    setScore();
    elLast.textContent = "Τελευταία: —";
    if (questions.length) renderQuestion(pickRandomQuestion());
  });

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

  setQuizEnabled(false);

  (async () => {
    try {
      const res = await fetch(QUESTIONS_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) throw new Error("Empty questions");
      questions = data;

      const categories = getCategoriesFromQuestions(questions);
      renderCategoriesUI(categories);

      setScore();

      if (user?.first_name && user?.last_name) {
        loginBox.style.display = "none";
        setQuizEnabled(true);
        catsBox.style.display = "";
        registerSessionIfNeeded(user.first_name, user.last_name);
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
    catsBox.style.display = "";

    if (questions.length) renderQuestion(pickRandomQuestion());
  });
})();
