import sequelize from "../config/db.js";
import { DataTypes } from "sequelize";
import Product from "./products.js";

const Classification = sequelize.define(
  "Classification",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: false,
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
      allowNull: true,
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
    attributeModifications: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      validate: {
        isValidModifications(value) {
          if (value === null) return;

          if (typeof value !== "object") {
            throw new Error("Attribute modifications must be an object");
          }

          for (const [attribute, mods] of Object.entries(value)) {
            if (
              !["Attributes1", "Attributes2", "Attributes3"].includes(attribute)
            ) {
              throw new Error(`Invalid attribute name: ${attribute}`);
            }

            if (mods && typeof mods === "object") {
              const validKeys = [
                "prefix",
                "suffix",
                "find",
                "replace",
                "remove",
                "formula",
              ];
              for (const key of Object.keys(mods)) {
                if (!validKeys.includes(key)) {
                  throw new Error(`Invalid modification key: ${key}`);
                }

                if (typeof mods[key] !== "string") {
                  throw new Error(`Modification ${key} must be a string`);
                }
              }
            }
          }
        },
      },
    },
    dimensionOperations: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        weight: "",
        height: "",
        length: "",
        width: "",
      },
      validate: {
        isValidDimensionOperations(value) {
          if (value === null) return;

          if (typeof value !== "object") {
            throw new Error("Dimension operations must be an object");
          }

          const validDimensions = ["weight", "height", "length", "width"];
          for (const [dimension, operation] of Object.entries(value)) {
            if (!validDimensions.includes(dimension)) {
              throw new Error(`Invalid dimension: ${dimension}`);
            }

            if (operation && typeof operation !== "string") {
              throw new Error(`Operation for ${dimension} must be a string`);
            }
          }
        },
      },
    },
    parent: {
      type: DataTypes.TEXT,
      allowNull: true,
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
