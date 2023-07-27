"use strict";

//Server
const Hapi = require("@hapi/hapi");
const Inert = require("@hapi/inert");
const Vision = require("@hapi/vision");
const Pack = require("./package");
const hapiswagger = require("hapi-swagger");
const Joi = require("joi");
const authKeycloak = require("hapi-auth-keycloak");
const {
  keycloakGeneralConfig,
  keycloakGeneralAuthConfig,
} = require("./keycloak-config");

const fs = require("fs");
const replyCache = require("./replyCache");
const robotCache = require("./robotCache");
const amqp = require("./amqp");
const config = require("./config");
require("dotenv").config();

var tls = {
  key: fs.readFileSync(process.env.KEY_PATH),
  cert: fs.readFileSync(process.env.CERT_PATH),
};

(async () => {
  /*  create new HAPI service  */
  const server = new Hapi.Server({
    host: "0.0.0.0",
    port: process.env.API_PORT,
    // tls
  });

  server.events.on("response", function (request) {
    console.log(
      new Date().toISOString() +
        " " +
        request.info.remoteAddress +
        ": " +
        request.method.toUpperCase() +
        " " +
        request.path +
        " --> " +
        request.response.statusCode
    );
  });

  amqp.sub("ListRobotsAtTurnstileRequest");
  amqp.sub("TurnstileCheckPermissionRequest");
  amqp.sub("DoorData");
  amqp.sub("ListRobotsAtLiftRequest");
  amqp.sub("LiftCheckPermissionRequest");
  amqp.sub("DoorCheckPermissionRequest");
  amqp.sub("ListRobotsAtSecurityRequest");

  const swaggerOptions = {
    info: {
      title: "Robot API Documentation",
      version: Pack.version,
    },
    securityDefinitions: {
      jwt: {
        type: "apiKey",
        name: "Authorization",
        in: "header",
      },
    },
    security: [{ jwt: [] }],
  };

  await server.register([
    Inert,
    Vision,
    {
      plugin: hapiswagger,
      options: swaggerOptions,
    },
    {
      plugin: authKeycloak,
    },
  ]);
  server.auth.strategy("keycloak-jwt", "keycloak-jwt", keycloakGeneralConfig);

  server.route([
    {
      //6.1
      method: "POST",
      path: "/robot/tcm/v1/register",
      options: {
        auth: keycloakGeneralAuthConfig,
        handler: async (request, h) => {
          var payload = request.payload;
          var requestID = "ROBOTAPI" + Date.now();
          payload.requestID = requestID;

          amqp.sendProto(payload, "SecurityCheckpointRequest");
          const response = h.response({
            robotID: request.payload.robotID,
            message: "Received Request",
            timestamp: new Date().toISOString(),
          });
          response.header("Authorization", request.headers.authorization);
          return response.code(200);
        },
        description: "6.1",
        tags: ["api"],
        validate: {
          payload: Joi.object({
            arrived: Joi.boolean()
              .required()
              .description(
                "Whether robot is physically at security checkpoint"
              ),
            destination: Joi.array()
              .items(Joi.string().description("Destination Point"))
              .required()
              .description("List of destination points"),
            robotID: Joi.string().required().description("Robot ID"),
            vendorID: Joi.string().required().description("Vendor ID"),
            url: Joi.string().required().description("Webhook URL"),
            key: Joi.string().required(),
            keyType: Joi.string().required(),
            timestamp: Joi.string().description("Timestamp in ISO 8601 format"),
          }),
        },
      },
    },
    {
      //6.2
      method: "GET",
      path: "/robot/tcm/v1/security-list",
      options: {
        auth: keycloakGeneralAuthConfig,
        handler: async (request, h) => {
          const cached_data = replyCache.getCachedData(
            "ListRobotsAtSecurityRequest"
          );
          var robot_list = [];
          if (cached_data) {
            robot_list = cached_data.robotIDs;
          }
          const data = {
            robotIDs: robot_list,
            timestamp: new Date().toISOString(),
          };
          const response = h.response(data);
          response.header("Authorization", request.headers.authorization);
          return response.code(200);
        },
        description: "6.2",
        tags: ["api"],
        validate: {
          query: Joi.object({
            vendorID: Joi.string().required().description("Vendor ID"),
            timestamp: Joi.string().description("Timestamp in ISO 8601 format"),
          }),
        },
      },
    },
    {
      //6.3
      method: "POST",
      path: "/robot/tcm/v1/holdingzone-turnstile",
      options: {
        auth: keycloakGeneralAuthConfig,
        handler: async (request, h) => {
          var payload = request.payload;
          var requestID = "ROBOTAPI" + Date.now();
          payload.requestID = requestID;

          amqp.sendProto(payload, "TurnstileAccessRequest");
          const response = h.response({
            robotID: request.payload.robotID,
            message: "Received Request",
            timestamp: new Date().toISOString(),
          });
          response.header("Authorization", request.headers.authorization);
          return response.code(200);
        },
        description: "6.3",
        tags: ["api"],
        validate: {
          payload: Joi.object({
            arrived: Joi.boolean()
              .required()
              .description("Whether robot is physically at holding zone"),
            robotID: Joi.string().required().description("Robot ID"),
            vendorID: Joi.string().required().description("Vendor ID"),
            turnstileID: Joi.number().required().description("Turnstile ID"),
            zone: Joi.string()
              .valid("ENTER", "EXIT")
              .required()
              .description("Enter or exit zone"),
            timestamp: Joi.string().description("Timestamp in ISO 8601 format"),
          }),
        },
      },
    },
    {
      //6.4
      method: "GET",
      path: "/robot/tcm/v1/holdingzone-turnstile",
      options: {
        auth: keycloakGeneralAuthConfig,
        handler: async (request, h) => {
          const cached_data = replyCache.getCachedData(
            "ListRobotsAtTurnstileRequest"
          );
          const robot_list = [];
          if (cached_data) {
            for (var i = 0; i < cached_data["robotIDs"].length; i++) {
              var split_string = cached_data["robotIDs"][i].split("_");
              if (split_string[0] === request.query.vendorID) {
                robot_list.push(split_string[1]);
              }
            }
          }
          const data = {
            robotIDs: robot_list,
            timestamp: new Date().toISOString(),
          };
          const response = h.response(data);
          response.header("Authorization", request.headers.authorization);
          return response.code(200);
        },
        description: "6.4",
        tags: ["api"],
        validate: {
          query: Joi.object({
            vendorID: Joi.string().required().description("Vendor ID"),
            zone: Joi.string()
              .valid("ENTER", "EXIT")
              .required()
              .description("Enter or exit zone"),
            timestamp: Joi.string().description("Timestamp in ISO 8601 format"),
          }),
        },
      },
    },
    {
      //6.5
      method: "GET",
      path: "/robot/tcm/v1/accesspoint-turnstile",
      options: {
        auth: keycloakGeneralAuthConfig,
        handler: async (request, h) => {
          const cached_data = replyCache.getCachedData(
            "TurnstileCheckPermissionRequest"
          );
          var go = false;
          if (cached_data) {
            console.log(
              cached_data.approvedRobots[
                request.query.vendorID + "_" + request.query.robotID
              ]
            );
            if (
              cached_data.approvedRobots[
                request.query.zone +
                  "_" +
                  request.query.vendorID +
                  "_" +
                  request.query.robotID
              ] == request.query.turnstileID
            ) {
              go = true;
            }
          }
          const data = {
            robotID: request.query.robotID,
            turnstile: request.query.turnstileID,
            go: go,
            zone: request.query.zone,
            timestamp: new Date().toISOString(),
          };
          const response = h.response(data);
          response.header("Authorization", request.headers.authorization);
          return response.code(200);
        },
        description: "6.5",
        tags: ["api"],
        validate: {
          query: Joi.object({
            robotID: Joi.string().required().description("Robot ID"),
            vendorID: Joi.string().required().description("Vendor ID"),
            turnstileID: Joi.number().required().description("Turnstile ID"),
            zone: Joi.string()
              .valid("ENTER", "EXIT")
              .required()
              .description("Enter or exit zone"),
            timestamp: Joi.string().description("Timestamp in ISO 8601 format"),
          }),
        },
      },
    },
    {
      //6.6
      method: "POST",
      // path: '/robot/tcm/v1/turnstile',
      path: "/robot/v1/turnstile",
      options: {
        auth: keycloakGeneralAuthConfig,
        handler: async (request, h) => {
          var message =
            "Invalid Request - Open and close cannot have same values";
          if (request.payload.open != request.payload.close) {
            message = "Received Request";

            var payload = request.payload;
            var requestID = "ROBOTAPI" + Date.now();
            payload.requestID = requestID;

            amqp.sendProto(request.payload, "TurnstileControlMessage");
            amqp.sendProto(payload, "RPCRequest");

            robotCache.setRobotTurnstile(
              request.payload.robotID,
              request.payload.vendorID,
              request.payload.turnstileID
            );
          }
          const response = h.response({
            robotID: request.payload.robotID,
            turnstile: request.query.turnstileID,
            message: message,
            timestamp: new Date().toISOString(),
          });
          response.header("Authorization", request.headers.authorization);
          return response.code(200);
        },
        description: "6.6",
        tags: ["api"],
        validate: {
          payload: Joi.object({
            robotID: Joi.string().required().description("Robot ID"),
            vendorID: Joi.string().required().description("Vendor ID"),
            turnstileID: Joi.number().required().description("Turnstile ID"),
            zone: Joi.string()
              .valid("ENTER", "EXIT")
              .required()
              .description("Enter or exit zone"),
            open: Joi.boolean().description("Whether to open turnstile"),
            close: Joi.boolean().description("Whether to close turnstile"),
            timestamp: Joi.string().description("Timestamp in ISO 8601 format"),
          }),
        },
      },
    },
    {
      //6.7
      method: "GET",
      // path: '/robot/tcm/v1/turnstile',
      path: "/robot/v1/turnstile",
      options: {
        auth: keycloakGeneralAuthConfig,
        handler: async (request, h) => {
          const cached_data = replyCache.getCachedData("DoorData");

          var turnstile = null;
          var opened = null;
          if (cached_data) {
            var turnstileID = robotCache.getRobotTurnstile(
              request.query.robotID,
              request.query.vendorID
            );
            turnstile = config.turnstiles[turnstileID];
            const reading = cached_data["doorReading"].filter(
              (reading) => reading.doorName == turnstile
            )[0];

            if (reading) {
              opened = reading.status === "OPEN";
            }
          }

          const data = {
            turnstileID: turnstileID,
            isOpened: opened,
            message: "ACCEPTED",
            robotID: request.query.robotID,
            timestamp: new Date().toISOString(),
          };
          const response = h.response(data);
          response.header("Authorization", request.headers.authorization);
          return response.code(200);
        },
        description: "6.7",
        tags: ["api"],
        validate: {
          query: Joi.object({
            robotID: Joi.string().required().description("Robot ID"),
            vendorID: Joi.string().required().description("Vendor ID"),
            timestamp: Joi.string().description("Timestamp in ISO 8601 format"),
          }),
        },
      },
    },
    {
      //6.8
      method: "POST",
      path: "/robot/tcm/v1/holdingzone-lift",
      options: {
        auth: keycloakGeneralAuthConfig,
        handler: async (request, h) => {
          var message =
            "Invalid Request - levels must be more than 0 and less than 31";
          var boardingLevel = request.payload.boardingLevel;
          var destinationLevel = request.payload.destinationLevel;

          if (
            boardingLevel > 0 &&
            boardingLevel <= 31 &&
            destinationLevel > 0 &&
            destinationLevel <= 31
          ) {
            message = "Received Request";

            var payload = request.payload;
            var requestID = "ROBOTAPI" + Date.now();
            payload.requestID = requestID;

            amqp.sendProto(payload, "LiftAccessRequest");
          }

          const response = h.response({
            robotID: request.payload.robotID,
            message: message,
            timestamp: new Date().toISOString(),
          });
          response.header("Authorization", request.headers.authorization);
          return response.code(200);
        },
        description: "6.8",
        tags: ["api"],
        validate: {
          payload: Joi.object({
            arrived: Joi.boolean()
              .required()
              .description("Whether robot is at holding zone"),
            robotID: Joi.string().required().description("Robot ID"),
            vendorID: Joi.string().required().description("Vendor ID"),
            liftID: Joi.number().description("Preferred Lift"),
            boardingLevel: Joi.number()
              .required()
              .description("Boarding Level"),
            destinationLevel: Joi.number()
              .required()
              .description("Destination Level"),
            timestamp: Joi.string().description("Timestamp in ISO 8601 format"),
          }),
        },
      },
    },
    {
      //6.9
      method: "GET",
      path: "/robot/tcm/v1/holdingzone-lift",
      options: {
        auth: keycloakGeneralAuthConfig,
        handler: async (request, h) => {
          const cached_data = replyCache.getCachedData(
            "ListRobotsAtLiftRequest"
          );
          var robot_list = [];

          if (cached_data) {
            var turnstileID = request.query.level.toString();
            if (turnstileID in cached_data.robotsPerLevel) {
              var raw_list = cached_data.robotsPerLevel[turnstileID].robotIDs;
              for (var i = 0; i < raw_list.length; i++) {
                var split_string = raw_list[i].split("_");
                if (split_string[0] === request.query.vendorID) {
                  robot_list.push(split_string[1]);
                }
              }
            }
          }
          const data = {
            robotIDs: robot_list,
            timestamp: new Date().toISOString(),
          };
          const response = h.response(data);
          response.header("Authorization", request.headers.authorization);
          return response.code(200);
        },
        description: "6.9",
        tags: ["api"],
        validate: {
          query: Joi.object({
            vendorID: Joi.string().required().description("Vendor ID"),
            level: Joi.number().required().description("Level of interest"),
            timestamp: Joi.string().description("Timestamp in ISO 8601 format"),
          }),
        },
      },
    },
    {
      //6.10
      method: "GET",
      path: "/robot/tcm/v1/accesspoint-lift",
      options: {
        auth: keycloakGeneralAuthConfig,
        handler: async (request, h) => {
          const cached_data = replyCache.getCachedData(
            "LiftCheckPermissionRequest"
          );
          var go = false;
          var liftID = null;

          var combined_id =
            request.query.vendorID + "_" + request.query.robotID;
          if (cached_data) {
            liftID = cached_data.approvedRobots[combined_id];
            if (liftID == request.query.liftID) {
              go = true;
            }
          }
          const data = {
            robotID: request.query.robotID,
            go: go,
            liftID: request.query.liftID,
            timestamp: new Date().toISOString(),
          };
          const response = h.response(data);
          response.header("Authorization", request.headers.authorization);
          return response.code(200);
        },
        description: "6.10",
        tags: ["api"],
        validate: {
          query: Joi.object({
            robotID: Joi.string().required().description("Robot ID"),
            vendorID: Joi.string().required().description("Vendor ID"),
            liftID: Joi.string().description("Preferred Lift"),
            boardingLevel: Joi.number()
              .required()
              .description("Boarding Level"),
            timestamp: Joi.string().description("Timestamp in ISO 8601 format"),
          }),
        },
      },
    },
    {
      //6.11
      method: "POST",
      path: "/robot/v1/lift",
      options: {
        auth: keycloakGeneralAuthConfig,
        handler: async (request, h) => {
          var message =
            "Invalid Request - levels must be more than 0 and less than 31";
          var boardingLevel = request.payload.boardingLevel;
          var destinationLevel = request.payload.destinationLevel;

          var payload = request.payload;
          var requestID = "ROBOTAPI" + Date.now();
          payload.requestID = requestID;

          if (
            boardingLevel > 0 &&
            boardingLevel <= 31 &&
            destinationLevel > 0 &&
            destinationLevel <= 31
          ) {
            message = "Received Request";
            amqp.sendProto(payload, "JtcLiftReservationRequest");
          }

          const response = h.response({
            robotID: request.payload.robotID,
            //hardcoded liftID
            liftID: request.payload.liftID,
            message: message,
            requestID: requestID,
            timestamp: new Date().toISOString(),
          });
          response.header("Authorization", request.headers.authorization);
          return response.code(200);
        },
        description: "6.11",
        tags: ["api"],
        validate: {
          payload: Joi.object({
            robotID: Joi.string().required().description("Robot ID"),
            vendorID: Joi.string().required().description("Vendor ID"),
            liftID: Joi.number().required().description("Preferred Lift"),
            boardingLevel: Joi.number()
              .required()
              .description("Boarding Level"),
            destinationLevel: Joi.number()
              .required()
              .description("Destination Level"),
            timestamp: Joi.string().description("Timestamp in ISO 8601 format"),
          }),
        },
      },
    },
    {
      //6.12
      method: "POST",
      path: "/robot/lift/v1/notifications",
      options: {
        auth: keycloakGeneralAuthConfig,
        handler: async (request, h) => {
          var message =
            "Invalid Request - levels must be more than -3 and less than 31";
          var boardingLevel = request.payload.boardingLevel;
          var destinationLevel = request.payload.destinationLevel;

          if (
            boardingLevel >= -3 &&
            boardingLevel <= 31 &&
            destinationLevel >= -3 &&
            destinationLevel <= 31
          ) {
            message = "Received Notification";
            amqp.sendProto(request.payload, "JtcRobotEmbarkationNotification");
            amqp.sendProto(request.payload, "LiftSignalMessage");
          }

          const response = h.response({
            robotID: request.payload.robotID,
            message: message,
            timestamp: new Date().toISOString(),
          });
          response.header("Authorization", request.headers.authorization);
          return response.code(200);
        },
        description: "6.12",
        tags: ["api"],
        validate: {
          payload: Joi.object({
            requestID: Joi.string().required().description("Request ID"),
            robotID: Joi.string().required().description("Robot ID"),
            vendorID: Joi.string().required().description("Vendor ID"),
            liftID: Joi.number().required().description("Preferred Lift"),
            boardingLevel: Joi.number()
              .required()
              .description("Boarding Level"),
            destinationLevel: Joi.number()
              .required()
              .description("Destination Level"),
            embarkationStatus: Joi.number()
              .required()
              .description("Embarkation Status"),
            timestamp: Joi.string().description("Timestamp in ISO 8601 format"),
          }),
        },
      },
    },
    {
      //6.13
      method: "POST",
      path: "/robot/tcm/v1/holdingzone-door",
      options: {
        auth: keycloakGeneralAuthConfig,
        handler: async (request, h) => {
          var message =
            "Invalid Request - levels must be more than 0 and less than 31";
          var currentLevel = request.payload.currentLevel;

          if (currentLevel > 0 && currentLevel <= 31) {
            message = "Received Request";

            var payload = request.payload;
            var requestID = "ROBOTAPI" + Date.now();
            payload.requestID = requestID;

            amqp.sendProto(payload, "DoorAccessRequest");
          }

          const response = h.response({
            robotID: request.payload.robotID,
            message: message,
            timestamp: new Date().toISOString(),
          });
          response.header("Authorization", request.headers.authorization);
          return response.code(200);
        },
        description: "6.13",
        tags: ["api"],
        validate: {
          payload: Joi.object({
            arrived: Joi.boolean()
              .required()
              .description("Whether robot is physically at holding zone"),
            robotID: Joi.string().required().description("Robot ID"),
            vendorID: Joi.string().required().description("Vendor ID"),
            currentLevel: Joi.number().required().description("Current Level"),
            doorID: Joi.number().required().description("Door ID"),
            zone: Joi.string()
              .valid("ENTER", "EXIT")
              .required()
              .description("Enter or exit zone"),
            timestamp: Joi.string().description("Timestamp in ISO 8601 format"),
          }),
        },
      },
    },
    {
      //6.14
      method: "GET",
      path: "/robot/tcm/v1/accesspoint-door",
      options: {
        auth: keycloakGeneralAuthConfig,
        handler: async (request, h) => {
          const cached_data = replyCache.getCachedData(
            "DoorCheckPermissionRequest"
          );
          var go = false;
          var door = null;

          if (cached_data) {
            door =
              cached_data.approvedRobots[
                request.query.zone +
                  "_" +
                  request.query.vendorID +
                  "_" +
                  request.query.robotID
              ];
            if (door == request.query.doorID) {
              go = true;
            }
          }
          const data = {
            robotID: request.query.robotID,
            go: go,
            zone: request.query.zone,
            door: request.query.doorID,
            timestamp: new Date().toISOString(),
          };
          const response = h.response(data);
          response.header("Authorization", request.headers.authorization);
          return response.code(200);
        },
        description: "6.14",
        tags: ["api"],
        validate: {
          query: Joi.object({
            robotID: Joi.string().required().description("Robot ID"),
            vendorID: Joi.string().required().description("Vendor ID"),
            currentLevel: Joi.number().required().description("Current Level"),
            doorID: Joi.number().required().description("Door ID"),
            zone: Joi.string()
              .valid("ENTER", "EXIT")
              .required()
              .description("Enter or exit zone"),
            timestamp: Joi.string().description("Timestamp in ISO 8601 format"),
          }),
        },
      },
    },
    {
      //6.15
      method: "POST",
      path: "/robot/v1/door",
      options: {
        auth: keycloakGeneralAuthConfig,
        handler: async (request, h) => {
          var message =
            "Invalid Request - Open and close cannot have same values";
          if (request.payload.open != request.payload.close) {
            message = "Received Request";
            var payload = request.payload;
            var requestID = "ROBOTAPI" + Date.now();

            payload.requestID = requestID;
            amqp.sendProto(request.payload, "DoorControlMessage");
            amqp.sendProto(payload, "RPCRequest");

            robotCache.setRobotDoor(
              request.payload.robotID,
              request.payload.vendorID,
              request.payload.doorID
            );
            robotCache.setRobotLevel(
              request.payload.robotID,
              request.payload.vendorID,
              request.payload.currentLevel
            );
          }

          const response = h.response({
            robotID: request.payload.robotID,
            doorID: request.payload.doorID,
            message: message,
            timestamp: new Date().toISOString(),
          });
          response.header("Authorization", request.headers.authorization);
          return response.code(200);
        },
        description: "6.15",
        tags: ["api"],
        validate: {
          payload: Joi.object({
            robotID: Joi.string().required().description("Robot ID"),
            vendorID: Joi.string().required().description("Vendor ID"),
            currentLevel: Joi.number().required().description("Current Level"),
            doorID: Joi.number().required().description("Door ID"),
            zone: Joi.string()
              .valid("ENTER", "EXIT")
              .required()
              .description("Enter or exit zone"),
            open: Joi.boolean().description("Open Door"),
            close: Joi.boolean().description("Close Door"),
            timestamp: Joi.string().description("Timestamp in ISO 8601 format"),
          }),
        },
      },
    },
    {
      //6.16
      method: "GET",
      path: "/robot/v1/door",
      options: {
        auth: keycloakGeneralAuthConfig,
        handler: async (request, h) => {
          const cached_data = replyCache.getCachedData("DoorData");

          var door = null;
          var opened = null;
          var level = null;
          var doorID = null;
          if (cached_data) {
            doorID = robotCache.getRobotDoor(
              request.query.robotID,
              request.query.vendorID
            );
            door = config.doors[doorID];
            var reading = cached_data["doorReading"].filter(
              (reading) => reading.doorName == door
            )[0];

            if (reading) {
              opened = reading.status === "OPEN";
            }

            level = robotCache.getRobotLevel(
              request.query.robotID,
              request.query.vendorID
            );
          }
          const data = {
            doorID: doorID,
            currentLevel: level,
            isOpened: opened,
            message: "ACCEPTED",
            robotID: request.query.rootID,
            timestamp: new Date().toISOString(),
          };
          const response = h.response(data);
          response.header("Authorization", request.headers.authorization);
          return response.code(200);
        },
        description: "6.16",
        tags: ["api"],
        validate: {
          query: Joi.object({
            robotID: Joi.string().required().description("Robot ID"),
            vendorID: Joi.string().required().description("Vendor ID"),
            timestamp: Joi.string().description("Timestamp in ISO 8601 format"),
          }),
        },
      },
    },
  ]);

  /*  start the HAPI service  */
  await server
    .start()
    .then(console.log("Server running on %s", server.info.uri));
})().catch((err) => {
  console.log(`ERROR: ${err}`);
});
