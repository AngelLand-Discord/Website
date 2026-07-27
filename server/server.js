require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "../client")));

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

app.get("/restaurants", async (req, res) => {

    try {

        const userLat = Number(req.query.lat);
        const userLon = Number(req.query.lon);

        const result = await pool.query(
            "SELECT * FROM restaurants"
        );

        const restaurants = result.rows;

        const nearbyRestaurants = restaurants
            .map((restaurant) => {

                const distance = getDistance(
                    userLat,
                    userLon,
                    restaurant.latitude,
                    restaurant.longitude
                );

                return {
                    id: restaurant.id,
                    name: restaurant.name,
                    latitude: restaurant.latitude,
                    longitude: restaurant.longitude,
                    availableSeats: restaurant.available_seats,
                    rating: restaurant.rating,
                    image: restaurant.image,
                    distance: distance.toFixed(2)
                };

            })
            .sort((a, b) => a.distance - b.distance);

        res.json(nearbyRestaurants);

    }

    catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Database Error"
        });

    }

});

/*
|--------------------------------------------------------------------------
| Book a Seat
|--------------------------------------------------------------------------
*/

app.post("/book", async (req, res) => {

    try {

        const {
            restaurantId,
            customerName,
            phone,
            people,
            date,
            time
        } = req.body;

        const restaurantResult = await pool.query(

            "SELECT * FROM restaurants WHERE id=$1",

            [restaurantId]

        );

        if (restaurantResult.rows.length === 0) {

            return res.status(404).json({
                message: "Restaurant not found."
            });

        }

        const restaurant = restaurantResult.rows[0];

        if (restaurant.available_seats < people) {

            return res.status(400).json({
                message: "Not enough seats available."
            });

        }

        await pool.query(

            `INSERT INTO bookings
            (restaurant_id, customer_name, phone, people, booking_date, booking_time)
            VALUES ($1,$2,$3,$4,$5,$6)`,

            [
                restaurantId,
                customerName,
                phone,
                people,
                date,
                time
            ]

        );

        await pool.query(

            `UPDATE restaurants
            SET available_seats = available_seats - $1
            WHERE id=$2`,

            [
                people,
                restaurantId
            ]

        );

        res.json({

            success: true,

            message: "Booking Successful!"

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            message: "Database Error"

        });

    }

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
