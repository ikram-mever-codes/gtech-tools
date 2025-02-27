// controllers/shopController.js
import Shop from "../models/shops.js";
import Category from "../models/category.js";
import ErrorHandler from "../utils/errorHandler.js";

// Create a new shop
export const createShop = async (req, res, next) => {
  try {
    const { shopName, shopURL, shopLogo } = req.body;

    if (!shopName || !shopURL) {
      return next(new ErrorHandler("Shop name and URL are required", 400));
    }

    const newShop = await Shop.create({
      shopName,
      shopURL,
      shopLogo,
    });

    return res.status(201).json({
      success: true,
      message: "Shop created successfully",
      data: newShop,
    });
  } catch (err) {
    next(err);
  }
};

// Get a single shop by ID
export const getShopById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findByPk(id);

    if (!shop) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    return res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (err) {
    next(err);
  }
};

// Get all shops
export const getAllShops = async (req, res, next) => {
  try {
    const shops = await Shop.findAll();

    if (shops.length === 0) {
      return next(new ErrorHandler("No shops found", 404));
    }

    return res.status(200).json({
      success: true,
      data: shops,
    });
  } catch (err) {
    next(err);
  }
};

// Update shop by ID
export const updateShop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { shopName, shopURL, shopLogo } = req.body;

    const shop = await Shop.findByPk(id);

    if (!shop) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    // Update shop with provided details
    await shop.update({ shopName, shopURL, shopLogo });

    return res.status(200).json({
      success: true,
      message: "Shop updated successfully",
      data: shop,
    });
  } catch (err) {
    next(err);
  }
};

// Delete a shop by ID
export const deleteShop = async (req, res, next) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findByPk(id);

    if (!shop) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    await shop.destroy();

    return res.status(200).json({
      success: true,
      message: "Shop deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

// Get all categories of a shop
export const getAllCategories = async (req, res, next) => {
  try {
    const { shopId } = req.params;

    const shop = await Shop.findByPk(shopId);

    if (!shop) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    const categories = await Category.findAll({
      where: { shopId },
    });

    if (categories.length === 0) {
      return next(new ErrorHandler("No categories found for this shop", 404));
    }

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
};
