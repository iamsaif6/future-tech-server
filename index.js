'use strict';
const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 3300;

//Middleware
app.use(express.json());
app.use(cors());

//MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mal3t53.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const productCollections = client.db('future-tech').collection('productCollections');

    app.get('/products', async (req, res) => {
      const page = parseInt(req.query.page) - 1;
      const items = parseInt(req.query.items);
      const filter = req.query.filter;
      const order = req.query.order;
      const from = parseInt(req.query.from);
      const to = parseInt(req.query.to);
      const brandArray = req.query.brand;
      const brands = brandArray.split(',');

      if (filter.trim() == false) {
        console.log('filter empty');
      } else {
        console.log('filter not empty');
      }
      const query = {
        discountPrice: { $gte: from, $lte: to },
        // $and: [
        //   {
        //     productName: { $regex: new RegExp(filter, 'i') },
        //   },
        //   {

        //   },
        // ],

        // $and: [
        //   {
        //     brandName: { $in: brands },
        //   },
        //   {
        //     discountPrice: { $gte: from, $lte: to },
        //   },
        // ],
      };
      let option;
      if (order.trim() == 'low') {
        option = {
          sort: {
            discountPrice: 1,
          },
        };
      } else if (order.trim() == 'high') {
        option = {
          sort: {
            discountPrice: -1,
          },
        };
      } else if (order.trim() == 'date') {
        option = {
          sort: {
            productCreationDateTime: -1,
          },
        };
      } else {
        option = {
          sort: {
            _id: 1,
          },
        };
      }

      const result = await productCollections
        .find(query, option)
        .skip(page * items)
        .limit(items)
        .toArray();

      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send(`Server is running`);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
