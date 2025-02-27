import { sequelize } from "../index.mjs";
import {
  Classification,
  SubClass,
  ProductSubClass,
} from "../models/classification.js";
import Product from "../models/products.js";
import ErrorHandler from "../utils/errorHandler.js";
export const createClassification = async (req, res, next) => {
  const { name, description, subClasses } = req.body;

  try {
    const result = await sequelize.transaction(async (t) => {
      const classification = await Classification.create(
        {
          name,
          description,
        },
        { transaction: t }
      );

      if (subClasses && Array.isArray(subClasses)) {
        const subClassPromises = subClasses.map((subClass) =>
          SubClass.create(
            {
              name: subClass.name,
              description: subClass.description,
              classificationId: classification.id,
              numberOfAttributes: subClass.numberOfAttributes || 0, // Add this field
            },
            { transaction: t }
          )
        );

        await Promise.all(subClassPromises);
      }

      return await Classification.findByPk(classification.id, {
        include: [{ model: SubClass, as: "subClasses" }],
        transaction: t,
      });
    });

    return res.status(201).json({
      success: true,
      message: "Classification created successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};
export const updateClassification = async (req, res, next) => {
  const { id } = req.params;
  const { name, description, subClasses, isActive } = req.body;

  try {
    const result = await sequelize.transaction(async (t) => {
      const classification = await Classification.findByPk(id, {
        transaction: t,
      });

      if (!classification) {
        return next(new ErrorHandler("Classification not found", 404));
      }

      // Update main classification
      await classification.update(
        { name, description, isActive },
        { transaction: t }
      );

      // If subClasses are provided, update them
      if (subClasses && Array.isArray(subClasses)) {
        // Get existing subClass IDs
        const existingSubClasses = await SubClass.findAll({
          where: { classificationId: id },
          transaction: t,
        });

        const existingIds = existingSubClasses.map((sc) => sc.id);
        const updatedIds = subClasses.filter((sc) => sc.id).map((sc) => sc.id);

        // Delete removed subClasses
        const idsToDelete = existingIds.filter(
          (id) => !updatedIds.includes(id)
        );
        if (idsToDelete.length) {
          await SubClass.destroy({
            where: { id: idsToDelete },
            transaction: t,
          });
        }

        // Update or create subClasses
        for (const subClass of subClasses) {
          if (subClass.id) {
            await SubClass.update(
              {
                name: subClass.name,
                description: subClass.description,
                isActive: subClass.isActive,
                numberOfAttributes: subClass.numberOfAttributes || 0, // Add this field
              },
              {
                where: { id: subClass.id },
                transaction: t,
              }
            );
          } else {
            await SubClass.create(
              {
                ...subClass,
                classificationId: id,
                numberOfAttributes: subClass.numberOfAttributes || 0, // Add this field
              },
              { transaction: t }
            );
          }
        }
      }

      // Return updated classification with subClasses
      return await Classification.findByPk(id, {
        include: [{ model: SubClass, as: "subClasses" }],
        transaction: t,
      });
    });

    return res.status(200).json({
      success: true,
      message: "Classification updated successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

// Delete classification and all its sub-classes
export const deleteClassification = async (req, res, next) => {
  const { id } = req.params;

  try {
    const classification = await Classification.findByPk(id);

    if (!classification) {
      return next(new ErrorHandler("Classification not found", 404));
    }

    // This will automatically delete all subClasses due to CASCADE
    await classification.destroy();

    return res.status(200).json({
      success: true,
      message: "Classification deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

// Get classification with all details
export const getClassificationDetails = async (req, res, next) => {
  const { id } = req.params;

  try {
    const classification = await Classification.findByPk(id, {
      include: [
        {
          model: SubClass,
          as: "subClasses",
          include: [
            {
              model: Product,
              as: "products",
              through: {
                model: ProductSubClass,
                attributes: ["addedBy", "notes"],
              },
            },
          ],
        },
      ],
    });

    if (!classification) {
      return next(new ErrorHandler("Classification not found", 404));
    }

    return res.status(200).json({
      success: true,
      data: classification,
    });
  } catch (error) {
    return next(error);
  }
};

// Get all classifications
export const getAllClassifications = async (req, res, next) => {
  try {
    const classifications = await Classification.findAll({
      include: [{ model: SubClass, as: "subClasses" }],
    });

    return res.status(200).json({
      success: true,
      data: classifications,
    });
  } catch (error) {
    return next(error);
  }
};

// Add products to a sub-class
export const addProductsToSubClass = async (req, res, next) => {
  const { subClassId } = req.params;
  const { productIds, addedBy, notes } = req.body;

  try {
    const result = await sequelize.transaction(async (t) => {
      // Verify subClass exists
      const subClass = await SubClass.findByPk(subClassId, { transaction: t });
      if (!subClass) {
        return next(new ErrorHandler("SubClass not found", 404));
      }

      // Verify all products exist
      const products = await Product.findAll({
        where: { id: productIds },
        transaction: t,
      });

      if (products.length !== productIds.length) {
        return next(new ErrorHandler("Some products were not found", 404));
      }

      // Filter products based on the number of attributes
      const validProducts = products.filter((product) => {
        const combinations = product.combinations
          ? Array.isArray(product.combinations)
            ? product.combinations
            : JSON.parse(product.combinations)
          : [];
        const firstCombination = combinations[0] || {};
        const numberOfAttributes = Object.keys(firstCombination).filter(
          (key) => key.startsWith("attribute") && firstCombination[key]
        ).length;
        return numberOfAttributes === subClass.numberOfAttributes;
      });

      if (validProducts.length === 0) {
        return next(
          new ErrorHandler(
            "No products match the required number of attributes",
            400
          )
        );
      }

      // Create associations only for valid products
      const associations = validProducts.map((product) => ({
        productId: product.id,
        subClassId,
        addedBy,
        notes,
      }));

      await ProductSubClass.bulkCreate(associations, {
        ignoreDuplicates: true,
        transaction: t,
      });

      // Return updated subClass with products
      return await SubClass.findByPk(subClassId, {
        include: [
          {
            model: Product,
            as: "products",
            through: {
              attributes: ["addedBy", "notes"],
            },
          },
        ],
        transaction: t,
      });
    });

    return res.status(200).json({
      success: true,
      message: "Products added to subClass successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

// Remove products from a sub-class
export const removeProductsFromSubClass = async (req, res, next) => {
  const { subClassId } = req.params;
  const { productIds } = req.body;

  try {
    await ProductSubClass.destroy({
      where: {
        subClassId,
        productId: productIds,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Products removed from subClass successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export const getProductsBySubClass = async (req, res, next) => {
  const { subClassId } = req.params;

  try {
    const subClass = await SubClass.findByPk(subClassId, {
      include: [
        {
          model: Product,
          as: "products",
          through: {
            attributes: ["addedBy", "notes"],
          },
        },
      ],
    });

    if (!subClass) {
      return next(new ErrorHandler("SubClass not found", 404));
    }

    return res.status(200).json({
      success: true,
      data: subClass.products,
    });
  } catch (error) {
    return next(error);
  }
};

export const getSubClassDetails = async (req, res, next) => {
  const { id } = req.params;

  try {
    const subClass = await SubClass.findByPk(id, {
      include: [
        {
          model: Classification,
          as: "classification",
        },
        {
          model: Product,
          as: "products",
          through: {
            model: ProductSubClass,
            attributes: ["addedBy", "notes"],
          },
        },
      ],
    });

    if (!subClass) {
      return next(new ErrorHandler("SubClass not found", 404));
    }

    return res.status(200).json({
      success: true,
      data: subClass,
    });
  } catch (error) {
    return next(error);
  }
};
