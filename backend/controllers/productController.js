import Product from "../models/products.js";
import Category from "../models/category.js";
import ErrorHandler from "../utils/errorHandler.js";

const processLink = (link) => {
  const url = new URL(link);
  const searchParams = new URLSearchParams(url.search);

  const id = searchParams.get("id");
  if (id) {
    url.search = new URLSearchParams({ id }).toString();
  } else {
    url.search = "";
  }

  return url.toString();
};

export const addProduct = async (req, res) => {
  const { title, combinations, link, isAssociated, categoryId, image } =
    req.body;
  try {
    const pLink = processLink(link);
    let product = await Product.findOne({
      where: {
        link: pLink,
      },
    });

    if (product) {
      // Parse the combinations if it's a string
      const currentCombinations = Array.isArray(product.combinations)
        ? product.combinations
        : JSON.parse(product.combinations || "[]");

      const newCombinations = combinations.filter((newComb) => {
        return !currentCombinations.some(
          (existingComb) =>
            newComb.price === existingComb.price &&
            newComb.attribute1 === existingComb.attribute1 &&
            newComb.attribute2 === existingComb.attribute2 &&
            newComb.attribute3 === existingComb.attribute3 &&
            newComb.attribute4 === existingComb.attribute4 &&
            newComb.attribute5 === existingComb.attribute5
        );
      });

      if (newCombinations.length > 0) {
        product.combinations = [...currentCombinations, ...newCombinations];
        await product.save();
      }

      return res.status(200).json({
        message: "Product already exists, combinations updated",
        updatedProduct: product,
        success: true,
      });
    } else {
      // Ensure combinations is an array
      const combinationsArray = Array.isArray(combinations)
        ? combinations
        : [combinations];

      // Create new product with first combination
      const firstCombination = combinationsArray[0];
      const newProduct = await Product.create({
        title,
        image,
        combinations: [firstCombination], // Start with just the first combination
        link: pLink,
        isAssociated,
        categoryId,
      });

      // If there are more combinations, add them
      if (combinationsArray.length > 1) {
        newProduct.combinations = combinationsArray;
        await newProduct.save();
      }

      return res.status(201).json({
        message: "Product successfully added",
        newProduct,
        success: true,
      });
    }
  } catch (error) {
    console.error("Error in adding product:", error);
    return res.status(500).json({
      message: "An error occurred while adding the product",
      error: error.message,
    });
  }
};
// Update Product
export const updateProduct = async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    await product.update(updateData);
    return res.status(200).json({
      message: "Product updated successfully",
      data: product,
      success: true,
    });
  } catch (error) {
    return next(error);
  }
};

// Get All Products
export const getAllProducts = async (req, res, next) => {
  const { categoryId } = req.query;

  try {
    const whereClause = categoryId ? { categoryId } : {};
    const products = await Product.findAll({
      where: whereClause,
      include: ["category"],
    });

    return res.status(200).json({ data: products, success: true });
  } catch (error) {
    return next(error);
  }
};

// Get Product by ID
export const getProductById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const product = await Product.findByPk(id, { include: ["category"] });
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    return res.status(200).json({ data: product, success: true });
  } catch (error) {
    return next(error);
  }
};

// Get Product by Link
export const getProductByLink = async (req, res, next) => {
  const { link } = req.query;

  try {
    const product = await Product.findOne({
      where: { link },
      include: ["category"],
    });
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    return res.status(200).json({ data: product, success: true });
  } catch (error) {
    return next(error);
  }
};

// Delete Product
export const deleteProduct = async (req, res, next) => {
  const { id } = req.params;

  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    await product.destroy();
    return res.status(200).json({
      message: "Product deleted successfully",
      success: true,
    });
  } catch (error) {
    return next(error);
  }
};
// Update scrapeCategoryProducts to handle optional attributes
export const scrapeCategoryProducts = async (req, res, next) => {
  try {
    const { title, combinations, link, categoryId, isLast, image } = req.body;

    if (!title || !combinations || !link || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const processedLink = processLink(link);

    let product = await Product.findOne({
      where: {
        link: processedLink,
        categoryId,
      },
    });

    let response;
    if (product) {
      const currentCombinations = product.combinations;
      const newCombinations = combinations.filter((newComb) => {
        return !currentCombinations.some(
          (existingComb) =>
            newComb.price === existingComb.price &&
            newComb.attribute1 === existingComb.attribute1 &&
            newComb.attribute2 === existingComb.attribute2 &&
            newComb.attribute3 === existingComb.attribute3 &&
            newComb.attribute4 === existingComb.attribute4 &&
            newComb.attribute5 === existingComb.attribute5
        );
      });

      if (newCombinations.length > 0) {
        product.combinations = [...currentCombinations, ...newCombinations];
        await product.save();
      }

      response = {
        success: true,
        message: "Product already exists, combinations updated",
        updatedProduct: product,
      };
    } else {
      const firstCombination = combinations[0];
      const newProduct = await Product.create({
        title,
        image,
        combinations: [firstCombination],
        link: processedLink,
        categoryId,
      });

      if (combinations.length > 1) {
        newProduct.combinations = combinations;
        await newProduct.save();
      }

      response = {
        success: true,
        message: "New product created",
        product: newProduct,
      };
    }

    if (isLast) {
      // Update category URLs
      const category = await Category.findByPk(categoryId);
      if (category && category.urls) {
        category.urls = category.urls.map((url) => {
          if (processLink(url.link) === processedLink) {
            return { ...url, isScrapped: true };
          }
          return url;
        });
        await category.save();
      }
    }

    return res.status(product ? 200 : 201).json(response);
  } catch (error) {
    console.error("Error in scrapeCategoryProducts:", error);
    return next(error);
  }
};
