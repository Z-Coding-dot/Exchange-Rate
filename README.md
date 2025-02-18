# Weather and Air Quality and Exchange Rate App

A web application to provide real-time weather, air quality, and currency exchange rate information. The app is designed with a user-friendly interface and integrates several APIs to deliver dynamic and accurate data.

## Features

- **Weather Information**: Fetches real-time weather data for any city using the OpenWeather API.
- **Air Quality Index (AQI)**: Displays the air quality index based on the selected location.
- **Currency Exchange Rates**: Provides currency exchange rates for different countries.
- **Interactive Map**: Integrates an interactive map using Leaflet.js to visualize city locations.
- **Responsive Design**: Works seamlessly on both desktop and mobile devices.

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Backend**: Node.js, Express.js
- **APIs**:
  - OpenWeather API (for weather and air quality data)
  - Air Quality Index(for air quality based on the selected location)
  - ExchangeRate-API (for currency exchange rates)
- **Mapping**: Leaflet.js
- **Environment Variables**: Managed using `dotenv`

## How It Works

1. **Weather Data**:

   - Users input the city name into the search bar.
   - The app sends a request to the `/api/weather` endpoint to fetch weather details for the specified city.

2. **Air Quality Index**:

   - Based on the city’s geographic coordinates (latitude and longitude), the app queries the `/api/air-quality` endpoint.
   - The air quality index is displayed as part of the weather data.

3. **Currency Exchange Rates**:

   - The app determines the currency based on the country code provided in the weather data.
   - Fetches exchange rate data for the city’s currency from the `/api/exchange-rate` endpoint.

4. **Interactive Map**:

   - Using Leaflet.js, the city’s location is displayed on a dynamic map.
   - The map updates automatically based on the searched city.

5. **MongoDB**:
   - this project is connected to MongoDB as well when user Enter a question or any query
     it is automatically save into MondoDB with the result of the search which include weather Date,
     Air Quality Index, and Currency Exchange Rates.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/weather-app.git
   cd weather-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   - Create a `.env` file in the project root and add your API keys:
     ```plaintext
     WEATHER_API_KEY=your_openweather_api_key
     EXCHANGE_API_KEY=your_exchangerate_api_key
     MONGO_URI=MONGODB LINK
     ```

4. Start the server:

   ```bash
   node server.js
   ```

5. Open the app:
   - Navigate to `http://localhost:3000` in your web browser.

## Project Structure

```plaintext
├── public
│   ├── images        # Weather condition images
│   ├── styles.css    # Custom styles
│   ├── index.html    # Main HTML file
│   └── script.js     # Client-side JavaScript
├── server.js         # Backend server
├── .env              # Environment variables
├── package.json      # Project dependencies
└── README.md         # Project documentation
```

## Future Enhancements

- Add support for more APIs (e.g., historical weather data, travel recommendations).
- Include more currencies and countries.
- Enhance the UI with advanced animations and charts.

## Contributors

- **Ziaulhaq Parsa Karimi**
- **Mohammad Shahid Meyakhail**
