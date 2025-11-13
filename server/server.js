// // 1. Import required modules
// const express = require('express');
// const http = require('http');
// const { Server } = require("socket.io");
// const path = require('path');

// // --- USER MANAGEMENT ---
// const USERS = {}; 
// let userCounter = 1;

// function getRandomColor() {
//     const letters = '0123456789ABCDEF';
//     let color = '#';
//     for (let i = 0; i < 6; i++) {
//         color += letters[Math.floor(Math.random() * 16)];
//     }
//     return color;
// }

// function getUsersList() {
//     return Object.keys(USERS).map(id => ({
//         id: id,
//         color: USERS[id].color,
//         name: USERS[id].name
//     }));
// }

// // --- HISTORY MANAGEMENT (Stroke-Based) ---
// let DRAWING_HISTORY = []; 
// let historyPointer = 0;   

// function addCommand(command) {
//     DRAWING_HISTORY = DRAWING_HISTORY.slice(0, historyPointer);
//     DRAWING_HISTORY.push(command);
//     historyPointer++;
// }

// function clearHistory() {
//     DRAWING_HISTORY = [];
//     historyPointer = 0;
// }

// // 2. Initialize Express app and HTTP server
// const app = express();
// const httpServer = http.createServer(app);

// // 3. Initialize Socket.IO and attach it to the HTTP server
// const io = new Server(httpServer, {
//     cors: {
//         origin: "*", 
//         methods: ["GET", "POST"]
//     }
// });

// // 4. Define a basic route for the server
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, '../client/index.html'));
// });


// // 5. Handle Socket.IO connections (The main logic block)
// io.on('connection', (socket) => {
//     // 1. ADD NEW USER & INITIAL BROADCASTS
//     const userColor = getRandomColor();
//     const userName = `User${userCounter++}`;
    
//     USERS[socket.id] = { color: userColor, name: userName };

//     console.log(`A user connected: ${userName} (${socket.id}). Total: ${Object.keys(USERS).length}`);

//     socket.emit('user-info', { id: socket.id, color: userColor });
//     io.emit('users-update', getUsersList()); 
    
//     // Send initial history to the new client
//     socket.emit('initial-history', DRAWING_HISTORY.slice(0, historyPointer));
    
//     // --- DRAWING LISTENERS (Stroke-Based) ---

//     // Listener for the FINAL stroke (used for history/undo)
//     socket.on('new-stroke', (segments) => {
//         // 1. Store the entire stroke (array of segments) as ONE command
//         const command = { type: 'stroke', data: segments };
//         addCommand(command); 
        
//         // 2. Broadcast the state update to enable the Undo button
//         io.emit('history-state', {
//             pointer: historyPointer,
//             total: DRAWING_HISTORY.length
//         });
//         console.log(`[HISTORY] New stroke saved. Total commands: ${DRAWING_HISTORY.length}`);
//     });
    
//     // Listener for individual segments (used for real-time display)
//     socket.on('segment-draw', (segment) => {
//         // Broadcast the single segment to ALL OTHER clients for real-time display
//         socket.broadcast.emit('segment-draw', segment);
//     });

//     // --- UNDO/REDO LISTENERS ---

//     socket.on('undo', () => {
//         if (historyPointer > 0) {
//             historyPointer--;
//             io.emit('history-replay', {
//                 commands: DRAWING_HISTORY.slice(0, historyPointer),
//                 pointer: historyPointer,
//                 total: DRAWING_HISTORY.length
//             });
//             console.log(`[UNDO] executed. Pointer at: ${historyPointer}`);
//         }
//     });

//     socket.on('redo', () => {
//         if (historyPointer < DRAWING_HISTORY.length) {
//             historyPointer++;
//             io.emit('history-replay', {
//                 commands: DRAWING_HISTORY.slice(0, historyPointer),
//                 pointer: historyPointer,
//                 total: DRAWING_HISTORY.length
//             });
//             console.log(`[REDO] executed. Pointer at: ${historyPointer}`);
//         }
//     });

//     // --- UTILITY LISTENERS ---
    
//     socket.on('clear', () => {
//         clearHistory();
        
//         // Broadcast the clear command to everyone
//         io.emit('command', { type: 'clear' }); 
        
//         // Broadcast the state to disable Undo/Redo buttons
//         io.emit('history-state', {
//             pointer: historyPointer,
//             total: DRAWING_HISTORY.length
//         });
//         console.log('Canvas cleared by a user.');
//     });

//     socket.on('chat message', (msg) => {
//         const user = USERS[socket.id] || { name: 'Unknown' };
//         io.emit('chat message', `${user.name}: ${msg}`);
//     });
    
//     socket.on('color-change', (newColor) => {
//         if (USERS[socket.id]) {
//             USERS[socket.id].color = newColor;
//         }
//         io.emit('users-update', getUsersList());
//     });

//     socket.on('cursor-move', (data) => {
//         socket.broadcast.emit('cursor-update', { id: socket.id, x: data.x, y: data.y });
//     });

//     socket.on('disconnect', () => {
//         delete USERS[socket.id];
//         console.log(`User disconnected. Total: ${Object.keys(USERS).length}`);
//         io.emit('users-update', getUsersList());
//     });
// });

// // 6. Define the port and start the server
// const PORT = 3000;
// httpServer.listen(PORT, () => {
//     console.log(`Server listening on http://localhost:${PORT}`);
// });





// 1. Required modules setup
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

// --- USER TRACKING ---
const activeUsers = {};
let userIdCounter = 1;

// Generate a random hex color for user identification
function generateRandomHexColor() {
    const hexChars = '0123456789ABCDEF';
    let colorCode = '#';
    for (let i = 0; i < 6; i++) {
        colorCode += hexChars[Math.floor(Math.random() * 16)];
    }
    return colorCode;
}

// Return the list of current users with their ids, colors and display names
function getCurrentUsers() {
    return Object.keys(activeUsers).map(socketId => ({
        id: socketId,
        color: activeUsers[socketId].color,
        name: activeUsers[socketId].name
    }));
}

// --- DRAWING HISTORY MANAGEMENT ---
let strokesHistory = [];
let currentHistoryIndex = 0;

function saveStrokeCommand(strokeCommand) {
    // Erase any undone redo history before saving new stroke
    strokesHistory = strokesHistory.slice(0, currentHistoryIndex);
    strokesHistory.push(strokeCommand);
    currentHistoryIndex++;
}

function resetDrawingHistory() {
    strokesHistory = [];
    currentHistoryIndex = 0;
}

// 2. Express app and server initialization
const app = express();
const server = http.createServer(app);

// 3. Socket.IO server setup with CORS settings
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 4. Serve the main client HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// 5. Handle real-time socket connections
io.on('connection', (socket) => {

    // Assign new user a unique color and name
    const newUserColor = generateRandomHexColor();
    const newUserName = `User${userIdCounter++}`;

    activeUsers[socket.id] = { color: newUserColor, name: newUserName };

    console.log(`User connected: ${newUserName} (Socket ID: ${socket.id}). Current users: ${Object.keys(activeUsers).length}`);

    // Inform the new user of their details
    socket.emit('user-info', { id: socket.id, color: newUserColor });

    // Update all clients with the new users list
    io.emit('users-update', getCurrentUsers());

    // Send existing drawing history up to the current point to the new client
    socket.emit('initial-history', strokesHistory.slice(0, currentHistoryIndex));

    // --- DRAWING EVENTS ---

    // When a user finishes a stroke, save it as a command
    socket.on('new-stroke', (strokeSegments) => {
        const strokeCommand = { type: 'stroke', data: strokeSegments };
        saveStrokeCommand(strokeCommand);

        // Update all clients on history state for undo/redo UI
        io.emit('history-state', {
            pointer: currentHistoryIndex,
            total: strokesHistory.length
        });

        console.log(`[HISTORY] Stroke added. Total saved commands: ${strokesHistory.length}`);
    });

    // Real-time drawing broadcast as segments come in from the user
    socket.on('segment-draw', (segment) => {
        socket.broadcast.emit('segment-draw', segment);
    });

    // --- UNDO/REDO FUNCTIONALITY ---

    socket.on('undo', () => {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            io.emit('history-replay', {
                commands: strokesHistory.slice(0, currentHistoryIndex),
                pointer: currentHistoryIndex,
                total: strokesHistory.length
            });
            console.log(`[UNDO] action performed. History pointer at: ${currentHistoryIndex}`);
        }
    });

    socket.on('redo', () => {
        if (currentHistoryIndex < strokesHistory.length) {
            currentHistoryIndex++;
            io.emit('history-replay', {
                commands: strokesHistory.slice(0, currentHistoryIndex),
                pointer: currentHistoryIndex,
                total: strokesHistory.length
            });
            console.log(`[REDO] action performed. History pointer at: ${currentHistoryIndex}`);
        }
    });

    // --- MISCELLANEOUS EVENTS ---

    // Clear the canvas and reset history on command
    socket.on('clear', () => {
        resetDrawingHistory();

        io.emit('command', { type: 'clear' });
        io.emit('history-state', {
            pointer: currentHistoryIndex,
            total: strokesHistory.length
        });

        console.log('Canvas cleared by a user.');
    });

    // Simple chat message broadcasting
    socket.on('chat message', (message) => {
        const sender = activeUsers[socket.id] || { name: 'Unknown' };
        io.emit('chat message', `${sender.name}: ${message}`);
    });

    // Handle user changing their assigned color
    socket.on('color-change', (updatedColor) => {
        if (activeUsers[socket.id]) {
            activeUsers[socket.id].color = updatedColor;
        }
        io.emit('users-update', getCurrentUsers());
    });

    // Broadcast cursor position updates to other users
    socket.on('cursor-move', (cursorData) => {
        socket.broadcast.emit('cursor-update', { id: socket.id, x: cursorData.x, y: cursorData.y });
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        delete activeUsers[socket.id];
        console.log(`User disconnected. Remaining users: ${Object.keys(activeUsers).length}`);
        io.emit('users-update', getCurrentUsers());
    });
});

// 6. Start server on specified port
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
