const UserModel = require('../models/UserModel');


exports.register = async (req,res) => {
    //create new user
    const User = new UserModel(req.body);

    //register new user
    const user = await User.register();

    //if there was error
    if(!user){
        res.json({msg: User.errors});
        return;
    }

    //greetings, confirm email!
    res.json({msg: 'sucesso, enviamos uma mensagem para seu email. Confirme seu email em até 5 minutos.'});
}

exports.confirm = async (req,res) => {
    //create new user
    const User = new UserModel();

    //confirm user
    const user = await User.confirm(req.params.token);

    //if there was error
    if(!user){
        return res.json({msg: User.errors.join(', ')});
    };

    //greetings, success!
    return res.json({msg: 'Usuário foi ativado no sistema, obrigado!'});
}

exports.login = async (req,res) => {
    const User = new UserModel(req.body);

    const user = await User.login();

    if(!user){
        return res.json({msg: User.errors.join(', ')});
    }

    //greetings, success!
    return res.json({msg: 'Logado com sucesso!'});
}