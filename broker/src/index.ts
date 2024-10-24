import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { DescribeTasksCommand, ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';
import { DescribeNetworkInterfacesCommand, EC2Client } from "@aws-sdk/client-ec2";

// Load environment variables from .env file

const app = express();
app.use(cors({
    origin: 'https://cloud-ide-three.vercel.app/'
}));
app.use(express.json());

// Initialize ECS and EC2 clients with credentials from environment variables
const ecsClient = new ECSClient({
    region: 'ap-south-1',
    credentials: {
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!
    }
});

const ec2Client = new EC2Client({
    region: 'ap-south-1',
    credentials: {
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!
    }
});

// Configuration using environment variables
const config = {
    CLUSTER: process.env.CLUSTER_ARN!,
    TASK: process.env.TASK_ARN!
};



app.get('/', (req, res) => {
    res.send('Hello World!');
});

async function getTaskDetails(clusterName: string, taskArn: string) {
    const params = {
        cluster: clusterName,
        tasks: [taskArn]
    };

    const command = new DescribeTasksCommand(params);
    const response = await ecsClient.send(command);
    if (!response || !response.tasks || response.tasks.length === 0) {
        return "";
    }

    const attachments = response.tasks![0].attachments;

    // Find the network interface attached to the task
    //@ts-ignore
    const networkInterfaceId = attachments.find(attachment => attachment.type === "ElasticNetworkInterface")
        .details.find(detail => detail.name === "networkInterfaceId").value;

    return networkInterfaceId;
}

async function getIPv6Address(networkInterfaceId: string) {
    const params = {
        NetworkInterfaceIds: [networkInterfaceId],
    };

    const command = new DescribeNetworkInterfacesCommand(params);
    const response = await ec2Client.send(command);

    const networkInterface = response.NetworkInterfaces![0];
    const ipv6Addresses = networkInterface.Association?.PublicDnsName;

    return ipv6Addresses;
}

app.post('/spin-ide', async (req, res) => {

    console.log(config);
    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: [
                    process.env.SUBNET_1!,
                    process.env.SUBNET_2!,
                    process.env.SUBNET_3!
                ],
                securityGroups: [
                    process.env.SECURITY_GROUP!
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

    const response = await ecsClient.send(command);
    console.log(JSON.stringify(response));
    res.send({
        taskArn: response.tasks![0].taskArn
    });
});

app.post('/get-ip', async (req, res) => {
    const taskArn = req.body.taskArn;
    const enId = await getTaskDetails(config.CLUSTER, taskArn);
    const ip = await getIPv6Address(enId || "");
    const match = ip!.match(/ec2-(.*?)\.ap-south-1/);
    res.send(match ? match[1] : '');
});

app.listen(8081, () => {
    console.log('Listening on port 8081');
});
