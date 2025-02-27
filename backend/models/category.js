import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Shop from "./shops.js";

const Category = sequelize.define(
  "Category",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    last_scrapped: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    urls: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "shops",
        key: "id",
      },
    },
  },
  {
    tableName: "categories",
    timestamps: false,
    hooks: {
      beforeSave: (category) => {
        if (category.urls) {
          const uniqueUrls = [];
          const seenLinks = new Set();

          category.urls.forEach((url) => {
            if (!seenLinks.has(url.link)) {
              seenLinks.add(url.link);
              uniqueUrls.push(url);
            }
          });

          category.urls = uniqueUrls;
        }
      },
    },
  }
);

// Define the association
Category.belongsTo(Shop, {
  foreignKey: "shopId",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Shop.hasMany(Category, {
  foreignKey: "shopId",
});

export default Category;
