// Reusable Number Selector Control

export function createNumberSelector({
  container,
  label = "SQUAT",
  min = 20,
  max = 160,
  step = 1,
  storageKey = "number-selector-value",
  percentages = [
    { percent: 1 / 0.85, label: "100%" },
    { percent: 0.65 / 0.85, label: "65%" },
  ],
  initial = null,
  onChange = null,
}) {
  // Create DOM structure
  container.innerHTML = `
    <label style="font-size:2.5em;font-weight:bold;margin-bottom:0.2em;letter-spacing:0.05em;text-transform:uppercase;text-align:center;line-height:1.1;">
      ${label}
    </label>
    <div style="display:flex;flex-direction:row;align-items:center;justify-content:center;gap:1em;">
      <div class="percentages-row" style="display:flex;flex-direction:row;gap:1em;font-size:2em;justify-content:flex-end;align-items:center;min-width:10ch;font-family:SFMono-Regular,Consolas,Liberation Mono,Menlo,Courier,monospace;"></div>
      <div class="number-selector" tabindex="0" style="user-select:none;width:4ch;height:60px;display:flex;align-items:center;justify-content:center;font-size:2em;font-family:SFMono-Regular,Consolas,Liberation Mono,Menlo,Courier,monospace;border:2px solid #888;border-radius:8px;background:#f9f9f9;box-shadow:0 2px 8px #0001;touch-action:pan-y;cursor:pointer;box-sizing:border-box;padding:0.6em;margin:0;">0</div>
      <span class="number-kg" style="font-size:2em;margin-left:-0.3em;font-family:SFMono-Regular,Consolas,Liberation Mono,Menlo,Courier,monospace;">kg</span>
    </div>
  `;

  const el = container.querySelector(".number-selector");
  const percentsEl = container.querySelector(".percentages-row");
  const kgEl = container.querySelector(".number-kg");

  let value = initial;
  if (value == null) {
    value = parseInt(localStorage.getItem(storageKey), 10);
    if (isNaN(value)) value = min;
  }

  function clamp(val) {
    return Math.max(min, Math.min(max, val));
  }

  function updateDisplay() {
    el.textContent = String(value).padStart(3, "\u00A0");
    percentsEl.innerHTML = percentages
      .map(
        (p) =>
          `<span>${String(Math.round(value * p.percent)).padStart(3, "\u00A0")}kg</span>`,
      )
      .join("");
    kgEl.textContent = "kg";
    if (onChange) onChange(value);
  }

  function saveValue() {
    localStorage.setItem(storageKey, value);
  }

  // Touch events for swipe
  let startY = null,
    lastY = null,
    touchActive = false;
  const touchThreshold = 30; // px per step for touch
  el.addEventListener("touchstart", function (e) {
    if (e.touches.length === 1) {
      touchActive = true;
      startY = e.touches[0].clientY;
      lastY = startY;
    }
  });
  el.addEventListener("touchmove", function (e) {
    if (!touchActive) return;
    const y = e.touches[0].clientY;
    if (Math.abs(y - startY) >= touchThreshold) {
      let steps = Math.floor((startY - y) / touchThreshold);
      if (steps !== 0) {
        value = clamp(value + steps * step);
        updateDisplay();
        saveValue();
        startY = y;
      }
    }
    lastY = y;
  });
  el.addEventListener("touchend", function () {
    touchActive = false;
    startY = null;
    lastY = null;
  });

  // Wheel events for scroll
  let wheelDeltaAccum = 0;
  const wheelThreshold = 17; // Increase this to make it less sensitive for mouse
  el.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault();
      let delta = e.deltaY || e.detail || e.wheelDelta;
      wheelDeltaAccum += delta;
      if (wheelDeltaAccum <= -wheelThreshold) {
        value = clamp(value + step);
        updateDisplay();
        saveValue();
        wheelDeltaAccum = 0;
      } else if (wheelDeltaAccum >= wheelThreshold) {
        value = clamp(value - step);
        updateDisplay();
        saveValue();
        wheelDeltaAccum = 0;
      }
    },
    { passive: false },
  );
  // Keyboard accessibility
  el.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp") {
      value = clamp(value + step);
      updateDisplay();
      saveValue();
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      value = clamp(value - step);
      updateDisplay();
      saveValue();
      e.preventDefault();
    }
  });

  updateDisplay();

  return {
    getValue: () => value,
    setValue: (v) => {
      value = clamp(v);
      updateDisplay();
      saveValue();
    },
    focus: () => el.focus(),
    element: el,
    container,
  };
}
