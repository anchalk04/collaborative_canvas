# Collaborative Canvas: Real-time Drawing Board

This is a real-time, collaborative drawing application built using Vanilla JavaScript and Node.js with Socket.IO. It allows multiple users to draw, chat, and synchronize complex actions like undo/redo across all connected clients instantly.

# Collaborative Canvas: Real-time Drawing Board

## 🚀 Live Demo

**Collaborate Live Here:** [Collaborative Canvas Live Deployment](https://collaborative-canvas-anchal.onrender.com)

## 🛠️ Setup Instructions

To get the project running locally, follow these steps:

1.  **Clone the Repository:**

    ```bash
    git clone [https://github.com/anchalk04/collaborative_canvas.git](https://github.com/anchalk04/collaborative_canvas.git)
    cd collaborative_canvas
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

3.  **Start the Server:**

    ```bash
    npm start
    ```

    The server will start on `http://localhost:3000`.

## 🧪 How to Test with Multiple Users

1.  Open your web browser and navigate to `http://localhost:3000`.
2.  Open a **second tab** or an **Incognito window** and navigate to the same URL.
3.  **Verify Synchronization:**
    * Draw a long line in Tab 1 (one continuous mouse stroke). The line appears in Tab 2 instantly.
    * Click the **Undo** button in Tab 1. The **entire line** vanishes in both tabs.

## ⚠️ Known Limitations/Bugs

### ❌ Current Limitations

| Limitation | Impact |
| :--- | :--- |
| **Performance During Redraw** | Replaying extremely long histories (thousands of strokes) can introduce a brief, visible delay on older machines due to the clear-and-redraw action. |
| **No User Authentication** | User names (e.g., "User1," "User2") are randomly assigned and persistent only for the duration of the session. |

## ⏱️ Time Spent on the Project

| Phase | Time Estimate (Hours) | 
| :--- | :--- | 
| Initial Setup & Basic Drawing Sync | 1.0 | 
| Implementing Tools (Color, Width, Eraser, Clear) | 1.5 | 
| User Management & Cursor Indicators | 2.0 | 
| **Global Undo/Redo (The Core Challenge)** | 4.5 | 
| Code Cleanup, Debugging, Documentation | 1.0 | 
| **Total Time Spent** | **10.0 Hours** |
```eof
