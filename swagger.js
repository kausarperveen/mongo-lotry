const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'Shib Lottery',
      description: 'it gives information about lottry system',
      version: '1.0.0',
    },
  },
  apis: ['./routes/index.js'],// Path to the API routes files
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};
