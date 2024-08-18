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
      const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) - 1 : parseInt(req.query.page);
      const items = parseInt(req.query.items);
      const filter = req.query.filter;
      const order = req.query.order?.trim();
      const from = parseInt(req.query.from);
      const to = parseInt(req.query.to);
      const brandArray = req.query.brand;
      const brands = brandArray?.split(',');
      const categoryArray = req.query.category;
      const category = categoryArray?.split(',');

      // If nothing avaible
      if (!page && !items && !filter && !order && !from && !to && !brands) {
        console.log('No request');
        return res.status(400).send({ message: 'Invalid Request' });
      }

      const query = constructQuery(filter, from, to, brands, category);
      const option = constructOption(order);

      const result = await productCollections
        .find(query, option)
        .skip(page * items)
        .limit(items)
        .toArray();

      // Total item count
      const totalItem = await productCollections.find(query, option).toArray();
      const total = totalItem.length;

      res.send({ result, total });
    });

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

// Function for reuturn the query
function constructQuery(filter, from, to, brands, category) {
  const query = {};
  // if filter is available
  if (filter.length > 0) {
    query.productName = { $regex: new RegExp(filter, 'i') };
  }
  //   if price range available
  if (from || to) {
    query.discountPrice = { $gte: from, $lte: to };
  }
  //   if brand name is available
  if (brands != false) {
    query.brandName = { $in: brands };
  }
  //if category available
  if (category != false) {
    query.category = { $in: category };
  }
  return query;
}

// Functions for Product orderlist (low / high / date)
function constructOption(order) {
  const option = {};

  switch (order) {
    case 'low':
      option.sort = { discountPrice: 1 };
      break;
    case 'high':
      option.sort = { discountPrice: -1 };
      break;
    case 'date':
      option.sort = { productCreationDateTime: -1 };
      break;
    default:
      option.sort = { _id: 1 };
  }

  return option;
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send(`Server is running`);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
