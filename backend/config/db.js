import { Sequelize } from "sequelize";

// const sequelize = new Sequelize("item-injector", "admin", "Mis@Gtech_123", {
//   host: "localhost",
//   dialect: "mysql",
//   sync: true,
// });

const sequelize = new Sequelize("item-injector", "root", "", {
  host: "localhost",
  dialect: "mysql",
  sync: true,
});

export default sequelize;
