const protobuf = require("protobufjs");
const config = require("./config");
const replyCache = require("./replyCache");

function unpackMessage(topic, message) {
  var protoType = getProtoType(topic);
  var res_topic = config.responses[topic];
  protobuf.load("protobuf/src/" + protoType + ".proto", function (err, root) {
    if (err) throw err;

    // pack protobuf
    if (protoType == "lift") {
      protoType = "ReservationLogicControllerSummit";
    }

    var protoFields = root.lookupType(protoType + "." + res_topic);

    var decodedMessage = protoFields.decode(message);
    var object = protoFields.toObject(decodedMessage, {
      enums: String, // enums as string names
      longs: String, // longs as strings (requires long.js)
      defaults: false, // includes default values
      arrays: true, // populates empty arrays (repeated fields) even if defaults=false
      objects: true, // populates empty objects (map fields) even if defaults=false
      oneofs: true, // includes virtual oneof fields set to the present field's name
    });
    replyCache.setCache(topic, object);
  });
}

function preparePayload(payload, topic) {
  let ret = Object.assign({}, payload);
  if (topic == "SecurityCheckPoint") {
    delete ret["arrived"];
    delete ret["url"];
    delete ret["timestamp"];
  } else if (topic == "RPCRequest") {
    delete ret["robotID"];
    delete ret["vendorID"];
    delete ret["zone"];
    delete ret["timestamp"];

    // ret["requestID"] = "request123"
    if ("turnstileID" in ret) {
      ret["doorName"] = [config.turnstiles[ret["turnstileID"]]];
    }
    if ("doorID" in ret) {
      ret["doorName"] = [config.doors[ret["doorID"]]];
    }

    if (ret["open"]) {
      ret["statusToSet"] = 1;
    }
    if (ret["close"]) {
      ret["statusToSet"] = 2;
    }
    ret["requestTime"] = Date.now();

    delete ret["turnstileID"];
    delete ret["doorID"];
    delete ret["open"];
    delete ret["close"];
  } else if (
    topic == "JtcLiftReservationRequest" ||
    topic == "LiftSignalMessage"
  ) {
    ret["user"] = ret["robotID"];
    ret["epochTime"] = Date.now();
    ret["deviceId"] = "LIFT-" + ret["liftID"];

    delete ret["robotID"];
    delete ret["timestamp"];
    delete ret["liftID"];
  } else if (topic == "JtcRobotEmbarkationNotification") {
    ret["user"] = ret["robotID"];
    ret["epochTime"] = Date.now();
    ret["deviceId"] = "LIFT-" + ret["liftID"];

    delete ret["robotID"];
    delete ret["timestamp"];
    delete ret["liftID"];
  }

  // if (topic.includes("Request")){
  //     ret["requestID"] = "ROBOTAPI" + Date.now()
  // }

  if ("zone" in ret) {
    if (ret["zone"] == "ENTER") {
      ret["zone"] = 1;
    } else {
      ret["zone"] = 2;
    }
  }

  console.log(ret);
  return ret;
}

function getProtoType(topic) {
  var ret = null;
  var protoTypes = config.protoTypes;

  for (const [protoType, messageTypes] of Object.entries(protoTypes)) {
    if (messageTypes.includes(topic)) {
      ret = protoType;
    }
  }
  return ret;
}

function buildExchangeName(protoType, topic) {
  var exchange = "jtc_" + protoType + "_rpc";

  if (
    topic === "TurnstileControlMessage" ||
    topic === "DoorControlMessage" ||
    topic === "LiftSignalMessage"
  ) {
    exchange = "jtc_" + protoType + "_data";
  } else if (topic === "DoorData") {
    exchange = "jtc_" + protoType + "_data_fanout";
  }
  return exchange;
}

module.exports = {
  preparePayload,
  unpackMessage,
  getProtoType,
  buildExchangeName,
};
