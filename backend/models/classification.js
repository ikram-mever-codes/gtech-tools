import sequelize from "../config/db.js";
import { DataTypes } from "sequelize";
import Product from "./products.js";

const Classification = sequelize.define(
  "Classification",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "classifications",
    timestamps: true,
  }
);

const SubClass = sequelize.define(
  "SubClass",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    numberOfAttributes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    classificationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Classification,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  },
  {
    tableName: "subclasses",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["name", "classificationId"],
      },
    ],
  }
);

const ProductSubClass = sequelize.define(
  "ProductSubClass",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Product,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    subClassId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: SubClass,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    addedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "product_subclasses",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["productId", "subClassId"],
      },
    ],
  }
);

Classification.hasMany(SubClass, {
  foreignKey: "classificationId",
  as: "subClasses",
});
SubClass.belongsTo(Classification, {
  foreignKey: "classificationId",
  as: "classification",
});

Product.belongsToMany(SubClass, {
  through: ProductSubClass,
  foreignKey: "productId",
  otherKey: "subClassId",
  as: "subClasses",
});
SubClass.belongsToMany(Product, {
  through: ProductSubClass,
  foreignKey: "subClassId",
  otherKey: "productId",
  as: "products",
});

export { Classification, SubClass, ProductSubClass };
