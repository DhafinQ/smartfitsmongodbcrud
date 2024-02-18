const {MongoClient} = require('mongodb');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function main(){
    // Pilih Salah Satu
    const URI = process.env.MONGODB_ATLAS_URI;
    // const URI = process.env.MONGODB_LOCAL_URI;

    const client = new MongoClient(URI);

    try{
        await client.connect();

        // ======= Lihat Semua Database ========
        await clientListDatabases(client);

        // ======= Insert One User =======
        const salt = await bcrypt.genSalt();
        await createUser(client,{
            name: "Dennish",
            email: "dennish@gmail.com",
            role: "cstmr",
            password: await bcrypt.hash("dennish",salt),
        });

        // ======= Insert Many User =======
        // const salt = await bcrypt.genSalt();
        await createdMultipleUser(client,[{
            name: "Rangga",
            email: "rangga@gmail.com",
            role: "cstmr",
            password: await bcrypt.hash("rangga",salt),
            createdAt: new Date(),
            updatedAt: new Date()
        },{
            name: "Wyatt",
            email: "wyatt@gmail.com",
            role: "cstmr",
            password: await bcrypt.hash("wyatt",salt),
            createdAt: new Date(),
            updatedAt: new Date()
        },{
            name: "Marlowe",
            email: "marlowe@gmail.com",
            role: "cstmr",
            password: await bcrypt.hash("marlowe",salt),
            createdAt: new Date(),
            updatedAt: new Date()
        }]);

        // ======= Find One User =======
        await findUserByName(client,"Wyatt");

        // ======= Find All User =======
        await findUserWithRoleAndMaximumResult(client,{
            userRole:'cstmr',
            maximumNumberOfResults:5
        });

        // ======= Update User By Name =======
        await findUserByName(client,"Marlowe");
        await updateUserByName(client,"Marlowe",{name:"Preston Marlowe",updatedAt:new Date()});
        await findUserByName(client,"Preston Marlowe");

        // ======= Upsert User By Name =======
        await findUserByName(client,"Scott");
        await upsertUserByName(client,"Scott",{name:"Scott",createdAt:new Date(),updatedAt:new Date()});
        await findUserByName(client,"Scott");

        await findUserByName(client,"Wyatt");
        await upsertUserByName(client,"Wyatt",{name:"Thomas Wyatt",updatedAt:new Date()});
        await findUserByName(client,"Thomas Wyatt");

        // ======= Update Many =======
        await findUserByName(client,"Scott");
        await updateAllUsersToHaveRoleandPassword(client,'scott');
        await findUserByName(client,"Scott");

        // ======= Delete User By Name =======
        await findUserByName(client,"Scott");
        await deleteUserByName(client,"Scott");
        await findUserByName(client,"Scott");

        // ======= Delete Many User By Date =======
        await findUserWithRoleAndMaximumResult(client,{userRole:'cstmr',maximumNumberOfResults:5});
        await deleteUsersAfterEqualDate(client,new Date("2024-02-18"));
        await findUserWithRoleAndMaximumResult(client,{userRole:'cstmr',maximumNumberOfResults:5});

    }finally{
        await client.close();
    }
}

main().catch(console.error);

// Fungsi Lihat List Database
async function clientListDatabases(client){
    databaseList = await client.db().admin().listDatabases();
    console.log("Databases: ");

    databaseList.databases.forEach(db => {
        console.log(`- ${db.name}`)
    });
}

// Fungsi Insert One User
async function createUser(client,newUser){
    newUser.createdAt = new Date();
    newUser.updatedAt =  new Date();
    const result = await client.db("smartfits").collection("users").insertOne(newUser);
    console.log(`New User created with the following id: ${result.insertedId}`)
}

// Fungsi Inser Many User
async function createdMultipleUser(client, newUsers){
    const result = await client.db("smartfits").collection("users").insertMany(newUsers);

    console.log(`${result.insertedCount} new user(s) created with the following id(s):`);
    console.log(result.insertedIds);
}

// Fungsi Find One User
async function findUserByName(client,nameOfUser){
    const result = await client.db("smartfits").collection("users").findOne({name:nameOfUser});

    if(result){
        console.log(`Found an user in the collection with name ${nameOfUser} :`);
        console.log(result);
    }else{
        console.log(`No user found with the name '${nameOfUser}'`);
    }
}

// Fungsi Find User Dengan Role dan Maximum Result
async function findUserWithRoleAndMaximumResult(client, {
    userRole = "",
    maximumNumberOfResults = Number.MAX_SAFE_INTEGER
} = {}) {
    const cursor = client.db("smartfits").collection("users")
        .find({
            role: userRole,
        }
        )
        .sort({ createdAt: -1 })
        .limit(maximumNumberOfResults);

    const results = await cursor.toArray();

    if (results.length > 0) {
        console.log(`Found user(s) with role ${userRole} :`);
        results.forEach((result, i) => {
            const createdDate = new Date(result.createdAt).toDateString();
            const updatedDate = new Date(result.updatedAt).toDateString();

            console.log();
            console.log(`${i + 1}. name: ${result.name}`);
            console.log(`   _id: ${result._id}`);
            console.log(`   Role: ${result.role}`);
            console.log(`   CreatedAt: ${createdDate}`);
            console.log(`   UpdatedAt: ${updatedDate}`);
        });
    } else {
        console.log(`No User Found with role ${userRole}`);
    }
}

// Fungsi Update User Dengan Nama
async function updateUserByName(client, nameOfUser, updatedUser) {
    const result = await client.db("smartfits").collection("users").updateOne({ name: nameOfUser }, { $set: updatedUser });

    console.log(`${result.matchedCount} document(s) matched the query criteria.`);
    console.log(`${result.modifiedCount} document(s) was/were updated.`);
}

// Fungsi Update User Dengan Nama dan Upsert
async function upsertUserByName(client, nameOfUser, updatedUser) {
    const result = await client.db("smartfits").collection("users").updateOne({ name: nameOfUser }, { $set: updatedUser }, { upsert: true });
    console.log(`${result.matchedCount} document(s) matched the query criteria.`);

    if (result.upsertedCount > 0) {
        console.log(`One document was inserted with the id ${result.upsertedId}`);
    } else {
        console.log(`${result.modifiedCount} document(s) was/were updated.`);
    }
}

// Fungsi Update Many
async function updateAllUsersToHaveRoleandPassword(client,password) {
    const salt = await bcrypt.genSalt();
    generatedPassword = await bcrypt.hash(password,salt);
    const result = await client.db("smartfits").collection("users").updateMany({ $and: [{role: { $exists: false }},{password: { $exists: false }}] }, { $set: { role: "cstmr",password: generatedPassword } });
    console.log(`${result.matchedCount} document(s) matched the query criteria.`);
    console.log(`${result.modifiedCount} document(s) was/were updated.`);
}

// Fungsi Delete User Dengan Nama
async function deleteUserByName(client, nameOfUser) {
    const result = await client.db("smartfits").collection("users").deleteOne({ name: nameOfUser });
    console.log(`${result.deletedCount} document(s) was/were deleted.`);
}

// Fungsi Delete User Yang Dibuat Setelah/Sama dengan Tanggal Sekian
async function deleteUsersAfterEqualDate(client, date) {
    const result = await client.db("smartfits").collection("users").deleteMany({ "createdAt": { $gte: date } });
    console.log(`${result.deletedCount} document(s) was/were deleted.`);
}