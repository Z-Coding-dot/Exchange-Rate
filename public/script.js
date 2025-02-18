let map;
let marker;

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

async function fetchAndDisplayWeather(city) {
  if (!city) return alert("Please enter a city name");

  const token = localStorage.getItem("token");
  if (!token) {
    alert("You must be logged in to view this data.");
    window.location.href = "login.html"; // Redirect to login
    return;
  }

  try {
    const weatherResponse = await fetch(`/api/weather?city=${city}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!weatherResponse.ok) throw new Error("Weather API error");
    const weatherData = await weatherResponse.json();

    const airQualityResponse = await fetch(
      `/api/air-quality?lat=${weatherData.coord.lat}&lon=${weatherData.coord.lon}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!airQualityResponse.ok) throw new Error("Air Quality API error");
    const airQualityData = await airQualityResponse.json();

    const aqi = airQualityData.list[0]?.main?.aqi || "N/A";

    const exchangeRateResponse = await fetch(
      `/api/exchange-rate?country=${weatherData.sys.country}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const exchangeRateData = await exchangeRateResponse.json();

    const rates = exchangeRateData.rates || {};
    const baseCurrency = exchangeRateData.baseCurrency || "N/A";

    let exchangeRateHTML = "";
    for (const [currency, rate] of Object.entries(rates)) {
      exchangeRateHTML += `<tr><td>${currency}</td><td>${rate.toFixed(2)}</td></tr>`;
    }
    document.querySelector(".weather-data").innerHTML = `
    <div class="card mb-3">
      <div class="card-body">
        <h2 class="card-title">Weather in ${weatherData.name} (${weatherData.sys.country})</h2>
        <p class="card-text">Temperature: ${weatherData.main.temp}°C</p>
        <p class="card-text">Humidity: ${weatherData.main.humidity}%</p>
        <p class="card-text">Wind Speed: ${weatherData.wind.speed} m/s</p>
        <p class="card-text">Weather Condition: ${weatherData.weather[0].description}</p>
        <p class="card-text">Air Quality Index (AQI): ${aqi}</p>
      </div>
    </div>
  `;

    document.querySelector(".exchange-rate-data").innerHTML = `
      <div class="card">
        <div class="card-body">
          <h2 class="card-title">Exchange Rates (Base: ${baseCurrency})</h2>
          <table class="table table-striped table-bordered table-hover bg-dark text-light">
            <thead class="table-dark text-light">
              <tr>
                <th class="fs-4" style="color:#35e1f0;" >Currency</th>
                <th class="fs-4" style="color:#35e1f0;">Rate</th>
              </tr>
            </thead>
            <tbody class="table-dark text-light">
              ${exchangeRateHTML}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (!map) {
      map = L.map("map").setView(
        [weatherData.coord.lat, weatherData.coord.lon],
        10
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
    } else {
      map.setView([weatherData.coord.lat, weatherData.coord.lon], 10);
    }

    if (marker) {
      marker.setLatLng([weatherData.coord.lat, weatherData.coord.lon]);
    } else {
      marker = L.marker([weatherData.coord.lat, weatherData.coord.lon]).addTo(
        map
      );
    }
  } catch (error) {
    alert("Error fetching data. Please try again.");
  }
}

// Logout Function
function logout() {
  localStorage.removeItem("token");
  alert("Logged out successfully.");
  window.location.href = "login.html"; // Redirect to login
}

// Event Listeners
document.getElementById("searchBtn").addEventListener("click", () => {
  const city = document.getElementById("cityInput").value.trim();
  fetchAndDisplayWeather(city);
});

document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("token")) {
    window.location.href = "login.html"; // Redirect if not logged in
  } else {
    fetchAndDisplayWeather("Astana");
  }
});
