# Bus Tracker Project

## Overview

This project is a real-time bus tracking application. It uses Firebase as a database to store bus locations and Socket.IO for real-time communication between the server and client.

## Technologies Used

-   Node.js
-   Express
-   Socket.IO
-   Firebase Realtime Database
-   CORS

## Setup Instructions

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    ```

2.  **Install dependencies:**

    ```bash
    cd server
    npm install
    ```

3.  **Set up Firebase:**

    -   Create a new project in the [Firebase Console](https://console.firebase.google.com/).
    -   Set up a Realtime Database.
    -   Obtain your Firebase configuration and add it to a `firebase.js` file in the `utils` directory.  The contents of this file should look like this:

        ```javascript
        // filepath: ./utils/firebase.js
        import { initializeApp } from "firebase/app";
        import { getDatabase, ref, push, set, onValue } from "firebase/database";

        const firebaseConfig = {
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_AUTH_DOMAIN",
            databaseURL: "YOUR_DATABASE_URL",
            projectId: "YOUR_PROJECT_ID",
            storageBucket: "YOUR_STORAGE_BUCKET",
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
            appId: "YOUR_APP_ID"
        };

        const app = initializeApp(firebaseConfig);
        export const database = getDatabase(app);
        export { ref, push, set, onValue };
        ```

4.  **Run the server:**

    ```bash
    npm start
    ```

    The server will start on port 5500.

## Project Structure

