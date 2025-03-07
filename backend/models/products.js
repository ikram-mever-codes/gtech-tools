import sequelize from "../config/db.js";
import Category from "./category.js";
import { DataTypes } from "sequelize";
import crypto from "crypto";

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
    },
    link: {
      type: DataTypes.STRING(2048),
      allowNull: false,
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

        if (product.link) {
          product.linkHash = crypto
            .createHash("sha256")
            .update(product.link)
            .digest("hex");
        }
      },
    },
  }
);

Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

export default Product;
