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
const carouselSlides = Array.from(document.querySelectorAll('.carouselSlide'));
const carouselDots = Array.from(document.querySelectorAll('.carouselDot'));

let currentRaised = 3400;
let currentGoal = 7500;
let activeSlide = 0;
let carouselInterval = null;

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

function goToSlide(index) {
  if (!carouselSlides.length) return;
  activeSlide = index % carouselSlides.length;
  carouselSlides.forEach((slide, i) => {
    slide.classList.toggle('slide-visible', i === activeSlide);
    slide.classList.toggle('slide-hidden', i !== activeSlide);
  });
  carouselDots.forEach((dot, i) => {
    dot.classList.toggle('bg-white/90', i === activeSlide);
    dot.classList.toggle('bg-white/30', i !== activeSlide);
  });
}

function startCarousel() {
  if (!carouselSlides.length) return;
  carouselInterval = setInterval(() => {
    goToSlide((activeSlide + 1) % carouselSlides.length);
  }, 6000);
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

    currentRaised += amount;
    setProgress(currentRaised);
    showMessage(donationFeedback, `¡Donación simulada exitosa! Has aportado ${formatCurrency(amount)}.`);

    setTimeout(() => {
      if (donationFeedback) donationFeedback.textContent = '';
    }, 5000);
  });
}

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

setProgress(currentRaised);

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
