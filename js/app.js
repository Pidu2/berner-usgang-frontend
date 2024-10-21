function getbackendURL(){
    const currentHostname = window.location.hostname;
    let backendUrl;
    if (currentHostname === "localhost" || currentHostname === "127.0.0.1") {
        // If running locally, use the remote backend URL
        backendUrl = `http://${currentHostname}:3000`;
    } else {
        // If in production (same domain), use the current hostname
        backendUrl = `https://${currentHostname}/api`;
    }
    return backendUrl
}
function openImage(src) {
    var modal = document.getElementById("imageModal");
    var modalImg = document.getElementById("modalImage");
    modal.style.display = "block";
    modalImg.src = src;
}

function closeModal() {
    var modal = document.getElementById("imageModal");
    modal.style.display = "none";
}
function prepBody(key, display){
    // Create a section for scraper results
    const scraperSection = document.createElement('div');
    scraperSection.classList.add('scraper-section');

    // create anchor
    const anchor = document.createElement('a');
    anchor.setAttribute("name", key)
    scraperSection.appendChild(anchor)

    // Add a header for each scraper's result set
    const scraperTitle = document.createElement('h1');
    scraperTitle.classList.add('scraper-title');
    scraperTitle.textContent = display;
    scraperSection.appendChild(scraperTitle);

    // Create a container for the results
    const resultGrid = document.createElement('div');
    resultGrid.classList.add('scraper-results-grid');
    scraperSection.appendChild(resultGrid);
    return [scraperSection, resultGrid];
}

// Fetch list of scrapers
async function fetchScrapers() {
    try {
        const currentHostname = getbackendURL();
        const response = await fetch(`${currentHostname}/scraper`);
        if (!response.ok) {
            throw new Error('Failed to fetch scraper list');
        }
        const scraperResults = document.getElementById('scraperResults');

        const headerLeft = document.getElementById('header-left');

        const scrapers = await response.json();
        Object.entries(scrapers).forEach(([key, value]) => {
            if (value.enabled) {
                // Display scrapers in a list
                const headerItemLink = document.createElement('a');
                const headerItem = document.createElement('div');
                headerItem.classList.add('header-item');
                headerItemLink.href = `#${key}`;
                headerItem.textContent = value.displayname;
                headerItemLink.append(headerItem);
                headerLeft.append(headerItemLink);

                var body = prepBody(key, value.displayname);
                scraperResults.appendChild(body[0]);

                // Fetch and display scraper results
                fetchScraperResults(key, body[1]);
            }
        });
    } catch (error) {
        console.error(error);
        alert('Error fetching scrapers. Please check the console.');
    }
}

// Fetch and display results of individual scrapers
async function fetchScraperResults(scraper, resultGrid, limit = 5) {
    try {
        const currentHostname = getbackendURL();
        const url = `${currentHostname}/scraper/${scraper}?limit=${limit}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch results for ${scraper}`);
        }

        const results = await response.json();

        results.forEach(result => {
            // Create result card
            const resultCard = document.createElement('div');
            resultCard.classList.add('result-card');

            if (result.isimage) {
                resultCard.innerHTML = `
                  <img src="${result.title}" alt="Image" class="fit-image" onclick="openImage(this.src)">
                  <div id="imageModal" class="modal">
                      <img class="modal-content" id="modalImage" onclick="closeModal()">
                  </div>
                `
            } else {
                resultCard.innerHTML = `
                    <div class="event-date">${result.date}</div>
                    <div class="event-content">
                    <div class="event-content-title"><h2>${result.title}</h2></div>
                    <div class="event-content-genre"><p>${result.genre}</p></div>
                    <div class="event-content-artist"><p>${result.artists}</p></div>
                    </div>
                `;
            }

            resultGrid.appendChild(resultCard);
        });
    } catch (error) {
        console.error(error);
    }
}

function decreaseLimit(){
    setLimit(-1);
}

function increaseLimit(){
    setLimit(1);
}

function setLimit(limit) {
    const currentNu = document.getElementById('limitNumber');
    let newLimit = parseInt(currentNu.textContent, 10) + limit;
    if (newLimit > 20 || newLimit < 1) {
        return
    }
    currentNu.textContent = newLimit;
    // Clear the existing results
    const scraperResults = document.getElementById('scraperResults');
    scraperResults.innerHTML = '';

    // Re-fetch all scraper results with the new limit
    const scrapers = document.querySelectorAll('#header-left a');
    scrapers.forEach(scraperItem => {
        const scraperKey = scraperItem.getAttribute("href").replace("#", "");
        const scraperDisplay = scraperItem.textContent;
        var body = prepBody(scraperKey, scraperDisplay);
        scraperResults.appendChild(body[0]);
        fetchScraperResults(scraperKey, body[1], newLimit);
    });
}

// Initial fetch of scrapers and results
fetchScrapers();