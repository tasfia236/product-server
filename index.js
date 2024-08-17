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
        // Connect the client to the server	(optional starting in v4.7)
        client.connect()
        const clothCollection = client.db("clothesDB").collection("clothes");

        app.get('/clothes', async (req, res) => {
            try {
                // Get page and limit from query parameters (default: page 1, limit 10)
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const skip = (page - 1) * limit;

                // Get the total count of products
                const totalItems = await clothCollection.countDocuments();

                // Fetch paginated products
                const clothes = await clothCollection.find()
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
            res.send('running');
        })


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log(`brand server is running on port ${port}`);
})