const amqp = require('amqplib')
const protobuf = require("protobufjs")
const proto_util = require('./proto_util')

const fs = require('fs');
const config = require('./config')

var opts = {
    cert: fs.readFileSync(process.env.CERT_PATH),
    key: fs.readFileSync(process.env.KEY_PATH),
    passphrase: '12345',
    ca: [fs.readFileSync(process.env.CA_PATH)],
    checkServerIdentity: function (host, cert) {
        return undefined;
    }
};

var brokerurl = `amqps://${process.env.AMQP_USER}:${process.env.AMQP_PASSWORD}@${process.env.AMQP_HOST}:${process.env.AMQP_PORT}/`;

async function pub(exchange, message, routingKey,headers) {
    const conn = await amqp.connect(brokerurl,opts);
    const channel = await conn.createChannel();
    
    console.log("Sending to " + routingKey)
    await channel.publish(exchange, routingKey, Buffer.from(message),{headers});
    await channel.close();
    await conn.close();
};

function sendProto(payload, topic){
    payload = proto_util.preparePayload(payload, topic)
    var protoType = proto_util.getProtoType(topic)
    protobuf.load("protobuf/src/"+protoType+".proto", function(err,root){
        if (err)
            throw err

        // pack protobuf
        var protoFields = root.lookupType(protoType + "." + topic)
        errMsg = protoFields.verify(payload);
        
        if (errMsg)
            throw Error(errMsg);
        var proto = protoFields.fromObject(payload)
        
        var buffer = protoFields.encode(proto).finish()
        var exchange = proto_util.buildExchangeName(protoType,topic)
        pub(exchange,buffer,config.routingKeys[topic])
    })
}

async function sub(topic){
    const conn = await amqp.connect(brokerurl,opts);
    const channel = await conn.createChannel();
    var replyQueue = config.replyQueues[topic];
    var protoType = proto_util.getProtoType(topic)
    var exchange = proto_util.buildExchangeName(protoType,topic)
    
    channel.assertQueue(replyQueue, {exclusive: true});
    channel.bindQueue(replyQueue, exchange, replyQueue)

    console.log("created "+replyQueue+" for " + topic)
    
    channel.consume(replyQueue, function(msg) {
        if (msg !== null) {
            console.log("Message Received for: " + topic)
            // console.log(msg.content)
            proto_util.unpackMessage(topic,msg.content)
        }
    });
}

module.exports = {
    pub,
    sub,
    sendProto
}