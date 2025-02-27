import sequelize from "../config/db.js";
import Category from "./category.js";
import { DataTypes } from "sequelize";

const Product = sequelize.define(
  "Product",
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    combinations: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      get() {
        const value = this.getDataValue("combinations");
        return value ? (Array.isArray(value) ? value : JSON.parse(value)) : [];
      },
      set(value) {
        this.setDataValue(
          "combinations",
          Array.isArray(value) ? value : JSON.parse(value || "[]")
        );
      },
      validate: {
        isArrayWithValidStructure(value) {
          // Ensure value is an array
          const combinations = Array.isArray(value)
            ? value
            : JSON.parse(value || "[]");

          if (!Array.isArray(combinations)) {
            throw new Error("Combinations must be an array");
          }

          const seenCombinations = new Set();

          combinations.forEach((combination) => {
            // Check if price exists (only required field)
            if (!combination.price) {
              throw new Error("Each combination must have a price");
            }

            // Validate types for present attributes
            if (typeof combination.price !== "string") {
              throw new Error("Price must be a string");
            }

            // Only validate attributes that are present
            const attributeValidations = {
              attribute1: combination.attribute1,
              attribute2: combination.attribute2,
              attribute3: combination.attribute3,
              attribute4: combination.attribute4,
              attribute5: combination.attribute5,
            };

            Object.entries(attributeValidations).forEach(([key, value]) => {
              if (
                value !== undefined &&
                value !== null &&
                typeof value !== "string"
              ) {
                throw new Error(`${key} must be a string when present`);
              }
            });

            // Create combination key only with present attributes
            const combinationObj = {
              price: combination.price,
            };

            if (combination.attribute1)
              combinationObj.attribute1 = combination.attribute1;
            if (combination.attribute2)
              combinationObj.attribute2 = combination.attribute2;
            if (combination.attribute3)
              combinationObj.attribute3 = combination.attribute3;
            if (combination.attribute4)
              combinationObj.attribute4 = combination.attribute4;
            if (combination.attribute5)
              combinationObj.attribute5 = combination.attribute5;

            const combinationKey = JSON.stringify(combinationObj);

            if (seenCombinations.has(combinationKey)) {
              throw new Error("Duplicate combinations are not allowed");
            }

            seenCombinations.add(combinationKey);
          });
        },
      },
    },
    link: {
      type: DataTypes.STRING(2048),
      allowNull: false,
      unique: {
        name: "link_unique",
        length: 255,
      },
    },
    isAssociated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Category,
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
  },
  {
    tableName: "products",
    timestamps: false,
    hooks: {
      beforeSave: (product) => {
        if (product.isAssociated && !product.categoryId) {
          throw new Error(
            "categoryId must be present when isAssociated is true"
          );
        }
      },
    },
  }
);

Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

export default Product;
