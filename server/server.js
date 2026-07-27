require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "../client")));

/*
|--------------------------------------------------------------------------
| Sample Restaurant Data
|--------------------------------------------------------------------------
*/

let restaurants = [
    {
        id: 1,
        name: "Pizza Palace",
        latitude: 12.9716,
        longitude: 80.2200,
        availableSeats: 15,
        rating: 4.5,
        image: "https://picsum.photos/400/250?random=1"
    },
    {
        id: 2,
        name: "Burger Hub",
        latitude: 12.9735,
        longitude: 80.2250,
        availableSeats: 8,
        rating: 4.2,
        image: "https://picsum.photos/400/250?random=2"
    },
    {
        id: 3,
        name: "Indian Spice",
        latitude: 12.9698,
        longitude: 80.2280,
        availableSeats: 0,
        rating: 4.8,
        image: "https://picsum.photos/400/250?random=3"
    }
];

/*
|--------------------------------------------------------------------------
| Calculate Distance (Haversine Formula)
|--------------------------------------------------------------------------
*/

function getDistance(lat1, lon1, lat2, lon2) {

    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/*
|--------------------------------------------------------------------------
| Get Nearby Restaurants
|--------------------------------------------------------------------------
*/

app.get("/restaurants", (req, res) => {

    const userLat = Number(req.query.lat);
    const userLon = Number(req.query.lon);

    const nearbyRestaurants = restaurants
        .map((restaurant) => {

            const distance = getDistance(
                userLat,
                userLon,
                restaurant.latitude,
                restaurant.longitude
            );

            return {
                ...restaurant,
                distance: distance.toFixed(2)
            };

        })
        .sort((a, b) => Number(a.distance) - Number(b.distance));

    res.json(nearbyRestaurants);

});

/*
|--------------------------------------------------------------------------
| Book a Seat
|--------------------------------------------------------------------------
*/

app.post("/book", (req, res) => {

    const {
        restaurantId,
        customerName,
        phone,
        people,
        date,
        time
    } = req.body;

    const restaurant = restaurants.find(
        r => r.id === restaurantId
    );

    if (!restaurant) {

        return res.status(404).json({
            message: "Restaurant not found."
        });

    }

    if (restaurant.availableSeats < people) {

        return res.status(400).json({
            message: "Not enough seats available."
        });

    }

    restaurant.availableSeats -= people;

    console.log({
        customerName,
        phone,
        restaurant: restaurant.name,
        people,
        date,
        time
    });

    res.json({
        success: true,
        message: "Booking Successful!"
    });

});

/*
|--------------------------------------------------------------------------
| Default Route
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "../client/index.html")
    );

});

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});
