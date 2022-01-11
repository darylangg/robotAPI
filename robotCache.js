class RobotCache {
    constructor() {
        this.turnstileCache = {}
        this.liftCache = {}
        this.doorCache = {}
        this.robotLevel = {}
    }

    setRobotTurnstile(robot_id, vendor_id, turnstile_id){
        this.turnstileCache[robot_id + "_"+vendor_id] = turnstile_id
    }

    getRobotTurnstile(robot_id, vendor_id){
        return this.turnstileCache[robot_id + "_"+vendor_id]
    }

    setRobotLift(robot_id, vendor_id, lift_id){
        this.liftCache[robot_id + "_"+vendor_id] = lift_id
    }

    getRobotLift(robot_id, vendor_id){
        return this.liftCache[robot_id + "_"+vendor_id]
    }

    setRobotDoor(robot_id, vendor_id, door_id){
        this.doorCache[robot_id + "_"+vendor_id] = door_id
    }

    getRobotDoor(robot_id, vendor_id){
        return this.doorCache[robot_id + "_"+vendor_id]
    }

    setRobotLevel(robot_id, vendor_id, level){
        this.robotLevel[robot_id + "_"+vendor_id] = level
    }

    getRobotLevel(robot_id, vendor_id){
        return this.robotLevel[robot_id + "_"+vendor_id]
    }
    
}
module.exports = new RobotCache();