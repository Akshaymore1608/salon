/**
 * MADDY'S UNISEX SALON & ACADEMY — FRONTEND APPLICATION LOGIC
 * Dynamic integration with Express backend APIs
 */

let allServices = [];
let allReviews = [];
let currentServiceFilter = 'all';
let currentReviewFilter = 'all';

// DOM Content Loaded Handler
document.addEventListener('DOMContentLoaded', () => {
  initLiveSalonStatus();
  fetchServices();
  fetchReviews();
  fetchAcademyCourses();
  initBeforeAfterSlider();
  initStarRating();
  initMobileNav();
  setupBookingDate();
  
  // Refresh live salon status every 60 seconds
  setInterval(initLiveSalonStatus, 60000);
});

/* ===================================================================
   1. LIVE SALON STATUS & OPERATING HOURS ("Whether shop runs more")
   =================================================================== */
async function initLiveSalonStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();

    // 1. Top banner live pill
    const topLivePill = document.getElementById('livePill');
    const topLiveText = document.getElementById('liveStatusText');
    if (topLivePill && topLiveText) {
      if (data.isOpen) {
        topLivePill.classList.remove('closed');
        topLiveText.innerHTML = `<strong>OPEN NOW</strong> • ${data.timeUntilNextEvent}`;
      } else {
        topLivePill.classList.add('closed');
        topLiveText.innerHTML = `<strong>CLOSED NOW</strong> • ${data.timeUntilNextEvent}`;
      }
    }

    // 2. Real-time Status Card Widget
    const statusLiveBadge = document.getElementById('statusLiveBadge');
    const statusBadgeText = document.getElementById('statusBadgeText');
    const clockDisplay = document.getElementById('clockDisplay');
    const crowdStatusVal = document.getElementById('crowdStatusVal');
    const crowdSubText = document.getElementById('crowdSubText');
    const statusHours = document.getElementById('statusHours');
    const nextSlotText = document.getElementById('nextSlotText');

    if (clockDisplay) clockDisplay.textContent = data.currentTime;
    if (statusHours) statusHours.textContent = data.dailyHours;

    if (statusLiveBadge && statusBadgeText) {
      if (data.isOpen) {
        statusLiveBadge.classList.remove('closed');
        statusBadgeText.textContent = data.statusMessage;
        if (crowdStatusVal) crowdStatusVal.textContent = data.crowdStatus;
        if (crowdSubText) {
          crowdSubText.textContent = `Estimated wait: ~${data.estimatedWaitMins} mins for walk-ins • Online reservations skip the queue`;
        }
        if (nextSlotText) nextSlotText.textContent = 'Today Slots Available';
      } else {
        statusLiveBadge.classList.add('closed');
        statusBadgeText.textContent = data.statusMessage;
        if (crowdStatusVal) crowdStatusVal.textContent = 'Salon Closed';
        if (crowdSubText) crowdSubText.textContent = data.timeUntilNextEvent;
        if (nextSlotText) nextSlotText.textContent = 'Booking Open for Tomorrow';
      }
    }
  } catch (err) {
    console.error('Failed to fetch live salon status:', err);
  }
}

/* ===================================================================
   2. SERVICES CATALOGUE & FILTERS
   =================================================================== */
async function fetchServices() {
  try {
    const res = await fetch('/api/services');
    allServices = await res.json();
    renderServices(allServices);
    populateBookingServiceDropdown(allServices);
    setupServiceTabs();
  } catch (err) {
    console.error('Failed to load services:', err);
    document.getElementById('servicesGrid').innerHTML = `
      <div class="loader-placeholder">
        <p>Could not load services. Please check your connection.</p>
      </div>`;
  }
}

function renderServices(servicesToRender) {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;

  if (servicesToRender.length === 0) {
    grid.innerHTML = `
      <div class="loader-placeholder">
        <p>No services found in this category.</p>
      </div>`;
    return;
  }

  grid.innerHTML = servicesToRender.map(s => `
    <div class="service-card" data-category="${s.category}">
      <div class="service-img-wrap">
        <img src="${s.image}" alt="${s.name}" loading="lazy">
        ${s.popular ? `<span class="card-badge"><i class="fa-solid fa-crown"></i> Popular</span>` : ''}
        <span class="card-gender-badge">${s.gender}</span>
      </div>
      <div class="service-body">
        <h3 class="service-title">${s.name}</h3>
        <div class="service-meta">
          <span><i class="fa-regular fa-clock"></i> ${s.duration}</span>
          <span><i class="fa-solid fa-sparkles"></i> L'Oréal / Premium</span>
        </div>
        <p class="service-desc">${s.description}</p>
        <div class="service-footer">
          <div class="price-tag">
            <span class="from-label">Starting From</span>
            <span class="amount">₹${s.price.toLocaleString('en-IN')}</span>
          </div>
          <button class="btn btn-primary" onclick="quickBookService('${s.id}')">
            <i class="fa-solid fa-calendar-check"></i> Book Now
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function setupServiceTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.getAttribute('data-filter');
      currentServiceFilter = filter;
      
      if (filter === 'all') {
        renderServices(allServices);
      } else {
        const filtered = allServices.filter(s => s.category.toLowerCase() === filter.toLowerCase());
        renderServices(filtered);
      }
    });
  });
}

function populateBookingServiceDropdown(services) {
  const select = document.getElementById('bookServiceSelect');
  if (!select) return;
  select.innerHTML = '<option value="">-- Choose Service --</option>' +
    services.map(s => `<option value="${s.id}">${s.name} (Starting ₹${s.price})</option>`).join('');
}

function quickBookService(serviceId) {
  openBookingModal();
  const select = document.getElementById('bookServiceSelect');
  if (select) {
    select.value = serviceId;
  }
}

/* ===================================================================
   3. VERIFIED REVIEWS & RATINGS HUB ("Specially Mentioned")
   =================================================================== */
async function fetchReviews() {
  try {
    const res = await fetch('/api/reviews');
    const data = await res.json();
    allReviews = data.reviews;

    // Update Average Rating display
    const avgRatingDisplay = document.getElementById('avgRatingDisplay');
    if (avgRatingDisplay && data.stats) {
      avgRatingDisplay.textContent = data.stats.averageRating;
    }

    renderReviews(allReviews);
    setupReviewFilterPills();
  } catch (err) {
    console.error('Failed to load reviews:', err);
    document.getElementById('reviewsGrid').innerHTML = `
      <div class="loader-placeholder">
        <p>Could not load reviews. Please refresh.</p>
      </div>`;
  }
}

function renderReviews(reviewsToRender) {
  const grid = document.getElementById('reviewsGrid');
  if (!grid) return;

  if (reviewsToRender.length === 0) {
    grid.innerHTML = `
      <div class="loader-placeholder">
        <p>No reviews matching this filter.</p>
      </div>`;
    return;
  }

  grid.innerHTML = reviewsToRender.map(r => {
    // Generate star icons
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= r.rating) {
        starsHtml += '<i class="fa-solid fa-star"></i>';
      } else {
        starsHtml += '<i class="fa-regular fa-star"></i>';
      }
    }

    const firstLetter = r.author ? r.author.charAt(0).toUpperCase() : 'C';

    return `
      <div class="review-card">
        <div class="review-header">
          <div class="author-info">
            <div class="author-avatar">${firstLetter}</div>
            <div>
              <h4 class="author-name">${r.author}</h4>
              <span class="review-date">${r.date}</span>
            </div>
          </div>
          <span class="platform-badge-pill">
            <i class="fa-solid fa-check-circle"></i> ${r.platform}
          </span>
        </div>

        <div class="review-stars">
          ${starsHtml}
        </div>

        ${r.service ? `<span class="review-service-tag"><i class="fa-solid fa-scissors"></i> ${r.service}</span>` : ''}

        <p class="review-text">"${r.comment}"</p>

        <div class="review-footer">
          <span class="verified-client-tag">
            <i class="fa-solid fa-badge-check"></i> Verified Client Visit
          </span>
          <span><i class="fa-regular fa-thumbs-up"></i> ${r.helpful || 1} found helpful</span>
        </div>
      </div>
    `;
  }).join('');
}

function setupReviewFilterPills() {
  const pills = document.querySelectorAll('.review-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const filter = pill.getAttribute('data-review-filter');
      currentReviewFilter = filter;

      if (filter === 'all') {
        renderReviews(allReviews);
      } else if (filter === '5') {
        renderReviews(allReviews.filter(r => r.rating === 5));
      } else {
        renderReviews(allReviews.filter(r => r.platform.toLowerCase().includes(filter.toLowerCase())));
      }
    });
  });
}

// Write a Review Form Submission to Backend POST /api/reviews
async function handleReviewSubmit(e) {
  e.preventDefault();
  const author = document.getElementById('revAuthor').value;
  const rating = document.getElementById('revRatingValue').value;
  const service = document.getElementById('revService').value;
  const platform = document.getElementById('revPlatform').value;
  const comment = document.getElementById('revComment').value;

  const btn = document.getElementById('submitReviewBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, rating, service, platform, comment })
    });

    const result = await res.json();
    if (res.ok) {
      showToast('Thank you! Your review has been published.', 'success');
      closeReviewModal();
      document.getElementById('reviewForm').reset();
      fetchReviews(); // Reload dynamic review wall
    } else {
      showToast(result.error || 'Failed to submit review.', 'error');
    }
  } catch (err) {
    console.error('Error submitting review:', err);
    showToast('Network error while posting review.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Review';
  }
}

// Star rating input click interaction
function initStarRating() {
  const stars = document.querySelectorAll('#starRatingInput i');
  const ratingInput = document.getElementById('revRatingValue');
  
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-val'), 10);
      ratingInput.value = val;
      stars.forEach(s => {
        const sVal = parseInt(s.getAttribute('data-val'), 10);
        if (sVal <= val) {
          s.classList.add('active');
          s.classList.remove('fa-regular');
          s.classList.add('fa-solid');
        } else {
          s.classList.remove('active');
          s.classList.remove('fa-solid');
          s.classList.add('fa-regular');
        }
      });
    });
  });
}

/* ===================================================================
   4. ACADEMY COURSES & ENQUIRIES
   =================================================================== */
async function fetchAcademyCourses() {
  try {
    const res = await fetch('/api/academy');
    const courses = await res.json();
    const grid = document.getElementById('coursesGrid');
    if (!grid) return;

    grid.innerHTML = courses.map(c => `
      <div class="course-card">
        <img src="${c.image}" alt="${c.title}" class="course-img" loading="lazy">
        <div class="course-body">
          <div class="course-duration"><i class="fa-solid fa-hourglass-half"></i> ${c.duration}</div>
          <h3 class="course-title">${c.title}</h3>
          
          <ul class="course-topics">
            ${c.topics.map(t => `<li><i class="fa-solid fa-circle-check"></i> ${t}</li>`).join('')}
          </ul>

          <div class="course-cert">
            <i class="fa-solid fa-certificate"></i> ${c.certification}
          </div>

          <button class="btn btn-outline btn-block" onclick="enquireSpecificCourse('${c.title}')">
            <i class="fa-solid fa-graduation-cap"></i> Enquire Course
          </button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load academy courses:', err);
  }
}

function enquireSpecificCourse(title) {
  openAcademyEnquiryModal();
  const select = document.getElementById('acadCourse');
  if (select) {
    select.value = title;
  }
}

async function handleAcademySubmit(e) {
  e.preventDefault();
  const name = document.getElementById('acadName').value;
  const phone = document.getElementById('acadPhone').value;
  const courseTitle = document.getElementById('acadCourse').value;
  const background = document.getElementById('acadBackground').value;

  try {
    const res = await fetch('/api/academy/enquire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, courseTitle, background })
    });
    const result = await res.json();
    if (res.ok) {
      showToast('Enquiry received! Our counselor will reach out shortly.', 'success');
      closeAcademyModal();
      document.getElementById('academyForm').reset();
    } else {
      showToast(result.error || 'Failed to submit enquiry.', 'error');
    }
  } catch (err) {
    console.error('Error submitting academy enquiry:', err);
    showToast('Network error submitting enquiry.', 'error');
  }
}

/* ===================================================================
   5. APPOINTMENT BOOKING WIZARD
   =================================================================== */
function setupBookingDate() {
  const dateInput = document.getElementById('bookDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
  }
}

async function handleBookingSubmit(e) {
  e.preventDefault();
  const fullName = document.getElementById('bookFullName').value;
  const phone = document.getElementById('bookPhone').value;
  const serviceId = document.getElementById('bookServiceSelect').value;
  const date = document.getElementById('bookDate').value;
  const timeSlot = document.getElementById('bookTimeSlot').value;
  const stylistPreference = document.getElementById('bookStylist').value;
  const notes = document.getElementById('bookNotes').value;

  const btn = document.getElementById('submitBookingBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Reserving Priority Slot...';

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        phone,
        serviceId,
        date,
        timeSlot,
        stylistPreference,
        notes
      })
    });

    const result = await res.json();
    if (res.ok) {
      // Show confirmation receipt
      document.getElementById('bookingForm').style.display = 'none';
      const receipt = document.getElementById('bookingConfirmationReceipt');
      receipt.style.display = 'block';

      document.getElementById('receiptRef').textContent = result.booking.bookingRef;
      document.getElementById('receiptName').textContent = result.booking.fullName;
      document.getElementById('receiptService').textContent = result.booking.serviceName;
      document.getElementById('receiptDateTime').textContent = `${result.booking.date} at ${result.booking.timeSlot}`;
      document.getElementById('receiptPrice').textContent = `₹${result.booking.servicePrice}`;
      
      const waBtn = document.getElementById('receiptWhatsappLink');
      if (waBtn) waBtn.href = result.whatsappUrl;

      showToast('Booking successfully confirmed!', 'success');
    } else {
      showToast(result.error || 'Booking failed.', 'error');
    }
  } catch (err) {
    console.error('Error submitting booking:', err);
    showToast('Network error while booking.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Confirm Reservation';
  }
}

/* ===================================================================
   6. INTERACTIVE BEFORE/AFTER SLIDER
   =================================================================== */
function initBeforeAfterSlider() {
  const slider = document.getElementById('compareSlider');
  const afterWrapper = document.getElementById('afterImageWrapper');
  const divider = document.getElementById('sliderDivider');

  if (!slider || !afterWrapper || !divider) return;

  slider.addEventListener('input', (e) => {
    const val = e.target.value;
    afterWrapper.style.width = `${val}%`;
    divider.style.left = `${val}%`;
  });
}

/* ===================================================================
   7. MODAL CONTROLS & TOAST NOTIFICATIONS
   =================================================================== */
function openBookingModal() {
  document.getElementById('bookingModal').classList.add('active');
  document.getElementById('bookingForm').style.display = 'block';
  document.getElementById('bookingConfirmationReceipt').style.display = 'none';
  document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('active');
  document.body.style.overflow = 'auto';
}

function openReviewModal() {
  document.getElementById('reviewModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeReviewModal() {
  document.getElementById('reviewModal').classList.remove('active');
  document.body.style.overflow = 'auto';
}

function openAcademyEnquiryModal() {
  document.getElementById('academyModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAcademyModal() {
  document.getElementById('academyModal').classList.remove('active');
  document.body.style.overflow = 'auto';
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  const bModal = document.getElementById('bookingModal');
  const rModal = document.getElementById('reviewModal');
  const aModal = document.getElementById('academyModal');

  if (e.target === bModal) closeBookingModal();
  if (e.target === rModal) closeReviewModal();
  if (e.target === aModal) closeAcademyModal();
});

function showToast(message, type = 'info') {
  const toast = document.getElementById('toastNotification');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

/* ===================================================================
   8. MOBILE NAVIGATION
   =================================================================== */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  if (!hamburger || !navMenu) return;

  hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('open');
  });

  const navLinks = navMenu.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
    });
  });
}
