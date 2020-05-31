module.exports = function (sequelize, DataTypes) {
  var Tickets = sequelize.define("Tickets", {
    ticketTitle: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 200],
      },
    },
    ticketText: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 50000],
      },
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1],
      },
    },
  });
  // Tickets.associate = function (models) {
  //
  // };
  Tickets.associate = function (models) {
    models.Tickets.hasMany(models.Comments, {
      onDelete: "cascade",
      foreignKey: {
        allowNull: false,
      },
    });
    models.Tickets.belongsTo(models.Customers);
    models.Tickets.belongsTo(models.Users);
  };

  return Tickets;
};
