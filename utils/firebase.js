// Import Firebase
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBM60GbatJbCcmytzfW9J4gL-pDxz4MxMo",
  authDomain: "esp32-gps-firebase-2fd12.firebaseapp.com",
  databaseURL: "https://esp32-gps-firebase-2fd12-default-rtdb.firebaseio.com",
  projectId: "esp32-gps-firebase-2fd12",
  storageBucket: "esp32-gps-firebase-2fd12.firebasestorage.app",
  messagingSenderId: "468797100873",
  appId: "1:468797100873:web:e8a5565dc6e270ac8a0098",
  measurementId: "G-0TK8VKHPS8"
};


// Create some dummy bus data
const buses = {
  bus1: {
    driver: "John Doe",
    busName: "3Start 25",
    busNumber: "1234",
    route: "Uttara Route",
    currentLocation: { latitude: 23.7948374, longitude: 90.3683716 },
    passengers: 25,
    status: "On Time"
  },
  bus2: {
    driver: "Enamul Haque",
    busName: "3Start 20",
    busNumber: "12345",
    route: "Sony Shuttle",
    currentLocation: {
      latitude: 23.7948385,
      longitude: 90.3683722
    },
    passengers: 10,
    status: "Delayed"
  },
  bus3: {
    driver: "Jack Smith",
    busName: "3Start 10",
    busNumber: "123456",
    route: "Mirpur Route",
    currentLocation: {
      latitude: 23.7948381,
      longitude: 90.3683732
    },
    passengers: 32,
    status: "On Time"
  }
};

// Function to write the data to Firebase
function writeBusData() {
  const db = getDatabase();
  set(ref(db, 'buses'), buses);
}


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Write bus data to Firebase
writeBusData();

export { database, ref, onValue };