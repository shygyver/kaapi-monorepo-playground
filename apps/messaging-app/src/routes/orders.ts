import { pubOrderCreated } from '../services/kafka';
import { withSchema } from '@kaapi/validator-zod';
import { z } from 'zod';

let nbOrders = 0;

// route
export const createOrderRoute = withSchema({
    payload: z
        .object({
            items: z
                .array(
                    z.object({
                        sku: z.string().meta({
                            examples: ['A12'],
                        }),
                        qty: z
                            .number()
                            .int()
                            .min(1)
                            .meta({
                                description: 'quantity',
                                examples: [3],
                            }),
                        price: z.number().meta({
                            description: 'price',
                        }),
                    })
                )
                .min(1),
        })
        .meta({
            description: 'Order',
            ref: '#/components/schemas/Order',
        }),
}).route({
    method: 'POST',
    path: '/zod/orders',
    options: {
        description: 'Create an order.',
        tags: ['Orders'],
        payload: {
            allow: ['application/json', 'application/x-www-form-urlencoded'],
        },
    },
    handler: async ({ payload: { items } }) => {
        const order = {
            customerId: '',
            items,
            orderId: `${++nbOrders}`,
            total: items.reduce((value, item) => value + Number((item.price * item.qty).toFixed(2)), 0),
        };
        await pubOrderCreated(order);
        return order;
    },
});
