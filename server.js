//EXPRESS
const express = require('express');
const multer = require('multer')
// const upload = multer({ dest: 'uploads/' });
const upload = multer();
const app = express();
const cors = require('cors');
require('dotenv').config();
const PORT = process.env.PORT;
app.use(cors());
app.use(express.json())
//ROUTER
const router = express.Router();
app.use('/api/v1/postcards', router)

//ROUTES
// router.post('/crt', upload.single('image'), (req, res, next) => { uploadCard(req.file, req.body.title, req.body.text, req.body.name).then(r => res.send(r)).catch(e => console.error(e)); })
router.post('/crt', upload.array('images', 2), (req, res, next) => { uploadCard(req.files[0], req.files[1], req.body.title, req.body.text, req.body.name).then(r => res.send(r)).catch(e => console.error(e)); });
router.get('/ftch/nfs', (req, res, next) => { fetchInfos().then(r => res.send(r)).catch(console.error); });
router.get('/ftch/mg/:id', (req, res, next) => { fetchImg(req.params.id).then(r => res.send(r)).catch(console.error); });
router.put('/upd/:id', (req, res, next) => { updateCountry(req.params.id, req.query.name, req.query.continent).then(r => res.send(r)).catch(console.error); });
router.delete('/del/:id', (req, res, next) => { deleteCard(req.params.id).then(r => res.send(r)).catch(console.error); });

app.listen(PORT, () => { console.log(`Server is listening on port ${PORT}`); });

//MONGODB
const { MongoClient, ObjectId } = require('mongodb');
const uri = process.env.DB_URI
const client = new MongoClient(uri);
client.connect(() => console.log('Connected to DB'));

const uploadCard = async (img, oImg, title, text, name) => {
    const result = await client.db("postcards").collection("cards").insertOne({ image: img, oImage: oImg, title: title, text: text, name: name });
    return result.insertedId;
}

const fetchInfos = async () => {
    const cursor = await client.db("postcards").collection("cards").find({}, { projection: { title: 1, text: 1, date: 1, name: 1 } }).sort({ _id: -1 }).toArray();
    const infos = cursor.map(x => { return { name: x.name || 'anonymous', _id: x._id, date: x.date || ObjectId(x._id).getTimestamp().toDateString(), time: ObjectId(x._id).getTimestamp().getTime(), title: x.title, text: x.text } });
    return infos;
}

const fetchImg = async (id) => {
    const image = await client.db("postcards").collection("cards").findOne({ _id: ObjectId(id) }, { projection: { image: 1 } })
    return image;
}

const deleteCard = async (id) => {
    try {
        const result = await client.db("postcards").collection("cards").deleteOne({ _id: ObjectId(id) });
        return `${result.deletedCount} documents were deleted.`
    } catch (e) {
        console.error(e);
    }
}

process.on('SIGINT', () => {
    client.close(() => {
        console.log('DB disconnected on app termination');
        process.exit(0);
    });
});