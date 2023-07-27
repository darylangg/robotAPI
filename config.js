var host = "192.168.4.2";
var port = "5671";
var user = "user";
var password = "JtcSubmit02!";

var cert_path = "../certs/client.crt";
var key_path = "../certs/client.key";
var ca_path = "../certs/ca.crt";

// request queues to send POST data
var routingKeys = {
  SecurityCheckPoint: "key.tcm.security_checkpoint.rpc.reservation.robot.tcm",
  TurnstileAccessRequest: "key.tcm.turnstile.rpc.reservation.robot.tcm",
  LiftAccessRequest: "key.tcm.lift.rpc.reservation.robot.tcm",
  DoorAccessRequest: "key.tcm.door.rpc.reservation.robot.tcm",
  TurnstileControlMessage: "turnstile",
  RPCRequest: "key.door.rpc.control.request.app",
  JtcLiftReservationRequest: "key.lift.rpc.reservation.request.robot.qms",
  JtcRobotEmbarkationNotification:
    "key.lift.rpc.notify_status.request.robot.qms",
  DoorControlMessage: "door",
  LiftSignalMessage: "lift",
  SecurityCheckpointRequest:
    "key.tcm.security_checkpoint.rpc.reservation.robot.tcm",
};

// reply queues to receive GET data
var replyQueues = {
  ListRobotsAtTurnstileRequest: "api.reply.tcm.rpc.list-robots-at-turnstile",
  TurnstileCheckPermissionRequest:
    "api.reply.tcm.rpc.turnstile-check-permission",
  DoorData: "api.reply.door.rpc.door-data",
  ListRobotsAtLiftRequest: "api.reply.tcm.rpc.list-robots-at-lift",
  LiftCheckPermissionRequest: "api.reply.tcm.rpc.lift-check-permission",
  DoorCheckPermissionRequest: "api.reply.tcm.rpc.door-check-permission",
  ListRobotsAtSecurityRequest: "api.reply.tcm.rpc.list-robots-at-security",
};

// mapping to know which proto file to read for all
var protoTypes = {
  tcm: [
    "SecurityCheckPoint",
    "TurnstileAccessRequest",
    "ListRobotsAtTurnstileRequest",
    "ListOfRobotsResponse",
    "TurnstileCheckPermissionRequest",
    "TurnstileControlMessage",
    "LiftAccessRequest",
    "ListRobotsAtLiftRequest",
    "LiftCheckPermissionRequest",
    "DoorAccessRequest",
    "DoorCheckPermissionRequest",
    "DoorControlMessage",
    "LiftSignalMessage",
    "SecurityCheckpointRequest",
    "ListRobotsAtSecurityRequest",
  ],
  lift: ["JtcLiftReservationRequest", "JtcRobotEmbarkationNotification"],
  door: ["RPCRequest", "DoorData"],
};

// mapping of request to replies for GET
var responses = {
  ListRobotsAtTurnstileRequest: "ListOfRobotsResponse",
  TurnstileCheckPermissionRequest: "ListOfApprovedRobotsUpdate",
  DoorData: "DoorData",
  ListRobotsAtLiftRequest: "ListOfRobotsLiftUpdate",
  LiftCheckPermissionRequest: "ListOfApprovedRobotsUpdate",
  DoorCheckPermissionRequest: "ListOfApprovedRobotsUpdate",
  ListRobotsAtSecurityRequest: "ListOfRobotsResponse",
};

// turnstiles
// var turnstiles = [
//   "L1_FRONT_HIGHRISE_LANE4A",
//   "L1_FRONT_HIGHRISE_LANE4B",
//   "L1_FRONT_LOWRISE_LANE3A",
//   "L1_FRONT_LOWRISE_LANE3B",
//   "L1_FRONT_MIDRISE_LANE4A",
//   "L1_FRONT_MIDRISE_LANE4B",
//   "L1_BACK_HIGHRISE_LANE2A_CONTROL",
//   "L1_BACK_HIGHRISE_LANE2B_CONTROL",
//   "L1_BACK_LOWRISE_LANE2A_CONTROL",
//   "L1_BACK_LOWRISE_LANE2B_CONTROL",
//   "L1_BACK_MIDRISE_LANE2A_CONTROL",
//   "L1_BACK_MIDRISE_LANE2B_CONTROL",
// ];

var turnstiles = [
  "DOOR-42",
  "DOOR-43",
  "DOOR-46",
  "DOOR-47",
  "DOOR-51",
  "DOOR-52",
  "DOOR-20",
  "DOOR-21",
  "DOOR-23",
  "DOOR-24",
  "DOOR-26",
  "DOOR-27",
];

// doors
// var doors = [
// "L31_MAIN_LIFT_LOBBY_1_312502",
//   "L31_MAIN_LIFT_LOBBY_2_312503",
//   "L22_LOBBY_ENTRANCE_1_1102",
//   "L6_COLLAB_SPACE_7708",
//   "L6_COLLAB_SPACE_7509",
// ];

var doors = ["DOOR-242", "DOOR-243", "DOOR-221", "DOOR-263", "DOOR-262"];

module.exports = {
  host,
  port,
  user,
  password,
  cert_path,
  key_path,
  ca_path,
  routingKeys,
  replyQueues,
  protoTypes,
  responses,
  turnstiles,
  doors,
};
