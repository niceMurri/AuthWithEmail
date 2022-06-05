require('dotenv').config
const mongoose = require('mongoose');
const validator = require('validator').default
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const nodemailer = require('./nodemailer.config'); 


const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    status: {
        type: String,
        enum: ['Pending', 'Active'],
        default: 'Pending'
    },
    confirmationCode: {
        type: String,
        unique: true
    }
});

const UserModel = mongoose.model("User", UserSchema);


class User{
    constructor(body){
        this.body = body;
        this.errors = [];
    }


    async register(){
        await this.validateNewUser();

        //checking if there are errors
        if(this.errors.length > 0) return false;
        
        try {
            const { name, email} = this.body;
            let { password } = this.body;

            //create token for confirm email
            const token = jwt.sign({
                name,
                email
            },process.env.SECRET,{
                expiresIn: 300
            });
            
            //create crypt password 
            const salt =  bcrypt.genSaltSync(12);
            password = bcrypt.hashSync(password, salt);
        
            //create user
            const user = await UserModel.create({
                name,
                email,
                password,
                confirmationCode: token
            })

            //send confirmed account
            nodemailer.sendConfirmationEmail(name, email, token);
            
            return user;

        } catch (error) {
            console.log(error);
            return false;
        }


    }
    async login(){
        try {
            //validate body infos
            await this.validateLogin();

            //checking if there was an error
            if(this.errors.length > 0) return false;

            const {email, password} = this.body;

            //get user
            const user = await this.somethingExists('email',email);

            //is Active?
            if(user.status !== 'Active'){
                this.errors.push("Usuário ainda não foi ativado, verifique seu email.");
                return false; 
            };

            //password compare
            const passwordMatch = bcrypt.compareSync(password, user.password);

            //Checking if password match
            if(!passwordMatch){
                this.errors.push("Email ou senha inválidos.");
                return false; 
            };

            //success
            return true
        } catch (error) { 
            this.errors.push('Aconteceu algo inesperado.');
            return false
        }


        
    }
    async validateNewUser(){
        this.clearUp();

        const { name, email, password } = this.body

        //name validator
        if(name.length < 4) this.errors.push('Nome deve conter no mínimo 4 caracteres.');
        
        if(!validator.isAlpha(name,'pt-BR')) this.errors.push('Números não são aceitos em seu nome.');

        if(await this.somethingExists('name',name) !== null) this.errors.push('Usuário já existente.');

        //email validator
        if(!validator.isEmail(email)) this.errors.push('Digite um email válido.');

        if(await this.somethingExists('email',email) !== null) this.errors.push('Email já em uso.');

        //password validator
        if(password.length < 6) this.errors.push('Senha deve conter no mínimo 6 caracteres.');

    }
    async validateLogin(){
        try {
            this.clearUp();

            const {email, password} = this.body;
        
            //valid email
            if(
                !validator.isEmail(email) 
                || await this.somethingExists('email',email) == null
            ) 
            return this.errors.push("Email ou senha inválidos.");

            //password
            if(password.length < 6) return this.errors.push("Email ou senha inválidos.");

        } catch (error) {
            console.log(error);
            return this.errors.push('Confira os campos');
        }
    }
    async somethingExists(filter,content){
        return await UserModel.findOne({[filter]: content});
    }
    clearUp(){
        for(const index in this.body){
            if(typeof this.body[index] !== 'string') this.body[index] = '';
        }
    }
    async confirm(token){
        try {
            //verify token is valid
            const tokenIsValid = jwt.verify(token, process.env.SECRET);

            const {email} = tokenIsValid
            
            const user = await this.somethingExists('email',email);

            if(user.status == 'Active') {
                this.errors.push('Já está ativo!');
                return false
            }

            await UserModel.findOneAndUpdate(
                {confirmationCode: token}, //filter
                {status: 'Active'}, //update
                {new: true}); //options


            if(user == null) return false;

            return true;
        } catch (error) {
            try {
                //get expired token information
                const decode = jwt.decode(token);

                const {name, email} = decode;

                if(!name || !email){
                    this.errors.push('Nome e email precisam ser declarados.');
                    return false
                };

                const user = await this.somethingExists('email',email);

                if(user.status == 'Active') {
                    this.errors.push('Já está ativo.');
                    return false
                }
                
                //gen new token
                const newToken = jwt.sign({
                    name,
                    email
                },process.env.SECRET,{
                    expiresIn: 300
                });

                //update token for confirmation
                await UserModel.findOneAndUpdate({email}, {confirmationCode: newToken}, {new: true});

                //send email
                nodemailer.sendConfirmationEmail(name,email,newToken);
                
                this.errors.push('Tempo de confirmação foi expirado, enviamos um novo email de confirmação.');
                return false

            } catch (error) {
                this.errors.push("Algo inesperado aconteceu.");
                return false
            }
        }
    }
}

module.exports = User;