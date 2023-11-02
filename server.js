const express = require('express')
const app = express()
const db = require('./pgsql/database')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const appKey = 'DFAAdjfsjadGSDFGsd'
var ids = 56

app.set('view engine', 'ejs')
app.use(express.json());
app.use(express.static(__dirname + '/static'));
app.use(cors({
    origin: 'http://localhost:3000'
    
}))

function checkToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split("  ")[1]
    if(!token) return res.status(401).json({msg: 'acesso negado!'})
    try{
        jwt.verify(token, appKey)
        next()
    }catch(error){
        res.status(400).json({msg: 'erro inesperado!'})
    }
}

app.post('/signup', async function(req, res){
    const body = req.body
    //await db.connect()
    try{
        await db.query(`INSERT INTO "users" VALUES ('${++ids}', '${body.name}', '${body.login}', '${body.email}', '${body.address}', '${body.password}', false, '2023-10-15');`)
    }catch(err){
        await db.end()
        return res.status(401).json({msg: `${err}`})                
    }
    //await db.end()
    return res.status(200).json({msg: 'usuário cadastrado com sucesso!'})
})
app.post('/signin', async function(req, res){
    const body = req.body
    try{
        //faz uma conexão ao banco de dados, procurando uma tupla cujo login seja igual ao user.login e as password seja igual a user.password. Em seguida encerra o bd.
        const user = await db.query(`SELECT "Login", "Password" FROM users u WHERE u."Login" = '${body.login}' AND u."Password" = '${body.password}';`)
        if(user.rowCount){
            //se for retornada uma tupla, cria um token usando o jsonwebtoken
            const token = jwt.sign({
                id: body.login
            }, appKey)
            return res.status(200).json({msg: 'sucesso!', token: token})
        }
        else return res.status(404).json({msg: 'senha ou usuário incorreto(s)'})
    }catch(err){
        return res.status(401).json({msg: `${err}`})             
    }
})


app.post('/newProduct', async function(req, res){
    const body = req.body
    //await db.connect()
    try{
        await db.query(`INSERT INTO "products" VALUES (${++ids}, '${body.name}', ${body.category}, '${body.description}', '${body.imageUrl}', ${body.qtdeStock}, ${body.price}, '2023-10-15');`)
    }catch(err){
        //await db.end()
        return res.status(401).json({msg: `${err}`})                
    }
    //await db.end()
    return res.status(200).json({msg: 'produto cadastrado com sucesso!'})
})
app.post('/newCategory', async function(req, res){
    const body = req.body
    //await db.connect()
    try{
        await db.query(`INSERT INTO "categories" VALUES ('${++ids}', '${body.name}', '${body.imageUrl}', '2023-10-15');`)
    }catch(err){
        //await db.end()
        return res.status(401).json({msg: `${err}`})                
    }
    //await db.end()
    return res.status(200).json({msg: 'usuário cadastrado com sucesso!'})
})
app.post('/newPromotion', async function(req, res){
    const body = req.body
    try{
        await db.query(`INSERT INTO "promotions" VALUES ('${++ids}', '${body.imageUrl}', ${body.repeat}, '${body.beggining}', '${body.closure}' , '2023-10-15', '${body.description}', '${body.name}');`)
    }catch(err){
        //await db.end()
        return res.status(401).json({msg: `${err}`})                
    }
    //await db.end()
    return res.status(200).json({msg: 'usuário cadastrado com sucesso!'})
})




app.post('/getProducts', async function(req, res){
    try{
        const result = await db.query(`SELECT * FROM products;`)
        return res.status(200).json({msg: 'sucesso!', res: result})
    }catch(err){
        return res.status(401).json({msg: `${err}`})             
    }
})
app.post('/getCategories', async function(req, res){
    try{
        const result = await db.query(`SELECT * FROM categories;`)
        return res.status(200).json({msg: 'sucesso!', res: result})
    }catch(err){
        return res.status(401).json({msg: `${err}`})             
    }
})
app.post('/getPromotions', async function(req, res){
    try{
        const result = await db.query(`SELECT * FROM promotions;`)
        return res.status(200).json({msg: 'sucesso!', res: result})
    }catch(err){
        return res.status(401).json({msg: `${err}`})             
    }
})
app.post('/search', async function(req, res){
    const body = req.body
    console.log(body)
    try{
        const result = await db.query(`SELECT * FROM products p WHERE p."Name" ILIKE '%${body.name}%' or p."Description" ILIKE '%${body.name}%';`)
        console.log(result)
        return res.status(200).json({msg: 'sucesso!', res: result})
    }catch(err){
        return res.status(401).json({msg: `${err}`})             
    }
})
app.post('/catchProduct', async function(req, res){
    const body = req.body
    try{
        const product = await db.query(`SELECT * FROM products p WHERE p."ID" = '${body.id}'`)
        return res.status(200).json({msg: 'sucesso!', res: product})
    }catch(err){
        return res.status(401).json({msg: `${err}`})
    }
})

app.post('/delProduct', async function(req, res){
    const body = req.body
    console.log(body)
    try{
        const result = await db.query(`DELETE FROM products p WHERE p."ID" = ${body.ID};`)
        return res.status(200).json({msg: 'deletado com sucesso!', res: result})
    }catch(err){
        return res.status(401).json({msg: `${err}`})             
    }
})
app.post('/delCategory', async function(req, res){
    const body = req.body
    try{
        const result = await db.query(`DELETE FROM categories c WHERE c."ID" = ${body.ID};`)
        return res.status(200).json({msg: 'deletado sucesso!', res: result})
    }catch(err){
        return res.status(401).json({msg: `${err}`})             
    }
})
app.post('/delPromotion', async function(req, res){
    const body = req.body
    try{
        const result = await db.query(`DELETE * FROM promotions p WHERE p."ID" = ${body.ID};`)
        return res.status(200).json({msg: 'deletado com sucesso!', res: result})
    }catch(err){
        return res.status(401).json({msg: `${err}`})             
    }
})

app.put('/updProduct', async function(req, res){
    const body = req.body
    try{
        const result = await db.query(`UPDATE products p
        SET "Name" = ${body.name}, "Image" = ${body.imgUrl}, "Price" = ${body.price}, "Category" = ${body.category} , "qtde_Stock" = ${body.stock}, "Description" = ${body.description}
        WHERE p."ID" = ${body.ID}
        `)
        return res.status(200).json({msg: 'produto atualizado com sucesso!', res: result})
    }catch(err){
        return res.status(401).json({msg: `${err}`})
    }
})
app.put('/updCategory', async function(req, res){
    const body = req.body
    try{
        const result = await db.query(`UPDATE categories c
        SET "Name" = ${body.name}, "Image" = ${body.imgUrl}
        WHERE c."ID" = ${body.ID}
        `)
        return res.status(200).json({msg: 'categoria atualizada com sucesso!', res: result})
    }catch(err){
        return res.status(401).json({msg: `${err}`})
    }
})



db.connect()

process.on('SIGINT', () => {
  db.end()
    .then(() => {
      console.log('Conexão com o banco de dados encerrada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro ao encerrar a conexão com o banco de dados:', error);
      process.exit(1);
    });
});





app.listen(8080)
console.log('server is on!')