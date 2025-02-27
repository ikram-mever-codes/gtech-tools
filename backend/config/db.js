import { Sequelize } from "sequelize";

const sequelize = new Sequelize("item-injector", "root", "NewStrongPassword", {
  host: "localhost",
  dialect: "mysql",
  sync: true,
});

export default sequelize;
