const API_KEY = 'fe227ebfcdb18d17f4c4d67bde3e94d4';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const searchCounts = new Map(getFromLocalStorage('searchCounts') || []);
const MAX_FAVORITES = 3;

function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getFromLocalStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function saveLastWeather(weatherData) {
    saveToLocalStorage('lastWeather', weatherData);
}

// Weather emoji mappings
const weatherEmojis = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '🌨️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Haze': '🌫️',
    'Scattered Clouds': '⛅',
    'Broken Clouds': '☁️',
    'Few Clouds': '🌤️',
    'Overcast Clouds': '☁️'
};

// DOM Elements
const searchForm = document.querySelector('.search__form');
const searchInput = document.querySelector('.search__input');
const weatherIcon = document.querySelector('.weather__icon span');
const weatherCondition = document.querySelector('.weather__condition h2');
const weatherCity = document.querySelector('.weather__city h3');
const favouritesList = document.querySelector('.favourites__list');

// Function to fetch weather data
async function getWeatherData(city) {
    try {
        const url = `${API_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
        console.log('Fetching URL:', url); // Debug log

        const response = await fetch(url);
        const data = await response.json();
        
        console.log('API Response:', data); // Debug log

        if (data.cod === '404') {
            throw new Error('City not found');
        }

        return data;
    } catch (error) {
        console.error('Error fetching weather:', error); // Debug log
        throw error;
    }
}

// Function to update weather display
function updateWeatherDisplay(weatherData) {
    const mainWeather = weatherData.weather[0].main;
    const city = weatherData.name;

    // Update weather icon
    weatherIcon.textContent = weatherEmojis[mainWeather] || '❓';
    
    // Update weather condition
    weatherCondition.textContent = mainWeather;
    
    // Update city name
    weatherCity.textContent = city;

    // Save to localStorage
    saveLastWeather(weatherData);
}

async function loadLastWeather() {
    const lastWeather = getFromLocalStorage('lastWeather');
    if (lastWeather) {
        updateWeatherDisplay(lastWeather);
    }
}

window.addEventListener('load', () => {
    // Load last weather
    loadLastWeather();
    
    // Load and display favorites
    const savedSearchCounts = getFromLocalStorage('searchCounts');
    if (savedSearchCounts) {
        searchCounts.clear();
        savedSearchCounts.forEach(([city, count]) => {
            searchCounts.set(city, count);
        });
        
        // Trigger favorites update
        if (searchCounts.size > 0) {
            addToFavorites(Array.from(searchCounts.keys())[0]);
        }
    }
});

// Function to add city to favorites
function addToFavorites(city) {
    // Update search count for the city
    searchCounts.set(city, (searchCounts.get(city) || 0) + 1);
    
    // Save updated searchCounts to localStorage
    saveToLocalStorage('searchCounts', Array.from(searchCounts.entries()));
    
    // Convert Map to array and sort by count (descending)
    const sortedCities = Array.from(searchCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_FAVORITES);
    
    // Clear current favorites list
    favouritesList.innerHTML = '';
    
    // Add top 3 cities to favorites
    sortedCities.forEach(([cityName, count]) => {
        const li = document.createElement('li');
        li.className = 'favourites__item';
        li.textContent = cityName;
        
        li.addEventListener('click', () => {
            searchInput.value = cityName;
            handleWeatherSearch(cityName);
        });
        
        favouritesList.appendChild(li);
    });
}

// Function to show error message
function showError(message) {
    weatherIcon.textContent = '❌';
    // Clear the existing content
    weatherCondition.innerHTML = '';
    
    // Create and append error paragraph
    const errorParagraph = document.createElement('p');
    errorParagraph.className = 'weather__error';
    errorParagraph.textContent = message;
    weatherCondition.appendChild(errorParagraph);
    
    weatherCity.textContent = '';
}

// Function to handle weather search
async function handleWeatherSearch(city) {
    try {
        const weatherData = await getWeatherData(city);
        updateWeatherDisplay(weatherData);
        addToFavorites(city);
    } catch (error) {
        showError('City not found, please add the city');
    }
}

// Event Listeners
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = searchInput.value.trim();
    if (city) {
        handleWeatherSearch(city);
        searchInput.value = '';
    }
});

// Add City button functionality
const addCityButton = document.querySelector('.search__add-button');
addCityButton.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city) {
        handleWeatherSearch(city);
        searchInput.value = '';
    }
});

// Test the API connection on page load
window.addEventListener('load', () => {
    console.log('Testing API connection...');
    getWeatherData('London')
        .then(data => console.log('API Test successful:', data))
        .catch(error => console.error('API Test failed:', error));
});