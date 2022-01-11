var host = "192.168.4.2"
var port = "5671"
var user = "user"
var password = "JtcSubmit02!"

var cert_path = '../certs/client.crt'
var key_path = '../certs/client.key'
var ca_path = '../certs/ca.crt'

// request queues to send POST data
var routingKeys = {
    "SecurityCheckPoint" : "key.tcm.security_checkpoint.rpc.reservation.robot.tcm",
    "TurnstileAccessRequest" : "key.tcm.turnstile.rpc.reservation.robot.tcm",
    "LiftAccessRequest" : "key.tcm.lift.rpc.reservation.robot.tcm",
    "DoorAccessRequest" : "key.tcm.door.rpc.reservation.robot.tcm",
    "TurnstileControlMessage" : "turnstile",
    "RPCRequest": "key.door.rpc.control.request.app",
    "LiftAccessRequest": "key.tcm.lift.rpc.reservation.robot.tcm",
    "JtcLiftReservationRequest":"key.lift.rpc.reservation.request.robot.qms",
    "JtcRobotEmbarkationNotification":"key.lift.rpc.notify_status.request.robot.qms",
    "DoorAccessRequest":"key.tcm.door.rpc.reservation.robot.tcm",
    "DoorControlMessage" :"door",
    "LiftSignalMessage": "lift",
    "SecurityCheckpointRequest":"key.tcm.security_checkpoint.rpc.reservation.robot.tcm"
}

// reply queues to receive GET data
var replyQueues = {
    "ListRobotsAtTurnstileRequest":"api.reply.tcm.rpc.list-robots-at-turnstile",
    "TurnstileCheckPermissionRequest":"api.reply.tcm.rpc.turnstile-check-permission",
    "DoorData":"api.reply.door.rpc.door-data",
    "ListRobotsAtLiftRequest":"api.reply.tcm.rpc.list-robots-at-lift",
    "LiftCheckPermissionRequest":"api.reply.tcm.rpc.lift-check-permission",
    "DoorCheckPermissionRequest":"api.reply.tcm.rpc.door-check-permission",
    "ListRobotsAtSecurityRequest":"api.reply.tcm.rpc.list-robots-at-security"
}

// mapping to know which proto file to read for all
var protoTypes={
    "tcm": ["SecurityCheckPoint","TurnstileAccessRequest","ListRobotsAtTurnstileRequest","ListOfRobotsResponse","TurnstileCheckPermissionRequest","TurnstileControlMessage","LiftAccessRequest","ListRobotsAtLiftRequest","LiftCheckPermissionRequest","DoorAccessRequest","DoorCheckPermissionRequest","DoorControlMessage","LiftSignalMessage","SecurityCheckpointRequest","ListRobotsAtSecurityRequest"],
    "lift":["JtcLiftReservationRequest","JtcRobotEmbarkationNotification"],
    "door":["RPCRequest","DoorData"]
}

// mapping of request to replies for GET
var responses = {
    "ListRobotsAtTurnstileRequest":"ListOfRobotsResponse",
    "TurnstileCheckPermissionRequest":"ListOfApprovedRobotsUpdate",
    "DoorData":"DoorData",
    "ListRobotsAtLiftRequest":"ListOfRobotsLiftUpdate",
    "LiftCheckPermissionRequest":"ListOfApprovedRobotsUpdate",
    "DoorCheckPermissionRequest":"ListOfApprovedRobotsUpdate",
    "ListRobotsAtSecurityRequest":"ListOfRobotsResponse"
}

// turnstiles
var turnstiles = [
    "L1_FRONT_HIGHRISE_LANE4A",
    "L1_FRONT_HIGHRISE_LANE4B",
    "L1_FRONT_LOWRISE_LANE3A",
    "L1_FRONT_LOWRISE_LANE3B",
    "L1_FRONT_MIDRISE_LANE4A",
    "L1_FRONT_MIDRISE_LANE4B"
]

// doors 
var doors = [
    "L6_COLLAB_SPACE_7509",
    "L6_COLLAB_SPACE_7708",
    "L6_DATA_CENTER_RM_INTERLOCK_MAIN_7602",
    "L6_DATA_CENTRE_RM_INTERLOCKINNER_7610",
    "L6_DATA_RM_7502",
    "L6_DATA_RM_7707",
    "L6_DIR_RM_3_7504",
    "L6_DIR_RM_4_7503",
    "L6_DIR_RM_SECURITY_7609",
    "L6_MEETING_RM_DR1_7606",
    "L6_MEETING_RM_DR_2_7608",
    "L6_MEETING_RM_ENT_7701",
    "L6_MEETING_RM_EXIT_7704",
    "L6_NED_DIR_RM_1_7506",
    "L6_NED_DIR_RM_2_7505",
    "L6_NED_WORKING_SPACE_7507",
    "L6_OPERATION_CENT2_RM_7705",
    "L6_OPERATION_CEN_1_DR2_7605",
    "L6_OPERATION_CEN_1_DR_1_7603",
    "L6_OPERATION_CEN_3_RM_7706",
    "L6_PANTRY_DOOR_7601",
    "L6_POLARIZED_GLASS_EQUI_7607",
    "L6_PPD_RM_7501",
    "L6_SECURITY_RM_ENTER_7709",
    "L6_ST2_7510",
    "L6_STAIRCASE1_SMOKE_LB_7604",
    "L6_STORAGE_RM_ENTR_2_7702",
    "L6_STORAGE_ROOM_ENTRY_1_7508",
    "L22_ACEO_ROOM_NEW_1106",
    "L22_CMD_DR_1209",
    "L22_CMD_MEETING_RM_1211",
    "L22_CMD_STORE_1105",
    "L22_DATA_RM_1_1101",
    "L22_DATA_RM_2_1212",
    "L22_FIRELIFT_LOBBY_1203",
    "L22_LOBBY_ENTRANCE_1_1102",
    "L22_LOBBY_ENTRANCE_2_1205",
    "L22_LOBBY_ENTRANCE_3_1103",
    "L22_LOBBY_ENTRANCE_4_1207",
    "L22_OED_DR_1208",
    "L22_PA_DR_2_1202",
    "L22_PA_DR_4_1206",
    "L22_PA_MAIN_ENTRANCE_DR_3_1204",
    "L22_STAIRCASE_1104"
]

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
    doors
}