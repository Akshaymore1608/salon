# ✨ Maddy's Unisex Salon & Academy — Full-Stack Web Application

A full-stack, animated luxury web application built for **Maddy's Unisex Salon & Academy** (Wagholi, Pune) based on the official business research brief.

---

## 🌟 Key Features

### 1. 🕒 Live Salon Status & Operating Hours ("Whether Shop Runs More")
- **Real-Time Open / Closed Engine (`/api/status`)**: Tracks Indian Standard Time (IST) against salon working hours (**9:00 AM – 10:00 PM Daily**).
- **Live Pulsing Beacon**: Displays `"OPEN NOW — Closes in X hrs at 10:00 PM"` or `"CURRENTLY CLOSED — Opens at 9:00 AM"`.
- **Live Crowd Rush & Wait-Time Tracker**: Estimates walk-in wait times based on time of day (e.g. *Moderate*, *Peak Evening Rush*, *Low Wait*) and prioritizes online reservations.

### 2. ⭐ Specially Featured: Reviews & Ratings Hub
- **Multi-Platform Breakdown**:
  - **Google Reviews**: 4.7★ (~200 reviews)
  - **Justdial**: 4.6★ (204 ratings)
  - **Magicpin**: 4.7★ (88 ratings)
- **Interactive Review Filter**: Filter by rating (5-star) or source platform.
- **"Write a Review" Modal (`POST /api/reviews`)**: Clients can submit their rating, service taken, and comments with immediate persistence in the backend and dynamic wall update.
- **Authentic Client Highlights**: Attentive staff who listen to customer preferences, patient handling of kids' haircuts, cleanliness, and honest pricing.

### 3. ✂️ Interactive Services & Pricing Catalog
- Categorized menu with starting prices, duration, gender tags, and luxury photos:
  - **Hair Artistry & Treatments**: Signature Cuts, Keratin Silk Smooth, Cysteine Treatment, Balayage Color.
  - **Men's Royal Grooming**: Precision Beard Sculpting, Hot Towel Shave, Activated Charcoal Detox.
  - **Skin & Facials**: Hydra-Glow Facial, O3+ Radiance Whitening.
  - **Bridal & Glamour**: HD Bridal Makeup, Engagement & Party Glam.
  - **Nail Care & Kids**: Glass shine buffing, toddler haircuts.
- **Transparent Pricing Promise**: Reminds clients that prices are starting estimates and confirmed after consultation.

### 4. 🪞 Before & After Transformation Slider
- Interactive split slider comparing hair textures before treatment (frizz & dullness) vs. after treatment (silk mirror glow).

### 5. 🎓 Maddy's Academy Wing
- Course showcase for aspiring stylists:
  - Master Hair Dressing & Chemical Artistry (3 Months)
  - Professional Barbering & Men's Grooming (6 Weeks)
  - Bridal Artistry & HD Glam Makeup (2 Months)
- Interactive **Course Enquiry Modal (`POST /api/academy/enquire`)**.

### 6. 📅 Priority Booking Wizard & WhatsApp Integration
- Step-by-step reservation with stylist preference, date picker, and 30-min time slots.
- Direct booking persistence (`POST /api/bookings`) returning a unique reference ID (e.g. `MS-XXXXXX`).
- 1-Click WhatsApp booking trigger that opens a pre-filled message directly to Maddy's official number `+91 95956 98986`.

### 7. 📱 Mobile-First Luxury UX & Floating Action Dock
- Persistent mobile dock with **Call Now**, **WhatsApp**, **Book Slot**, and **Directions** buttons.
- Deep obsidian & champagne gold aesthetics, smooth glassmorphism, glowing accents, and typography.

---

## 🚀 How to Run Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
The server will start at: **`http://localhost:3000`**

---

## 📍 Business Information (From Brief)
- **Salon Name**: Maddy's Unisex Salon & Academy
- **Address**: Shop No. 18, Rainbow Crossroads, McDonald’s Building, BJS College Chowk, Bakori Phata, Pune–Nagar Road, Wagholi, Pune, Maharashtra 412207, India.
- **Phone / WhatsApp**: +91 95956 98986
- **Hours**: 9:00 AM – 10:00 PM (Monday – Sunday)
- **Established**: 2021
