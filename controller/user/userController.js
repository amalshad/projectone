const User = require("../../models/userSchema")
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema")
const Cart=require("../../models/cartSchema")


// LOAD HOME
const loadHome = async (req, res) => {
  try {
    const categories = await Category.find({ isListed: true })
    const cat = categories.map(v => v._id)
    const products = await Product.find({ isBlocked: false, category: { $in: cat } })

    let user = req.session.passport?.user || req.session.user

    userData = await User.findById(user);




    res.render("home", {
      user: userData,
      title: 'Shad Electro',
      products,
      categories,

    })

  } catch (error) {
    console.log("ERROR", error)
    res.status(500).send("Server Error")
  }
}

// PAGE NOT FOUND
const pageNotFound = async (req, res) => {
  try {

    res.status(404).render('notfound', {
      title: 'Page Not Found - Shad Electro'
    });

  } catch (error) {
    console.log("ERROR", error)
    res.status(500).send("Server Error")
  }
}


//LOAD SHOP
const loadShop = async (req, res) => {
  try {
    const { category, priceRange, sort, search } = req.query;
    const filter = { isBlocked: false };
    const sortOption = {};
    // category.isListed=true


    if (category) {
      filter.category = category;

    } else {
      const foundCat = await Category.find({ isListed: true })
      filter.category = foundCat.map(v => v._id)
    }
    let minPrice = 100;
    let maxPrice = 2000;

    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        minPrice = min;
        maxPrice = max;
      }
    }



    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);

      if (min && max) {
        filter.$or = [
          { 'variants.salesPrice': { $gte: min, $lte: max } },
          { 'variants.regularPrice': { $gte: min, $lte: max } }
        ];
      }
    }


    if (search) {
      filter.productName = { $regex: search, $options: "i" };
    }


    if (sort === 'price_asc') {
      sortOption['variants.0.salesPrice'] = 1;
    } else if (sort === 'price_desc') {
      sortOption['variants.0.salesPrice'] = -1;
    } else if (sort === 'name_asc') {
      sortOption.productName = 1;
    } else if (sort === 'name_desc') {
      sortOption.productName = -1;
    }


    const products = await Product.find(filter).sort(sortOption);
    const categories = await Category.find({ isListed: true });


    let selectedCategoryName = '';
    if (category) {
      const categoryObj = await Category.findById(category);
      if (categoryObj) {
        selectedCategoryName = categoryObj.name;
      }
    }



    let user = req.session.passport?.user || req.session.user
    userData = await User.findById(user);

    res.render("shop", {
      products,
      title: 'ShadElectro',
      categories,
      user: userData,
      selectedCategory: category || '',
      selectedCategoryName,
      priceRange: priceRange || '',
      sort: sort || 'recommended',
      search: search || "",
      minPrice,
      maxPrice,
    });
  } catch (error) {
    console.error("Shop page error:", error);
    res.status(500).render("error", { message: "Something went wrong" });
  }
};

// LOAD PRODUCT DETAIL
const loadProductDetail = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const categories = await Category.find();

    if (!product) return res.status(404).render("notfound", { message: "Product not found" });

    const user = req.session.passport?.user || req.session.user;
    const userData = await User.findById(user);
    const cart = await Cart.findOne({ userId: user });

    // Adjust stock based on cart
    if (cart) {
      cart.items.forEach(item => {
        if (item.productId.toString() === product._id.toString()) {
          const variant = product.variants[item.variantIndex];
          if (variant) {
            variant.quantity -= item.quantity;
            if (variant.quantity < 0) variant.quantity = 0;
          }
        }
      });
    }

    const relatedProduct = await Product.find({
      category: product.category,
      isBlocked: false,
      _id: { $ne: req.params.id }
    });

    res.render("product-detail", {
      title: "Shad Electro",
      product,
      relatedProduct,
      user: userData,
      categories
    });
  } catch (err) {
    console.error("Product Detail Error:", err);
    res.status(500).render("notfound", { message: "Something went wrong" });
  }
};






module.exports = {
  loadHome,
  pageNotFound,
  loadShop,
  loadProductDetail,
}