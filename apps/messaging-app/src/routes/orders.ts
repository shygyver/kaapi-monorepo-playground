import { pubOrderCreated } from '../services/kafka';
import { KaapiServerRoute } from '@kaapi/kaapi';
import { ZodDocHelper } from '@kaapi/validator-zod';
import { z } from 'zod';

let nbOrders = 0;

// payload schema
const payloadSchema = z
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
    });

// route
export const createOrderRoute: KaapiServerRoute<{
    Payload: z.infer<typeof payloadSchema>;
}> = {
    method: 'POST',
    path: '/zod/orders',
    options: {
        description: 'Create an order.',
        tags: ['Orders'],
        payload: {
            allow: ['application/json', 'application/x-www-form-urlencoded'],
        },
        plugins: {
            kaapi: {
                docs: {
                    helperSchemaProperty: 'zod',
                    openAPIHelperClass: ZodDocHelper,
                },
            },
            zod: {
                payload: payloadSchema,
            },
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
};
