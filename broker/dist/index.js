"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_ecs_1 = require("@aws-sdk/client-ecs");
const client_ec2_1 = require("@aws-sdk/client-ec2");
// Load environment variables from .env file
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: 'https://cloud-ide-three.vercel.app/'
}));
app.use(express_1.default.json());
// Initialize ECS and EC2 clients with credentials from environment variables
const ecsClient = new client_ecs_1.ECSClient({
    region: 'ap-south-1',
    credentials: {
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID
    }
});
const ec2Client = new client_ec2_1.EC2Client({
    region: 'ap-south-1',
    credentials: {
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID
    }
});
// Configuration using environment variables
const config = {
    CLUSTER: process.env.CLUSTER_ARN,
    TASK: process.env.TASK_ARN
};
app.get('/', (req, res) => {
    res.send('Hello World!');
});
function getTaskDetails(clusterName, taskArn) {
    return __awaiter(this, void 0, void 0, function* () {
        const params = {
            cluster: clusterName,
            tasks: [taskArn]
        };
        const command = new client_ecs_1.DescribeTasksCommand(params);
        const response = yield ecsClient.send(command);
        if (!response || !response.tasks || response.tasks.length === 0) {
            return "";
        }
        const attachments = response.tasks[0].attachments;
        // Find the network interface attached to the task
        //@ts-ignore
        const networkInterfaceId = attachments.find(attachment => attachment.type === "ElasticNetworkInterface")
            .details.find(detail => detail.name === "networkInterfaceId").value;
        return networkInterfaceId;
    });
}
function getIPv6Address(networkInterfaceId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const params = {
            NetworkInterfaceIds: [networkInterfaceId],
        };
        const command = new client_ec2_1.DescribeNetworkInterfacesCommand(params);
        const response = yield ec2Client.send(command);
        const networkInterface = response.NetworkInterfaces[0];
        const ipv6Addresses = (_a = networkInterface.Association) === null || _a === void 0 ? void 0 : _a.PublicDnsName;
        return ipv6Addresses;
    });
}
app.post('/spin-ide', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(config);
    const command = new client_ecs_1.RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: [
                    process.env.SUBNET_1,
                    process.env.SUBNET_2,
                    process.env.SUBNET_3
                ],
                securityGroups: [
                    process.env.SECURITY_GROUP
                ]
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'wscloudide',
                }
            ]
        }
    });
    const response = yield ecsClient.send(command);
    console.log(JSON.stringify(response));
    res.send({
        taskArn: response.tasks[0].taskArn
    });
}));
app.post('/get-ip', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const taskArn = req.body.taskArn;
    const enId = yield getTaskDetails(config.CLUSTER, taskArn);
    const ip = yield getIPv6Address(enId || "");
    const match = ip.match(/ec2-(.*?)\.ap-south-1/);
    res.send(match ? match[1] : '');
}));
app.listen(8081, () => {
    console.log('Listening on port 8081');
});
