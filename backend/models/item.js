import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Category from "./category.js";

const Item = sequelize.define(
  "Item",
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    price: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    attribute1: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    attribute2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    attribute3: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    attribute4: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    attribute5: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "items",
    timestamps: true,
  }
);

Item.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});

export default Item;
