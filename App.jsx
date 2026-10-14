
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const CITIES = [
  { id: "hanoi", name: "Hà Nội", lat: 21.0285, lon: 105.8542 },
  { id: "haiphong", name: "Hải Phòng", lat: 20.8449, lon: 106.6881 },
  { id: "hue", name: "Huế", lat: 16.4637, lon: 107.5909 },
  { id: "danang", name: "Đà Nẵng", lat: 16.0544, lon: 108.2022 },
  { id: "nhatrang", name: "Nha Trang", lat: 12.2388, lon: 109.1967 },
  { id: "dalat", name: "Đà Lạt", lat: 11.9404, lon: 108.4583 },
  { id: "hcm", name: "TP. Hồ Chí Minh", lat: 10.8231, lon: 106.6297 },
  { id: "cantho", name: "Cần Thơ", lat: 10.0452, lon: 105.7469 },
];

function getWeather(code) {
  if (code === 0) return { icon: "☀️", desc: "Trời quang" };
  if (code === 1) return { icon: "🌤️", desc: "Ít mây" };
  if (code === 2) return { icon: "⛅", desc: "Có mây" };
  if (code === 3) return { icon: "☁️", desc: "Nhiều mây" };
  if ([45, 48].includes(code))
    return { icon: "🌫️", desc: "Sương mù" };
  if ([51, 53, 55, 56, 57].includes(code))
    return { icon: "🌦️", desc: "Mưa phùn" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return { icon: "🌧️", desc: "Có mưa" };
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return { icon: "❄️", desc: "Có tuyết" };
  if ([95, 96, 99].includes(code))
    return { icon: "⛈️", desc: "Dông" };

  return { icon: "🌥️", desc: "Thời tiết thay đổi" };
}

function normalizeText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function formatDate(dateString, options = {}) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString(
    "vi-VN",
    { timeZone: "Asia/Ho_Chi_Minh", ...options }
  );
}

function formatTime(timeString) {
  if (!timeString) return "--";
  return new Date(`${timeString}:00+07:00`).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function App() {
  const [selectedCity, setSelectedCity] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState("C");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("weather-favorites")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("weather-favorites", JSON.stringify(favorites));
  }, [favorites]);

  async function fetchWeather(city) {
    setSelectedCity(city);
    setLoading(true);
    setError("");
    setWeather(null);

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${city.lat}&longitude=${city.lon}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=Asia%2FHo_Chi_Minh&forecast_days=7`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Không thể lấy dữ liệu thời tiết.");
      }

      const data = await response.json();

      if (!data.current || !data.daily) {
        throw new Error("Dữ liệu thời tiết không hợp lệ.");
      }

      setWeather(data);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Không thể kết nối. Vui lòng kiểm tra mạng Internet."
          : err.message || "Đã xảy ra lỗi. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleFavorite(cityId) {
    setFavorites((previous) =>
      previous.includes(cityId)
        ? previous.filter((id) => id !== cityId)
        : [...previous, cityId]
    );
  }

  const filteredCities = useMemo(() => {
    const keyword = normalizeText(search.trim());

    return CITIES.filter((city) =>
      normalizeText(city.name).includes(keyword)
    );
  }, [search]);

  function temperature(value) {
    const result = unit === "C" ? value : (value * 9) / 5 + 32;
    return `${Math.round(result)}°${unit}`;
  }

  const currentWeather = weather
    ? getWeather(weather.current.weather_code)
    : null;

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Trang chủ thời tiết">
          <span className="brand-icon">🌦️</span>
          <span>WeatherVN</span>
        </a>

        <div className="unit-switch" aria-label="Đơn vị nhiệt độ">
          <button
            className={unit === "C" ? "active" : ""}
            onClick={() => setUnit("C")}
            aria-pressed={unit === "C"}
          >
            °C
          </button>
          <button
            className={unit === "F" ? "active" : ""}
            onClick={() => setUnit("F")}
            aria-pressed={unit === "F"}
          >
            °F
          </button>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <p className="eyebrow">THỜI TIẾT VIỆT NAM</p>
          <h1>Thời tiết hôm nay</h1>
          <p className="subtitle">
            Cập nhật thời tiết hiện tại và dự báo 7 ngày tại 8 thành phố.
          </p>
        </section>

        <div className="dashboard">
          <aside className="city-panel">
            <div className="panel-heading">
              <div>
                <h2>Thành phố</h2>
                <p>Chọn nơi bạn muốn xem</p>
              </div>
              <span className="city-count">{CITIES.length}</span>
            </div>

            <div className="search-box">
              <span>⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm thành phố..."
                aria-label="Tìm thành phố"
              />
            </div>

            {favorites.length > 0 && (
              <p className="favorites-label">★ ĐÃ YÊU THÍCH</p>
            )}

            <div className="city-list">
              {filteredCities.map((city) => (
                <button
                  key={city.id}
                  className={`city-item ${
                    selectedCity?.id === city.id ? "selected" : ""
                  }`}
                  onClick={() => fetchWeather(city)}
                >
                  <span className="city-pin">📍</span>
                  <span className="city-name">{city.name}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    className={`favorite ${
                      favorites.includes(city.id) ? "favorited" : ""
                    }`}
                    aria-label={
                      favorites.includes(city.id)
                        ? `Bỏ yêu thích ${city.name}`
                        : `Yêu thích ${city.name}`
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(city.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(city.id);
                      }
                    }}
                  >
                    {favorites.includes(city.id) ? "★" : "☆"}
                  </span>
                  {selectedCity?.id === city.id && (
                    <span className="selected-dot" />
                  )}
                </button>
              ))}

              {filteredCities.length === 0 && (
                <p className="empty-search">Không tìm thấy thành phố.</p>
              )}
            </div>

            <p className="sidebar-note">
              <span>ℹ️</span> Dữ liệu được cung cấp miễn phí bởi Open-Meteo.
            </p>
          </aside>

          <section className="weather-panel">
            {!selectedCity && (
              <div className="state-card">
                <div className="state-icon">🌍</div>
                <h2>Chào mừng bạn!</h2>
                <p>
                  Hãy chọn một thành phố bên trái để xem thông tin thời tiết.
                </p>
              </div>
            )}

            {loading && (
              <div className="state-card">
                <div className="spinner" />
                <h2>Đang tải dữ liệu...</h2>
                <p>Đang cập nhật thời tiết tại {selectedCity?.name}.</p>
              </div>
            )}

            {error && !loading && (
              <div className="state-card">
                <div className="state-icon">⚠️</div>
                <h2>Không tải được dữ liệu</h2>
                <p>{error}</p>
                <button
                  className="retry-button"
                  onClick={() => selectedCity && fetchWeather(selectedCity)}
                >
                  ↻ Thử lại
                </button>
              </div>
            )}

            {selectedCity && weather && !loading && !error && (
              <>
                <div className="current-card">
                  <div className="current-top">
                    <div>
                      <span className="live-label">
                        <span className="live-dot" /> THỜI TIẾT HIỆN TẠI
                      </span>
                      <h2>{selectedCity.name}</h2>
                      <p className="updated">
                        Cập nhật: {formatTime(weather.current.time)}
                      </p>
                    </div>
                    <div className="current-icon">{currentWeather.icon}</div>
                  </div>

                  <div className="current-main">
                    <div className="temperature">
                      {temperature(weather.current.temperature_2m)}
                    </div>
                    <p className="weather-description">
                      {currentWeather.desc}
                    </p>
                  </div>

                  <div className="current-stats">
                    <div className="stat">
                      <span className="stat-icon">💧</span>
                      <div>
                        <p>Độ ẩm</p>
                        <strong>
                          {weather.current.relative_humidity_2m}%
                        </strong>
                      </div>
                    </div>
                    <div className="stat">
                      <span className="stat-icon">💨</span>
                      <div>
                        <p>Tốc độ gió</p>
                        <strong>
                          {weather.current.wind_speed_10m} km/h
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="forecast-section">
                  <div className="section-heading">
                    <div>
                      <h2>Dự báo 7 ngày</h2>
                      <p>Diễn biến thời tiết trong tuần</p>
                    </div>
                    <span className="forecast-badge">7 NGÀY</span>
                  </div>

                  <div className="forecast-list">
                    {weather.daily.time.map((date, index) => {
                      const dayWeather = getWeather(
                        weather.daily.weather_code[index]
                      );

                      return (
                        <div className="forecast-row" key={date}>
                          <div className="forecast-date">
                            <strong>
                              {index === 0
                                ? "Hôm nay"
                                : formatDate(date, { weekday: "short" })}
                            </strong>
                            <span>{formatDate(date, {
                              day: "2-digit",
                              month: "2-digit",
                            })}</span>
                          </div>

                          <span className="forecast-icon">
                            {dayWeather.icon}
                          </span>

                          <span className="forecast-desc">
                            {dayWeather.desc}
                          </span>

                          <div className="forecast-temperatures">
                            <strong>
                              {temperature(
                                weather.daily.temperature_2m_max[index]
                              )}
                            </strong>
                            <span>
                              {temperature(
                                weather.daily.temperature_2m_min[index]
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="data-source">
                    Nhiệt độ cao nhất / thấp nhất · Nguồn: Open-Meteo
                  </p>
                </div>
              </>
            )}
          </section>
        </div>

        <footer className="footer">
          <span>🌦️ WeatherVN</span>
          <span>Dữ liệu thời tiết từ Open-Meteo API</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
