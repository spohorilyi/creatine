// Reusable Number Selector Control

export function createNumberSelector({
  container,
  label = "SQUAT",
  min = 20,
  max = 160,
  step = 1,
  storageKey = "number-selector-value",
  rpeStorageKey = "number-selector-rpe-value",
  rpeChart = {
    5: { 1: 0.837, 3: 0.762, 6: 0.68 },
    6: { 1: 0.863, 3: 0.786, 6: 0.707 },
    7: { 1: 0.892, 3: 0.811, 6: 0.723 },
    8: { 1: 0.922, 3: 0.837, 6: 0.751 },
    9: { 1: 0.955, 3: 0.863, 6: 0.774 },
    10: { 1: 1, 3: 0.915, 6: 0.815 },
  },
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
      <span style="font-size:2em;margin-left:-0.3em;font-family:SFMono-Regular,Consolas,Liberation Mono,Menlo,Courier,monospace;">@</span>
      <select class="number-rpe" style="user-select:none;width:2.5ch;height:60px;display:flex;font-size:2em;font-family:SFMono-Regular,Consolas,Liberation Mono,Menlo,Courier,monospace;border:2px solid #888;border-radius:8px;background:#f9f9f9;box-shadow:0 2px 8px #0001;cursor:pointer;box-sizing:border-box;margin:0;">
        <option value="5"  >5</option>
        <option value="6"  >6</option>
        <option value="7"  >7</option>
        <option value="8"  >8</option>
        <option value="9"  >9</option>
      </select>
      <span style="font-size:2em;margin-left:-0.3em;font-family:SFMono-Regular,Consolas,Liberation Mono,Menlo,Courier,monospace;">x3</span>
    </div>
  `;

  const el = container.querySelector(".number-selector");
  const percentsEl = container.querySelector(".percentages-row");
  const kgEl = container.querySelector(".number-kg");
  const rpeEl = container.querySelector(".number-rpe");

  let value = initial;
  if (value == null) {
    value = parseInt(localStorage.getItem(storageKey), 10);
    if (isNaN(value)) value = min;
  }
  let rpeValue = parseInt(localStorage.getItem(rpeStorageKey), 10);
  if (isNaN(rpeValue) || rpeValue == null) rpeValue = rpeEl.value;
  rpeEl.value = rpeValue;
  let baseReps = 3;

  console.log("rpeValue:", rpeValue);

  function clamp(val) {
    return Math.max(min, Math.min(max, val));
  }

  function updateDisplay() {
    el.textContent = String(value).padStart(3, "\u00A0");
    percentsEl.innerHTML = `<span>${String(Math.round((value * rpeChart[10][1]) / rpeChart[rpeValue][baseReps])).padStart(3, "\u00A0")}kg</span>`;
    percentsEl.innerHTML += `<span>${String(Math.round((value * 0.6) / rpeChart[rpeValue][baseReps])).padStart(3, "\u00A0")}-${String(Math.round((value * 0.75) / rpeChart[rpeValue][baseReps]))}kg</span>`;
    kgEl.textContent = "kg";
    if (onChange) onChange(value);
  }

  function saveValue() {
    localStorage.setItem(storageKey, value);
    localStorage.setItem(rpeStorageKey, rpeValue);
  }

  // Touch events for swipe
  let startY = null,
    lastY = null,
    touchActive = false;
  const touchThreshold = 10; // px per step for touch
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

  // window.addEventListener("load", function (e) {
  //   rpeValue = parseInt(localStorage.getItem(rpeStorageKey), 10);
  //   console.log("Found rpeValue:", rpeValue);
  //   if (rpeValue !== null) {
  //     rpeEl.value = rpeValue;
  //   }
  //   updateDisplay();
  // });

  rpeEl.addEventListener("change", function (e) {
    let oldRpeValue = rpeValue;
    rpeValue = e.target.value;
    console.log("rpeValue:", rpeValue);
    console.log("oldRpeValue:", oldRpeValue);
    value = clamp(
      Math.round(
        (value / rpeChart[oldRpeValue][baseReps]) *
          rpeChart[rpeValue][baseReps],
      ),
    );
    updateDisplay();
    saveValue();
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
