# SChat 

SChat is a full-stack real-time messaging application designed to deliver fast, secure, and seamless communication. It includes instant messaging, media sharing, voice notes, and audio/video calling through a modern, responsive interface.


** Live Demo:** [https://schat-five.vercel.app/](https://schat-five.vercel.app/)
*(Note: As the backend is hosted on Render's free tier, please allow 30-50 seconds for the server to wake up on your first visit!)*

---

##  Built for Privacy & Security

In today's digital landscape, your data safety is paramount. SChat was engineered with security in mind from day one:

- **Encrypted Authentication:** Your passwords are salted and hashed using industry-standard cryptography (bcrypt) before ever reaching the database.
- **Stateless Sessions:** We utilize JSON Web Tokens (JWT) for secure, stateless authentication, ensuring your session data is tamper-proof.
- **Input Validation**: User input is validated on the backend to improve application security and data integrity.
- **Secure Media Storage:** All media and files are securely uploaded and delivered via Cloudinary's encrypted CDN.

---

##  Key Features

SChat is packed with thoughtful features designed to make communication feel natural:

- **Instant Real-Time Messaging:** Powered by WebSockets, messages are delivered instantly without ever needing to refresh the page.
- **Video & Audio Calling:** High-quality, peer-to-peer WebRTC calls directly in your browser.
- **Rich Media Sharing:** Seamlessly share images, files, and live voice notes.
- **Dynamic Personalization:** Switch between elegant Light and Dark modes, and customize individual chat wallpapers to fit your mood.
- **Expressive Interactions:** Search for GIFs, react to messages instantly with our quick-emoji menu, and enjoy beautifully rendered 3D emojis.
- **Message Management:** Made a typo? You can edit or delete your messages at any time.

---

##  The Technology Stack

SChat is a full-stack application engineered from the ground up using the **MERN** stack, selected for its speed and scalability:

- **Frontend:** React.js & Vite for a lightning-fast user interface, styled precisely with Tailwind CSS.
- **Backend:** Node.js & Express.js architecture built for high concurrency.
- **Real-Time Engine:** Socket.io for persistent, bi-directional communication.
- **Database:** MongoDB Atlas paired with Mongoose for flexible, schema-driven data modeling.
- **Media Management:** Cloudinary API integration.
- **Peer-to-Peer:** Simple-peer (WebRTC) for direct audio/video streaming.

---

## Deployment Architecture

To maximize performance and reliability, SChat utilizes a decoupled deployment strategy:

- **Frontend (Vercel):** The React application is deployed on Vercel's Edge Network, ensuring static assets are served instantly to users anywhere in the world.
- **Backend (Render):** The Node.js API and WebSocket server are hosted on Render, handling constant real-time connections and direct database communications.

---

##  Feedback

Thank you for checking out SChat. If you have any suggestions or find any issues, feel free to open an issue on this repository.

##  Copyright

© 2026 Shamlu Mol A K. All Rights Reserved.

This repository is provided for portfolio and evaluation purposes only.

Unauthorized copying, modification, redistribution, or commercial use of this source code is prohibited without prior written permission.
