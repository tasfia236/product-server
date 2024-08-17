const express = require("express");
const cors = require("cors");
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();

const port = process.env.PORT || 8000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wxwisw2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        client.connect();
        const clothCollection = client.db("clothesDB").collection("clothes");

        app.get('/clothes', async (req, res) => {
            try {
                // Pagination
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const skip = (page - 1) * limit;

                // Filters
                const searchTerm = req.query.searchTerm || '';
                const categoryFilter = req.query.category || '';
                const brandFilter = req.query.brand || '';
                const priceFilter = req.query.price || '';
                const sortOption = req.query.sort || '';

                // Build the query object
                let query = {};

                if (searchTerm) {
                    query.productName = { $regex: searchTerm, $options: 'i' };
                }

                if (categoryFilter) {
                    query.category = categoryFilter;
                }

                if (brandFilter) {
                    query.brandName = brandFilter;
                }

                if (priceFilter === 'under50') {
                    query.price = { $lt: 50 };
                } else if (priceFilter === '50To100') {
                    query.price = { $gte: 50, $lte: 100 };
                } else if (priceFilter === 'over100') {
                    query.price = { $gt: 100 };
                }

                // Sorting
                let sort = {};
                if (sortOption === 'priceLowToHigh') {
                    sort.price = 1; // Ascending
                } else if (sortOption === 'priceHighToLow') {
                    sort.price = -1; // Descending
                } else if (sortOption === 'newestFirst') {
                    sort.createdAt = -1; // Newest first
                }

                // Get total count before applying skip and limit
                const totalItems = await clothCollection.countDocuments(query);

                // Fetch filtered, sorted, and paginated data
                const clothes = await clothCollection.find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .toArray();

                // Calculate total number of pages
                const totalPages = Math.ceil(totalItems / limit);

                // Send response with paginated data and metadata
                res.json({
                    totalItems,
                    totalPages,
                    currentPage: page,
                    itemsPerPage: limit,
                    clothes,
                });
            } catch (error) {
                console.error('Error fetching clothes:', error);
                res.status(500).json({ message: 'Internal Server Error' });
            }
        });

        app.get('/', (req, res) => {
            res.send('Server is running');
        });

    } finally {
        // Leave client open for future requests
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Clothes server is running on port ${port}`);
});
