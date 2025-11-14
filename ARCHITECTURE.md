# Collaborative Canvas Architecture Document

This document outlines the technical design, data structures, and strategies used to implement global synchronization and state management in the Collaborative Canvas application.

## 1. Data Flow Diagram (Drawing Events)

The architecture uses a strict Server-Authoritative model, ensuring the server controls the final state of the canvas history.

| Action | Sender | Protocol/Event | Receiver | Data Content |
| :--- | :--- | :--- | :--- | :--- |
| **Real-time Draw** | Client A | `segment-draw` | Server (broadcasts) | Single segment (`x0, y0, x1, y1`, color, width) |
| **History Save** | Client A | `new-stroke` | Server (history) | Array of all segments in the completed stroke (`[{seg1}, {seg2}, ...]`) |
| **Global Undo/Redo**| Client A | `undo` or `redo` | Server (history) | None (just a signal) |
| **Canvas State Update** | Server | `history-replay` | All Clients | Truncated history array (`commands`, pointer, total) |

## 2. WebSocket Protocol

The protocol is designed to differentiate between **real-time streaming** (low latency) and **history management** (robustness).

* **Real-time Streaming (`segment-draw`):** Sent on every `mousemove` when `isDrawing=true`. Used only for visual feedback to remote clients; **not saved to history.**
* **Stroke Command (`new-stroke`):** Sent once on `mouseup`. This data contains the complete stroke (an array of all segments), which is saved to the server's history.
* **State Updates (`history-state`):** Sent after any operation that modifies the history pointer (e.g., after receiving a `new-stroke`). This allows clients to instantly enable/disable the Undo/Redo buttons without waiting for a full replay command.

## 3. Global Undo/Redo Strategy (History Replay Model)

The project utilizes the **History Replay Model** to achieve global, synchronized undo/redo functionality.

1.  **Server State:** The `server.js` maintains a single global array (`DRAWING_HISTORY`) containing complete stroke objects (`{ type: 'stroke', data: [segments] }`). A `historyPointer` tracks the index of the last displayed command.
2.  **Stroke Grouping:** The client bundles all `mousemove` events between a `mousedown` and `mouseup` into a single, large array (`currentStrokeSegments`). This array is sent as a single `new-stroke` command on `mouseup`. This is the **Stroke-Based History** crucial for single-action undo.
3.  **Execution:** When a client sends `undo`, the server decrements `historyPointer`. The server then broadcasts a sliced version of the `DRAWING_HISTORY` (up to the new pointer index) via the `history-replay` event.
4.  **Client Replay:** All clients receive the sliced history, run `clearLocalCanvas()`, and then sequentially execute every stroke command in the truncated history using nested loops. This redraws the entire canvas to the correct state.

## 4. Performance Decisions

* **Optimization:** Choosing **Stroke Grouping** significantly improves performance over the previous segment-based history. By saving only one command per stroke (instead of 40-100), the size of the history array is minimized, making the `history-replay` loop much faster.
* **Latency:** The use of `segment-draw` for real-time visual streaming ensures immediate feedback, giving the illusion of zero-latency drawing, even though the definitive history update is delayed until `mouseup`.

## 5. Conflict Resolution

The conflict resolution strategy is based on **Low-Latency Overwrite** (often called **Last Write Wins** in a temporal sense).

* **Mechanism:** Since all drawing data is streamed and rendered sequentially, the drawing segment that arrives at the client's canvas last will overwrite or be drawn on top of earlier segments.
* **Simultaneous Drawing:** If two users draw at the same time, the network ensures one segment arrives slightly before the other. The resulting image is the correct, combined visual representation of both actions, which is acceptable for a collaborative canvas where complex vector merging is not required.