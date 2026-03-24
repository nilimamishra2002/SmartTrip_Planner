"use client";
import React, { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  ChevronDown,
  User,
  Check,
  X,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DatePicker } from "antd";
import moment from "moment";
import axios from "axios";
import TravelPlannerModal from "./TravelPlannerModal";
import { useSession } from "next-auth/react";
import type { Dayjs } from "dayjs";
import { signOut } from "next-auth/react";
const handleLogout = async () => {
  await signOut({
    callbackUrl: "/signin",
  });
};

const BookingCard = () => {
  // Dummy data for initial form state
  const places = [
    { location: "Bhubaneswar", latitude: 20.2961, longitude: 85.8245 },
    { location: "Puri", latitude: 19.8135, longitude: 85.8312 },
    { location: "Konark", latitude: 19.8876, longitude: 86.0945 },
    { location: "Cuttack", latitude: 20.4625, longitude: 85.883 },
    { location: "Chilika", latitude: 19.673, longitude: 85.388 },
    { location: "Gopalpur", latitude: 19.2561, longitude: 84.9041 },
    { location: "Koraput", latitude: 18.811, longitude: 82.7105 },
    { location: "Rayagada", latitude: 19.1717, longitude: 83.4163 },
    { location: "Rourkela", latitude: 22.2604, longitude: 84.8536 },
    { location: "Sambalpur", latitude: 21.4669, longitude: 83.9812 },
    { location: "Balasore", latitude: 21.4942, longitude: 86.9336 },
    { location: "Baripada", latitude: 21.931, longitude: 86.751 },
  ];

  // todays date
  const today = new Date();

  // Form state variables
  const [tripType, setTripType] = useState("oneWay");
  const [origin, setOrigin] = useState("Bhubaneswar");
  const [destination, setDestination] = useState("Puri");
  const [journeyDate, setJourneyDate] = useState(today.toISOString());
  const [days, setDays] = useState("3");
  const [people, setPeople] = useState("5");
  const [travelClass, setTravelClass] = useState("economy");
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [budget, setBudget] = useState("5000");
  const [preferences, setPreferences] = useState("want to see beach");

  const router = useRouter();

  // Handle form submission
  const handleSearch = async () => {
    const tripPlanQuery = `origin=${origin}&destination=${destination}&days=${days}&budget=${budget}&people=${people}&preferences=${preferences}&tripType=${tripType}&journeyDate=${journeyDate}&travelClass=${travelClass}`;
    console.log("Trip Plan Query:", tripPlanQuery);

    try {
      const response = await axios.get(
        `http://localhost:3000/api/tripPlan?${tripPlanQuery}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status !== 200) {
        throw new Error("API request failed");
      }

      const data = response.data;
      console.log("API Response:", data);

      // Store response data in local storage
      localStorage.removeItem("tripPlan");
      localStorage.setItem("tripPlan", JSON.stringify(data));

      console.log("Stored tripPlan:", localStorage.getItem("tripPlan"));

      router.push("/trip/preview");

      console.log("Stored tripPlan:", localStorage.getItem("tripPlan"));

      // Navigate to preview page if successful
      router.push("/trip/preview");
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handleDateChange = (date: Dayjs | null) => {
    setSelectedDate(date);
    if (date) {
      setJourneyDate(date.toISOString());
    }
  };

  return (
    <div className="py-4 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Booking Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-5xl mx-auto transition-transform duration-500 ease-in-out transform scale-100">
          {/* Trip Type Selection */}
          <div className="flex gap-6 mb-8 justify-center">
            {["oneWay", "roundWay", "multiCity"].map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div className="relative w-6 h-6">
                  <input
                    type="radio"
                    name="tripType"
                    checked={tripType === type}
                    onChange={() => setTripType(type)}
                    className="peer absolute opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 peer-checked:border-purple-600 transition-colors" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-600 scale-0 peer-checked:scale-100 transition-transform" />
                </div>
                <span className="text-gray-700 font-medium">
                  {type === "oneWay"
                    ? "One Way"
                    : type === "roundWay"
                    ? "Round Trip"
                    : "Multi City"}
                </span>
              </label>
            ))}
          </div>

          {/* Search Form */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 grid grid-cols-2 gap-6 relative">
              <div className="border border-gray-300 hover:border-purple-500 rounded-lg p-6 transition-all bg-white shadow-md hover:shadow-lg">
                <label className="text-xs font-medium text-gray-600 tracking-wide">
                  FROM
                </label>
                <select
                  title="origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-lg font-semibold text-gray-900"
                >
                  {places.map((loc, idx) => (
                    <option key={idx} value={loc.location}>
                      {loc.location}
                    </option>
                  ))}
                </select>
              </div>
              <button className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-2xl transition-all z-10 group">
                <ArrowLeftRight className="w-5 h-5 text-purple-600 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <div className="border border-gray-300 hover:border-purple-500 rounded-lg p-6 transition-all bg-white shadow-md hover:shadow-lg">
                <label className="text-xs font-medium text-gray-600 tracking-wide">
                  TO
                </label>
                <select
                  title="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-lg font-semibold text-gray-900"
                >
                  {places.map((loc, idx) => (
                    <option key={idx} value={loc.location}>
                      {loc.location}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-gray-300 hover:border-purple-500 rounded-lg p-6 transition-all duration-200 cursor-pointer bg-white shadow-md hover:shadow-lg">
              <label className="text-xs font-medium text-gray-600 tracking-wide">
                JOURNEY DATE
              </label>
              <DatePicker
                id="journeyDate"
                style={{ width: "100%" }}
                value={selectedDate}
                onChange={handleDateChange}
                className="text-lg font-semibold text-gray-700 mt-1"
              />
              <label className="text-xs font-medium text-gray-600 tracking-wide mt-4 block">
                Duration (Days)
              </label>
              <div className="flex justify-between gap-1 items-center">
                <input
                  type="number"
                  min={1}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm text-gray-700"
                  title="days"
                />
                <div className="text-sm text-gray-700 mt-1">Days</div>
              </div>
            </div>

            <div className="border border-gray-300 hover:border-purple-500 rounded-lg p-6 transition-all duration-200 cursor-pointer bg-white shadow-md hover:shadow-lg">
              <label className="text-xs font-medium text-gray-600 tracking-wide">
                Person
              </label>
              <div className="flex justify-between gap-3 items-center">
                <input
                  type="number"
                  min="1"
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm font-semibold text-gray-900"
                  title="people"
                />
                <div className="text-lg font-semibold text-gray-900 mt-1">
                  Person
                </div>
              </div>
              <label className="text-xs font-medium text-gray-600 tracking-wide">
                Class
              </label>
              <select
                title="travelClass"
                value={travelClass}
                onChange={(e) => setTravelClass(e.target.value)}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm text-gray-700"
              >
                <option value="economy">Economy</option>
                <option value="business">Business</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <div>
              <div className="text-lg font-semibold text-gray-900 mt-1">
                Budget
              </div>
              <input
                type="number"
                min="1"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-lg font-semibold text-gray-700"
                title="budget"
              />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900 mt-1">
                Preference
              </div>
              <input
                type="text"
                min="1"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-lg font-semibold text-gray-700"
                title="preference"
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSearch} // Call handleSearch on button click
              className="bg-purple-600 text-white px-12 py-4 rounded-lg font-semibold shadow-lg hover:bg-purple-700 transition-all"
            >
              Make Trip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Header = () => {
  const router = useRouter();

  const { data: session } = useSession();

  const handleSignInClick = () => {
    router.push("/signin");
  };

return (
  <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-200 z-50 shadow-sm">
    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      
      {/* LOGO */}
      <div className="flex items-center gap-12">
        <div className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-pink-500 bg-clip-text text-transparent">
          SmartTrip
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">

        {/* CURRENCY */}
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-200 transition-all">
          <span className="text-sm font-medium text-gray-800">INR</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>

        {session?.user ? (
          <div className="flex items-center gap-3">

            {/* HOME BUTTON (GOOD ALREADY, SLIGHT ENHANCE) */}
            <button
              onClick={() => router.push("/trip")}
              className="bg-purple-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              Go to Home
            </button>

            {/* LOGOUT BUTTON FIXED */}
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-all shadow-md hover:shadow-lg"
            >
              Logout
            </button>

          </div>
        ) : (
          /* SIGN IN BUTTON FIXED */
          <button
            onClick={handleSignInClick}
            className="bg-purple-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  </div>
);
};

export default function Homepage() {
  const [selectedTab, setSelectedTab] = useState("train");
  const [tripType, setTripType] = useState("oneWay");
  const [showForm, setShowForm] = useState(false);
  const [showInputField, setShowInputField] = useState(true);
  const router = useRouter();
  // Array of suggestions
  const suggestions = [
    "Bhubaneswar to Puri trip for 3 days budget 8000",
    "Temple tour Bhubaneswar Puri Konark",
    "Weekend beach trip to Gopalpur from Bhubaneswar",
    "Chilika lake tour with family",
    "Odisha heritage tour for 5 days",
    "Budget trip to Koraput hills",
    "Konark Sun Temple one day trip",
    "Road trip Bhubaneswar to Sambalpur",
    "Nature trip to Rayagada Odisha",
  ];

  const [inputText, setInputText] = useState(""); // Holds the user input or auto-typed text
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0); // Tracks which suggestion to show
  const [typingIndex, setTypingIndex] = useState(0); // Tracks the typing progress
  const [isUserTyping, setIsUserTyping] = useState(false); // Flag to detect if the user started typing
  const [isModalOpen, setModalOpen] = useState(false); // Manage modal state
  const [modalInputText, setModalInputText] = useState("");

  useEffect(() => {
    // If the user is typing, stop the auto-typing effect
    if (isUserTyping) return;

    const currentSuggestion = suggestions[currentSuggestionIndex];

    if (typingIndex < currentSuggestion.length) {
      const timeoutId = setTimeout(() => {
        setInputText((prev) => prev + currentSuggestion[typingIndex]);
        setTypingIndex((prev) => prev + 1);
      }, 100); // Typing speed in milliseconds
      return () => clearTimeout(timeoutId);
    } else {
      // Pause before starting to type the next suggestion
      const pauseTimeout = setTimeout(() => {
        setTypingIndex(0); // Reset typing index
        setCurrentSuggestionIndex(
          (prev) => (prev + 1) % suggestions.length, // Loop through suggestions
        );
        setInputText(""); // Clear the input for the next suggestion
      }, 2000); // Delay between typing suggestions
      return () => clearTimeout(pauseTimeout);
    }
  }, [typingIndex, currentSuggestionIndex, suggestions, isUserTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    setIsUserTyping(true);
  };

  const handleClearInput = () => {
    setInputText("");
    setIsUserTyping(false); // Resume auto-typing when the input is cleared
    setTypingIndex(0);
    setCurrentSuggestionIndex(0); // Optionally reset to the first suggestion
  };

  const handleYesClick = () => {
    setShowInputField(false); // Hide the input field and suggestions
    setShowForm(true); // Show the booking form
  };

  const handleGeneratePlan = (inputText: string) => {
    setModalInputText(inputText); // Set the prompt text for modal
    setModalOpen(true); // Open the modal
  };

  // Function to handle closing the modal
  const handleCloseModal = () => {
    setModalOpen(false); // Close the modal
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-purple-100 to-purple-200">
      <Header />
      <div className="pt-32 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* EasyTrip Intro */}
          <div className="text-center mb-12 space-y-6">
            <div className="text-4xl md:text-5xl font-extrabold text-gray-800 leading-normal">
              <span className="font-bold">SmartTrip</span> <br />
              <div className="text-xl md:text-2xl font-bold text-gray-700">
                Your Personal Travel Agent
              </div>
            </div>

            {/* Conditional rendering for Search Input */}
            {showInputField && (
              <div className="bg-white p-6 rounded-full shadow-md flex items-center justify-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="Ask Anything"
                  className="flex-grow text-xl font-semibold bg-transparent text-gray-700 outline-none px-4"
                />
                <button
                  className="flex font-bold items-center gap-1 bg-purple-500 text-white px-5 py-3 rounded-full shadow-md hover:bg-purple-600 transition-all"
                  onClick={() => handleGeneratePlan(inputText)}
                >
                  <Send className="w-6 h-6" />
                  Generate Plan
                </button>
              </div>
            )}

            {/* Suggestion Tags */}
            {showInputField && (
              <div className="flex flex-wrap gap-4 justify-center mt-10 text-gray-800">
                {suggestions.map((tag, index) => (
                  <button
                    key={index}
                    className="px-4 py-2 bg-white border rounded-full hover:bg-gray-100 text-sm shadow-lg transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Manual Search Section */}
          <div className="text-center mb-8">
            <div className="text-xl md:text-2xl font-semibold text-gray-700 mb-4">
              Want to search manually?
            </div>
            <div className="flex justify-center gap-4 text-gray-700">
              <button
                onClick={handleYesClick}
                className={`px-4 py-2 rounded-full hover:bg-green-100 text-sm flex items-center gap-1 shadow-md transition-all ${
                  showForm
                    ? "bg-green-500 text-white font-semibold hover:bg-green-600"
                    : "bg-white"
                }`}
              >
                <Check
                  className={`w-6 h-6 ${
                    showForm ? "text-white" : "text-green-600"
                  }`}
                />
                Yes
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setShowInputField(true);
                }}
                className="px-4 py-2 bg-white rounded-full hover:bg-red-100 text-sm flex items-center gap-1 shadow-md transition-all"
              >
                <X className="w-6 h-6 text-red-600" />
                No
              </button>
            </div>
          </div>
        </div>

        {/* Conditionally Show the Form with Transition */}
        <div
          className={`transform transition-opacity duration-1000 ${
            showForm
              ? "opacity-100 fade-in-50"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {showForm && <BookingCard />}
        </div>
      </div>

      {isModalOpen && (
        <TravelPlannerModal
          isOpen={isModalOpen} // Pass modal state as prop
          inputText={modalInputText} // Pass input text as prop
          onClose={handleCloseModal} // Pass close function to modal
        />
      )}
    </div>
  );
}
