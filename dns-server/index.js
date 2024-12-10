const dgram = require("node:dgram");
const dnsPacket = require("dns-packet");

const server = dgram.createSocket("udp4");

const db = {
  "jaikumar.com": "1.2.3.4",
  "google.com": "8.8.8.8",
};

server.on("message", (msg, rinfo) => {
  console.log(`Server received: ${msg} from ${rinfo.address}:${rinfo.port}`);
  const incomingMessage = dnsPacket.decode(msg);
  const ipFromDb = db[incomingMessage.questions[0].name];
  const ans = dnsPacket.encode({
    type: "response",
    id: incomingMessage.id,
    flags: dnsPacket.AUTHORITATIVE_ANSWER,
    questions: incomingMessage.questions,
    answers: [
      {
        type: "A",
        name: incomingMessage.questions[0].name,
        class: incomingMessage.questions[0].class,
        ttl: 10,
        data: ipFromDb,
      },
    ],
  });

  server.send(ans, rinfo.port, rinfo.address);
});

server.bind(53, () => {
  console.log("DNS server is running on port 53");
});
