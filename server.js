const express = require('express')
const app = express()
const db = require('./pgsql/database')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const appKey = 'DFAAdjfsjadGSDFGsd'

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
    await db.connect()
    try{
        await db.query(`INSERT INTO "users" VALUES (2, '${body.name}', '${body.login}', '${body.email}', '${body.address}', '${body.password}', false, '2023-10-15');`)
    }catch(err){
        await db.end()
        return res.status(401).json({msg: `${err}`})                
    }
    await db.end()
    return res.status(200).json({msg: 'usuário cadastrado com sucesso!'})

})
app.post('/signin', async function(req, res){
    const body = req.body
    await db.connect()
    try{
        //faz uma conexão ao banco de dados, procurando uma tupla cujo login seja igual ao user.login e as password seja igual a user.password. Em seguida encerra o bd.
        const user = await db.query(`SELECT "Login", "Password" FROM users u WHERE u."Login" = '${body.login}' AND u."Password" = '${body.password}';`)
        await db.end()
        if(user.rowCount){
            //se for retornada uma tupla, cria um token usando o jsonwebtoken
            const token = jwt.sign({
                id: body.login
            }, appKey)
            return res.status(200).json({msg: 'sucesso!', token: token})
        }
        else return res.status(404).json({msg: 'senha ou usuário incorreto(s)'})
    }catch(err){
        await db.end()
        return res.status(401).json({msg: `${err}`})             
    }
})

app.listen(8080)
console.log('server is on!')