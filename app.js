const express = require("express");
const parser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(parser.urlencoded());

mongoose.connect('mongodb://localhost:27017/shopDB', {useNewUrlParser: true, useUnifiedTopology: true});
const userSchema = mongoose.Schema({
    name: String,
    username: String,
    email: String,
    password: String,
    role: String,
    cartItems: Array,
    purchasedItems: Array,
  });
const itemSchema = mongoose.Schema({
    name: String,
    description: String,
    quantity: String,
    price: String,
    seller: String,
    url: String
  });
const boughtItemSchema = mongoose.Schema({
    name: String,
    description: String,
    price: String,
    seller: String,
    url: String,
    buyer: String,
    buyerEmail: String,
  });
const user = mongoose.model('User', userSchema);
const item = mongoose.model('Item', itemSchema);
const boughtItem = mongoose.model('BoughtItem', boughtItemSchema);

var authenticated = false;
var loginEmail = "";
var loginPassword = "";
var regEmail = "";
var regPassword = "";
var regName = "";
var regUsername = "";
var regRole = "";
var loginRole = "";
var loginUsername = "";

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){
    regName = req.body.name;
    regUsername = req.body.username;
    regEmail = req.body.email;
    regPassword = req.body.password;
    regRole = "";
    if(req.body.role == "0"){
        regRole = "Buyer";
    }else if(req.body.role == "1"){
        regRole = "Seller";
    }
    if(regPassword.length < 8 || regUsername.length == 0 || regName.length == 0 || regEmail.length == 0 || regRole == "" || !regPassword.match(/^[0-9a-zA-Z]+$/)){
        res.redirect("/register");
    }else{
        user.find({ $or: [{ email: regEmail }, { username: regUsername }] },function(err,result){
            if(err){
                console.log(err);
            }else{
                if(result){
                    if(result.length > 0){
                        res.redirect("/register");
                    }else{
                        console.log("HI");
                        const newUser = new user({
                            name: regName,
                            username: regUsername,
                            email: regEmail,
                            password: regPassword,
                            role: regRole,
                            cartItems: [],
                            purchasedItems: [],
                        });
                    
                        newUser.save(function (err, result) {
                            if(err){
                                console.error(result);
                                res.redirect("/register");
                            }else{
                                console.log(result.email + " saved to users collection.");
                                authenticated = true;
                                if(regRole=="Buyer"){
                                    res.redirect("/buyerdashboard");
                                }else{
                                    res.redirect("/sellerdashboard");
                                } 
                            }    
                        });
                    }
                }
            }
        });
    }

});

app.get("/",function(req,res){
    res.render("login");
});

app.post("/",function(req,res){
    loginEmail = req.body.email;
    loginPassword = req.body.password;
    user.findOne({email: loginEmail, password: loginPassword},function(err,user){
        if(err){
            console.log(err);
        }else{
            if(user){
                if(user.password == loginPassword){
                    authenticated = true;
                    loginUsername = user.username;
                    loginRole = user.role;
                    if(loginRole=="Buyer"){
                        res.redirect("/buyerdashboard");
                    }else{
                        res.redirect("/sellerdashboard");
                    } 
                }
            }else{
                res.redirect("/");
            }
        }
    });
});

app.get("/sellerdashboard",function(req,res){
    if(authenticated == true){
        var items = [];
        var a = 0;
        var b = 0;
        var d = 0;
        var c = 0;
        item.find({seller: (loginEmail=="") ? regEmail : loginEmail},function(err,result){
            if(err){
                console.log(err)
            }else{
                for(var i=0; i<result.length; i++){
                    var itemName = "";
                    var itemDescription = "";
                    var itemQuantity = "";
                    var itemPrice = "";
                    var itemURL = "";
                    if(result[i]){
                        itemName = result[i].name;
                        itemDescription = result[i].description;
                        itemQuantity = result[i].quantity;
                        itemPrice = result[i].price;
                        itemURL = result[i].url;
                        var itemScript = {name: itemName, description: itemDescription, quantity: itemQuantity, price: itemPrice, url: itemURL};
                        a+=Number(itemQuantity);
                        items.push(itemScript);
                    }
                }   
                console.log(items);
                boughtItem.find({seller: (loginEmail=="") ? regEmail : loginEmail},function(err,result){
                    if(err){
                        console.log(err);
                    }else{
                        if(result){
                            b+=Number(result.length);
                            console.log(a);
                            console.log(b);
                            d = (b/(a+b)) * 100;
                            console.log(d);
                            c = (a/(a+b)) * 100;
                            console.log(c);
                            res.render("sellerdashboard",{username: (loginUsername=="") ? regUsername : loginUsername, items: items.reverse(), a: c, b: d});   
                        }
                    }
                });
            }
        });
    }else{
        res.redirect("/");
    }

});

app.get("/buyerdashboard",function(req,res){
    var itemsBuyer = []
    if(authenticated == true){
        item.find({quantity: {$ne: "0"}},function(err,result){
            if(err){
                console.log(err)
            }else{
                for(var i=0; i<result.length; i++){
                    var itemName = "";
                    var itemDescription = "";
                    var itemQuantity = "";
                    var itemPrice = "";
                    var itemURL = "";
                    var itemSeller = "";
                    var itemID = "";
                    if(result[i]){
                        itemName = result[i].name;
                        itemDescription = result[i].description;
                        itemQuantity = result[i].quantity;
                        itemPrice = result[i].price;
                        itemURL = result[i].url;
                        itemSeller = result[i].seller;
                        var itemBuyerScript = {name: itemName, description: itemDescription, quantity: itemQuantity, price: itemPrice, url: itemURL, seller: itemSeller};
                        itemsBuyer.push(itemBuyerScript);
                    }
                }   
                console.log(itemsBuyer.reverse());
            }    
        res.render("buyerdashboard",{username: (loginUsername=="") ? regUsername : loginUsername, items: itemsBuyer});
        });    
    }else{
        res.redirect("/");
    }
});

app.get("/logout",function(req,res){
    loginEmail = "";
    loginPassword = "";
    regEmail = "";
    regPassword = "";
    regName = "";
    regUsername = "";
    regRole = "";
    loginRole = "";
    loginUsername = "";
    authenticated = false;
    res.redirect("/");
});

app.get("/addItem",function(req,res){
    if(authenticated==true){
        res.render("addItem",{username: (loginUsername=="") ? regUsername : loginUsername});
    }
});

app.post("/addItem",function(req,res){
    console.log(req.body);
    if(req.body.itemName != "" && req.body.itemDescription != "" && Number(req.body.quantity) >=0 && Number(req.body.itemPrice) >=0 && req.body.imageURL != ""){
        const newItem = new item({
            name: req.body.itemName,
            description: req.body.itemDescription,
            quantity: req.body.quantity,
            price: req.body.itemPrice,
            seller: (loginEmail=="") ? regEmail : loginEmail,
            url: req.body.imageURL
        });
        newItem.save(function (err, result) {
            if(err){
                console.error(result);
                res.redirect("/addItem");
            }else{
                console.log(result.name + " saved to items collection.");
                res.redirect("/sellerdashboard");
            }    
          });        
    }else{
        res.redirect("/sellerdashboard");
    }
});

app.get("/addToCart",function(req,res){
    console.log(req.body);
});

app.post("/addToCart",function(req,res){
    console.log(req.body);
    var obj = {
        itemName: req.body.name,
        itemDescription: req.body.description,
        sellerName: req.body.seller,
        price: req.body.price,
        url: req.body.url,
        quantity: req.body.quantity
    };
    console.log(obj)
    user.update(
        { "username": (loginUsername=="") ? regUsername : loginUsername},
        { "$push": { "cartItems": obj } },
        function (err, raw) {
            if (err){
                console.log(err);
            }else{
                console.log('The raw response from Mongo was ', raw);
            }
        }
    );
    res.redirect("buyerdashboard");
});

app.get("/itemsInCart",function(req,res){
    var cartItemsNew = [];
    if(authenticated == true){
        user.find({email: (loginEmail=="") ? regEmail : loginEmail},function(err,user){
            if(err){
                console.log(err);
            }else{
                if(user){
                    if(! user[0].cartItems == []){
                        for(var i=0; i<user[0].cartItems.length; i++){
                            cartItemsNew.push(user[0].cartItems[i]);
                        }
                        console.log(cartItemsNew);
                    }
                }
            }
            res.render("itemsInCart",{username: ((loginUsername=="") ? regUsername : loginUsername), items: cartItemsNew.reverse()});
        });
    }
});

app.get("/boughtItems",function(req,res){
    if(authenticated == true){
        boughtItem.find({buyer: loginUsername == "" ? regUsername : loginUsername},function(err,item){
            if(err){
                res.send(err);
            }else{
                if(item){
                    console.log(item);
                    res.render("boughtItems",{username: loginUsername == "" ? regUsername : loginUsername, items: item.reverse()});
                }
            }
        });
    }
});

app.get("/buyNow",function(req,res){
    if(authenticated == true){
        console.log(req.body);
    }
});

app.post("/buyNow",function(req,res){
    var obj = {
        itemName: req.body.name,
        itemDescription: req.body.description,
        itemPrice: req.body.price,
        itemSeller: req.body.seller,
        itemUrl: req.body.url
    }
    user.update(
        { "username": (loginUsername=="") ? regUsername : loginUsername},
        { "$push": { "boughtItems": obj } },
        function (err, raw) {
            if (err){
                console.log(err);
            }else{
                console.log('The raw response from Mongo was ', raw);
            }
        }
    );
    const newBoughtItem = new boughtItem({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        seller: req.body.seller,
        url: req.body.url,
        buyer: (loginUsername=="") ? regUsername : loginUsername,
        buyerEmail: (loginEmail=="") ? regEmail : loginEmail,
    });

    newBoughtItem.save(function (err, result) {
        if(err){
            console.error(result);
            res.send(err);
        }else{
            console.log(result.email + " saved to boughtItem collection.");
            item.update({name: req.body.name, seller: req.body.seller ,price: req.body.price,},{$set: { quantity: (Number(req.body.quantity)-1).toString() }},function(err,raw){
                if (err){
                    console.log(err);
                }else{
                    console.log('The raw response from Mongo was ', raw);
                    res.redirect("/buyerdashboard");
                }
            });
        }    
      });
    
});

var purName = "";
var purDescription = "";
var purPrice = "";
var purQuantity = "";
var purURL = "";

app.get("/modifyItems",function(req,res){
    if(authenticated == true){
        res.render("modify",{username: (loginUsername == "")?regUsername:loginUsername, name: purName, description: purDescription, price: purPrice, quantity: purQuantity, url:purURL});
    }
});

app.post("/modifyItems",function(req,res){
    console.log(req.body);
    purName = req.body.name;
    purDescription = req.body.description;
    purPrice = req.body.price;
    purQuantity = req.body.quantity;
    purURL = req.body.url;
    res.redirect("/modifyItems");
});

app.get("/modifyItemsFinal",function(req,res){
    console.log(req.body);
});

app.post("/modifyItemsFinal",function(req,res){

    item.update({name: purName, seller: (loginEmail == "")? regEmail:loginEmail},{$set: {name: req.body.itemName, quantity: req.body.quantity, description: req.body.itemDescription, price: req.body.itemPrice, url: req.body.imageURL}},function(err,raw){
        if(err){
            res.send(err);
        }else{
            console.log('The raw response from Mongo was ', raw);
            res.redirect("/sellerdashboard");
        }
    });
});

app.get("/selledItems",function(req,res){
    if(authenticated == true){
        boughtItem.find({seller: (loginEmail == "")?regEmail:loginEmail},function(err,item){
            if(err){
                console.log(err);
            }else{
                if(item){
                    console.log(item);
                    res.render("selledItems",{username: (loginUsername == "")?regUsername:loginUsername, items: item.reverse()})
                }
            }
        });        
    }
});

app.get("/delete",function(req,res){
    console.log("Delete");
});

app.post("/delete",function(req,res){
    console.log(req.body);
    user.update({ username: (loginUsername == "") ? regUsername : loginUsername }, { "$pull": { "cartItems": { "itemName": req.body.name, "sellerName": req.body.seller } }}, { safe: true, multi:true }, function(err, obj) {
        if(err){
            console.log(err);
        }else{
            console.log(obj);
            res.redirect("/buyerdashboard");
        }
    });
});

app.get("/sellerDeleteItem",function(req,res){
    console.log("Error");
});

app.post("/sellerDeleteItem",function(req,res){
    item.deleteOne({seller: loginEmail == "" ? regEmail : loginEmail, name: req.body.name, price: req.body.price, url: req.body.url, description: req.body.description},function(err,item){
        if(err){
            console.log(err);
        }else{
            console.log(item);
            res.redirect("/sellerdashboard");
        }
    });
});

var searchedItem = "";

app.get("/searchItem",function(req,res){
    var searchItems = [];
    if(authenticated == true){
        item.find({quantity: {$ne: "0"}},function(err,items){
            if(err){
                console.log(err);
            }else{
                if(items){
                    for(var i=0; i<items.length; i++){
                        if((items[i].name.toLowerCase()).includes(searchedItem.toLowerCase())){
                            searchItems.push(items[i]);
                        }
                    }
                    console.log(searchItems);
                }
            }
            res.render("search",{username: (loginUsername == "")? regUsername: loginUsername ,items: searchItems});
        });
    }
});

app.post("/searchItem",function(req,res){
    console.log(req.body.search);
    searchedItem = req.body.search;
    res.redirect("/searchItem");
});

app.listen(3000,function(){
    console.log("Server Started on port 3000");
});