# SChat 💬

Hi there! Welcome to SChat. 

I built SChat to be a clean, fast, and simple real-time chat application. It works a lot like WhatsApp or Messenger but runs entirely in your web browser. My goal was to create a messaging experience that isn't just functional, but genuinely feels good to use.

Whether you want to send a quick text, share a funny GIF, send a voice note, or hop on a video call, SChat handles it instantly.

**🌍 Live Demo:** [Insert Your Vercel Link Here]
*(Note: Since the backend is hosted on Render's free tier, it might take 30-50 seconds to wake up the first time you send a message!)*

---

## What can it do?

- **Real-Time Messaging:** Messages appear instantly on the other person's screen without needing to refresh.
- **Secure Accounts:** Your passwords and data are securely encrypted.
- **Customizable:** You can switch between dark and light modes, and customize the color and wallpaper of your individual chats.
- **Media Sharing:** Send images, files, and live voice notes directly in the chat.
- **GIFs & Emojis:** I integrated GIF search and 3D emojis so you can express yourself better.
- **Video & Audio Calls:** Built-in high-quality video calling for when text isn't enough.
- **Message Editing:** Made a typo? You can edit your messages even after you hit send.

---

## How it was built (Tech Stack)

I built this project from scratch using the **MERN** stack. Here are the core technologies I used:

- **Frontend:** React.js & Vite (for a snappy user interface), styled with Tailwind CSS.
- **Backend:** Node.js & Express.js.
- **Database:** MongoDB Atlas & Mongoose.
- **Real-Time Engine:** Socket.io (this is what makes the messages instant!).
- **Cloud Storage:** Cloudinary (for securely storing profile pictures and sent images).
- **Security:** JWT (JSON Web Tokens) for safe, stateless user sessions.

---

## ☁️ Deployment Architecture

Because this is a full-stack application, I deployed the frontend and backend separately to optimize for performance and hosting costs:

- **Frontend (Vercel):** The React interface is deployed on Vercel. Vercel automatically serves the static assets extremely fast via their edge network.
- **Backend (Render):** The Node.js/Socket.io server is hosted on Render. It handles the continuous real-time WebSocket connections and communicates directly with MongoDB.

*(If you clone this repository, both the `frontend` and `backend` folders are completely ready to be deployed to Vercel and Render respectively!)*

---

## Thanks for stopping by!
Feel free to explore the code, report any bugs in the issues tab, or reach out if you have any questions. 

License: MIT
