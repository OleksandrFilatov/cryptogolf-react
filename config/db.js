const mongoose = require('mongoose');


const connectDB = () => {
    // const uri = process.env.MONGODB_URI;
    // uri = "mongodb+srv://benjamin:MxakYgSBMLy8FSHY@seevar-cluster.pz8kn.mongodb.net/seevar_db?retryWrites=true&w=majority"
    //database Name
    // mongodb://localhost:27017/cryptogolf
    // mongodb+srv://golfpunks:crEvRFFodOmaHKMk@cluster0.4g3ei.mongodb.net/cryptogolf?retryWrites=true&w=majority
    const uri = "mongodb://localhost:27017/cryptogolf";
    mongoose.connect(`${uri}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // useCreateIndex: true
    })
        .then((con) => console.log(`Database connected : ${con.connection.host}`))
        .catch((error) => {
            console.error(`Error: ${error.message}`)
            process.exit(1)
        });
}

module.exports = connectDB;