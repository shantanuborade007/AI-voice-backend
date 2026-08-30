# Exotel & Sarvam AI Voice Integration Guide

This document explains the real-time telephony voice architecture, environment setup, Exotel Dashboard configuration, and end-to-end testing workflow for your multi-tenant AI Voice SaaS platform.

---

## 1. System Architecture & Call Flow

```
[ Caller ] 
    │
    ▼ (Mobile Call)
[ Exotel ExoPhone ]
    │
    ▼ (1. Inbound Passthru HTTP Webhook: POST /api/v1/telephony/exotel/incoming)
[ NestJS ExotelController ]
    │
    ├─► Looks up called ExoPhone in `PhoneNumberAssignment` database
    ├─► Fetches Business Profile, FAQs, and Catalog Items
    └─► Responds with ExoML XML containing WebSocket Stream URL:
        <Response><Connect><Stream url="wss://<domain>/api/v1/telephony/stream?businessId=xyz"/></Connect></Response>
    │
    ▼ (2. Bidirectional 8kHz 16-bit Linear PCM Audio Stream - s16le)
[ NestJS AudioStreamGateway (WebSocket Server) ]
    │
    ▼ (3. Audio Processing Loop)
[ CallSession & SarvamClient ]
    ├── Receives raw 16-bit PCM (s16le) audio base64 payload from Exotel
    ├── TurnSilenceDetector monitors Voice Activity Detection (VAD)
    ├── Sends speech WAV to Sarvam STT (saarika:v2.5)
    ├── Queries Sarvam Chat LLM (sarvam-105b-conversations) with dynamic Business Context
    ├── Converts response to audio via Sarvam TTS (bulbul:v3)
    └── Encodes PCM s16le and streams 320-byte (20ms) frames back over WebSocket to Exotel
```

---

## 2. Environment Configuration (`.env`)

Add the following keys to your `.env` file:

```env
# Server Port
PORT=3000

# Sarvam AI Credentials & Configuration
SARVAM_AI_API_KEY=your_actual_sarvam_api_key_here
BOT_LANGUAGE=hi-IN
BOT_SPEAKER=ritu
SILENCE_MS=700

# Exotel Credentials
EXOTEL_SID=your_exotel_sid_here
EXOTEL_API_KEY=your_exotel_api_key_here
EXOTEL_API_TOKEN=your_exotel_api_token_here
```

---

## 3. Exotel Dashboard Configuration

To route incoming calls to your backend:

1. Log into your **Exotel Dashboard**.
2. Go to **App Builder** (or Flow Builder) and create/edit a **Passthru Applet** (or Custom Stream Applet).
3. Set the **Passthru URL** to your backend's public endpoint:
   `https://<YOUR-DOMAIN-OR-NGROK>/api/v1/telephony/exotel/incoming`
4. Set HTTP Method to `POST`.
5. Attach your virtual **ExoPhone** to this Applet.

---

## 4. How to Test End-to-End

### Test Phase A: Baseline Verification Call
To test that Exotel, WebSockets, and Sarvam AI can communicate cleanly:

1. Start your local database and NestJS backend:
   ```bash
   npm run start:dev
   ```
2. In a separate terminal, expose your local port via `ngrok`:
   ```bash
   ngrok http 3000
   ```
3. Copy your HTTPS URL (e.g. `https://abc1234.ngrok-free.app`) and configure your Exotel Passthru Applet with:
   `https://abc1234.ngrok-free.app/api/v1/telephony/exotel/incoming`
4. Dial your Exotel number from your phone.
5. **Expected Result**: Exotel connects to your WebSocket stream. When you speak into the phone, Sarvam STT transcribes your voice, Sarvam LLM generates a baseline response, Sarvam TTS speaks back, and you hear the AI answer clearly on your mobile phone!

---

### Test Phase B: Multi-Tenant Business Profile & Dynamic AI Receptionist Call

Follow these steps to register a new business with custom FAQs and test dynamic AI receptionist responses:

#### Step 1: Register a Business Owner Account
- **Endpoint**: `POST /api/v1/auth/register`
- **Request Body**:
  ```json
  {
    "email": "owner@democafe.com",
    "password": "Password123!",
    "fullName": "Demo Cafe Owner"
  }
  ```
- **Response**: Copy the returned `accessToken`.

#### Step 2: Create a Business
- **Endpoint**: `POST /api/v1/businesses`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**:
  ```json
  {
    "name": "Spicy Bite Cafe",
    "category": "restaurant_cafe",
    "description": "Authentic North Indian cafe in Koregaon Park Pune."
  }
  ```
- **Response**: Copy the returned business `id` (e.g. `b1234567-89ab-cdef-0123-456789abcdef`).

#### Step 3: Add Business FAQs (AI Knowledge Base)
- **Endpoint**: `POST /api/v1/businesses/{businessId}/faqs`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**:
  ```json
  {
    "question": "What are your opening hours and location?",
    "answer": "We are located at Lane 5, Koregaon Park, Pune. We are open every day from 11:00 AM to 11:00 PM."
  }
  ```
- Add another FAQ:
  ```json
  {
    "question": "Do you have vegetarian and vegan options?",
    "answer": "Yes! We have extensive vegetarian and vegan dishes including Paneer Butter Masala and Dal Makhani."
  }
  ```

#### Step 4: Add Catalog Items
- **Endpoint**: `POST /api/v1/businesses/{businessId}/catalog-items`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**:
  ```json
  {
    "name": "Paneer Butter Masala",
    "description": "Rich cottage cheese curry with butter naan combo",
    "price": "350.00",
    "currency": "INR",
    "isAvailable": true
  }
  ```

#### Step 5: Assign the Exotel ExoPhone Number to the Business (Admin Endpoint)
- **Endpoint**: `PATCH /api/v1/businesses/{businessId}/phone-number`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**:
  ```json
  {
    "phoneNumber": "+919876543210",
    "status": "active",
    "notes": "Assigned primary ExoPhone"
  }
  ```
  *(Replace `+919876543210` with your exact Exotel virtual number formatted with country code).*

#### Step 6: Dial the ExoPhone Number
1. Call `+919876543210` from your mobile phone.
2. Ask: *"What are your opening hours?"* or *"What is the price of Paneer Butter Masala?"*
3. **Expected Result**: The backend looks up `Spicy Bite Cafe` by called ExoPhone number, dynamically builds Sarvam AI's System Prompt with these exact FAQs and catalog items, and Sarvam AI answers your specific questions accurately on the live call!
