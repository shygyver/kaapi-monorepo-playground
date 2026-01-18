import { KafkaMessaging } from '@kaapi/kafka-messaging';

const KAFKA_BROKERS = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];

const messaging = new KafkaMessaging({
    clientId: 'notification-service',
    brokers: KAFKA_BROKERS,
    name: 'notification-service',
});

interface UserCreatedEvent {
    id: string;
    email: string;
    name: string;
    createdAt: number;
}

async function createTopicIfNotExists(topic: string) {
    const admin = await messaging.createAdmin();
    if (admin) {
        const topics = await admin.listTopics();
        if (!topics.includes(topic)) {
            const clusterInfo = await admin.describeCluster();
            const availableBrokers = clusterInfo?.brokers.length;
            const replicationFactor = availableBrokers && availableBrokers >= 3 ? 3 : 1;

            await admin.createTopics({
                topics: [{ topic, numPartitions: 1, replicationFactor }],
            });

            console.log(`Topic "${topic}" created.`);
        }
        await admin.disconnect();
    }
}

const start = async () => {
    console.log('🚀 Starting Notification Service...');
    console.log(`🔌 Connecting to Kafka brokers: ${KAFKA_BROKERS.join(', ')}`);

    await createTopicIfNotExists('user.created');
    await messaging.subscribe<UserCreatedEvent>(
        'user.created',
        async (user, ctx) => {
            console.log(`📧 Sending welcome email to ${user.email}...`);

            // await emailService.sendWelcome(user.email, user.name);

            console.log(`✅ Email sent (offset: ${ctx.offset})`);
        },
        {
            onError: async (error, _message, ctx) => {
                console.error(`❌ Failed to process message at offset ${ctx.offset}:`, error);
            },
        }
    );

    console.log('👂 Notification service listening...');
};

start().catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
});
