const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema")
const sharp = require('sharp')
const path = require('path');


// LOAD PRODUCT PAGE
const loadProduct = async (req, res) => {

  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = ((page - 1) * limit)

    const query = { productName: { $regex: search, $options: "i" } };

    const products = await Product.find(query)
      .populate("category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);


    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit)

    res.render('product', {
      products,
      currentPage: page,
      totalPages,
      totalProducts,
      search,
    });
  } catch (err) {
    res.status(500).send('Error fetching products');
  }

};

//LOAD PRODUCTADD PAGE
const loadAddProduct = async (req, res) => {
  try {

    const categories = await Category.find({ isListed: true });
    res.render("productAdd", { categories });

  } catch (error) {

  }

}

// PRODUCT ADDING
const addProduct = async (req, res) => {
  try {

    const products = { ...req.body };

    const productExists = await Product.findOne({ productName: { $regex: products.name, $options: "i" } });



    if (typeof products.variants === 'string') {
      products.variants = JSON.parse(products.variants);
    }

    products.variants = products.variants
      .filter(v =>
        v.type?.trim() &&
        v.color?.trim() &&
        !isNaN(parseFloat(v.regularPrice)) &&
        !isNaN(parseFloat(v.salesPrice)) &&
        !isNaN(parseInt(v.quantity))
      )
      .map(v => ({
        ...v,
        quantity: parseInt(v.quantity),
        regularPrice: parseFloat(v.regularPrice),
        salesPrice: parseFloat(v.salesPrice),
        productImage: []
      }));


    //  console.log("Qauntity",typeof products.variants.quantity);
    //       console.log("sPrice",typeof products.variants.salesPrice);
    //       console.log("rPrice",typeof products.variants.regularPrice);

    if (!productExists) {

      products.variants.forEach(variant => {
        variant.productImage = [];
      });

      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];


          const match = file.fieldname.match(/^variants\[(\d+)\]\[productImage\]/);
          if (!match) continue;

          const variantIndex = parseInt(match[1]);


          const originalImagePath = file.path;
          const resizedImagePath = path.join('public', 'uploads', 'productImages', file.filename);

          await sharp(originalImagePath)
            .resize({ width: 440, height: 440 })
            .toFile(resizedImagePath);


          if (products.variants[variantIndex]) {
            products.variants[variantIndex].productImage.push(file.filename);
          }
        }
      }


      const categoryId = await Category.findById(products.category);
      if (!categoryId) {
        return res.status(400).json({success:false,message:"Invalid category name"});
      }

      const newProduct = new Product({
        productName: products.name,
        description: products.description,
        category: categoryId._id,
        createdOn: new Date(),
        variants: products.variants,
        status: "Available",
      });

      await newProduct.save();


      return res.redirect("/admin/product");

    } else {
      return res.status(400).json({success:false,message:"Product already exists, please try with another name"});
    }

  } catch (error) {
    console.error("Error at add product", error);
    return res.redirect('/admin/404');
  }
};

// LOAD EDIT PRODUCT
const loadEditProduct = async (req, res) => {
  try {
    const id = req.params.id
    const product = await Product.findById(id)

    const categories = await Category.find({ isListed: true })

    res.render("productEdit", {
      product, categories
    })
  } catch (error) {

  }
}

// LIST & UNLIST PRODUCT
const listProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const item = await Product.findOne({ _id: id });

    const newStatus = !item.isBlocked;

    await Product.updateOne({ _id: id }, { $set: { isBlocked: newStatus } });

    res.json({
      success: true,
      isBlocked: newStatus,
    });
  } catch (error) {
    console.log("Error at listProduct", error);
    res.status(500).json({ success: false });
  }
};


// EDIT PRODUCT
const editProduct = async (req, res) => {
  try {
    const id = req.params.id
    const products = req.body;

    const exist = await Product.findOne({ _id: id })



    if (!exist) return res.redirect('/admin/product');

    if (typeof products.variants === "string") {
      products.variants = JSON.parse(products.variants);
    }

    products.variants.forEach((variant, index) => {
      variant.productImage = [];

      if (products.variants[index].existingImage) {

        const existing = products.variants[index].existingImage;
        variant.productImage = Array.isArray(existing) ? existing : [existing];
      }
    })

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i]
        const match = file.fieldname.match(/^variants\[(\d+)\]\[productImage\]/)
        if (!match) continue;

        const variantIndex = parseInt(match[1])

        const originalImagePath = file.path
        const resizedImagePath = path.join('public', 'uploads', 'productImages', file.filename);

        await sharp(originalImagePath)
          .resize({ width: 440, height: 440 })
          .toFile(resizedImagePath);

        if (products.variants[variantIndex]) {

          products.variants[variantIndex].productImage.push(file.filename)

        }

      }
    }

    console.log("Product Updated");

    await Product.findByIdAndUpdate(id, {
      productName: products.name,
      description: products.description,
      category: products.category,
      variants: products.variants
    });
    return res.redirect("/admin/product");
  } catch (error) {
    console.error("Error at productEditing", error)
    return res.redirect("/admin/404")
  }
}

module.exports = { loadProduct, addProduct, loadAddProduct, loadEditProduct, listProduct, editProduct }