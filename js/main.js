const roleSelect = document.getElementById('roleSelect');
const donationPanel = document.getElementById('donationPanel');
const adminPanel = document.getElementById('adminPanel');
const superAdminPanel = document.getElementById('superAdminPanel');
const donationForm = document.getElementById('donationForm');
const evidenceForm = document.getElementById('evidenceForm');
const evidenceImage = document.getElementById('evidenceImage');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const donationFeedback = document.getElementById('donationFeedback');
const evidenceFeedback = document.getElementById('evidenceFeedback');
const superAdminFeedback = document.getElementById('superAdminFeedback');
const progressBar = document.getElementById('progressBar');
const currentAmount = document.getElementById('currentAmount');
const evidenceFeed = document.getElementById('evidenceFeed');
const contactForm = document.getElementById('contactForm');
const contactFeedback = document.getElementById('contactFeedback');
const donationCauseSelect = document.getElementById('donationCause');
const goalAmount = document.getElementById('goalAmount');
const carouselSlides = Array.from(document.querySelectorAll('.carouselSlide'));
const carouselDots = Array.from(document.querySelectorAll('.carouselDot'));
const donationCauseCards = Array.from(document.querySelectorAll('[data-cause-card]'));
const donationCauseButtons = Array.from(document.querySelectorAll('[data-select-cause]'));

const donationCauses = {
  roof: {
    label: 'Techo principal y estructura',
    raised: 1200,
    goal: 2500,
    statusId: 'cause-status-roof',
    raisedId: 'cause-raised-roof',
    goalId: 'cause-goal-roof',
    progressId: 'cause-progress-roof',
  },
  altar: {
    label: 'Altar y área de oración',
    raised: 980,
    goal: 1800,
    statusId: 'cause-status-altar',
    raisedId: 'cause-raised-altar',
    goalId: 'cause-goal-altar',
    progressId: 'cause-progress-altar',
  },
  community: {
    label: 'Capilla comunitaria',
    raised: 760,
    goal: 1500,
    statusId: 'cause-status-community',
    raisedId: 'cause-raised-community',
    goalId: 'cause-goal-community',
    progressId: 'cause-progress-community',
  },
  access: {
    label: 'Accesos e iluminación interior',
    raised: 460,
    goal: 1200,
    statusId: 'cause-status-access',
    raisedId: 'cause-raised-access',
    goalId: 'cause-goal-access',
    progressId: 'cause-progress-access',
  },
};

let currentRaised = Object.values(donationCauses).reduce((sum, cause) => sum + cause.raised, 0);
let currentGoal = 7500;
let activeSlide = 0;
let carouselInterval = null;

// Ensure slides have predictable starting styles (helps when CSS or build tools alter ordering)
if (carouselSlides.length) {
  carouselSlides.forEach((slide, i) => {
    slide.style.transition = 'opacity 0.9s ease, transform 0.9s ease';
    slide.style.willChange = 'opacity, transform';
    slide.style.opacity = i === 0 ? '1' : '0';
    slide.style.transform = i === 0 ? 'scale(1)' : 'scale(1.03)';
    slide.style.zIndex = i === 0 ? '2' : '1';
    slide.classList.toggle('slide-visible', i === 0);
    slide.classList.toggle('slide-hidden', i !== 0);
  });
}

const roles = {
  donor: {
    show: [donationPanel],
    hide: [adminPanel, superAdminPanel],
  },
  admin: {
    show: [donationPanel, adminPanel],
    hide: [superAdminPanel],
  },
  superadmin: {
    show: [donationPanel, superAdminPanel],
    hide: [adminPanel],
  },
};

function updateRole(role) {
  if (!roleSelect || !donationPanel) return;

  Object.values(roles).forEach(({ show, hide }) => {
    show.forEach(el => el?.classList.add('hidden'));
    hide.forEach(el => el?.classList.add('hidden'));
  });

  roles[role].show.forEach(el => el?.classList.remove('hidden'));
  roles[role].hide.forEach(el => el?.classList.add('hidden'));
}

function formatCurrency(value) {
  return `$${value.toLocaleString('en-US')}`;
}

function animateProgress(newAmount) {
  if (!progressBar) return;
  const percentage = Math.min((newAmount / currentGoal) * 100, 100);
  progressBar.style.width = `${percentage}%`;
}

function setProgress(amount) {
  if (currentAmount) currentAmount.textContent = formatCurrency(amount);
  animateProgress(amount);
}

function validateCardNumber(value) {
  const cleaned = value.replace(/\s+/g, '');
  return /^\d{16}$/.test(cleaned);
}

function validateExpiry(value) {
  if (!/^\d{2}\/\d{2}$/.test(value)) return false;
  const [month, year] = value.split('/').map(Number);
  if (month < 1 || month > 12) return false;
  const currentDate = new Date();
  const expiryDate = new Date(2000 + year, month - 1, 1);
  expiryDate.setMonth(expiryDate.getMonth() + 1);
  return expiryDate > currentDate;
}

function validateCVV(value) {
  return /^\d{3}$/.test(value);
}

function showMessage(element, message, success = true) {
  if (!element) return;
  element.textContent = message;
  element.style.color = success ? '#2c7a2a' : '#b91c1c';
}

function formatDonationGoal(value) {
  return formatCurrency(value);
}

function updateDonationSummary() {
  if (currentAmount) currentAmount.textContent = formatCurrency(currentRaised);
  if (goalAmount) goalAmount.textContent = formatDonationGoal(currentGoal);
  animateProgress(currentRaised);

  Object.entries(donationCauses).forEach(([key, cause]) => {
    const raisedElement = document.getElementById(cause.raisedId);
    const goalElement = document.getElementById(cause.goalId);
    const progressElement = document.getElementById(cause.progressId);
    const statusElement = document.getElementById(cause.statusId);
    const raisedPercentage = Math.min((cause.raised / cause.goal) * 100, 100);

    if (raisedElement) raisedElement.textContent = formatCurrency(cause.raised);
    if (goalElement) goalElement.textContent = formatCurrency(cause.goal);
    if (progressElement) progressElement.style.width = `${raisedPercentage}%`;
    if (statusElement) {
      const isComplete = cause.raised >= cause.goal;
      statusElement.textContent = isComplete ? 'Meta alcanzada' : 'En progreso';
      statusElement.classList.toggle('is-complete', isComplete);
    }

    const card = donationCauseCards.find(element => element.dataset.causeCard === key);
    if (card) {
      card.classList.toggle('is-complete', cause.raised >= cause.goal);
    }
  });
}

function setDonationCause(causeKey) {
  if (!donationCauseSelect || !donationCauses[causeKey]) return;
  donationCauseSelect.value = causeKey;
}

function goToSlide(index) {
  if (!carouselSlides.length) return;
  const newIndex = ((index % carouselSlides.length) + carouselSlides.length) % carouselSlides.length;
  activeSlide = newIndex;
  console.log('goToSlide called, newIndex=', newIndex);
  carouselSlides.forEach((slide, i) => {
    if (i === activeSlide) {
      slide.style.opacity = '1';
      slide.style.transform = 'scale(1)';
      slide.style.zIndex = '2';
      slide.classList.add('slide-visible');
      slide.classList.remove('slide-hidden');
    } else {
      slide.style.opacity = '0';
      slide.style.transform = 'scale(1.03)';
      slide.style.zIndex = '1';
      slide.classList.remove('slide-visible');
      slide.classList.add('slide-hidden');
    }
  });
  carouselDots.forEach((dot, i) => {
    dot.classList.toggle('active', i === activeSlide);
  });
}

function startCarousel() {
  if (!carouselSlides.length) return;
  if (carouselInterval) {
    clearInterval(carouselInterval);
  }
  console.log('startCarousel: starting interval for', carouselSlides.length, 'slides');
  carouselInterval = setInterval(() => {
    goToSlide(activeSlide + 1);
  }, 3000);
}

function setupCarouselControls() {
  carouselDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const index = Number(dot.dataset.index);
      goToSlide(index);
      if (carouselInterval) {
        clearInterval(carouselInterval);
        startCarousel();
      }
    });
  });
}

function validateContactForm(name, email, message) {
  return name.length >= 2 && /^\S+@\S+\.\S+$/.test(email) && message.length >= 10;
}

if (roleSelect) {
  roleSelect.addEventListener('change', event => {
    updateRole(event.target.value);
  });
}

if (donationForm) {
  const cardNumberInput = document.getElementById('cardNumber');
  const expiryInput = document.getElementById('expiryDate');
  const cvvInput = document.getElementById('cvv');

  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', event => {
      let value = event.target.value.replace(/\D/g, '');
      value = value.slice(0, 16);
      event.target.value = value.replace(/(.{4})/g, '$1 ').trim();
    });
  }

  if (expiryInput) {
    expiryInput.addEventListener('input', event => {
      let value = event.target.value.replace(/[^\d]/g, '');
      if (value.length > 2) {
        value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
      }
      event.target.value = value;
    });
  }

  donationForm.addEventListener('submit', event => {
    event.preventDefault();

    const amount = Number(document.getElementById('donationAmount').value);
    const causeKey = donationCauseSelect && donationCauses[donationCauseSelect.value] ? donationCauseSelect.value : 'roof';
    const cause = donationCauses[causeKey];
    const cardNumber = cardNumberInput ? cardNumberInput.value : '';
    const expiryDate = expiryInput ? expiryInput.value : '';
    const cvv = cvvInput ? cvvInput.value : '';

    if (amount < 10) {
      return showMessage(donationFeedback, 'Ingrese un monto mínimo de $10.', false);
    }
    if (!validateCardNumber(cardNumber)) {
      return showMessage(donationFeedback, 'Número de tarjeta inválido. 16 dígitos necesarios.', false);
    }
    if (!validateExpiry(expiryDate)) {
      return showMessage(donationFeedback, 'Fecha de expiración inválida.', false);
    }
    if (!validateCVV(cvv)) {
      return showMessage(donationFeedback, 'CVV inválido. Ingrese 3 dígitos.', false);
    }

    const previousRaised = cause.raised;
    cause.raised += amount;
    currentRaised = Object.values(donationCauses).reduce((sum, donationCause) => sum + donationCause.raised, 0);
    updateDonationSummary();

    const reachedGoalNow = previousRaised < cause.goal && cause.raised >= cause.goal;
    showMessage(
      donationFeedback,
      reachedGoalNow
        ? `¡Meta alcanzada en ${cause.label}! Tu aporte de ${formatCurrency(amount)} se sumó al total recaudado.`
        : `¡Donación simulada exitosa para ${cause.label}! Has aportado ${formatCurrency(amount)}.`
    );

    setTimeout(() => {
      if (donationFeedback) donationFeedback.textContent = '';
    }, 5000);
  });
}

donationCauseButtons.forEach(button => {
  button.addEventListener('click', () => {
    const causeKey = button.dataset.selectCause;
    setDonationCause(causeKey);
    donationCauseSelect?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});

if (evidenceImage) {
  evidenceImage.addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) {
      imagePreview?.classList.add('hidden');
      if (previewImg) previewImg.src = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      if (previewImg) previewImg.src = e.target.result;
      imagePreview?.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  });
}

if (evidenceForm) {
  evidenceForm.addEventListener('submit', event => {
    event.preventDefault();

    const title = document.getElementById('evidenceTitle').value.trim();
    const description = document.getElementById('evidenceDescription').value.trim();
    const imageSrc = previewImg ? previewImg.src : '';

    if (!title || !description || !imageSrc) {
      return showMessage(evidenceFeedback, 'Complete todos los campos y cargue una imagen.', false);
    }

    if (evidenceFeed) {
      const article = document.createElement('article');
      article.className = 'flex gap-4 rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-soft)] p-4 shadow-sm';
      article.innerHTML = `
        <div class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white">
          <img src="${imageSrc}" alt="Evidencia" class="h-full w-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="mb-2 flex items-center justify-between gap-3 text-sm text-color3">
            <span>${title}</span>
            <span>Justo ahora</span>
          </div>
          <p class="text-sm leading-6 text-color2">${description}</p>
        </div>
      `;
      evidenceFeed.prepend(article);
    }

    showMessage(evidenceFeedback, 'Evidencia publicada con éxito. El feed se actualizó.', true);
    evidenceForm.reset();
    imagePreview?.classList.add('hidden');
    if (previewImg) previewImg.src = '';

    setTimeout(() => {
      if (evidenceFeedback) evidenceFeedback.textContent = '';
    }, 5000);
  });
}

if (contactForm) {
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!validateContactForm(name, email, message)) {
      return showMessage(contactFeedback, 'Por favor completa todos los campos con información válida.', false);
    }

    showMessage(contactFeedback, 'Mensaje enviado. Te contactaremos pronto.', true);
    contactForm.reset();

    setTimeout(() => {
      if (contactFeedback) contactFeedback.textContent = '';
    }, 5000);
  });
}

if (roleSelect) {
  updateRole(roleSelect.value);
}

updateDonationSummary();

if (carouselSlides.length) {
  goToSlide(0);
  setupCarouselControls();
  startCarousel();
}

const approveButtons = document.querySelectorAll('.approveButton');
approveButtons.forEach(button => {
  button.addEventListener('click', event => {
    const cause = event.currentTarget.dataset.cause;
    showMessage(superAdminFeedback, `Causa "${cause}" aprobada con éxito.`, true);
    event.currentTarget.disabled = true;
    event.currentTarget.classList.add('opacity-60', 'cursor-not-allowed');
    event.currentTarget.textContent = `Aprobado: ${cause}`;
  });
});
