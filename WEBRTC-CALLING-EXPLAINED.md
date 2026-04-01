# WebRTC — Browser-to-Browser Voice/Video Calling

## What is WebRTC?

**WebRTC = Web Real-Time Communication**

It lets two browsers talk to each other directly — voice, video, or both — without any phone number, without any paid service, completely free.

```
Manager's Browser  ←──── direct connection ────►  Employee's Browser
     (speaks)              (no server in             (hears)
                            between)
```

It's like WhatsApp call or Google Meet — but built directly inside your app.

---

## How It Works — Step by Step

```
Step 1: Manager clicks "Call Priya" button in the app
              │
              ▼
Step 2: Your server (Socket.io) tells Priya's browser:
        "Manager wants to call you"
              │
              ▼
Step 3: Priya's screen shows: "Incoming call from Manager"
        with Accept / Reject buttons
              │
              ▼
Step 4: Priya clicks "Accept"
              │
              ▼
Step 5: Both browsers connect DIRECTLY to each other
        → Manager's microphone streams to Priya's speaker
        → Priya's microphone streams to Manager's speaker
        → Optional: video camera too
              │
              ▼
Step 6: Either person clicks "End Call" → connection closed
```

---

## How Data Flows

```
                    ┌──────────────┐
                    │  Your Server │
                    │  (Socket.io) │
                    └──────┬───────┘
                           │
                    Only used for:
                    - "Hey, someone is calling you"
                    - "Call accepted/rejected"
                    - Helping browsers find each other
                           │
                    NOT used for:
                    - Actual voice/video data
                    - That goes directly browser to browser
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     ┌──────────────┐         ┌──────────────┐
     │  Manager's   │◄═══════►│  Employee's  │
     │   Browser    │  DIRECT  │   Browser    │
     │              │  voice/  │              │
     │  Mic ──────► │  video   │  ──────► Speaker
     │  Speaker ◄── │  stream  │  ◄────── Mic
     └──────────────┘         └──────────────┘
```

### Why the server is barely involved:

The server (Socket.io) only does **signaling** — it tells both browsers "hey, this person wants to connect with you." Once the connection is established, all voice/video data flows **directly** between the two browsers. The server doesn't see, hear, or process any of the call data.

---

## The 3 Things That Make WebRTC Work

### 1. Signaling (Socket.io — already in your project)

Signaling is how two browsers find each other and agree to connect.

```
Manager's Browser                     Server                     Employee's Browser
       │                                │                               │
       │── "I want to call Priya" ─────►│                               │
       │                                │── "Manager is calling you" ──►│
       │                                │                               │
       │                                │◄── "I accept the call" ──────│
       │◄── "Priya accepted" ──────────│                               │
       │                                │                               │
       │   Now both browsers exchange connection details (SDP offer/answer)
       │   via the server, then connect directly to each other.
       │                                │                               │
       │◄══════════ DIRECT VOICE/VIDEO CONNECTION ═══════════════════►│
       │            (server no longer involved)                        │
```

### 2. STUN Server (Google provides free)

STUN = **Session Traversal Utilities for NAT**

In simple terms: Your browser is behind a router (NAT). The STUN server tells your browser what your public IP address is, so the other browser can find you.

```
Your Browser: "What's my public address?"
       │
       ▼
Google STUN Server: "You are at 203.45.67.89:12345"
       │
       ▼
Your Browser tells the other browser: "Connect to me at 203.45.67.89:12345"
       │
       ▼
Direct connection established!
```

**Google's free STUN servers:**
- stun:stun.l.google.com:19302
- stun:stun1.l.google.com:19302
- stun:stun2.l.google.com:19302

**Cost: Free forever, no API key needed.**

### 3. TURN Server (Optional fallback)

TURN = **Traversal Using Relays around NAT**

Sometimes direct connection fails (strict firewalls, corporate networks). TURN server acts as a relay — voice data goes through it instead of directly.

```
WITHOUT TURN (normal — works 80% of time):
  Browser A ◄════ direct ════► Browser B

WITH TURN (fallback — when direct fails):
  Browser A ◄──► TURN Server ◄──► Browser B
                 (relays data)
```

**Free TURN options:**
- Metered.ca (free tier: 500MB/month)
- Self-host with Coturn (free, open source)
- Most calls work without TURN (STUN is enough)

---

## Technical Flow — What Happens in Code

### Step 1: Manager initiates call

```
Manager clicks "Call Priya"
       │
       ▼
Browser creates RTCPeerConnection
       │
       ▼
Browser asks for microphone access
  → User sees: "Allow microphone?" → clicks Allow
       │
       ▼
Browser creates "offer" (SDP — describes what media to send)
       │
       ▼
Socket.io sends offer to server
       │
       ▼
Server forwards offer to Priya's browser
```

### Step 2: Employee receives call

```
Priya's browser receives the offer via Socket.io
       │
       ▼
UI shows: "Incoming call from Manager" [Accept] [Reject]
       │
       ▼
Priya clicks Accept
       │
       ▼
Browser creates RTCPeerConnection
       │
       ▼
Browser asks for microphone access → Allow
       │
       ▼
Browser creates "answer" (SDP — describes what media to send back)
       │
       ▼
Socket.io sends answer back to Manager's browser
```

### Step 3: Connection established

```
Both browsers exchange ICE candidates
  (ICE = different network paths to try)
       │
       ▼
STUN server helps find public IPs
       │
       ▼
Best connection path found
       │
       ▼
Direct peer-to-peer connection established
       │
       ▼
Audio streams flowing both ways
  Manager speaks → Priya hears
  Priya speaks → Manager hears
       │
       ▼
Call in progress until someone clicks "End"
```

### Step 4: Call ends

```
Either person clicks "End Call"
       │
       ▼
RTCPeerConnection.close() — connection terminated
       │
       ▼
Socket.io notifies other person: "Call ended"
       │
       ▼
Both browsers release microphone/camera
       │
       ▼
Call log saved in database (duration, participants, timestamp)
```

---

## What It Looks Like in the App

### Manager's Screen — Employee List

```
┌─────────────────────────────────────────────────────┐
│  Team Members                                       │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ 👤 Priya Sharma        🟢 Online            │    │
│  │    Engineering                               │    │
│  │    [📞 Voice Call]  [📹 Video Call]          │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ 👤 Amit Patel          🟢 Online            │    │
│  │    Engineering                               │    │
│  │    [📞 Voice Call]  [📹 Video Call]          │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ 👤 Neha Gupta          🔴 Offline           │    │
│  │    Design                                    │    │
│  │    [📞 Unavailable] [📹 Unavailable]        │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Manager clicks [📞 Voice Call] on Priya            │
└─────────────────────────────────────────────────────┘
```

### Employee's Screen — Incoming Call

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              ┌───────────────────┐                  │
│              │                   │                  │
│              │    📞 Incoming    │                  │
│              │      Call         │                  │
│              │                   │                  │
│              │  from: Rahul      │                  │
│              │  (Manager)        │                  │
│              │                   │                  │
│              │  ┌─────┐ ┌─────┐ │                  │
│              │  │  ✅  │ │  ❌  │ │                  │
│              │  │Accept│ │Reject│ │                  │
│              │  └─────┘ └─────┘ │                  │
│              │                   │                  │
│              └───────────────────┘                  │
│                                                     │
│         (with ringing sound playing)                │
└─────────────────────────────────────────────────────┘
```

### During Call — Both Screens

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              Connected with Priya Sharma             │
│                                                     │
│                   ⏱ 00:03:42                       │
│                                                     │
│              ┌──────────────────┐                   │
│              │  🔊 Audio Active  │                   │
│              │  Signal: Strong   │                   │
│              └──────────────────┘                   │
│                                                     │
│         ┌──────┐  ┌──────┐  ┌──────┐               │
│         │  🔇  │  │  📹  │  │  📕  │               │
│         │ Mute │  │Video │  │ End  │               │
│         └──────┘  └──────┘  └──────┘               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Video Call — Both Screens

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │                                             │    │
│  │         Other Person's Video                │    │
│  │         (large view)                        │    │
│  │                                             │    │
│  │                                             │    │
│  │                              ┌─────────┐   │    │
│  │                              │ Your    │   │    │
│  │                              │ Camera  │   │    │
│  │                              │ (small) │   │    │
│  │                              └─────────┘   │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│     ⏱ 00:05:21                                     │
│                                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │  🔇  │  │  📷  │  │  🖥  │  │  📕  │           │
│  │ Mute │  │Camera│  │Share │  │ End  │           │
│  └──────┘  └──────┘  └──────┘  └──────┘           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## What You Need to Build This (All Free)

| Component | What It Does | Technology | Cost |
|-----------|-------------|------------|------|
| **Signaling** | Tells browsers about each other | Socket.io (already in project!) | Free |
| **Peer Connection** | Actual voice/video stream | WebRTC API (built into browsers) | Free |
| **STUN Server** | Finds your public IP | Google STUN servers | Free |
| **TURN Server** | Fallback relay (if direct fails) | Metered.ca free tier or Coturn | Free |
| **Online Status** | Shows who is online | Socket.io (already in project!) | Free |
| **Call Log** | Saves call history | MongoDB (already in project!) | Free |
| **UI Components** | Call buttons, incoming call popup | React (already in project!) | Free |

**Everything needed is either already in the project or free to use.**

---

## Browser Support

| Browser | Voice | Video | Screen Share |
|---------|-------|-------|-------------|
| Chrome | Yes | Yes | Yes |
| Firefox | Yes | Yes | Yes |
| Edge | Yes | Yes | Yes |
| Safari | Yes | Yes | Yes (v13+) |
| Mobile Chrome | Yes | Yes | No |
| Mobile Safari | Yes | Yes | No |

**Works on all major browsers — desktop and mobile.**

---

## Limitations — What WebRTC Cannot Do

| Limitation | Explanation | Workaround |
|------------|-------------|------------|
| **Both must be online** | Unlike a phone call, both people need the app open | Show online/offline status so caller knows |
| **No phone numbers** | Cannot call someone's actual phone | Use for internal team calls only |
| **Corporate firewalls** | Some strict office networks block direct connections | TURN server acts as relay (fixes this) |
| **No call recording** | Calls are not saved by default | Can add MediaRecorder API (optional) |
| **Browser only** | Not a regular phone — works in web browser | Mobile browsers work too |
| **Internet required** | Both sides need internet connection | Standard requirement for any online tool |
| **No group calls** | Peer-to-peer = 2 people only (by default) | Can add SFU server for group calls (complex) |

---

## WebRTC vs Other Calling Options

| Feature | WebRTC (Browser) | Twilio (Phone) | Bland.ai (AI Call) |
|---------|-----------------|----------------|-------------------|
| **Cost** | Completely free | Paid per minute | Limited free, then paid |
| **Setup** | Medium (code only) | Easy (API key) | Easy (API key) |
| **Calls real phones** | No | Yes | Yes |
| **Voice quality** | Excellent | Excellent | Good |
| **Video support** | Yes | No | No |
| **Screen sharing** | Yes | No | No |
| **AI conversation** | No (human to human) | No | Yes (AI talks) |
| **Works offline** | No | Yes (calls phone) | Yes (calls phone) |
| **Both must be online** | Yes | No | No |
| **No phone number needed** | Yes | No (needs number) | No (needs number) |
| **Best for** | Internal team calls | Calling external clients | AI automated reminders |

---

## How This Fits Into Your Project

### Current System (Notification-Based):
```
Manager schedules "call"
       → At scheduled time → Email + In-app notification sent
       → Employee reads it
       → No actual voice call happens
```

### With WebRTC Added:
```
Manager sees Priya is online (green dot)
       → Clicks "Call" button
       → Priya's browser rings
       → Priya accepts
       → They talk directly in the browser
       → Call ends → log saved in database
       → Duration, participants, timestamp recorded

PLUS the existing notification system still works:
       → If Priya is offline (red dot), manager can still
         schedule a notification reminder for later
```

### Both systems work together:
```
Employee ONLINE?  → [📞 Call Now]     → WebRTC browser call
Employee OFFLINE? → [⏰ Schedule]     → Notification at scheduled time
```

---

## Summary

WebRTC gives your project **free, real-time, browser-to-browser voice and video calling** — like having WhatsApp/Google Meet built directly into your Corporate AI app.

- **Free forever** — no API keys, no per-minute charges
- **Already compatible** — Socket.io (signaling) and React (UI) are in your project
- **Voice + Video + Screen Share** — all supported
- **Works on all browsers** — desktop and mobile
- **Only limitation** — both people need the app open at the same time
