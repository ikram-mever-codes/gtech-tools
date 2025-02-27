import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Shop = sequelize.define(
  "Shop",
  {
    shopName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shopURL: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shopLogo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "shops",
    timestamps: false,
  }
);

export default Shop;
