const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'database.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Read database
function readData() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file:', err);
    return null;
  }
}

// Helper: Write database
function writeData(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

// Helper: Check Live Salon Status (Indian Standard Time: UTC+5:30)
function getSalonLiveStatus() {
  const now = new Date();
  // Get time in IST (Asia/Kolkata)
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'long'
  });
  
  const parts = istFormatter.formatToParts(now);
  let hour = 0;
  let minute = 0;
  let weekday = '';
  
  for (const part of parts) {
    if (part.type === 'hour') hour = parseInt(part.value, 10);
    if (part.type === 'minute') minute = parseInt(part.value, 10);
    if (part.type === 'weekday') weekday = part.value;
  }

  // Operating hours: 9:00 AM (09:00) to 10:00 PM (22:00)
  const currentMinutes = hour * 60 + minute;
  const openMinutes = 9 * 60; // 09:00 AM -> 540
  const closeMinutes = 22 * 60; // 10:00 PM -> 1320

  const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;

  let statusMessage = '';
  let timeUntilNextEvent = '';
  let crowdStatus = 'Moderate';
  let estimatedWaitMins = 15;

  if (isOpen) {
    const minutesLeft = closeMinutes - currentMinutes;
    const hoursLeft = Math.floor(minutesLeft / 60);
    const minsLeft = minutesLeft % 60;
    statusMessage = 'OPEN NOW — Accepting Appointments & Walk-ins';
    timeUntilNextEvent = `Closes in ${hoursLeft > 0 ? `${hoursLeft} hr ` : ''}${minsLeft} mins (at 10:00 PM)`;

    // Estimate crowd based on hour of day
    if (hour >= 11 && hour <= 14) {
      crowdStatus = 'High Activity';
      estimatedWaitMins = 20;
    } else if (hour >= 17 && hour <= 21) {
      crowdStatus = 'Peak Evening Rush';
      estimatedWaitMins = 25;
    } else {
      crowdStatus = 'Comfortable / Low Wait';
      estimatedWaitMins = 10;
    }
  } else {
    statusMessage = 'CURRENTLY CLOSED — Online Bookings Open 24/7';
    let minsUntilOpen = 0;
    if (currentMinutes < openMinutes) {
      minsUntilOpen = openMinutes - currentMinutes;
    } else {
      minsUntilOpen = (24 * 60 - currentMinutes) + openMinutes;
    }
    const h = Math.floor(minsUntilOpen / 60);
    const m = minsUntilOpen % 60;
    timeUntilNextEvent = `Opens today at 9:00 AM (in ${h} hr ${m} mins)`;
    crowdStatus = 'Closed';
    estimatedWaitMins = 0;
  }

  const formattedCurrentTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} IST`;

  return {
    isOpen,
    statusMessage,
    timeUntilNextEvent,
    crowdStatus,
    estimatedWaitMins,
    currentTime: formattedCurrentTime,
    day: weekday,
    dailyHours: '9:00 AM – 10:00 PM (Daily)',
    location: 'Wagholi, Pune'
  };
}

// ---------------- API ROUTES ---------------- //

// GET /api/business - Get Business Profile & Contact Info
app.get('/api/business', (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: 'Database read failed' });
  res.json(data.business);
});

// GET /api/status - Live Salon Status & Operating Hours
app.get('/api/status', (req, res) => {
  const liveStatus = getSalonLiveStatus();
  res.json(liveStatus);
});

// GET /api/services - Get All Services or Filter by Category
app.get('/api/services', (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: 'Database read failed' });

  const { category, gender, popular } = req.query;
  let services = data.services;

  if (category && category !== 'all') {
    services = services.filter(s => s.category.toLowerCase() === category.toLowerCase());
  }
  if (gender && gender !== 'all') {
    services = services.filter(s => s.gender.toLowerCase() === gender.toLowerCase() || s.gender.toLowerCase() === 'unisex');
  }
  if (popular === 'true') {
    services = services.filter(s => s.popular);
  }

  res.json(services);
});

// GET /api/academy - Get Academy Courses
app.get('/api/academy', (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: 'Database read failed' });
  res.json(data.academy);
});

// GET /api/reviews - Get Reviews, Platform Breakdown & Stats
app.get('/api/reviews', (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: 'Database read failed' });

  let reviews = [...data.reviews];
  const { rating, platform } = req.query;

  if (rating && rating !== 'all') {
    const minRating = parseInt(rating, 10);
    reviews = reviews.filter(r => r.rating >= minRating);
  }
  if (platform && platform !== 'all') {
    reviews = reviews.filter(r => r.platform.toLowerCase() === platform.toLowerCase());
  }

  // Calculate live stats
  const totalCount = data.reviews.length;
  const avgRating = totalCount > 0 
    ? (data.reviews.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1)
    : '4.7';

  res.json({
    stats: {
      averageRating: avgRating,
      totalReviews: totalCount,
      platforms: data.business.ratings.platforms
    },
    reviews
  });
});

// POST /api/reviews - Submit a New Review
app.post('/api/reviews', (req, res) => {
  const { author, rating, service, comment, platform } = req.body;

  if (!author || !rating || !comment) {
    return res.status(400).json({ error: 'Author, rating (1-5), and review text are required.' });
  }

  const parsedRating = parseInt(rating, 10);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  const data = readData();
  if (!data) return res.status(500).json({ error: 'Database read failed' });

  const newReview = {
    id: `rev-${Date.now()}`,
    author: author.trim(),
    rating: parsedRating,
    platform: platform ? platform.trim() : 'Website Client',
    service: service ? service.trim() : 'Salon Service',
    date: 'Just now',
    verified: true,
    comment: comment.trim(),
    helpful: 1
  };

  data.reviews.unshift(newReview);
  writeData(data);

  res.status(201).json({
    success: true,
    message: 'Thank you for your valuable review! Your feedback helps us maintain premium quality.',
    review: newReview
  });
});

// POST /api/bookings - Book an Appointment
app.post('/api/bookings', (req, res) => {
  const { fullName, phone, email, serviceId, date, timeSlot, stylistPreference, notes } = req.body;

  if (!fullName || !phone || !date || !timeSlot) {
    return res.status(400).json({ error: 'Full name, phone, appointment date, and time slot are required.' });
  }

  const data = readData();
  if (!data) return res.status(500).json({ error: 'Database read failed' });

  const selectedService = data.services.find(s => s.id === serviceId) || {
    name: 'General Consultation & Haircut',
    price: 349
  };

  const bookingRef = `MS-${Date.now().toString().slice(-6)}`;
  const bookingRecord = {
    bookingRef,
    fullName: fullName.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : '',
    serviceName: selectedService.name,
    servicePrice: selectedService.price,
    date,
    timeSlot,
    stylistPreference: stylistPreference || 'Any Senior Stylist',
    notes: notes ? notes.trim() : '',
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  };

  data.bookings.unshift(bookingRecord);
  writeData(data);

  // Pre-formatted WhatsApp text for client convenience
  const message = encodeURIComponent(
    `Hello Maddy's Unisex Salon! 👋\nI have booked an appointment through your website.\n\n*Booking ID:* ${bookingRef}\n*Name:* ${bookingRecord.fullName}\n*Service:* ${bookingRecord.serviceName}\n*Date:* ${bookingRecord.date}\n*Time:* ${bookingRecord.timeSlot}\n*Stylist:* ${bookingRecord.stylistPreference}\n\nPlease confirm my slot. Thank you!`
  );
  const whatsappUrl = `https://wa.me/919595698986?text=${message}`;

  res.status(201).json({
    success: true,
    message: 'Your salon appointment is confirmed! Our Wagholi team looks forward to pampering you.',
    booking: bookingRecord,
    whatsappUrl
  });
});

// POST /api/academy/enquire - Course Enquiry
app.post('/api/academy/enquire', (req, res) => {
  const { name, phone, courseTitle, background } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone number are required.' });
  }

  const data = readData();
  if (!data) return res.status(500).json({ error: 'Database read failed' });

  const enquiry = {
    id: `acad-enq-${Date.now()}`,
    name: name.trim(),
    phone: phone.trim(),
    courseTitle: courseTitle || 'Academy General Inquiry',
    background: background || '',
    date: new Date().toISOString()
  };

  data.academyEnquiries.unshift(enquiry);
  writeData(data);

  res.status(201).json({
    success: true,
    message: 'Enquiry received! Our academy admissions team will connect with you with the prospectus and fee structure.'
  });
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`✨ Maddy's Unisex Salon & Academy server running at http://localhost:${PORT}`);
});
