(() => {
  "use strict";

  
  const Carousel = (() => {
    const track = document.getElementById("carousel-track");
    const dotsWrap = document.getElementById("carousel-dots");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    const carouselEl = document.getElementById("carousel");

    if (!track || !dotsWrap || !prevBtn || !nextBtn || !carouselEl) {
      return { init() {} };
    }

    const slides = Array.from(track.querySelectorAll(".slide"));
    let current = 0;
    let timerId = null;
    const AUTO_DELAY = 3000;

    function buildDots() {
      dotsWrap.innerHTML = slides
        .map((_, i) => `<span class="dot${i === 0 ? " active" : ""}" data-index="${i}"></span>`)
        .join("");

      dotsWrap.querySelectorAll(".dot").forEach((dot) => {
        dot.addEventListener("click", () => {
          goTo(Number(dot.dataset.index));
          restartAutoplay();
        });
      });
    }

    function goTo(index) {
      slides[current].classList.remove("is-active");
      current = (index + slides.length) % slides.length;
      slides[current].classList.add("is-active");

      dotsWrap.querySelectorAll(".dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === current);
      });
    }

    function next() {
      goTo(current + 1);
    }

    function prev() {
      goTo(current - 1);
    }

    function startAutoplay() {
      timerId = setInterval(next, AUTO_DELAY);
    }

    function stopAutoplay() {
      clearInterval(timerId);
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    function bindControls() {
      nextBtn.addEventListener("click", () => {
        next();
        restartAutoplay();
      });

      prevBtn.addEventListener("click", () => {
        prev();
        restartAutoplay();
      });

      carouselEl.addEventListener("mouseenter", stopAutoplay);
      carouselEl.addEventListener("mouseleave", startAutoplay);

      carouselEl.addEventListener("touchstart", stopAutoplay, { passive: true });
      carouselEl.addEventListener("touchend", startAutoplay, { passive: true });
    }

    function init() {
      buildDots();
      bindControls();
      startAutoplay();
    }

    return { init };
  })();

  
  const Validation = (() => {
    // Each rule returns an error string, or "" when the field is valid
    const rules = {
      fullName(value) {
        if (!value.trim()) return "Full name is required.";
        if (value.trim().length < 3) return "Name must be at least 3 letters.";
        return "";
      },
      email(value) {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) return "Email address is required.";
        if (!pattern.test(value.trim())) return "Enter a valid email address.";
        return "";
      },
      phone(value) {
        const digitsOnly = /^\d{10}$/;
        if (!value.trim()) return "Phone number is required.";
        if (!digitsOnly.test(value.trim())) return "Phone number must be exactly 10 digits.";
        return "";
      },
      age(value) {
        if (!value) return "Age is required.";
        if (Number(value) < 18) return "You must be 18 or older.";
        return "";
      },
      city(value) {
        if (!value.trim()) return "City is required.";
        return "";
      },
      state(value) {
        if (!value) return "Please select a state.";
        return "";
      },
      model(value) {
        if (!value) return "Please select a preferred model.";
        return "";
      },
      rideDate(value) {
        if (!value) return "Please choose a preferred test ride date.";
        const chosen = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (chosen < today) return "Test ride date cannot be in the past.";
        return "";
      },
      gender(form) {
        const checked = form.querySelector('input[name="gender"]:checked');
        return checked ? "" : "Please select a gender.";
      },
      purpose(form) {
        const checked = form.querySelectorAll('input[name="purpose"]:checked');
        return checked.length > 0 ? "" : "Select at least one purpose.";
      },
      ownsRE(form) {
        const checked = form.querySelector('input[name="ownsRE"]:checked');
        return checked ? "" : "Please choose Yes or No.";
      },
      terms(form) {
        const checked = form.querySelector("#terms").checked;
        return checked ? "" : "You must accept the Terms & Conditions.";
      },
    };

    function paintField(inputEl, errorEl, message) {
      if (!inputEl) return;
      inputEl.classList.remove("valid", "invalid");
      inputEl.classList.add(message ? "invalid" : "valid");
      if (errorEl) errorEl.textContent = message;
    }

    function validateSimpleField(id) {
      const inputEl = document.getElementById(id);
      const errorEl = document.getElementById(`err-${id}`);
      const message = rules[id] ? rules[id](inputEl.value) : "";
      paintField(inputEl, errorEl, message);
      return message === "";
    }

    function validateGroupField(form, name) {
      const errorEl = document.getElementById(`err-${name}`);
      const message = rules[name](form);
      if (errorEl) errorEl.textContent = message;
      return message === "";
    }

    function bindLiveValidation(form) {
      ["fullName", "email", "phone", "age", "city", "state", "model", "rideDate"].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const eventName = el.tagName === "SELECT" ? "change" : "input";
        el.addEventListener(eventName, () => validateSimpleField(id));
      });

      form.querySelectorAll('input[name="gender"]').forEach((el) =>
        el.addEventListener("change", () => validateGroupField(form, "gender"))
      );
      form.querySelectorAll('input[name="purpose"]').forEach((el) =>
        el.addEventListener("change", () => validateGroupField(form, "purpose"))
      );
      form.querySelectorAll('input[name="ownsRE"]').forEach((el) =>
        el.addEventListener("change", () => validateGroupField(form, "ownsRE"))
      );
      document.getElementById("terms").addEventListener("change", () => validateGroupField(form, "terms"));
    }

    function validateAll(form) {
      const simpleValid = ["fullName", "email", "phone", "age", "city", "state", "model", "rideDate"]
        .map(validateSimpleField)
        .every(Boolean);

      const groupValid = ["gender", "purpose", "ownsRE", "terms"]
        .map((name) => validateGroupField(form, name))
        .every(Boolean);

      return simpleValid && groupValid;
    }

    return { bindLiveValidation, validateAll };
  })();

  const FormFlow = (() => {
    const DB_KEY = "royalEnfieldDB";
    const form = document.getElementById("re-form");
    const submitBtn = document.getElementById("submit-btn");
    const toast = document.getElementById("success-toast");

    function getDB() {
      try {
        const raw = localStorage.getItem(DB_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed && Array.isArray(parsed.registrations) ? parsed : { registrations: [] };
      } catch {
        return { registrations: [] };
      }
    }

    function saveRegistration(entry) {
      const db = getDB();
      db.registrations.push(entry);
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    }

    function collectFormData() {
      const purpose = Array.from(form.querySelectorAll('input[name="purpose"]:checked')).map((el) => el.value);

      return {
        fullName: form.fullName.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        age: Number(form.age.value),
        gender: form.querySelector('input[name="gender"]:checked')?.value || "",
        city: form.city.value.trim(),
        state: form.state.value,
        model: form.model.value,
        purpose,
        ownsRE: form.querySelector('input[name="ownsRE"]:checked')?.value || "",
        rideDate: form.rideDate.value,
        comments: form.comments.value.trim(),
        submittedAt: new Date().toISOString(),
      };
    }

    function showToast() {
      toast.classList.add("visible");
      setTimeout(() => toast.classList.remove("visible"), 3000);
    }

    function clearFieldStyles() {
      form.querySelectorAll(".valid, .invalid").forEach((el) => el.classList.remove("valid", "invalid"));
      form.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
    }

    function handleSubmit(e) {
      e.preventDefault();

      if (!Validation.validateAll(form)) return;

      submitBtn.classList.add("is-loading");
      submitBtn.disabled = true;

      setTimeout(() => {
        saveRegistration(collectFormData());

        submitBtn.classList.remove("is-loading");
        submitBtn.disabled = false;

        form.reset();
        clearFieldStyles();
        showToast();
      }, 900);
    }

    function handleReset() {
      setTimeout(clearFieldStyles, 0);
    }

    function init() {
      Validation.bindLiveValidation(form);
      form.addEventListener("submit", handleSubmit);
      form.addEventListener("reset", handleReset);
    }

    return { init };
  })();


  function initScrollLinks() {
    const targets = ["scroll-to-form", "scroll-cue"];
    targets.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("click", () => {
        document.getElementById("register").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    Carousel.init();
    FormFlow.init();
    initScrollLinks();
  });
})();