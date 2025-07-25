# 📌 **Pintrigue** 📌
_A Web-Based Social Media Application_

---

## **About**

**Pintrigue** is a dynamic social media platform that lets users share beautiful moments tied to **real-world locations**.  
Think Instagram, but **every photo is "pinned" to where it was taken** and displayed on an interactive map. 🌍✨  
Explore new places, uncover local gems, and see what’s trending near you, all through user-generated, geotagged content.

📍 **Pins appear on a map** so you can visually discover content by area!

[![React](https://img.shields.io/badge/Frontend-ReactJS-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

![Docker](https://img.shields.io/badge/docker-ready-blue?style=for-the-badge)  
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)  

---

## 📽️ Preview

> **Watch it in action:**

🚧 _Demo video coming soon!_

---

## 🚀 **Installation**

1. **Clone the repository:**  
   ```bash
   git clone https://github.com/your-username/Pintrigue.git
   cd Pintrigue
   ```
2. **Create a `.env` file in the project root:**  
   Add your Google Maps API key (used for geolocation & place services):
   ```env
   GOOGLE_API=your_google_maps_api_key
   ```
3. **Start with Docker Compose:**  
   Make sure Docker and Docker Compose are installed.

   - **For development:**
     ```bash
     docker-compose up -d --build
     ```

   - **For production:**
     ```bash
     docker-compose -f docker-compose.yaml up -d --build
     ```

4. **Visit the app:**  
   Once running, open your browser and head to:  
   [http://localhost:5173/](http://localhost:5173/) 📸🗺️

---

## 🧭 **Features**

- 📍 Location-tagged image "Pins"
- 🗺️ Interactive map to explore posts geographically
- 🧑‍🤝‍🧑 User-friendly interface with Chakra UI
- ⚡ FastAPI-powered backend
- 🐘 PostgreSQL for robust data storage
- 🐳 Fully dockerized for easy deployment

---
