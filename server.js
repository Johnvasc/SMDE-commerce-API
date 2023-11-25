const express = require('express')
const uuid = require('uuid')
const app = express()
const db = require('./pgsql/database')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const appKey = 'DFAAdjfsjadGSDFGsd'
const admKey = 'JndafnHDDSIKdifajdasD'
///import {checksUserExists} from "./script"
var ids = 999

app.set('view engine', 'ejs')
app.use(express.json());
app.use(express.static(__dirname + '/static'));
app.use(cors({
    origin: 'http://localhost:3000'
    
}))

async function checksUserExists(userName){
    try{
        const user = await db.query(`SELECT "Login" FROM users u WHERE u."Login" = '${userName}';`)
        if(user.rowCount) return true
        return false
    }catch(err){
        return false             
    }
}
function checkToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]
    if(!token) return res.status(401).json({msg: 'acesso negado!'})
    try{
        jwt.verify(token, appKey)
        next()
    }catch(error){
        res.status(400).json({msg: 'erro inesperado!'})
    }
}
function checkTokenAdm(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]
    if(!token) return res.status(401).json({msg: 'acesso negado!'})
    try{
        jwt.verify(token, admKey)
        next()
    }catch(error){
        res.status(400).json({msg: 'erro inesperado!'})
    }
}

app.get('/teste', async function(req, res){
    try{
        const twins = await db.query(`SELECT * FROM users u WHERE u."ID" = '1' AND u."Administrator" = true;`)
        return res.status(200).json({msg: 'sucesso!', res: twins})
    }catch(err){
        return res.status(401).json({msg: `${err}`})
    }
})
app.get('/checkAdmin', checkTokenAdm, async function(req, res){
    return res.status(200).json({msg: 'ok!'})
})
app.get('/checkInstanceAdm', async function(req, res){
    try{
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(" ")[1]
        if(token){
            let ID = jwt.decode(token, admKey)
            ID = ID.id
            console.log(ID)
            const user = await db.query(`SELECT * FROM users u WHERE u."ID" = '${ID}' AND u."Administrator" = true;`)
            console.log(user.rowCount)
            if(user.rowCount) return res.status(200).json({access: true})
        }
        return res.status(200).json({access: false})
    }catch(err){
        return res.status(401).json({msg: err})
    }
})


app.post('/signup', async function(req, res){
    const body = req.body
    //await db.connect()
    try{
        await db.query(`INSERT INTO "users" VALUES ('${++ids}', '${body.name}', '${body.login}', '${body.email}', '${body.address}', '${body.password}', false, '2023-10-15');`)
        let userID = ids
        await db.query(`INSERT INTO "carts" VALUES ('${++ids}', '{}', '2023-10-15', '${userID}');`)
        await db.query(`INSERT INTO "sales" VALUES ('${++ids}', '${userID}', '{}', '0.0' ,'2023-10-15');`)
    }catch(err){
        return res.status(401).json({msg: `${err}`})                
    }
    //await db.end()
    return res.status(200).json({msg: 'usuário cadastrado com sucesso!'})
})
app.post('/signin', async function(req, res){
    const body = req.body
    try{
        //faz uma conexão ao banco de dados, procurando uma tupla cujo login seja igual ao user.login e as password seja igual a user.password. Em seguida encerra o bd.
        const user = await db.query(`SELECT "Login", "Password", "Administrator" FROM users u WHERE u."Login" = '${body.login}' AND u."Password" = '${body.password}';`)
        if(user.rowCount){
            //se for retornada uma tupla, cria um token usando o jsonwebtoken
            console.log(user.rows[0].Administrator)
            if(!user.rows[0].Administrator){
                var token = jwt.sign({
                    id: body.login
                }, appKey)
            }else{
                var token = jwt.sign({
                    id: body.login
                }, admKey)
            }
            return res.status(200).json({msg: 'sucesso!', token: `${token}`})
        }
        else return res.status(404).json({msg: 'senha ou usuário incorreto(s)'})
    }catch(err){
        console.log(err)
        return res.status(401).json({msg: `${err}`})             
    }
})


app.post('/newProduct', checkTokenAdm, async function(req, res){
    const body = req.body
    //await db.connect()
    try{
        await db.query(`INSERT INTO "products" VALUES (${++ids}, '${body.name}', ${body.category}, '${body.description}', '${body.imageUrl}', ${body.qtdeStock}, ${body.price}, '2023-10-15');`)
    }catch(err){
        //await db.end()
        return res.status(401).json({msg: `${err}`})                
    }
    //await db.end()
    return res.status(201).json({msg: 'produto cadastrado com sucesso!'})
})
app.post('/newCategory', checkTokenAdm, async function(req, res){
    const body = req.body
    //await db.connect()
    try{
        await db.query(`INSERT INTO "categories" VALUES ('${++ids}', '${body.name}', '${body.imageUrl}', '2023-10-15');`)
    }catch(err){
        //await db.end()
        return res.status(401).json({msg: `${err}`})                
    }
    //await db.end()
    return res.status(201).json({msg: 'usuário cadastrado com sucesso!'})
})
app.post('/newPromotion', checkTokenAdm, async function(req, res){
    const body = req.body
    try{
        await db.query(`INSERT INTO "promotions" VALUES ('${++ids}', '${body.imageUrl}', ${body.repeat}, '${body.beggining}', '${body.closure}' , '2023-10-15', '${body.description}', '${body.name}');`)
        return res.status(201).json({msg: 'usuário cadastrado com sucesso!'})
    }catch(err){
        return res.status(401).json({msg: `${err}`})                
    }
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
app.get('/getSales', checkTokenAdm, async function(req, res){
    try{
        const result = await db.query(`SELECT u."ID", s."ID" AS "SaleID", s."Products", s."Created_at" AS "Date" FROM users u, sales s WHERE u."ID" = s."Owner";`)
        return res.status(200).json({msg: 'sucesso!', res: result})
    }catch(err){
        return res.status(401).json({msg: `${err}`})             
    }
})
app.get('/getAdm', checkTokenAdm, async function(req, res){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]
    if(!token) return res.status(401).json({msg: 'acesso negado!'})
    try{
        const ID = jwt.decode(token, admKey)
        console.log(ID.id)
        const result = await db.query(`SELECT * FROM users u WHERE u."Login" = '${ID.id}';`)
        return res.status(200).json({msg: 'sucesso!', res: result})
    }catch(err){
        return res.status(401).json({msg: `${err}`})             
    }
})
app.get('/getUser', checkToken, async function(req, res){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]
    if(!token) return res.status(401).json({msg: 'acesso negado!'})
    try{
        const ID = jwt.decode(token, appKey)
        console.log(ID.id)
        const result = await db.query(`SELECT * FROM users u WHERE u."Login" = '${ID.id}';`)
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
app.post('/catchCart', checkToken, async function(req, res){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]
    if(!token) return res.status(401).json({msg: 'acesso negado!'})
    try{
        const ID = jwt.decode(token, appKey)
        const user = await db.query(`SELECT "ID" FROM users u WHERE u."Login" = '${ID.id}'`)
        const cart = await db.query(`SELECT * FROM carts c WHERE c."UserID" = '${user.rows[0].ID}'`)
        return res.status(200).json({msg: 'sucesso!', res: cart})
    }catch(error){
        res.status(400).json({msg: 'erro inesperado!'})
    }
})
app.post('/catchSales', checkToken, async function(req, res){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]
    if(!token) return res.status(401).json({msg: 'acesso negado!'})
    try{
        const ID = jwt.decode(token, appKey)
        const user = await db.query(`SELECT "ID" FROM users u WHERE u."Login" = '${ID.id}'`)
        const sales = await db.query(`SELECT * FROM sales s WHERE s."Owner" = '${user.rows[0].ID}'`)
        return res.status(200).json({msg: 'sucesso!', res: sales})
    }catch(error){
        res.status(400).json({msg: 'erro inesperado!'})
    }
})
app.post('/makeSale', checkToken, async function(req, res){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]
    if(!token) return res.status(401).json({msg: 'acesso negado!'})
    try{
        let newSales
        let ID = jwt.decode(token, appKey)
        ID = ID.id
        const user = await db.query(`SELECT * FROM users u WHERE u."Login" = '${ID}'`)
        ID = user.rows[0].ID
        const cart = await db.query(`SELECT * FROM carts c WHERE c."UserID" = '${ID}'`)
        const sales = await db.query(`SELECT * FROM sales s WHERE s."Owner" = '${ID}'`)
        if(sales) newSales = sales.rows[0].Products.concat(cart.rows[0].Products)
        else newSales = cart.rows[0].Products
        const upd = await db.query(`UPDATE sales SET "Products" = '{${newSales}}' WHERE "ID" = '${sales.rows[0].ID}';`)
        for(let i=0; i<newSales.length; i++){
            let prod = await db.query(`SELECT * FROM products p WHERE p."ID" = ${newSales[i]}`)
            await db.query(`UPDATE products SET "qtde_Stock" = '${prod.rows[0].qtde_Stock - 1}' WHERE "ID" = '${prod.rows[0].ID}'`)
        }
        console.log(cart.rows[0].ID)
        const exc = await db.query(`UPDATE carts c SET "Products" = '{}' WHERE c."UserID" = ${cart.rows[0].UserID};`)
        console.log(exc)    
        
        return res.status(200).json({msg: 'sucesso!', res: upd})
    }catch(error){
        console.log(error)
        res.status(400).json({msg: error})
    }
})


app.post('/delProduct', checkTokenAdm, async function(req, res){
    const body = req.body
    console.log(body)
    try{
        const result = await db.query(`DELETE FROM products p WHERE p."ID" = ${body.ID};`)
        return res.status(200).json({msg: 'deletado com sucesso!', res: result})
    }catch(err){
        return res.status(401).json({msg: `${err}`})             
    }
})
app.post('/delCategory', checkTokenAdm, async function(req, res){
    const body = req.body
    try{
        const result = await db.query(`DELETE FROM categories c WHERE c."ID" = ${body.ID};`)
        return res.status(200).json({msg: 'deletado sucesso!', res: result})
    }catch(err){
        return res.status(401).json({msg: `${err}`})             
    }
})
app.post('/delPromotion', checkTokenAdm, async function(req, res){
    const body = req.body
    try{
        const result = await db.query(`DELETE * FROM promotions p WHERE p."ID" = ${body.ID};`)
        return res.status(200).json({msg: 'deletado com sucesso!', res: result})
    }catch(err){
        return res.status(401).json({msg: `${err}`})             
    }
})
app.post('/delSale', checkTokenAdm, async function(req, res){
    const body = req.body
    try{
        const result = await db.query(`DELETE * FROM sales s WHERE s."Owner" = ${body.ID};`)
        return res.status(200).json({msg: 'deletado com sucesso!', res: result})
    }catch(err){
        return res.status(401).json({msg: `${err}`})             
    }
})
app.post('/delAdm', checkTokenAdm, async function(req, res){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]
    if(!token) return res.status(401).json({msg: 'acesso negado!'})
    try{
        const ID = jwt.decode(token, admKey)
        console.log(ID.id)
        const result = await db.query(`DELETE * FROM users u WHERE u."Login" = '${ID.id}';`)
        return res.status(200).json({msg: 'sucesso!', res: result})
    }catch(err){
        return res.status(401).json({msg: `${err}`})             
    }
})
app.post('/delUser', checkToken, async function(req, res){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]
    if(!token) return res.status(401).json({msg: 'acesso negado!'})
    try{
        const ID = jwt.decode(token, appKey)
        console.log(ID.id)
        const result = await db.query(`DELETE * FROM users u WHERE u."Login" = '${ID.id}';`)
        return res.status(200).json({msg: 'sucesso!', res: result})
    }catch(err){
        return res.status(401).json({msg: `${err}`})             
    }
})

app.put('/updProduct', checkTokenAdm, async function(req, res){
    const body = req.body
    console.log(body)
    try{
        const result = await db.query(`UPDATE products
        SET "Name" = '${body.name}', "Image" = '${body.image}', "Price" = ${body.price}, "Category" = ${body.category} , "qtde_Stock" = ${body.stock}, "Description" = '${body.description}'
        WHERE "ID" = ${body.ID}
        `)
        return res.status(200).json({msg: 'produto atualizado com sucesso!', res: result})
    }catch(err){
        console.log(err)
        return res.status(401).json({msg: `${err}`})
    }
})
app.put('/updCategory', checkTokenAdm, async function(req, res){
    const body = req.body
    try{
        const result = await db.query(`UPDATE categories
        SET "Name" = '${body.name}', "Image" = '${body.imgUrl}'
        WHERE "ID" = ${body.ID};
        `)
        return res.status(200).json({msg: 'categoria atualizada com sucesso!', res: result})
    }catch(err){
        
        return res.status(401).json({msg: `${err}`})
    }
})
app.put('/updAdm', checkTokenAdm, async function(req, res){
    const body = req.body
    try{
        const twins = await db.query(`SELECT * FROM users u WHERE u."ID" != '${body.ID}'`)
        for(let i = 0; i<twins.rows.length; i++){
            if(twins.rows[i].Login == body.login) return res.status(400).json({msg: 'esse username já esta sendo utilizado!'})
            if(twins.rows[i].Email == body.email) return res.status(400).json({msg: 'esse email já esta sendo utilizado!'})
        }
        const result = await db.query(`UPDATE users
        SET "Name" = '${body.name}', "Login" = '${body.login}', "Email" = '${body.email}', "Password" = '${body.password}'
        WHERE "ID" = ${body.ID};
        `)
        return res.status(200).json({msg: 'cliente atualizado com sucesso!', res: result})
    }catch(err){
        return res.status(401).json({msg: `${err}`})
    }
})

app.put('/updCart', checkToken, async function(req, res){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]
    if(!token) return res.status(401).json({msg: 'acesso negado!'})
    let ID = jwt.decode(token, appKey)
    ID = ID.id
    console.log(ID)
    const body = req.body
    try{
        const user = await db.query(`SELECT "ID" FROM users u WHERE u."Login" = '${ID}'`)
        const cart = await db.query(`SELECT "Products" FROM carts c WHERE c."UserID" = ${user.rows[0].ID}`)
        let cartAtt = cart.rows[0].Products.concat(body.product)
        console.log(cartAtt)
        const result = await db.query(`UPDATE carts
        SET "Products" = '{${cartAtt}}'
        WHERE "UserID" = ${user.rows[0].ID};
        `)
        console.log(result)
        return res.status(200).json({msg: 'carrinho atualizado com sucesso!', res: result})
    }catch(err){
        
        return res.status(401).json({msg: `${err}`})
    }
})
app.delete('/removeFromCart', checkToken, async function(req, res){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]
    if(!token) return res.status(401).json({msg: 'acesso negado!'})
    let ID = jwt.decode(token, appKey)
    ID = ID.id
    console.log(ID)
    const body = req.body
    try{
        const user = await db.query(`SELECT "ID" FROM users u WHERE u."Login" = '${ID}'`)
        const cart = await db.query(`SELECT "Products" FROM carts c WHERE c."UserID" = ${user.rows[0].ID}`)
        let cartAtt = []
        let prodId = body.product
        for(let i = 0; i<cart.rows[0].Products.length; i++){
            if(cart.rows[0].Products[i] != prodId) cartAtt.push(cart.rows[0].Products[i])
            else prodId = -1
        }
        console.log(cartAtt)
        const result = await db.query(`UPDATE carts
        SET "Products" = '{${cartAtt}}'
        WHERE "UserID" = ${user.rows[0].ID};
        `)
        console.log(result)
        return res.status(200).json({msg: 'item removido com sucesso!', res: result})
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