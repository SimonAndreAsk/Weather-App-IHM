/* SAMMANFATTNING av applikationen:

Funktioner: Funktionerna ansvarar för specifika uppgifter, t.ex. att hämta data, uppdatera DOM eller hantera localStorage.
Arrays: Används för att att sortera städer baserat på hur många gånger de har sökts och begränsa listan till de tre mest populära städerna.
Loops: Används för att gå igenom listan av städer (arrayer) och skapa listobjekt som läggs till i favoritlistan.
if-else: Används för att visa ett varningsmeddelande om användaren försöker lägga till en stad utan att fylla i fältet eller om man fyller i en stad som inte finns.
Felhantering: Fel hanteras med try-catch-block, och användaren får feedback via felmeddelanden.
DOM-manipulation: DOM-element uppdateras dynamiskt baserat på användarens interaktioner.
localStorage: Används för att spara och hämta data som sökantal, senaste väder och fantasistäder.
Event Listeners: Används för att hantera användarens interaktioner, t.ex. formulärinlämning och klickhändelser.

*/

// API-nyckel och URL för att hämta väderdata
const API_KEY = 'fe227ebfcdb18d17f4c4d67bde3e94d4';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Skapar en karta för att lagra sökantal från localStorage
const searchCounts = new Map(getFromLocalStorage('searchCounts') || []);
const MAX_FAVORITES = 3; // Max antal favoriter som kan visas

// Funktion för att spara data i localStorage
function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data)); // Konverterar data till JSON-sträng och sparar
}

// Funktion för att hämta data från localStorage
function getFromLocalStorage(key) {
    const data = localStorage.getItem(key); // Hämtar data från localStorage
    return data ? JSON.parse(data) : null; // Om data finns, konvertera från JSON till objekt
}

// Funktion för att spara senaste väderdata i localStorage
function saveLastWeather(weatherData) {
    saveToLocalStorage('lastWeather', weatherData);
}

// Funktion för att visa väder- och favoritsektionerna
function showWeatherSections() {
    const weatherSection = document.querySelector('.weather'); // Hämtar vädersektionen från DOM
    const favouritesSection = document.querySelector('.favourites'); // Hämtar favoritsektionen från DOM
    
    if (weatherSection && favouritesSection) { // Kontrollera att båda sektionerna finns
        weatherSection.classList.add('visible'); // Gör vädersektionen synlig
        favouritesSection.classList.add('visible'); // Gör favoritsektionen synlig
        
        // Tvingar en omritning av DOM (reflow)
        weatherSection.offsetHeight;
        favouritesSection.offsetHeight;
    }
}

// En objektkarta för att mappa vädertyper till emojis
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

// DOM-element för att hantera väder och sökningar
const searchForm = document.querySelector('.search__form'); // Formulär för vädersökning
const searchInput = document.querySelector('.search__input'); // Inputfält för stadssökning
const weatherIcon = document.querySelector('.weather__icon span'); // Ikon för väder
const weatherCondition = document.querySelector('.weather__condition h2'); // Väderbeskrivning
const weatherCity = document.querySelector('.weather__city h3'); // Stadens namn
const favouritesList = document.querySelector('.favourites__list'); // Lista över favoriter

// Funktion för att hämta väderdata från API eller fantasistäder
async function getWeatherData(city) {
    const fantasyCities = loadFantasyCities(); // Laddar fantasistäder från localStorage
    const lowercaseCity = city.toLowerCase(); // Konverterar stadens namn till gemener
    
    // Kontrollera om staden finns i fantasistäder
    if (fantasyCities[lowercaseCity]) {
        return {
            weather: [{
                main: fantasyCities[lowercaseCity].weather // Hämtar väder från fantasistäder
            }],
            name: fantasyCities[lowercaseCity].name // Hämtar stadens namn
        };
    }
    
    // Om staden inte är en fantasistad, hämta data från API
    try {
        const response = await fetch(`${API_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);
        if (!response.ok) {
            throw new Error('City not found'); // Felhantering om staden inte hittas
        }
        return await response.json(); // Returnerar väderdata som JSON
    } catch (error) {
        throw error;
    }
}

// Funktion för att uppdatera väderinformationen i DOM
function updateWeatherDisplay(weatherData) {
    const mainWeather = weatherData.weather[0].main; // Hämtar huvudväder från data
    const city = weatherData.name; // Hämtar stadens namn

    weatherIcon.textContent = weatherEmojis[mainWeather] || '❓'; // Uppdaterar väderikonen
    weatherCondition.textContent = mainWeather; // Uppdaterar väderbeskrivningen
    weatherCity.textContent = city; // Uppdaterar stadens namn

    saveLastWeather(weatherData); // Sparar senaste väderdata i localStorage
}

// Funktion för att ladda senaste väderdata från localStorage
async function loadLastWeather() {
    const lastWeather = getFromLocalStorage('lastWeather'); // Hämtar senaste väderdata
    if (lastWeather) {
        showWeatherSections(); // Visar vädersektionerna
        updateWeatherDisplay(lastWeather); // Uppdaterar väderinformationen
    }
}

// Eventlistener för att ladda data vid sidladdning
window.addEventListener('load', () => {
    loadLastWeather(); // Laddar senaste väderdata
    
    const savedSearchCounts = getFromLocalStorage('searchCounts'); // Hämtar sökantal från localStorage
    if (savedSearchCounts) {
        searchCounts.clear(); // Rensar den nuvarande kartan
        savedSearchCounts.forEach(([city, count]) => {
            searchCounts.set(city, count); // Återställer sökantal
        });
        
        if (searchCounts.size > 0) {
            addToFavorites(Array.from(searchCounts.keys())[0]); // Lägger till första staden i favoriter
        }
    }
});

// Funktion för att lägga till en stad i favoriter
function addToFavorites(city) {
    searchCounts.set(city, (searchCounts.get(city) || 0) + 1); // Ökar sökantalet för staden
    saveToLocalStorage('searchCounts', Array.from(searchCounts.entries())); // Sparar uppdaterad karta i localStorage
    
    const sortedCities = Array.from(searchCounts.entries()) // Konverterar kartan till en array
        .sort((a, b) => b[1] - a[1]) // Sorterar städer efter sökantal (fallande)
        .slice(0, MAX_FAVORITES); // Begränsar till max antal favoriter
    
    favouritesList.innerHTML = ''; // Rensar nuvarande favoritlista
    
    sortedCities.forEach(([cityName, count]) => { // Loopar igenom de sorterade städerna
        const li = document.createElement('li'); // Skapar ett nytt listobjekt
        li.className = 'favourites__item'; // Lägger till en klass
        li.textContent = cityName; // Sätter stadens namn som text
        
        li.addEventListener('click', () => { // Lägger till en klickhändelse
            searchInput.value = cityName; // Fyller i stadens namn i sökfältet
            handleWeatherSearch(cityName); // Söker efter väder för staden
        });
        
        favouritesList.appendChild(li); // Lägger till listobjektet i DOM
    });
}

// Funktion för att visa ett felmeddelande
function showError(message) {
    weatherIcon.textContent = '❌'; // Visar en felikon
    weatherCondition.innerHTML = ''; // Rensar väderbeskrivningen
    
    const errorParagraph = document.createElement('p'); // Skapar ett nytt paragrafobjekt
    errorParagraph.className = 'weather__error'; // Lägger till en klass
    errorParagraph.textContent = message; // Sätter felmeddelandet som text
    weatherCondition.appendChild(errorParagraph); // Lägger till paragrafen i DOM
    
    weatherCity.textContent = ''; // Rensar stadens namn
}

// Funktion för att hantera vädersökning
async function handleWeatherSearch(city) {
    try {
        const weatherData = await getWeatherData(city); // Hämtar väderdata
        showWeatherSections(); // Visar vädersektionerna
        updateWeatherDisplay(weatherData); // Uppdaterar väderinformationen
        addToFavorites(city); // Lägger till staden i favoriter
    } catch (error) {
        showError('City not found, please add the city'); // Visar felmeddelande vid fel
    }
}

// Eventlistener för att hantera formulärinlämning
searchForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Förhindrar standardbeteendet
    const city = searchInput.value.trim(); // Hämtar och trimmar stadens namn
    if (city) {
        handleWeatherSearch(city); // Söker efter väder för staden
        searchInput.value = ''; // Rensar sökfältet
    }
});

// Nyckel för att lagra fantasistäder i localStorage
const FANTASY_CITIES_KEY = 'fantasyCities';

// Funktion för att ladda fantasistäder från localStorage
function loadFantasyCities() {
    return JSON.parse(localStorage.getItem(FANTASY_CITIES_KEY) || '{}'); // Returnerar ett objekt med fantasistäder
}

// Funktion för att spara fantasistäder i localStorage
function saveFantasyCities(cities) {
    localStorage.setItem(FANTASY_CITIES_KEY, JSON.stringify(cities)); // Sparar fantasistäder som JSON
}

// DOM-element för modalen och formuläret
const modal = document.getElementById('addCityModal'); // Modal för att lägga till stad
const closeButton = document.querySelector('.close-button'); // Stäng-knapp för modalen
const fantasyCityForm = document.getElementById('fantasyCityForm'); // Formulär för att lägga till fantasistad
const addCityButton = document.querySelector('.search__add-button'); // Knapp för att öppna modalen

// Eventlistener för att öppna modalen
addCityButton.addEventListener('click', () => {
    modal.style.display = 'block'; // Visar modalen
});

// Eventlistener för att stänga modalen
closeButton.addEventListener('click', () => {
    modal.style.display = 'none'; // Dölj modalen
});

// Eventlistener för att stänga modalen vid klick utanför
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none'; // Dölj modalen
    }
});

// Eventlistener för att hantera inlämning av fantasistadsformuläret
fantasyCityForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Förhindrar standardbeteendet
    
    const cityName = document.getElementById('fantasyCityName').value.trim(); // Hämtar stadens namn
    const weather = document.querySelector('.select-selected').getAttribute('data-value'); // Hämtar valt väder
    
    if (!cityName || !weather) { // Kontrollera att alla fält är ifyllda
        alert('Please fill in all fields'); // Visar ett varningsmeddelande
        return;
    }
    
    const fantasyCities = loadFantasyCities(); // Laddar befintliga fantasistäder
    
    fantasyCities[cityName.toLowerCase()] = { // Lägger till den nya staden
        name: cityName,
        weather: weather
    };
    
    saveFantasyCities(fantasyCities); // Sparar uppdaterade fantasistäder
    showWeatherSections(); // Visar vädersektionerna
    handleWeatherSearch(cityName); // Uppdaterar väderinformationen för den nya staden
    
    fantasyCityForm.reset(); // Återställer formuläret
    document.querySelector('.select-selected').textContent = 'Select Weather'; // Återställer dropdown
    modal.style.display = 'none'; // Dölj modalen
    
    alert(`${cityName} has been added to your fantasy cities!`); // Visar ett framgångsmeddelande
});