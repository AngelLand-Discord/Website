const locationBtn = document.getElementById("locationBtn");
const restaurantList = document.getElementById("restaurantList");
const loading = document.getElementById("loading");

const bookingModal = document.getElementById("bookingModal");
const bookingForm = document.getElementById("bookingForm");
const closeModal = document.getElementById("closeModal");

let selectedRestaurantId = null;

/* -------------------------------
   Get User Location
-------------------------------- */

locationBtn.addEventListener("click", () => {

    if (!navigator.geolocation) {
        alert("Geolocation is not supported.");
        return;
    }

    loading.classList.remove("hidden");
    restaurantList.innerHTML = "";

    navigator.geolocation.getCurrentPosition(

        async (position) => {

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {

                const response = await fetch(
                    `/restaurants?lat=${lat}&lon=${lon}`
                );

                const restaurants = await response.json();

                loading.classList.add("hidden");

                displayRestaurants(restaurants);

            } catch (error) {

                loading.classList.add("hidden");

                alert("Unable to fetch restaurants.");

                console.error(error);

            }

        },

        () => {

            loading.classList.add("hidden");

            alert("Location permission denied.");

        }

    );

});


/* -------------------------------
   Display Restaurant Cards
-------------------------------- */

function displayRestaurants(restaurants) {

    restaurantList.innerHTML = "";

    if (restaurants.length === 0) {

        restaurantList.innerHTML =
            "<h2>No restaurants found nearby.</h2>";

        return;
    }

    restaurants.forEach((restaurant) => {

        const seatsClass =
            restaurant.availableSeats > 0
                ? "available"
                : "full";

        const buttonDisabled =
            restaurant.availableSeats === 0
                ? "disabled"
                : "";

        const buttonText =
            restaurant.availableSeats > 0
                ? "Book Now"
                : "Fully Booked";

        restaurantList.innerHTML += `

        <div class="card">

            <img src="${restaurant.image}" alt="${restaurant.name}">

            <div class="card-body">

                <h2>${restaurant.name}</h2>

                <p class="distance">
                    📍 ${restaurant.distance} km away
                </p>

                <p>
                    ⭐ ${restaurant.rating}/5
                </p>

                <p class="${seatsClass}">
                    💺 Seats Left:
                    ${restaurant.availableSeats}
                </p>

                <button
                    class="bookBtn"
                    ${buttonDisabled}
                    onclick="openBooking(${restaurant.id})">

                    ${buttonText}

                </button>

            </div>

        </div>

        `;

    });

}


/* -------------------------------
   Booking Modal
-------------------------------- */

window.openBooking = function (id) {

    selectedRestaurantId = id;

    bookingModal.classList.remove("hidden");

}


closeModal.addEventListener("click", () => {

    bookingModal.classList.add("hidden");

});


window.onclick = function (event) {

    if (event.target === bookingModal) {

        bookingModal.classList.add("hidden");

    }

};


/* -------------------------------
   Submit Booking
-------------------------------- */

bookingForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const bookingData = {

        restaurantId: selectedRestaurantId,

        customerName:
            document.getElementById("customerName").value,

        phone:
            document.getElementById("phone").value,

        people:
            Number(document.getElementById("people").value),

        date:
            document.getElementById("date").value,

        time:
            document.getElementById("time").value

    };

    try {

        const response = await fetch("/book", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(bookingData)

        });

        const result = await response.json();

        alert(result.message);

        bookingModal.classList.add("hidden");

        bookingForm.reset();

        locationBtn.click();

    }

    catch (error) {

        console.error(error);

        alert("Booking failed.");

    }

});
