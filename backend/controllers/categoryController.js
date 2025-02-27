// controllers/categoryController.js
import Category from "../models/category.js";
import Product from "../models/products.js";
import Shop from "../models/shops.js";
import ErrorHandler from "../utils/errorHandler.js";

// Create a new category for a shop
export const createCategory = async (req, res, next) => {
  try {
    const { name, link, image, last_scrapped, urls, shopId } = req.body;

    // Validation for required fields
    if (!name || !shopId) {
      return next(
        new ErrorHandler("Category name and shop ID are required", 400)
      );
    }

    // Validate shopId is a number
    const shopIdNum = parseInt(shopId);
    if (isNaN(shopIdNum)) {
      return next(new ErrorHandler("Invalid shop ID format", 400));
    }

    // Check if shop exists using the association
    const shop = await Shop.findByPk(shopIdNum);
    if (!shop) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    // Prepare category data
    const categoryData = {
      name: name.trim(),
      shopId: shopIdNum,
      ...(link && { link: link.trim() }),
      ...(image && { image: image.trim() }),
      ...(last_scrapped && { last_scrapped: new Date(last_scrapped) }),
      urls: Array.isArray(urls)
        ? urls
        : typeof urls === "string"
        ? JSON.parse(urls)
        : [],
    };

    // Create the category using the association
    const newCategory = await shop.createCategory(categoryData);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (err) {
    console.error("Error creating category:", err);
    return next(
      new ErrorHandler(
        err.message || "Error creating category",
        err.status || 500
      )
    );
  }
};

// Update a category by ID
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, link, image, last_scrapped, urls, shopId } = req.body;

    const category = await Category.findByPk(id);

    if (!category) {
      return next(new ErrorHandler("Category not found", 404));
    }

    // Update category
    await category.update({ name, link, image, last_scrapped, urls, shopId });

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

// Delete a category by ID
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return next(new ErrorHandler("Category not found", 404));
    }

    await category.destroy();

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

// Fetch all categories or categories for a specific shop
export const getCategories = async (req, res, next) => {
  try {
    const { shopId } = req.query;

    let categories;
    if (shopId) {
      categories = await Category.findAll({
        where: { shopId },
      });

      if (!categories.length) {
        return next(new ErrorHandler("No categories found for this shop", 404));
      }
    } else {
      categories = await Category.findAll();
    }

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
};

// Add URLs to a category
export const addUrlsToCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls)) {
      console.log("Invalid URLs format:", urls);
      return next(new ErrorHandler("URLs must be provided as an array", 400));
    }
    const updatedUrls = urls.map((url) => {
      return {
        link: url.link,
        lastScrapped: url.lastScrapped || null,
        isScrapped: url.isScrapped !== undefined ? url.isScrapped : false,
      };
    });

    const category = await Category.findByPk(id);

    if (!category) {
      return next(new ErrorHandler("Category not found", 404));
    }

    // Ensure existing URLs is always an array
    let existingUrls = [];
    try {
      existingUrls = Array.isArray(category.urls)
        ? category.urls
        : JSON.parse(category.urls) || [];
    } catch (e) {
      existingUrls = [];
    }

    // Check if existingUrls is still not an array after parsing
    if (!Array.isArray(existingUrls)) {
      existingUrls = [];
    }

    const seenLinks = new Set();
    const mergedUrls = [
      ...existingUrls.filter((url) => {
        if (!url || !url.link || seenLinks.has(url.link)) return false;
        seenLinks.add(url.link);
        return true;
      }),
      ...updatedUrls.filter((url) => {
        if (!url || !url.link || seenLinks.has(url.link)) return false;
        seenLinks.add(url.link);
        return true;
      }),
    ];

    await category.update({ urls: mergedUrls });

    return res.status(200).json({
      success: true,
      message: "URLs added successfully to the category",
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

// Get a single category by ID
export const getCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return next(new ErrorHandler("Category not found", 404));
    }
    console.log(category);
    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

// Scrape Category Products
export const scrapeCategoryProduct = async (req, res, next) => {
  try {
    const { categoryId, productId, title, combinations, link, image, isLast } =
      req.body;

    // Validate required fields
    if (!categoryId || !productId || !title || !link || !image) {
      return next(new ErrorHandler("Missing required fields", 400));
    }

    // Find the category by ID
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return next(new ErrorHandler("Category not found", 404));
    }

    // Find or create the product in the category
    let product = await Product.findOne({
      where: {
        id: productId,
        categoryId: categoryId,
      },
    });

    if (!product) {
      product = await Product.create({
        id: productId,
        title,
        image,
        combinations: [],
        link,
        categoryId,
        isAssociated: true,
      });
    }

    // Parse the existing combinations
    const currentCombinations = Array.isArray(product.combinations)
      ? product.combinations
      : JSON.parse(product.combinations || "[]");

    // Filter out duplicate combinations
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

    // If there are new combinations, add them to the product
    if (newCombinations.length > 0) {
      product.combinations = [...currentCombinations, ...newCombinations];
      await product.save();
    }

    if (isLast) {
      await category.update({ last_scrapped: new Date() });
    }

    return res.status(200).json({
      success: true,
      message: "Product scraped successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
