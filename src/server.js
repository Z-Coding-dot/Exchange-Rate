const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define Schemas and Models
const WeatherLogSchema = new mongoose.Schema({
  city: String,
  temperature: Number,
  timestamp: { type: Date, default: Date.now },
});

// Add indexing for faster queries
WeatherLogSchema.index({ city: 1 });


const ExchangeRateSchema = new mongoose.Schema({
  baseCurrency: String,
  rates: Object,
  timestamp: { type: Date, default: Date.now, expires: 3600 }, // Cache for 1 hour
});

// User Schema and Model
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
});

const WeatherLog = mongoose.model("WeatherLog", WeatherLogSchema);
const ExchangeRate = mongoose.model("ExchangeRate", ExchangeRateSchema);
const User = mongoose.model("User", UserSchema);


// Currency mapping based on country codes
const countryToCurrency = {
  US: "USD",
  KZ: "KZT",
  GB: "GBP",
  EU: "EUR",
  IN: "INR",
  JP: "JPY",
  CN: "CNY",
  RU: "RUB",
};

// Weather API endpoint
app.get("/api/weather", async (req, res) => {
  const { city } = req.query;
  if (!city) {
    return res.status(400).json({ error: "City name is required" });
  }
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );

    // Save weather data to MongoDB
    const weatherLog = new WeatherLog({
      city,
      temperature: response.data.main.temp,
    });
    await weatherLog.save();

    res.json(response.data);
  } catch (error) {
    console.error("Weather API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

// Air Quality API endpoint
app.get("/api/air-quality", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res
      .status(400)
      .json({ error: "Latitude and longitude are required" });
  }
  try {
    const response = await axios.get(
      `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Air Quality API Error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch air quality data" });
  }
});

// Exchange Rate API endpoint
app.get("/api/exchange-rate", async (req, res) => {
  const { country } = req.query;

  if (!country) {
    return res.status(400).json({ error: "Country code is required" });
  }

  const baseCurrency = countryToCurrency[country];
  if (!baseCurrency) {
    return res.status(400).json({
      error: `No currency mapping found for country code: ${country}`,
    });
  }

  try {
    let exchangeData = await ExchangeRate.findOne({ baseCurrency });
    if (!exchangeData) {
      const response = await axios.get(
        `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/${baseCurrency}`
      );

      exchangeData = new ExchangeRate({
        baseCurrency,
        rates: response.data.conversion_rates,
      });
      await exchangeData.save();
    }

    res.json({ rates: exchangeData.rates, baseCurrency });
  } catch (error) {
    console.error("Exchange Rate API Error:", error.message);
    res.status(500).json({ error: "Failed to fetch exchange rate data" });
  }
});
// Create (POST) - Add New Weather Log & User
// Add a new weather log manually
app.post("/api/weather", async (req, res) => {
  const { city, temperature } = req.body;
  if (!city || !temperature) {
    return res.status(400).json({ error: "City and temperature are required" });
  }
  try {
    const weatherLog = new WeatherLog({ city, temperature });
    await weatherLog.save();
    res.status(201).json({ message: "Weather log added successfully", weatherLog });
  } catch (error) {
    res.status(500).json({ error: "Failed to save weather log" });
  }
});

// Register a new user
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  try {
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, passwordHash: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// User Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log("Login failed: User not found");
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Compare input password with hashed password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      console.log("Login failed: Password does not match");
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("Login successful:", username);
    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});



//  Read (GET) - Fetch Weather Logs & Users

// Get all weather logs
app.get("/api/weather", async (req, res) => {
  try {
    const weatherLogs = await WeatherLog.find();
    res.json(weatherLogs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch weather logs" });
  }
});

// Get a specific weather log by city
app.get("/api/weather/:city", async (req, res) => {
  try {
    const weatherLogs = await WeatherLog.find({ city: req.params.city });
    if (!weatherLogs.length) {
      return res.status(404).json({ error: "No weather logs found for this city" });
    }
    res.json(weatherLogs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch weather log" });
  }
});

// Update (PUT) - Modify Weather Logs
// Update a weather log by ID
app.put("/api/weather/:id", async (req, res) => {
  const { temperature } = req.body;
  if (!temperature) {
    return res.status(400).json({ error: "Temperature is required for update" });
  }
  try {
    const updatedWeatherLog = await WeatherLog.findByIdAndUpdate(
      req.params.id,
      { temperature },
      { new: true }
    );
    if (!updatedWeatherLog) {
      return res.status(404).json({ error: "Weather log not found" });
    }
    res.json({ message: "Weather log updated", updatedWeatherLog });
  } catch (error) {
    res.status(500).json({ error: "Failed to update weather log" });
  }
});

//Delete (DELETE) - Remove Weather Logs
// Delete a weather log by ID
app.delete("/api/weather/:id", async (req, res) => {
  try {
    const deletedWeatherLog = await WeatherLog.findByIdAndDelete(req.params.id);
    if (!deletedWeatherLog) {
      return res.status(404).json({ error: "Weather log not found" });
    }
    res.json({ message: "Weather log deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete weather log" });
  }
});

// User Login & Token Generation
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(403).json({ error: "Access denied, no token provided" });
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Protected Weather API
app.get("/api/weather", authenticateToken, async (req, res) => {
  try {
    const weatherLogs = await WeatherLog.find();
    res.json(weatherLogs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch weather logs" });
  }
});

// Protected Exchange Rate API
app.get("/api/exchange-rate", authenticateToken, async (req, res) => {
  const { country } = req.query;
  if (!country) {
    return res.status(400).json({ error: "Country code is required" });
  }

  const baseCurrency = countryToCurrency[country];
  if (!baseCurrency) {
    return res.status(400).json({
      error: `No currency mapping found for country code: ${country}`,
    });
  }

  try {
    let exchangeData = await ExchangeRate.findOne({ baseCurrency });
    if (!exchangeData) {
      const response = await axios.get(
        `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/${baseCurrency}`
      );

      exchangeData = new ExchangeRate({
        baseCurrency,
        rates: response.data.conversion_rates,
      });
      await exchangeData.save();
    }

    res.json({ rates: exchangeData.rates, baseCurrency });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch exchange rate data" });
  }
});




// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Start server
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
