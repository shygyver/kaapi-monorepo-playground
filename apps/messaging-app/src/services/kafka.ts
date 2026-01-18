import { logger } from '../utils/logger';
import { KafkaMessaging } from '@kaapi/kafka-messaging';

/**
 * KafkaMessaging
 */
export const messaging = new KafkaMessaging({
    clientId: 'messaging-app',
    address: `${process.env.HOST || 'localhost'}:${process.env.PORT || 3004}`,
    brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'],
    logger,
    name: 'messaging-app',
});

export enum Topics {
    orderCreated = 'order.created',
}

export interface OrderCreatedMessage {
    orderId: string;
    customerId: string;
    items: { sku: string; qty: number }[];
    total: number;
}

export async function pubOrderCreated(message: OrderCreatedMessage) {
    return await messaging.publish<OrderCreatedMessage>(Topics.orderCreated, message);
}
