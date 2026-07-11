<div align="center">
  <img src="https://via.placeholder.com/150x150/0066ff/ffffff?text=SChat" alt="SChat Logo" width="100" />
  <h1>SChat</h1>
  <p><strong>A lightning-fast, beautiful, and secure real-time messaging application.</strong></p>
</div>

<br />

## 🌟 What is SChat? (In Simple Terms)

SChat is a modern chat application built to work seamlessly in your web browser. Think of it like a web version of WhatsApp or iMessage. It allows users to create accounts, search for their friends, and send instant messages without having to refresh the page.

Whether you want to send a quick text, share a funny GIF, send a voice note, or even hop on a video call, SChat handles it all instantly and securely.

---

## ✨ Key Features

- 💬 **Instant Real-Time Messaging:** Messages appear on the recipient's screen the exact millisecond you hit send. No refreshing required.
- 🔒 **Secure Authentication:** Your passwords are securely encrypted. We use industry-standard security so your account is safe.
- 🎨 **Beautiful & Customizable:** Switch between stunning dark and light modes, and customize individual chat themes with unique colors and wallpapers.
- 📎 **Rich Media Sharing:** Send images, files, and even record live voice notes directly inside the chat.
- 🎉 **GIFs & Emojis:** Fully integrated GIF search and 3D emojis to express yourself.
- 📹 **Video & Audio Calling:** Connect face-to-face with built-in high-quality video calling.
- ✏️ **Message Editing:** Made a typo? Edit your messages inline even after sending them.

---

## 💻 The Technology Behind the Magic (For Developers)

SChat is a Full-Stack Web Application built using the **MERN** Stack, optimized for high performance and real-time data streaming.

### **Frontend (The User Interface)**
- **React.js & Vite:** Powers the ultra-fast, interactive user interface.
- **Tailwind CSS:** Used for sleek, modern, and fully responsive styling across all devices.
- **Socket.io-Client:** Maintains a persistent, live connection to the server for instant data delivery.
- **Axios:** Handles robust HTTP requests for user authentication and file uploads.

### **Backend (The Server & Database)**
- **Node.js & Express.js:** The core engine that runs the server, handles API requests, and processes data.
- **Socket.io:** The real-time engine that instantly routes messages from one user to another.
- **MongoDB & Mongoose:** A flexible NoSQL database that securely stores all user data, messages, and chat histories.
- **Cloudinary:** A cloud storage service used to reliably host user profile pictures and image attachments.
- **JWT (JSON Web Tokens):** Secures user sessions without needing to store sensitive data in the browser.

---

## 🚀 How to Run This Project on Your Own Computer

Want to try running SChat on your own machine? It's easy! Just follow these steps:

### **1. Prerequisites**
Make sure you have [Node.js](https://nodejs.org/) installed on your computer. 

### **2. Download the Code**
Clone this repository to your computer:
```bash
git clone https://github.com/yourusername/SChat.git
cd SChat
```

### **3. Setup the Backend Server**
Open a terminal and navigate to the backend folder:
```bash
cd backend
npm install
```

Create a new file named `.env` in the `backend` folder and add your secret keys:
```env
PORT=3001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=http://localhost:5173
```
Start the server:
```bash
npm run dev
```

### **4. Setup the Frontend App**
Open a **new** terminal window and navigate to the frontend folder:
```bash
cd frontend
npm install
```

Start the frontend application:
```bash
npm run dev
```

### **5. Open the App**
Open your web browser and go to: `http://localhost:5173`
You can now create an account and start chatting!

---

## 🤝 Contributing
Contributions, issues, and feature requests are always welcome! Feel free to check the issues page if you want to contribute.

## 📝 License
This project is [MIT](https://opensource.org/licenses/MIT) licensed.
