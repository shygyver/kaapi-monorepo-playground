import { app } from './app';
import { messaging, OrderCreatedMessage, Topics } from './services/kafka';
import { KafkaMessagingContext, KafkaMessagingSubscribeConfig } from '@kaapi/kafka-messaging';
import { PartitionAssigners } from 'kafkajs';

// START WEB SERVER

app.log('-------------- START WEB SERVER --------------');

await app.listen();

const BASE_URI = process.env.EXTERNAL_URI || app.base().info.uri;

app.log(`Server running on ${BASE_URI}`);
app.log(`Swagger UI on ${BASE_URI}/docs/api`);
app.log(`OpenAPI specification on ${BASE_URI}/docs/api/schema`);
app.log(`Postman collection on ${BASE_URI}/docs/api/schema?format=postman\n`);

app.log('-------------- CONFIG MESSAGING --------------');

// CREATE TOPIC

const admin = await messaging.createAdmin({
    retry: {
        retries: 1,
        maxRetryTime: 10000,
    },
});

if (admin) {
    const clusterInfo = await admin.describeCluster();
    const availableBrokers = clusterInfo?.brokers.length;

    app.log.info(`Cluster has ${availableBrokers} brokers.`);

    if (availableBrokers) {
        // Replication factor (requires at least 3 brokers)
        const replicationFactor = availableBrokers >= 3 ? 3 : 1;
        await admin.createTopics({
            topics: [
                {
                    topic: Topics.orderCreated,
                    numPartitions: 1,
                    replicationFactor,
                },
            ],
        });
        app.log.info(`Topic "${Topics.orderCreated}" created with replication factor ${replicationFactor}!`);
    }

    await admin.disconnect();
} else {
    app.log.error('Could not create topic: No Kafka instance');
}

// SUBSCRIBE TO TOPIC

const SUBSCRIBE_CONFIG: KafkaMessagingSubscribeConfig = {
    fromBeginning: false,
    allowAutoTopicCreation: false,
    groupId: 'my-group',
    heartbeatInterval: 3000,
    maxBytes: 10485760,
    maxBytesPerPartition: 1048576,
    maxWaitTimeInMs: 5000,
    metadataMaxAge: 300000,
    minBytes: 1,
    partitionAssigners: [PartitionAssigners.roundRobin],
    readUncommitted: true,
    rebalanceTimeout: 60000,
    retry: { retries: 5 },
    sessionTimeout: 30000,
};

app.subscribe<OrderCreatedMessage>(
    Topics.orderCreated,
    (message, context: KafkaMessagingContext) => {
        app.log.info('Received order:', message);
        app.log.debug('Context:', context);
    },
    SUBSCRIBE_CONFIG
);
